import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { EVENT_ID, HAS_SUPABASE, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config'

export type Phase = 'idle' | 'open' | 'closed' | 'reveal'

export interface LiveState {
  question_id: string | null
  phase: Phase
  updated_at?: string
}

export interface Resp {
  question_id: string
  participant_id: string
  value: string
}

export type SubmitResult = { ok: true } | { ok: false; reason: 'duplicate' | 'closed' | 'network' }

export interface LiveBackend {
  mode: 'supabase' | 'local'
  getState(): Promise<LiveState>
  /**
   * Plateia: acompanha o estado (polling no Supabase, BroadcastChannel no modo local).
   * `onBeat` avisa a cada consulta: true = o banco respondeu (mesmo sem mudança), false = falhou.
   * Sem ele, uma pergunta que fica minutos no ar pareceria queda de conexão.
   */
  watchState(cb: (s: LiveState) => void, pollMs: number, onBeat?: (ok: boolean) => void): () => void
  setState(key: string, questionId: string | null, phase: Phase): Promise<boolean>
  checkKey(key: string): Promise<boolean>
  submit(r: Resp): Promise<SubmitResult>
  listResponses(questionId: string): Promise<Resp[]>
  /** Palco: novas respostas em tempo real. onStatus informa se o canal realtime está saudável. */
  onResponse(cb: (r: Resp) => void, onStatus?: (ok: boolean) => void): () => void
  resetQuestion(key: string, questionId: string): Promise<boolean>
  /** Plateia: votos agregados por pergunta e opção (uma consulta para várias perguntas). */
  results(questionIds: string[]): Promise<Results>
}

/** pergunta → opção → votos */
export type Results = Record<string, Record<string, number>>

const IDLE: LiveState = { question_id: null, phase: 'idle' }

/* ------------------------------------------------------------------ */
/* Supabase                                                            */
/* ------------------------------------------------------------------ */

function supabaseBackend(): LiveBackend {
  const sb: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  })

  async function getState(): Promise<LiveState> {
    const { data, error } = await sb
      .from('live_state')
      .select('question_id, phase, updated_at')
      .eq('id', EVENT_ID)
      .maybeSingle()
    if (error || !data) throw error ?? new Error('estado não encontrado')
    return data as LiveState
  }

  return {
    mode: 'supabase',
    getState,
    watchState(cb, pollMs, onBeat) {
      let stopped = false
      let last = ''
      let timer: number | undefined
      const tick = async () => {
        if (stopped) return
        if (document.visibilityState === 'visible') {
          try {
            const s = await getState()
            onBeat?.(true)
            const sig = `${s.question_id}|${s.phase}|${s.updated_at}`
            if (sig !== last) {
              last = sig
              cb(s)
            }
          } catch {
            /* rede instável: tenta no próximo ciclo */
            onBeat?.(false)
          }
        }
        // jitter evita que 200 celulares batam no banco no mesmo milissegundo
        timer = window.setTimeout(tick, pollMs + Math.random() * 400)
      }
      tick()
      const wake = () => document.visibilityState === 'visible' && (window.clearTimeout(timer), tick())
      document.addEventListener('visibilitychange', wake)
      return () => {
        stopped = true
        window.clearTimeout(timer)
        document.removeEventListener('visibilitychange', wake)
      }
    },
    async setState(key, questionId, phase) {
      const { data, error } = await sb.rpc('set_live_state', {
        p_key: key,
        p_event: EVENT_ID,
        p_question_id: questionId,
        p_phase: phase,
      })
      return !error && data === true
    },
    async checkKey(key) {
      const { data, error } = await sb.rpc('check_presenter_key', { p_key: key })
      return !error && data === true
    },
    async submit(r) {
      const { error } = await sb.from('responses').insert(r)
      if (!error) return { ok: true }
      if (error.code === '23505') return { ok: false, reason: 'duplicate' }
      if (error.code === '42501') return { ok: false, reason: 'closed' }
      return { ok: false, reason: 'network' }
    },
    async listResponses(questionId) {
      const { data } = await sb
        .from('responses')
        .select('question_id, participant_id, value')
        .eq('question_id', questionId)
        .limit(5000)
      return (data as Resp[]) ?? []
    },
    onResponse(cb, onStatus) {
      const ch = sb
        .channel('palco-respostas')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses' }, (p) => cb(p.new as Resp))
        .subscribe((status) => onStatus?.(status === 'SUBSCRIBED'))
      return () => {
        sb.removeChannel(ch)
      }
    },
    async resetQuestion(key, questionId) {
      const { data, error } = await sb.rpc('reset_question', { p_key: key, p_question_id: questionId })
      return !error && data === true
    },
    async results(questionIds) {
      // view public.resultados (group by no banco): poucas linhas por consulta
      const { data, error } = await sb.from('resultados').select('question_id, value, votos').in('question_id', questionIds)
      if (error) throw error
      const out: Results = {}
      for (const r of (data as { question_id: string; value: string; votos: number }[]) ?? []) {
        ;(out[r.question_id] ??= {})[r.value] = r.votos
      }
      return out
    },
  }
}

/* ------------------------------------------------------------------ */
/* Modo local: ensaio sem internet (abas do mesmo navegador)            */
/* ------------------------------------------------------------------ */

function localBackend(): LiveBackend {
  const S_KEY = 'saem-local-state'
  const R_KEY = 'saem-local-responses'
  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('saem-local') : null

  const read = <T,>(k: string, fb: T): T => {
    try {
      return JSON.parse(localStorage.getItem(k) || '') as T
    } catch {
      return fb
    }
  }
  const write = (k: string, v: unknown) => {
    try {
      localStorage.setItem(k, JSON.stringify(v))
    } catch { /* ignora */ }
  }

  type Msg = { type: 'state'; state: LiveState } | { type: 'response'; r: Resp } | { type: 'reset' }
  const listeners = new Set<(m: Msg) => void>()
  bc?.addEventListener('message', (e) => listeners.forEach((l) => l(e.data as Msg)))
  const emit = (m: Msg) => {
    bc?.postMessage(m)
    listeners.forEach((l) => l(m)) // mesma aba
  }

  return {
    mode: 'local',
    async getState() {
      return read<LiveState>(S_KEY, IDLE)
    },
    watchState(cb, _pollMs, onBeat) {
      onBeat?.(true)
      cb(read<LiveState>(S_KEY, IDLE))
      const l = (m: Msg) => m.type === 'state' && cb(m.state)
      listeners.add(l)
      return () => listeners.delete(l)
    },
    async setState(_key, questionId, phase) {
      const s: LiveState = { question_id: questionId, phase, updated_at: new Date().toISOString() }
      write(S_KEY, s)
      emit({ type: 'state', state: s })
      return true
    },
    async checkKey() {
      return true
    },
    async submit(r) {
      const s = read<LiveState>(S_KEY, IDLE)
      if (s.question_id !== r.question_id || s.phase !== 'open') return { ok: false, reason: 'closed' }
      const all = read<Resp[]>(R_KEY, [])
      if (all.some((x) => x.question_id === r.question_id && x.participant_id === r.participant_id))
        return { ok: false, reason: 'duplicate' }
      all.push(r)
      write(R_KEY, all)
      emit({ type: 'response', r })
      return { ok: true }
    },
    async listResponses(questionId) {
      return read<Resp[]>(R_KEY, []).filter((r) => r.question_id === questionId)
    },
    onResponse(cb, onStatus) {
      onStatus?.(true)
      const l = (m: Msg) => m.type === 'response' && cb(m.r)
      listeners.add(l)
      return () => listeners.delete(l)
    },
    async resetQuestion(_key, questionId) {
      write(R_KEY, read<Resp[]>(R_KEY, []).filter((r) => r.question_id !== questionId))
      emit({ type: 'reset' })
      return true
    },
    async results(questionIds) {
      const out: Results = {}
      for (const r of read<Resp[]>(R_KEY, [])) {
        if (!questionIds.includes(r.question_id)) continue
        const q = (out[r.question_id] ??= {})
        q[r.value] = (q[r.value] || 0) + 1
      }
      return out
    },
  }
}

export const live: LiveBackend = HAS_SUPABASE ? supabaseBackend() : localBackend()

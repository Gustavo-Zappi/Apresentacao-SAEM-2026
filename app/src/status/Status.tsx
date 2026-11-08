import { useEffect, useState } from 'react'
import { live } from '../lib/live'
import { SUPABASE_URL, audienceUrl } from '../config'
import { KEY_STORE } from '../stage/Deck'

type Check = { title: string; ok: boolean | null; detail: string }

/** /status: diagnóstico em 10 segundos do que impede a dinâmica palco ↔ plateia. */
export default function Status() {
  const [checks, setChecks] = useState<Check[]>([])
  const [run, setRun] = useState(0)

  useEffect(() => {
    document.body.style.overflow = 'auto'
    const out: Check[] = []
    const push = (c: Check) => {
      out.push(c)
      setChecks([...out])
    }
    let off: (() => void) | undefined
    let timer: number | undefined
    ;(async () => {
      setChecks([])
      const sb = live.mode === 'supabase'
      push({
        title: 'Build conectado ao banco',
        ok: sb,
        detail: sb
          ? `Supabase: ${new URL(SUPABASE_URL).host}`
          : 'O build foi gerado SEM VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY. O app está em modo local: celulares nunca sincronizam com o palco. Refaça o build com app/.env.production.local preenchido.',
      })
      push({ title: 'URL do QR code', ok: true, detail: audienceUrl() })
      if (!sb) return

      let qid: string | null = null
      try {
        const s = await live.getState()
        qid = s.question_id
        push({ title: 'Leitura do estado ao vivo (live_state)', ok: true, detail: `pergunta: ${s.question_id ?? 'nenhuma'} · fase: ${s.phase} · atualizado: ${s.updated_at ?? '?'}` })
      } catch (e) {
        push({
          title: 'Leitura do estado ao vivo (live_state)',
          ok: false,
          detail: `Erro: ${(e as Error)?.message ?? e}. Causas comuns: migration não aplicada, linha 'saem2026' ausente, anon key errada ou domínio bloqueado pela CSP (connect-src).`,
        })
      }

      let key = ''
      try { key = localStorage.getItem(KEY_STORE) || '' } catch { /* ignora */ }
      if (!key) {
        push({ title: 'Chave do apresentador neste navegador', ok: false, detail: 'Nenhuma chave salva. Sem ela o palco não abre as perguntas nos celulares. Abra /palco e tecle K (ou use /palco?key=...).' })
      } else {
        const ok = await live.checkKey(key).catch(() => false)
        push({
          title: 'Chave do apresentador neste navegador',
          ok,
          detail: ok ? 'Chave válida: o palco controla os celulares.' : 'Chave salva, mas o banco recusou. Hash em saem_private.config diferente ou RPC check_presenter_key ausente.',
        })
      }

      if (qid) {
        const list = await live.listResponses(qid).catch(() => null)
        push({ title: 'Leitura das respostas', ok: list !== null, detail: list ? `${list.length} respostas em "${qid}"` : 'Falha ao ler public.responses.' })
      }

      const rt: Check = { title: 'Tempo real (palco recebe votos na hora)', ok: null, detail: 'conectando…' }
      push(rt)
      off = live.onResponse(() => {}, (ok) => {
        if (!ok) return
        rt.ok = true
        rt.detail = 'Canal conectado.'
        setChecks([...out])
      })
      timer = window.setTimeout(() => {
        if (rt.ok) return
        rt.ok = false
        rt.detail = 'Não conectou em 10 s. O palco ainda funciona por polling (atualiza a cada 3 s). Verifique wss:// na CSP e a publication supabase_realtime.'
        setChecks([...out])
      }, 10000)
    })()
    return () => {
      off?.()
      window.clearTimeout(timer)
    }
  }, [run])

  return (
    <div className="status">
      <div className="status-wrap">
        <h1>Diagnóstico SAEM 2026</h1>
        <div className="d" style={{ color: 'var(--c-mist)', marginBottom: 20 }}>Abra esta página no mesmo navegador do palco.</div>
        {checks.map((c) => (
          <div className="row" key={c.title}>
            <span className={`ic ${c.ok === null ? '' : c.ok ? 'ok' : 'bad'}`}>{c.ok === null ? '…' : c.ok ? '✓' : '✗'}</span>
            <div>
              <div className="t">{c.title}</div>
              <div className="d">{c.detail}</div>
            </div>
          </div>
        ))}
        <button onClick={() => setRun((r) => r + 1)}>Testar de novo</button>{' '}
        <a href="/palco" style={{ color: 'var(--c-purple)', marginLeft: 16 }}>abrir palco</a>
      </div>
    </div>
  )
}

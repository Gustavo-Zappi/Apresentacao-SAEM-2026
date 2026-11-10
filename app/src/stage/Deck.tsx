import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import gsap from 'gsap'
import FlowField, { setFlow } from '../components/FlowField'
import Clock from '../components/Clock'
import { EASE } from '../lib/motion'
import { SLIDES } from './slides'
import { QUESTION_BY_ID } from '../data/questions'
import { live } from '../lib/live'
import { SyncContext } from './sync'
import { participantId } from '../lib/participant'

type Pos = { i: number; s: number }

export const KEY_STORE = 'saem-presenter-key'
const POS_STORE = 'saem-deck-pos'
export const DECK_CHANNEL = 'saem-deck'

function clamp(p: Pos): Pos {
  const i = Math.max(0, Math.min(SLIDES.length - 1, p.i | 0))
  const s = Math.max(0, Math.min(SLIDES[i].steps - 1, p.s | 0))
  return { i, s }
}

function initialPos(): Pos {
  const m = location.hash.match(/^#(\d+)(?:\.(\d+))?/)
  if (m) return clamp({ i: +m[1], s: +(m[2] || 0) })
  try {
    return clamp(JSON.parse(localStorage.getItem(POS_STORE) || '{"i":0,"s":0}'))
  } catch {
    return { i: 0, s: 0 }
  }
}

function presenterKey(): string {
  const url = new URL(location.href)
  const k = url.searchParams.get('key')
  if (k) {
    try { localStorage.setItem(KEY_STORE, k) } catch { /* ignora */ }
    url.searchParams.delete('key')
    history.replaceState(null, '', url.pathname + url.search + url.hash)
    return k
  }
  try { return localStorage.getItem(KEY_STORE) || '' } catch { return '' }
}

const SAMPLE_WORDS = ['curiosidade', 'oportunidade', 'medo', 'ansiedade', 'futuro', 'aprendizado', 'desafio', 'ferramenta', 'mudança', 'empolgação', 'incerteza', 'produtividade']

export default function Deck() {
  const [shown, setShown] = useState<Pos>(initialPos)
  const shownRef = useRef(shown)
  const target = useRef(shown)
  const busy = useRef(false)
  const innerRef = useRef<HTMLDivElement>(null)
  const wipeRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [help, setHelp] = useState(false)
  const [black, setBlack] = useState(false)
  const [key, setKey] = useState(presenterKey)
  const [keyOk, setKeyOk] = useState<boolean | null>(null)
  const [syncErr, setSyncErr] = useState(false)
  const lastPush = useRef('')

  const askKey = useCallback(() => {
    const k = window.prompt('Chave do apresentador (fica salva só neste navegador):', '')
    if (!k) return
    try { localStorage.setItem(KEY_STORE, k.trim()) } catch { /* ignora */ }
    lastPush.current = ''
    setKeyOk(null)
    setKey(k.trim())
  }, [])

  shownRef.current = shown

  /* escala 1920×1080 → janela */
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    if (live.mode === 'supabase' && !key) {
      setKeyOk(false)
      return
    }
    live.checkKey(key).then(setKeyOk).catch(() => setKeyOk(false))
  }, [key])

  /* navegação com transições */
  const run = useCallback(() => {
    const next = target.current
    const cur = shownRef.current
    if (next.i === cur.i) {
      setShown(next)
      return
    }
    busy.current = true
    const dir = next.i > cur.i ? 1 : -1
    const done = () => {
      busy.current = false
      const t = target.current
      if (t.i !== shownRef.current.i || t.s !== shownRef.current.s) run()
    }
    // flushSync: o slide novo já está montado (com a entrada dele armada) antes de o palco reaparecer
    const swap = () => flushSync(() => setShown({ ...target.current }))
    const wipe = SLIDES[next.i].transition === 'wipe'
    const inner = innerRef.current
    const tl = gsap.timeline({ onComplete: done })
    if (wipe) {
      // abertura de seção: uma cortina cruza a tela no sentido da navegação
      tl.set(wipeRef.current, { transformOrigin: dir > 0 ? 'left center' : 'right center' })
        .to(wipeRef.current, { scaleX: 1, duration: 0.55, ease: EASE.inOut })
        .call(swap)
        .set(inner, { autoAlpha: 1, y: 0 })
        .set(wipeRef.current, { transformOrigin: dir > 0 ? 'right center' : 'left center' }, '+=0.12')
        .to(wipeRef.current, { scaleX: 0, duration: 0.7, ease: EASE.inOut })
    } else {
      // troca comum: o slide atual sai no sentido da navegação e o próximo assenta no lugar
      tl.to(inner, { autoAlpha: 0, y: -18 * dir, duration: 0.26, ease: EASE.in })
        .call(swap)
        .fromTo(inner, { autoAlpha: 0, y: 14 * dir }, { autoAlpha: 1, y: 0, duration: 0.5, ease: EASE.out, immediateRender: false }, '+=0.04')
    }
  }, [])

  const go = useCallback(
    (p: Pos) => {
      target.current = clamp(p)
      if (!busy.current) run()
    },
    [run],
  )

  const next = useCallback(() => {
    const t = target.current
    if (t.s < SLIDES[t.i].steps - 1) go({ i: t.i, s: t.s + 1 })
    else if (t.i < SLIDES.length - 1) go({ i: t.i + 1, s: 0 })
  }, [go])

  const prev = useCallback(() => {
    const t = target.current
    if (t.s > 0) go({ i: t.i, s: t.s - 1 })
    else if (t.i > 0) go({ i: t.i - 1, s: SLIDES[t.i - 1].steps - 1 })
  }, [go])

  /* persistência + fundo + canal para a janela de notas */
  const bc = useRef<BroadcastChannel | null>(null)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const ch = new BroadcastChannel(DECK_CHANNEL)
    bc.current = ch
    ch.onmessage = (e) => {
      const m = e.data as { cmd: string; i?: number }
      if (m.cmd === 'next') next()
      else if (m.cmd === 'prev') prev()
      else if (m.cmd === 'goto' && typeof m.i === 'number') go({ i: m.i, s: 0 })
      else if (m.cmd === 'hello') ch.postMessage({ type: 'pos', ...shownRef.current })
    }
    return () => ch.close()
  }, [next, prev, go])

  useEffect(() => {
    history.replaceState(null, '', `${location.pathname}${location.search}#${shown.i}.${shown.s}`)
    try { localStorage.setItem(POS_STORE, JSON.stringify(shown)) } catch { /* ignora */ }
    bc.current?.postMessage({ type: 'pos', ...shown })
    setFlow(SLIDES[shown.i].flow ?? 'laminar')
  }, [shown])

  /* sincroniza a plateia: abre/fecha/revela a pergunta do slide atual */
  const canControl = live.mode === 'local' || keyOk === true
  useEffect(() => {
    if (!canControl) return
    const def = SLIDES[shown.i]
    let qid: string | null = null
    let phase: 'idle' | 'open' | 'closed' | 'reveal' = 'idle'
    if (def.question) {
      qid = def.question
      phase = shown.s === 0 ? 'open' : QUESTION_BY_ID[qid].correct ? 'reveal' : 'closed'
    }
    const sig = `${qid}|${phase}`
    if (sig === lastPush.current) return
    lastPush.current = sig
    let cancelled = false
    let timer: number | undefined
    // reenvia até o banco aceitar (rede instável no anfiteatro)
    const push = async (attempt: number) => {
      const ok = await live.setState(key, qid, phase).catch(() => false)
      if (cancelled) return
      setSyncErr(!ok)
      if (!ok && attempt < 20) timer = window.setTimeout(() => push(attempt + 1), Math.min(1000 * 2 ** attempt, 8000))
    }
    push(0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [shown, canControl, key])

  /* teclado (clicker envia PageUp/PageDown) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'n'].includes(k)) { e.preventDefault(); next() }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p'].includes(k)) { e.preventDefault(); prev() }
      else if (k === 'Home') go({ i: 0, s: 0 })
      else if (k === 'End') go({ i: SLIDES.length - 1, s: 0 })
      else if (k === 'f') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
      else if (k === 'b' || k === '.') setBlack((v) => !v)
      else if (k === 'h' || k === '?') setHelp((v) => !v)
      else if (k === 'Escape') { setHelp(false); setBlack(false) }
      else if (k === 'o') window.open('/notas', 'saem-notas', 'width=1100,height=760')
      else if (k === 'k') askKey()
      else if (k === 'r') {
        const qid = SLIDES[shownRef.current.i].question
        if (qid && confirm(`Apagar todas as respostas de "${qid}"?`)) live.resetQuestion(key, qid)
      } else if (k === 's' && live.mode === 'local') simulate()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, go, key, askKey])

  /* ensaio: gera votos falsos no modo local */
  function simulate() {
    const qid = SLIDES[shownRef.current.i].question
    if (!qid) return
    const q = QUESTION_BY_ID[qid]
    for (let n = 0; n < 14; n++) {
      setTimeout(() => {
        const opts = q.options ?? []
        const value =
          q.type === 'words'
            ? SAMPLE_WORDS[Math.floor(Math.random() ** 1.6 * SAMPLE_WORDS.length)]
            : (q.correct && Math.random() < 0.45 ? q.correct : opts[Math.floor(Math.random() * opts.length)].id)
        live.submit({ question_id: qid, participant_id: participantId() + '-sim-' + Math.random().toString(36).slice(2), value })
      }, n * 140 + Math.random() * 200)
    }
  }

  const Comp = SLIDES[shown.i].Component
  const total = SLIDES.length
  const mode =
    live.mode === 'local'
      ? 'modo local: celulares NÃO sincronizam'
      : keyOk === null
        ? 'conectando'
        : !keyOk
          ? (key ? 'chave inválida' : 'sem chave') + ': plateia não sincroniza (tecla K)'
          : syncErr
            ? 'falha ao sincronizar, tentando de novo'
            : 'ao vivo'
  const alert = live.mode === 'local' || keyOk === false || syncErr

  return (
    <div className="viewport" onClick={(e) => { if (e.detail === 1 && e.clientX > window.innerWidth * 0.85) next() }}>
      <FlowField />
      <div className="vignette" aria-hidden />
      <div className="stage" style={{ transform: `scale(${scale}) translate(-960px, -540px)` }}>
        <div ref={innerRef} style={{ position: 'absolute', inset: 0 }}>
          <SyncContext.Provider value={!alert || live.mode === 'local'}>
            <Comp key={shown.i} step={shown.s} />
          </SyncContext.Provider>
        </div>
      </div>
      <div ref={wipeRef} className="wipe" />
      {/* camada fixa do palco: fica por cima das transições e na mesma escala dos slides */}
      <div className="stage stage-fixed" style={{ transform: `scale(${scale}) translate(-960px, -540px)` }}>
        <Clock />
      </div>
      {black && <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 40 }} />}
      <div className="progress" style={{ width: `${((shown.i + 1) / total) * 100}%` }} />
      <div className={`hud ${alert ? 'alert' : ''}`} onClick={(e) => { e.stopPropagation(); if (live.mode === 'supabase' && !keyOk) askKey() }}>
        <span><i className={`dot ${alert ? 'warn' : keyOk ? 'on' : ''}`} />{mode}</span>
        <span title="número usado no link (#slide.passo)">#{shown.i}.{shown.s} · {shown.i + 1}/{total}</span>
      </div>
      {help && (
        <div className="help" onClick={() => setHelp(false)}>
          <div>
            <div><kbd>→ / espaço / PgDn</kbd>avançar</div>
            <div><kbd>← / PgUp</kbd>voltar</div>
            <div><kbd>F</kbd>tela cheia</div>
            <div><kbd>B</kbd>tela preta</div>
            <div><kbd>O</kbd>abrir notas do apresentador</div>
            <div><kbd>K</kbd>informar chave do apresentador</div>
            <div><kbd>R</kbd>zerar respostas da pergunta atual</div>
            {live.mode === 'local' && <div><kbd>S</kbd>simular votos (ensaio)</div>}
            <div><kbd>Home / End</kbd>início / fim</div>
          </div>
        </div>
      )}
    </div>
  )
}

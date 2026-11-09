import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { live, type LiveState } from '../lib/live'
import { participantId, recalledVote, rememberVote } from '../lib/participant'
import { QUESTION_BY_ID, normalizeWord, type Question } from '../data/questions'
import { AUDIENCE_POLL_MS } from '../config'

/** App da plateia: segue o palco sozinho. Uma tela por fase da pergunta. */
export default function Audience() {
  const [state, setState] = useState<LiveState | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'auto'
    let misses = 0
    const fail = window.setInterval(() => {
      misses++
      if (misses > 4) setOffline(true)
    }, AUDIENCE_POLL_MS * 2)
    const off = live.watchState((s) => {
      misses = 0
      setOffline(false)
      setState(s)
    }, AUDIENCE_POLL_MS)
    return () => {
      off()
      window.clearInterval(fail)
    }
  }, [])

  const q = state?.question_id ? QUESTION_BY_ID[state.question_id] : undefined
  const screenKey = !state ? 'loading' : !q || state.phase === 'idle' ? 'idle' : `${q.id}`

  return (
    <div className="aud">
      <Blobs />
      <div className="aud-top">
        <span>SAEM 2026 · UFJF</span>
        <span>{offline ? 'reconectando…' : live.mode === 'local' ? 'modo ensaio' : 'ao vivo'}</span>
      </div>
      <div className="aud-main">
        {screenKey === 'loading' && <Waiting title="Conectando…" sub="Só um instante." />}
        {screenKey === 'idle' && <Waiting title="Olhe para o palco." sub="A próxima pergunta aparece aqui sozinha. Deixe esta página aberta." />}
        {q && state && state.phase !== 'idle' && <QuestionScreen key={screenKey} q={q} phase={state.phase} />}
      </div>
      <div className="aud-foot">
        <img src="/logo-4matt-branco.png" alt="4MATT" />
        Respostas anônimas. Usadas só nesta palestra.
      </div>
    </div>
  )
}

function Blobs() {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>('i', ref.current).forEach((b, i) => {
        gsap.to(b, {
          x: () => gsap.utils.random(-120, 120),
          y: () => gsap.utils.random(-160, 160),
          scale: () => gsap.utils.random(0.8, 1.3),
          duration: 6 + i * 2,
          repeat: -1,
          yoyo: true,
          repeatRefresh: true,
          ease: 'sine.inOut',
        })
      })
    },
    { scope: ref },
  )
  return (
    <div className="aud-bg" ref={ref} aria-hidden>
      <i style={{ width: 380, height: 380, left: '10%', top: '10%', background: '#58178B' }} />
      <i style={{ width: 300, height: 300, right: '5%', top: '45%', background: '#9156F1', opacity: 0.6 }} />
      <i style={{ width: 340, height: 340, left: '25%', bottom: '5%', background: '#201E4B' }} />
    </div>
  )
}

function Waiting({ title, sub }: { title: string; sub: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.from(ref.current!.children, { y: 24, autoAlpha: 0, stagger: 0.1, duration: 0.7, ease: 'power3.out' })
      gsap.utils.toArray<HTMLElement>('.rings i', ref.current).forEach((r, i) => {
        gsap.fromTo(r, { scale: 0.4, autoAlpha: 0.9 }, { scale: 1.6, autoAlpha: 0, duration: 2.4, repeat: -1, delay: i * 0.8, ease: 'power1.out' })
      })
      gsap.to('.rings b', { scale: 0.85, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    },
    { scope: ref },
  )
  return (
    <div ref={ref} className="aud-center">
      <div className="rings"><i /><i /><i /><b /></div>
      <div className="aud-big">{title}</div>
      <div className="aud-sub">{sub}</div>
    </div>
  )
}

function QuestionScreen({ q, phase }: { q: Question; phase: LiveState['phase'] }) {
  const [mine, setMine] = useState<string | null>(() => recalledVote(q.id))
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [word, setWord] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const isOpen = phase === 'open'
  const revealed = phase === 'reveal'

  useGSAP(
    () => {
      gsap.from('[data-a]', { y: 30, autoAlpha: 0, stagger: 0.07, duration: 0.6, ease: 'power3.out' })
    },
    { scope: ref, dependencies: [mine === null, phase], revertOnUpdate: true },
  )

  // acertou? confete
  useEffect(() => {
    if (!revealed || !q.correct || mine !== q.correct) return
    const colors = ['#9156F1', '#ffffff', '#3DDC97', '#cbb3ff']
    const bits = Array.from({ length: 60 }, (_, i) => {
      const d = document.createElement('i')
      d.className = 'confetti'
      d.style.background = colors[i % colors.length]
      document.body.appendChild(d)
      return d
    })
    bits.forEach((d) => {
      gsap.fromTo(d, { x: 0, y: 0, rotation: 0 }, {
        x: gsap.utils.random(-220, 220),
        y: gsap.utils.random(-380, -120),
        rotation: gsap.utils.random(-540, 540),
        duration: 0.9,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(d, { y: '+=700', autoAlpha: 0, duration: 1.6, ease: 'power1.in', onComplete: () => d.remove() })
        },
      })
    })
    navigator.vibrate?.([40, 60, 40])
    return () => bits.forEach((d) => d.remove())
  }, [revealed, mine, q])

  async function send(value: string) {
    if (sending || mine || !isOpen) return
    setErr('')
    setSending(true)
    navigator.vibrate?.(25)
    const r = await live.submit({ question_id: q.id, participant_id: participantId(), value })
    setSending(false)
    if (r.ok || r.reason === 'duplicate') {
      rememberVote(q.id, value)
      setMine(value)
      if (ref.current) {
        gsap.fromTo(ref.current.querySelector('.check path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, delay: 0.2, ease: 'power2.out' })
      }
    } else if (r.reason === 'closed') setErr('A votação desta pergunta já foi encerrada.')
    else setErr('Sem conexão agora. Toque de novo em alguns segundos.')
  }

  function sendWord() {
    const w = normalizeWord(word)
    if (!w) {
      setErr('Use uma palavra de 2 a 24 letras (e sem palavrão 😉).')
      return
    }
    send(w)
  }

  const title = q.mobilePrompt || q.prompt
  const labelOf = (id: string | null) => q.options?.find((o) => o.id === id)?.label ?? id ?? ''

  return (
    <div ref={ref}>
      <div className="aud-q" data-a>{title}</div>

      {q.type === 'choice' &&
        q.options!.map((o, i) => {
          const sel = mine === o.id
          const right = revealed && q.correct === o.id
          return (
            <button
              key={o.id}
              data-a
              className={`aud-opt ${sel ? 'sel' : ''} ${right ? 'right' : ''}`}
              disabled={!isOpen || !!mine || sending}
              onClick={() => send(o.id)}
              style={{ opacity: (mine || !isOpen) && !sel && !right ? 0.45 : 1 }}
            >
              <span className="k">{String.fromCharCode(65 + i)}</span>
              {o.label}
              {right && <span style={{ marginLeft: 'auto' }}>✓</span>}
            </button>
          )
        })}

      {q.type === 'words' && !mine && isOpen && (
        <div data-a>
          <input
            className="aud-input"
            value={word}
            maxLength={24}
            placeholder={q.placeholder}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendWord()}
            autoCapitalize="none"
            enterKeyHint="send"
          />
          <button className="aud-btn" disabled={!word.trim() || sending} onClick={sendWord}>Enviar</button>
        </div>
      )}

      {mine && (
        <div className="aud-center" data-a style={{ marginTop: 20 }}>
          <svg className="check" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(145,86,241,.4)" strokeWidth="4" />
            <path d="M28 50 L42 63 L69 34" fill="none" stroke="#9156F1" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {revealed && q.correct ? (
            mine === q.correct ? (
              <div className="aud-big">Você acertou!</div>
            ) : (
              <>
                <div className="aud-big">Quase.</div>
                <div className="aud-sub">Resposta certa: {labelOf(q.correct)}</div>
              </>
            )
          ) : (
            <>
              <div className="aud-big">Resposta registrada</div>
              <div className="aud-sub">{q.type === 'words' ? `“${mine}” já está no telão.` : 'Olhe o resultado no telão.'}</div>
            </>
          )}
        </div>
      )}

      {!mine && !isOpen && (
        <div className="aud-center" data-a style={{ marginTop: 16 }}>
          <div className="aud-sub">
            Votação encerrada.{revealed && q.correct ? ` Resposta certa: ${labelOf(q.correct)}.` : ''}
          </div>
        </div>
      )}

      {err && <div className="aud-err">{err}</div>}
    </div>
  )
}

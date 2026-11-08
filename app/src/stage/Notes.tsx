import { useEffect, useRef, useState } from 'react'
import { SLIDES } from './slides'
import { DECK_CHANNEL } from './Deck'

/** Janela de notas (abra no notebook com a tecla O; o palco fica no projetor). */
export default function Notes() {
  const [pos, setPos] = useState({ i: 0, s: 0 })
  const [start, setStart] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const ch = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const c = new BroadcastChannel(DECK_CHANNEL)
    ch.current = c
    c.onmessage = (e) => {
      if (e.data?.type === 'pos') setPos({ i: e.data.i, s: e.data.s })
    }
    c.postMessage({ cmd: 'hello' })
    const t = setInterval(() => setNow(Date.now()), 1000)
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) c.postMessage({ cmd: 'next' })
      if (['ArrowLeft', 'PageUp'].includes(e.key)) c.postMessage({ cmd: 'prev' })
    }
    window.addEventListener('keydown', onKey)
    return () => { c.close(); clearInterval(t); window.removeEventListener('keydown', onKey) }
  }, [])

  const def = SLIDES[pos.i]
  const nextDef = SLIDES[pos.i + 1]
  const planned = SLIDES.slice(0, pos.i).reduce((a, s) => a + (s.minutes ?? 0), 0)
  const elapsed = start ? Math.floor((now - start) / 1000) : 0
  const mm = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`
  const drift = start ? elapsed - planned * 60 : 0

  return (
    <div className="notes">
      <div className="timer" onClick={() => setStart(start ? null : Date.now())} title="clique para iniciar/zerar">
        {start ? mm(elapsed) : '▶ iniciar'}
        {start && <div style={{ fontSize: 16, color: drift > 60 ? '#FFB547' : '#3DDC97' }}>{drift >= 0 ? '+' : '−'}{mm(Math.abs(drift))} vs. roteiro</div>}
      </div>
      <h1>{pos.i + 1}. {def.title}</h1>
      <div className="meta">passo {pos.s + 1}/{def.steps} · previsto {def.minutes ?? 0} min{def.question ? ` · pergunta: ${def.question}` : ''}</div>
      <div className="body">{def.notes || 'Sem notas.'}</div>
      <div className="next">próximo: {nextDef ? nextDef.title : 'fim'}</div>
      <div className="nav">
        <button onClick={() => ch.current?.postMessage({ cmd: 'prev' })}>← voltar</button>
        <button onClick={() => ch.current?.postMessage({ cmd: 'next' })}>avançar →</button>
        <select onChange={(e) => ch.current?.postMessage({ cmd: 'goto', i: +e.target.value })} value={pos.i} style={{ padding: 12, borderRadius: 10, background: '#222', color: '#fff' }}>
          {SLIDES.map((s, i) => <option key={s.id} value={i}>{i + 1}. {s.title}</option>)}
        </select>
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Slide from './Slide'
import QR from './QR'
import CountUp from './CountUp'
import WordCloud from './WordCloud'
import { QUESTION_BY_ID } from '../data/questions'
import { useResponses } from '../lib/useResponses'
import { audienceUrl, audienceUrlLabel } from '../config'

/** Slide de pergunta ao vivo. Passo 0: votação aberta. Passo 1: encerra e revela. */
export default function Poll({ qid, step, kicker = 'Pergunta ao vivo' }: { qid: string; step: number; kicker?: string }) {
  const q = QUESTION_BY_ID[qid]
  const { counts, total } = useResponses(qid)
  const revealed = step >= 1
  const barsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barsRef.current || q.type !== 'choice') return
    q.options!.forEach((o) => {
      const el = barsRef.current!.querySelector<HTMLElement>(`[data-opt="${o.id}"] .bar-fill`)
      const pct = total ? ((counts[o.id] || 0) / total) * 100 : 0
      if (el) gsap.to(el, { width: `${pct}%`, duration: 0.9, ease: 'elastic.out(1, 0.75)' })
    })
  }, [counts, total, q])

  useEffect(() => {
    if (!revealed || !q.correct || !barsRef.current) return
    const el = barsRef.current.querySelector(`[data-opt="${q.correct}"]`)
    if (el) gsap.fromTo(el, { scale: 1 }, { scale: 1.035, duration: 0.25, yoyo: true, repeat: 3, ease: 'power1.inOut' })
  }, [revealed, q])

  const pct = (id: string) => (total ? Math.round(((counts[id] || 0) / total) * 100) : 0)

  return (
    <Slide step={step}>
      <div className="poll">
        <div>
          <div className="kicker" data-in>{kicker}</div>
          <h2 className="poll-q" data-split>{q.prompt}</h2>

          {q.type === 'choice' ? (
            <div className="bars" ref={barsRef}>
              {q.options!.map((o) => {
                const cls = revealed && q.correct ? (o.id === q.correct ? 'correct' : 'dim') : ''
                return (
                  <div key={o.id} className={`bar ${cls}`} data-opt={o.id} data-in>
                    <div className="bar-fill" />
                    <div className="bar-label">
                      <span>{o.label}</span>
                      <span className="pct">{pct(o.id)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div data-in>
              <WordCloud counts={counts} />
            </div>
          )}

          {q.revealNote && (
            <p className="reveal-note" data-step="1">
              {q.revealNote}
            </p>
          )}
        </div>

        <div data-in>
          <div className="qr-card">
            <QR url={audienceUrl()} />
            <div className="url">{audienceUrlLabel()}</div>
            <div className="hint">Aponte a câmera e responda</div>
          </div>
          <div className="counter">
            <b><CountUp to={total} duration={0.6} /></b>
            <span>{total === 1 ? 'resposta' : 'respostas'}</span>
          </div>
          <div className="status-pill">
            <span className="pill">{revealed ? '■ votação encerrada' : '● votação aberta'}</span>
          </div>
        </div>
      </div>
    </Slide>
  )
}

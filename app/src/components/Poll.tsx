import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Slide from './Slide'
import QR from './QR'
import CountUp from './CountUp'
import WordCloud from './WordCloud'
import { IcCheck } from './Icons'
import { QUESTION_BY_ID } from '../data/questions'
import { useResponses } from '../lib/useResponses'
import { audienceUrl, audienceUrlLabel } from '../config'
import { useSynced } from '../stage/sync'
import { EASE } from '../lib/motion'

/**
 * Slide de pergunta ao vivo. Passo 0: votação aberta. Passo 1: encerra e revela.
 *
 * Para onde vai o olhar:
 *  - aberta: o QR code é o chamado à ação e a opção na frente tem a barra mais viva;
 *  - encerrada: o QR recua e a resposta certa (ou a mais votada, quando não há gabarito) fica em evidência.
 */
export default function Poll({ qid, step, kicker = 'Pergunta ao vivo' }: { qid: string; step: number; kicker?: string }) {
  const q = QUESTION_BY_ID[qid]
  const { counts, total } = useResponses(qid)
  const revealed = step >= 1
  const synced = useSynced()
  const barsRef = useRef<HTMLDivElement>(null)
  /** Percentual exibido por opção (o número acompanha a barra em vez de saltar). */
  const shown = useRef<Record<string, { v: number }>>({})

  useEffect(() => {
    if (!barsRef.current || q.type !== 'choice') return
    q.options!.forEach((o) => {
      const row = barsRef.current!.querySelector<HTMLElement>(`[data-opt="${o.id}"]`)
      if (!row) return
      const pct = total ? ((counts[o.id] || 0) / total) * 100 : 0
      gsap.to(row.querySelector('.bar-fill'), { width: `${pct}%`, duration: 0.8, ease: EASE.out, overwrite: true })
      const num = row.querySelector<HTMLElement>('.pct-n')!
      const st = (shown.current[o.id] ??= { v: 0 })
      gsap.to(st, {
        v: pct,
        duration: 0.8,
        ease: EASE.out,
        overwrite: true,
        onUpdate: () => {
          num.textContent = `${Math.round(st.v)}%`
        },
      })
    })
  }, [counts, total, q])

  // revelação: um único pulso suave na opção em evidência
  useEffect(() => {
    if (!revealed || !barsRef.current) return
    const el = barsRef.current.querySelectorAll('.bar.correct, .bar.pick')
    if (el.length) gsap.fromTo(el, { scale: 1 }, { scale: 1.018, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.inOut', delay: 0.1 })
  }, [revealed, q])

  const max = q.options ? Math.max(0, ...q.options.map((o) => counts[o.id] || 0)) : 0
  const dense = (q.options?.length ?? 0) >= 5

  return (
    <Slide step={step}>
      <div className={`poll ${revealed ? 'closed' : ''}`}>
        <div>
          <div className="kicker" data-in>{kicker}</div>
          <h2 className="poll-q" data-split>{q.prompt}</h2>

          {q.type === 'choice' ? (
            <div className={`bars ${dense ? 'dense' : ''}`} ref={barsRef}>
              {q.options!.map((o) => {
                const leader = max > 0 && (counts[o.id] || 0) === max
                let cls = leader ? 'lead' : ''
                if (revealed && q.correct) cls += o.id === q.correct ? ' correct' : ' dim'
                else if (revealed && max > 0) cls += leader ? ' pick' : ' soft'
                return (
                  <div key={o.id} className={`bar ${cls}`} data-opt={o.id} data-in>
                    <div className="bar-fill" />
                    <div className="bar-label">
                      <span>{o.label}</span>
                      <span className="pct">
                        <span className="bar-check"><IcCheck /></span>
                        <span className="pct-n">0%</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div data-in="fade">
              <WordCloud counts={counts} />
            </div>
          )}

          {q.revealNote && (
            <p className="reveal-note" data-step="1">
              {q.revealNote}
            </p>
          )}
        </div>

        <div className="poll-side">
          <div data-in="scale">
            <div className="qr-card">
              <QR url={audienceUrl()} />
              <div className="url">{audienceUrlLabel()}</div>
              <div className="hint">Aponte a câmera e responda</div>
            </div>
          </div>
          <div className="counter" data-in>
            <b><CountUp to={total} duration={0.6} /></b>
            <span>{total === 1 ? 'resposta' : 'respostas'}</span>
          </div>
          <div className="status-pill" data-in>
            {synced ? (
              <span className={`pill ${revealed ? 'closed' : 'live'}`}><i />{revealed ? 'votação encerrada' : 'votação aberta'}</span>
            ) : (
              <span className="pill warn">⚠ celulares fora de sincronia</span>
            )}
          </div>
        </div>
      </div>
    </Slide>
  )
}

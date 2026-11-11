import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { live, type LiveState, type Results } from '../lib/live'
import { recalledVote } from '../lib/participant'
import { DECK_POLLS, QUESTION_BY_ID, type Question } from '../data/questions'

const POLL_MS = 6000

/**
 * Painel "Ver enquetes" do celular: resultado de cada votação do deck.
 * - A votação ainda aberta não mostra parcial (para não influenciar quem vai votar).
 * - Marca o voto deste celular com texto ("seu voto"), não só com cor.
 */
export default function Enquetes({ state, final, onBack }: { state: LiveState | null; final: boolean; onBack: () => void }) {
  const [res, setRes] = useState<Results | null>(null)
  const [err, setErr] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let stopped = false
    let timer: number | undefined
    const tick = async () => {
      if (stopped) return
      if (document.visibilityState === 'visible') {
        try {
          setRes(await live.results(DECK_POLLS))
          setErr(false)
        } catch {
          setErr(true)
        }
      }
      // jitter: os celulares não consultam todos no mesmo instante
      timer = window.setTimeout(tick, POLL_MS + Math.random() * 1500)
    }
    tick()
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [])

  useGSAP(
    () => {
      gsap.from('.enq-card', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' })
    },
    { scope: ref, dependencies: [res === null] },
  )

  const openId = state?.phase === 'open' ? state.question_id : null

  return (
    <div ref={ref} className="enq">
      <div className="enq-head">
        <div className="aud-big">{final ? 'Obrigado por participar!' : 'Resultados das enquetes'}</div>
        <div className="aud-sub">{final ? 'Este é o resultado final das votações desta palestra.' : 'Atualiza sozinho enquanto esta tela estiver aberta.'}</div>
      </div>
      {res === null && !err && <div className="aud-sub enq-empty">Carregando…</div>}
      {res === null && err && <div className="aud-sub enq-empty">Sem conexão agora. Tentando de novo…</div>}
      {res &&
        DECK_POLLS.map((qid, i) => {
          const q = QUESTION_BY_ID[qid]
          return q ? <Card key={qid} n={i + 1} q={q} votes={res[qid] ?? {}} open={openId === qid} /> : null
        })}
      <button className="aud-btn enq-back" onClick={onBack}>Voltar</button>
    </div>
  )
}

function Card({ n, q, votes, open }: { n: number; q: Question; votes: Record<string, number>; open: boolean }) {
  const total = Object.values(votes).reduce((a, b) => a + b, 0)
  const mine = recalledVote(q.id)
  // escolha: ordem das opções (estável entre atualizações); palavras: as mais citadas
  const rows: { id: string; label: string; n: number }[] =
    q.type === 'choice'
      ? (q.options ?? []).map((o) => ({ id: o.id, label: o.label, n: votes[o.id] ?? 0 }))
      : Object.entries(votes).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w, c]) => ({ id: w, label: w, n: c }))
  const top = Math.max(0, ...rows.map((r) => r.n))

  return (
    <section className="enq-card">
      <div className="enq-meta mono">
        <span>ENQUETE {n}</span>
        {!open && <span>{total} {total === 1 ? 'voto' : 'votos'}</span>}
      </div>
      <div className="enq-q">{q.mobilePrompt || q.prompt}</div>
      {open ? (
        <div className="aud-sub">Votação em andamento. O resultado aparece aqui quando ela fechar.</div>
      ) : total === 0 ? (
        <div className="aud-sub">Ainda sem votos.</div>
      ) : (
        <ul className="enq-rows">
          {rows.map((r) => {
            const pct = total ? Math.round((r.n / total) * 100) : 0
            const isMine = mine === r.id
            const isRight = !!q.correct && q.correct === r.id
            return (
              <li key={r.id} className={`${isMine ? 'mine' : ''} ${r.n === top && top > 0 ? 'top' : ''}`}>
                <div className="enq-line">
                  <span className="enq-label">
                    {r.label}
                    {isMine && <em className="enq-tag">seu voto</em>}
                    {isRight && <em className="enq-tag ok">✓ resposta certa</em>}
                  </span>
                  <span className="enq-pct mono">{pct}%</span>
                </div>
                <div className="enq-track" aria-hidden><i style={{ width: `${pct}%` }} /></div>
                <div className="enq-n mono">{r.n} {r.n === 1 ? 'voto' : 'votos'}</div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

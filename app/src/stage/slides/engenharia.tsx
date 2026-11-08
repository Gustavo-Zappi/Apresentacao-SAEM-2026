import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import CountUp from '../../components/CountUp'
import type { SlideProps } from '../types'

/* ---------------------------------------------------------------- Diagrama T-s */

const xS = (s: number) => 70 + s * 78
const yT = (T: number) => 590 - T * 1.0

// Linha de saturação da água (s em kJ/kg·K, T em °C)
const LIQ: [number, number][] = [[0, 0.01], [0.5725, 40], [1.3069, 100], [1.8418, 150], [2.3305, 200], [2.7935, 250], [3.2534, 300], [3.7776, 350], [4.1, 370], [4.407, 374]]
const VAP: [number, number][] = [[4.407, 374], [4.71, 370], [5.2112, 350], [5.7045, 300], [6.0729, 250], [6.4302, 200], [6.8379, 150], [7.3549, 100], [8.2557, 40], [9.1556, 0.01]]

function smooth(pts: [number, number][]) {
  const p = pts.map(([s, T]) => [xS(s), yT(T)])
  let d = `M ${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`
  }
  return d
}

// Ciclo A (ideal, vapor saturado 8 MPa, condensador 8 kPa)
const S1 = 0.5926
const S3 = 5.7432
const T_HOT = 295
const T_COLD = 41.5
const heating: [number, number][] = [[S1, T_COLD], [1.3069, 100], [1.8418, 150], [2.3305, 200], [2.7935, 250], [3.2067, T_HOT]]
const CYCLE =
  smooth(heating) +
  ` L ${xS(S3)} ${yT(T_HOT)} L ${xS(S3)} ${yT(T_COLD)} L ${xS(S1)} ${yT(T_COLD)}`

const STATES = [
  { n: '1', s: S1, T: T_COLD, dx: 14, dy: 44 },
  { n: '2', s: S1, T: T_COLD + 6, dx: -34, dy: -18 },
  { n: '3', s: S3, T: T_HOT, dx: 26, dy: -16 },
  { n: '4', s: S3, T: T_COLD, dx: 26, dy: 40, extra: 'x = ?' },
]

export function Rankine({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (step >= 1) gsap.fromTo('.dome', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.8, ease: 'power2.inOut' })
      if (step >= 2) {
        const tl = gsap.timeline()
        tl.fromTo('.cycle', { drawSVG: '0%' }, { drawSVG: '100%', duration: 2.4, ease: 'none' })
        tl.fromTo('.state', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, stagger: 0.3, ease: 'back.out(3)', duration: 0.5 }, 0.2)
        tl.to('.state-4 .ring', { scale: 1.8, autoAlpha: 0, transformOrigin: '50% 50%', repeat: -1, duration: 1.4, ease: 'power1.out' })
      }
    },
    { scope: ref, dependencies: [step] },
  )

  return (
    <Slide step={step}>
      <div ref={ref} style={{ display: 'grid', gridTemplateColumns: '1fr 860px', gap: 64, height: '100%' }}>
        <div>
          <div className="kicker" data-in>Bloco 1 · Problema de livro-texto</div>
          <h1 className="h1" data-split>Ciclo Rankine ideal</h1>
          <div className="grid" style={{ marginTop: 56, gap: 22 }}>
            {[
              ['Turbina', 'vapor saturado a 8 MPa'],
              ['Condensador', '8 kPa'],
              ['Potência líquida', '100 MW'],
              ['Calcular', 'η térmica, vazão de vapor, calor rejeitado'],
            ].map(([k, v]) => (
              <div key={k} data-in style={{ display: 'flex', gap: 24, fontSize: 34, alignItems: 'baseline' }}>
                <span className="mono accent" style={{ fontSize: 22, width: 250, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          <p className="lead" data-step="2" style={{ marginTop: 64, fontSize: 32 }}>
            Eu levava <b style={{ color: '#fff' }}>cerca de 1 hora</b> com tabela de vapor e interpolação.
          </p>
        </div>

        <svg viewBox="0 0 860 660" width="860" height="660" style={{ overflow: 'visible', alignSelf: 'center' }}>
          <g data-in stroke="rgba(255,255,255,.35)" strokeWidth="2">
            <line x1={xS(0)} y1={yT(0)} x2={xS(9.8)} y2={yT(0)} />
            <line x1={xS(0)} y1={yT(0)} x2={xS(0)} y2={yT(530)} />
          </g>
          <text data-in x={xS(9.8)} y={yT(0) + 40} textAnchor="end" fill="rgba(255,255,255,.6)" fontSize="24" fontFamily="JetBrains Mono">s [kJ/kg·K]</text>
          <text data-in x={xS(0) - 16} y={yT(520)} textAnchor="end" fill="rgba(255,255,255,.6)" fontSize="24" fontFamily="JetBrains Mono">T</text>
          <g data-step="1">
            <path className="dome" d={smooth([...LIQ, ...VAP.slice(1)])} stroke="rgba(255,255,255,.75)" strokeWidth="3" fill="none" />
            <text x={xS(4.4)} y={yT(400)} textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="22" fontFamily="JetBrains Mono">ponto crítico</text>
          </g>
          <g data-step="2">
            <path className="cycle" d={CYCLE} stroke="#9156F1" strokeWidth="6" fill="rgba(145,86,241,.12)" strokeLinejoin="round" />
            {STATES.map((st) => (
              <g key={st.n} className={`state state-${st.n}`}>
                {st.n === '4' && <circle className="ring" cx={xS(st.s)} cy={yT(st.T)} r="14" fill="none" stroke="#9156F1" strokeWidth="3" />}
                <circle cx={xS(st.s)} cy={yT(st.T)} r="11" fill="#fff" />
                <text x={xS(st.s) + st.dx} y={yT(st.T) + st.dy} fill="#fff" fontSize="30" fontWeight="700" fontFamily="Poppins" textAnchor="middle">{st.n}</text>
                {st.extra && (
                  <text x={xS(st.s) + 120} y={yT(st.T) + 40} fill="#cbb3ff" fontSize="28" fontFamily="JetBrains Mono">{st.extra}</text>
                )}
              </g>
            ))}
            <text x={xS(S3) + 28} y={yT(T_HOT) + 50} fill="rgba(255,255,255,.6)" fontSize="22" fontFamily="JetBrains Mono">turbina ↓</text>
          </g>
        </svg>
      </div>
    </Slide>
  )
}

/* ---------------------------------------------------------------- Demo em três tempos */

export function Demo({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div className="kicker" data-in>Demo ao vivo · três tempos</div>
      <h1 className="h1" data-split>O cálculo virou commodity.</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 72, alignItems: 'start' }}>
        <div className="card" data-step="0">
          <div className="mono accent" style={{ fontSize: 22, letterSpacing: '0.14em' }}>01 · COMO EU APRENDI</div>
          <div className="num" style={{ marginTop: 28 }}>≈ 1 h</div>
          <h3>Tabela de vapor</h3>
          <p>Interpolação linear, calculadora e paciência. Um exercício por vez.</p>
        </div>
        <div className="card" data-step="1">
          <div className="mono accent" style={{ fontSize: 22, letterSpacing: '0.14em' }}>02 · IA EM 30 SEGUNDOS</div>
          <div className="num" style={{ marginTop: 28 }}>
            <CountUp to={37.1} decimals={1} suffix="%" run={step >= 1} duration={2.2} />
          </div>
          <h3>
            <CountUp to={377} suffix=" t/h" run={step >= 1} duration={2.4} /> de vapor
          </h3>
          <p>Prompt em linguagem natural. A IA escreve o código, consulta as propriedades e entrega.</p>
        </div>
        <div className="card" data-step="2" style={{ borderColor: '#9156F1', background: 'rgba(145,86,241,.12)' }}>
          <div className="mono accent" style={{ fontSize: 22, letterSpacing: '0.14em' }}>03 · SÓ O ENGENHEIRO</div>
          <div className="num" style={{ marginTop: 28, color: '#fff' }}>?</div>
          <h3>A pergunta certa</h3>
          <p>O número está certo. Mas ele é aceitável para uma turbina real?</p>
        </div>
      </div>
      <p className="lead" data-step="2" style={{ marginTop: 'auto' }}>
        A IA calcula. <span style={{ color: '#fff', fontWeight: 600 }}>Quem pergunta se o resultado presta é você.</span>
      </p>
    </Slide>
  )
}

/* ---------------------------------------------------------------- Casos A a E */

const CASES = [
  { k: 'A', label: 'Ideal, vapor saturado', eta: 37.1, x: 0.675, m: 377, step: 0 },
  { k: 'B', label: '+ superaquecimento 480 °C', eta: 39.7, x: 0.795, m: 286, step: 1 },
  { k: 'C', label: '+ reaquecimento 0,7 MPa', eta: 40.3, x: 0.939, m: 236, step: 1 },
  { k: 'D', label: 'Real (η 85%), vapor saturado', eta: 31.4, x: 0.735, m: 445, step: 2 },
  { k: 'E', label: 'Real + superaq. + reaq.', eta: 35.1, x: 0.996, m: 278, step: 2 },
]
const CARNOT = 44.6
const SCALE = 1000 / 50 // px por ponto percentual

export function Casos({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      CASES.forEach((c) => {
        const el = `.case-${c.k} .eta-fill`
        if (step >= c.step) gsap.to(el, { width: c.eta * SCALE, duration: 1.4, ease: 'power4.out', delay: 0.3 })
        else gsap.set(el, { width: 0 })
      })
    },
    { scope: ref, dependencies: [step] },
  )

  return (
    <Slide step={step}>
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="kicker" data-in>Formular · verificar · decidir</div>
        <h1 className="h1" data-split>Eficiência × umidade na turbina</h1>
        <div style={{ position: 'relative', marginTop: 56 }}>
          <div
            data-in
            style={{ position: 'absolute', left: 520 + CARNOT * SCALE, top: -24, bottom: -10, borderLeft: '3px dashed rgba(255,255,255,.4)' }}
          >
            <span className="mono" style={{ position: 'absolute', top: -34, left: -70, fontSize: 20, color: 'rgba(255,255,255,.6)', whiteSpace: 'nowrap' }}>
              Carnot {CARNOT.toLocaleString('pt-BR')}%
            </span>
          </div>
          {CASES.map((c) => (
            <div key={c.k} className={`case-${c.k}`} data-step={c.step} style={{ display: 'flex', alignItems: 'center', height: 92 }}>
              <div style={{ width: 520, display: 'flex', gap: 20, alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                <span className="mono accent" style={{ fontSize: 36, fontWeight: 600 }}>{c.k}</span>
                <span style={{ fontSize: 26 }}>{c.label}</span>
              </div>
              <div style={{ position: 'relative', height: 54, width: 1000 }}>
                <div className="eta-fill" style={{ height: '100%', width: 0, borderRadius: 8, background: 'linear-gradient(90deg,#58178B,#9156F1)' }} />
                <span className="mono" style={{ position: 'absolute', left: c.eta * SCALE + 16, top: 10, fontSize: 28, fontWeight: 600 }}>
                  η {c.eta.toLocaleString('pt-BR')}%
                </span>
              </div>
              <div
                className="mono"
                style={{
                  marginLeft: 'auto', whiteSpace: 'nowrap', fontSize: 28, fontWeight: 600, padding: '8px 18px', borderRadius: 8,
                  background: c.x < 0.88 ? 'rgba(255,181,71,.16)' : 'rgba(61,220,151,.16)',
                  color: c.x < 0.88 ? '#FFB547' : '#3DDC97',
                }}
              >
                x {c.x.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}
              </div>
            </div>
          ))}
        </div>
        <p className="lead" data-step="3" style={{ marginTop: 'auto', fontSize: 38 }}>
          Mais pressão, mais eficiência, mais umidade. <span style={{ color: '#fff', fontWeight: 600 }}>O valor migrou de calcular para</span>{' '}
          <span className="accent" style={{ fontWeight: 700 }}>formular, verificar e decidir.</span>
        </p>
      </div>
    </Slide>
  )
}

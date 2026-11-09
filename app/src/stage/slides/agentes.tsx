import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import PumpSystem, { ROLE } from '../../components/PumpSystem'
import type { SlideProps } from '../types'

/* ---------------------------------------------------------------- Definição: malha fechada */

// Blocos do diagrama (coordenadas do SVG 1660×520)
const B = [
  { id: 'obj', x: 0, y: 190, w: 250, label: 'Objetivo', sub: 'setpoint', c: ROLE.obj },
  { id: 'plan', x: 400, y: 190, w: 300, label: 'Planejar', sub: 'controlador', c: ROLE.plan },
  { id: 'tool', x: 800, y: 190, w: 300, label: 'Ferramentas', sub: 'atuador', c: ROLE.tool },
  { id: 'world', x: 1200, y: 190, w: 300, label: 'Resultado', sub: 'planta', c: ROLE.world },
  { id: 'check', x: 800, y: 400, w: 300, label: 'Verificar', sub: 'sensor', c: ROLE.check },
]
const H = 110
const LOOP = 'M 250 245 L 400 245 M 700 245 L 800 245 M 1100 245 L 1200 245 M 1350 300 L 1350 455 L 1100 455 M 800 455 L 330 455 L 330 245'

// Ícones de traço (caixa 40×40, centro em 0,0)
const ICON: Record<string, string> = {
  obj: 'M 0 -17 A 17 17 0 1 1 -0.1 -17 M 0 -9 A 9 9 0 1 1 -0.1 -9 M 0 -2 A 2 2 0 1 1 -0.1 -2 M 6 -6 L 18 -18 M 13 -18 H 18 V -13',
  plan: 'M -16 -14 H -10 M -4 -14 H 16 M -16 0 H -10 M -4 0 H 12 M -16 14 H -10 M -4 14 H 16',
  tool: 'M 10 -16 A 8 8 0 1 0 16 -10 L 10 -4 L 4 -10 Z M 6 -6 L -14 14 A 3 3 0 0 1 -18 10 L 2 -10',
  world: 'M -18 16 H 18 M -12 16 V 4 M -2 16 V -6 M 8 16 V -14 M -16 -2 L -4 -12 L 4 -6 L 16 -18',
  check: 'M -16 10 A 18 18 0 1 1 16 10 M 0 4 L 9 -9 M -8 14 L 0 6 L 4 10',
}
const WIRE_LABEL = [
  { x: 370, y: 208, t: 'erro' },
  { x: 750, y: 232, t: 'plano' },
  { x: 1150, y: 232, t: 'ação' },
  { x: 1222, y: 442, t: 'medição' },
]
const ERR = [42, 17, 6, 1.2]

export function AgenteDef({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const abs = ref.current!.querySelector('.abs-loop')
      const pid = ref.current!.querySelector('.pid-loop')
      const def = ref.current!.querySelector('.def-lead')
      gsap.to(def, { autoAlpha: step >= 2 ? 0 : 1, duration: 0.5 })
      if (step >= 2) {
        gsap.to(abs, { autoAlpha: 0, scale: 0.94, duration: 0.6, ease: 'power2.in' })
        gsap.fromTo(pid, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.35, ease: 'power3.out' })
        return
      }
      gsap.set(pid, { autoAlpha: 0 })
      gsap.to(abs, { autoAlpha: 1, scale: 1, duration: 0.4 })
      if (step < 1) return
      const tl = gsap.timeline()
      tl.fromTo('.blk', { scale: 0.6, autoAlpha: 0, transformOrigin: '50% 50%' }, { scale: 1, autoAlpha: 1, stagger: 0.12, duration: 0.5, ease: 'back.out(2)' })
      tl.fromTo('.wire', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, ease: 'power1.inOut' }, 0.3)
      tl.fromTo('.wlbl', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.4 }, 1.2)
      // pacotes percorrendo o ciclo (o primeiro é o "sinal"; os outros, um rastro)
      const path = ref.current!.querySelector<SVGPathElement>('.cycle-path')!
      const len = path.getTotalLength()
      const dots = gsap.utils.toArray<SVGCircleElement>('.pulse', ref.current!)
      const readout = ref.current!.querySelector<SVGTextElement>('.iter')!
      const bar = ref.current!.querySelector<SVGRectElement>('.iter-bar')!
      const o = { l: 0, k: 0 }
      const show = (k: number) => {
        const i = k % (ERR.length + 1)
        if (i === ERR.length) {
          readout.textContent = '✓ entregue: erro dentro da tolerância'
          bar.setAttribute('width', '0')
        } else {
          readout.textContent = `iteração ${i + 1} · erro ${String(ERR[i]).replace('.', ',')}%`
          bar.setAttribute('width', String((ERR[i] / ERR[0]) * 260))
        }
      }
      show(0)
      tl.to(o, {
        l: len, duration: 3.2, ease: 'none', repeat: -1,
        onRepeat: () => show(++o.k),
        onUpdate: () => {
          dots.forEach((d, j) => {
            const p = path.getPointAtLength((o.l - j * 26 + len) % len)
            d.setAttribute('cx', String(p.x))
            d.setAttribute('cy', String(p.y))
          })
        },
      }, 1.4)
      tl.fromTo('.iter-g', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 1.4)
    },
    { scope: ref, dependencies: [step] },
  )

  return (
    <Slide step={step}>
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="kicker" data-in>O que é um agente de IA</div>
        <h1 className="h1" data-split>Chatbot responde. Agente executa.</h1>
        <div className="def-lead">
          <p className="lead" data-in style={{ marginTop: 28, color: '#fff', maxWidth: 1600 }}>
          Um modelo de IA que recebe um <b className="accent-t">objetivo</b>, planeja os passos, usa <b className="accent-t">ferramentas</b> e{' '}
          <b className="accent-t">verifica</b> o próprio resultado, em ciclo, até entregar.
        </p>
        </div>
        <div data-step="1" style={{ marginTop: 24, position: 'relative' }}>
          <div className="pid-loop" style={{ position: 'absolute', left: 0, right: 0, top: -150, visibility: 'hidden' }}>
            <div className="mono accent-t" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>NA PRÁTICA · MALHA DE VAZÃO DE UM SISTEMA DE BOMBEAMENTO</div>
            <PumpSystem mode="loop" width={1600} />
          </div>
          <svg className="abs-loop" viewBox="0 0 1660 520" width="1490" height="467" style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
            <defs>
              {B.map((b) => (
                <linearGradient key={b.id} id={`g-${b.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={b.c} stopOpacity="0.28" />
                  <stop offset="1" stopColor="#14112f" stopOpacity="0.95" />
                </linearGradient>
              ))}
              <marker id="ag-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,.85)" />
              </marker>
            </defs>
            <path className="wire" d={LOOP} stroke="rgba(255,255,255,.75)" strokeWidth="5" fill="none" strokeLinejoin="round" />
            {[[392, 245, 0], [792, 245, 0], [1192, 245, 0], [1108, 455, 180], [330, 274, -90]].map(([x, y, r], i) => (
              <path key={i} className="wire" d="M -14 -9 L 0 0 L -14 9" transform={`translate(${x} ${y}) rotate(${r})`} stroke="rgba(255,255,255,.85)" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            <path className="cycle-path" d="M 330 245 L 1350 245 L 1350 455 L 330 455 Z" fill="none" stroke="none" />
            {WIRE_LABEL.map((w) => (
              <text key={w.t} className="wlbl" x={w.x} y={w.y} textAnchor="middle" fill="rgba(255,255,255,.7)" fontSize="22" fontWeight="600" fontFamily="JetBrains Mono">{w.t}</text>
            ))}
            {B.map((b) => (
              <g key={b.id} className="blk">
                <rect x={b.x} y={b.y} width={b.w} height={H} rx="16" fill={`url(#g-${b.id})`} stroke={b.c} strokeWidth="3.5" />
                <rect x={b.x + 6} y={b.y + 6} width={b.w - 12} height={3} rx="1.5" fill={b.c} opacity={0.35} />
                <g transform={`translate(${b.x + 44} ${b.y + H / 2})`}>
                  <circle r="27" fill={b.c} opacity={0.14} />
                  <path d={ICON[b.id]} stroke={b.c} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="scale(0.95)" />
                </g>
                <text x={b.x + 82} y={b.y + 51} fill="#fff" fontSize="31" fontWeight="700" fontFamily="Poppins">{b.label}</text>
                <text x={b.x + 82} y={b.y + 86} fill={b.c} fontSize="23" fontWeight="600" fontFamily="JetBrains Mono">{b.sub}</text>
              </g>
            ))}
            <g className="blk">
              <circle cx="330" cy="245" r="24" fill="#120F2E" stroke="#fff" strokeWidth="4" />
              <text x="330" y="256" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="700" fontFamily="Poppins">Σ</text>
              <text x="296" y="230" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700" fontFamily="JetBrains Mono">+</text>
              <text x="350" y="292" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="700" fontFamily="JetBrains Mono">−</text>
            </g>
            {[0, 1, 2, 3].map((j) => (
              <circle key={j} className="pulse" cx="330" cy="245" r={14 - j * 3} fill="#FFB547" opacity={1 - j * 0.25} style={j === 0 ? { filter: 'drop-shadow(0 0 12px #FFB547)' } : undefined} />
            ))}
            <g className="iter-g" style={{ visibility: 'hidden' }}>
              <rect x="1180" y="468" width="300" height="10" rx="5" fill="rgba(255,255,255,.12)" />
              <rect className="iter-bar" x="1180" y="468" width="260" height="10" rx="5" fill="#3DDC97" />
              <text className="iter" x="1180" y="512" fill="#fff" fontSize="22" fontWeight="600" fontFamily="JetBrains Mono">iteração 1</text>
            </g>
          </svg>
        </div>
        <p className="lead" data-step="2" style={{ marginTop: 'auto', fontSize: 36 }}>
          Para quem estudou controle: <b style={{ color: '#fff' }}>é uma malha fechada.</b> No agente, o controlador entende linguagem e as ferramentas são software.
        </p>
      </div>
    </Slide>
  )
}

/* ---------------------------------------------------------------- Demo: agente dimensiona um sistema de bombeamento */

type Line = { who: 'Você' | 'Agente' | 'Ferramenta' | 'Verifica' | 'Engenheiro'; text: string; step: number }

// Números conferidos (água a 20 °C, aço comercial ε = 0,045 mm, Colebrook, ΣK = 8, η bomba 70%).
const LOG: Line[] = [
  { who: 'Você', text: 'Dimensione a bomba: 30 m³/h, desnível de 18 m, 120 m de tubo DN 80.', step: 0 },
  { who: 'Agente', text: 'Plano: fluido → tubulação → acessórios → altura → bomba → riscos.', step: 1 },
  { who: 'Ferramenta', text: 'propriedades(água, 20 °C) → ρ = 998 kg/m³ · ν = 1,0·10⁻⁶ m²/s', step: 2 },
  { who: 'Ferramenta', text: 'python: v = 1,75 m/s · Re = 1,36·10⁵ · colebrook → f = 0,0199 · hf = 4,8 m', step: 3 },
  { who: 'Ferramenta', text: 'python: ΣK = 8 → hm = 1,25 m', step: 4 },
  { who: 'Agente', text: 'Altura manométrica H = 18 + 4,8 + 1,25 ≈ 24 m', step: 5 },
  { who: 'Agente', text: 'Potência no eixo ≈ 2,8 kW → motor de 4 kW', step: 6 },
  { who: 'Verifica', text: 'Velocidade na faixa usual de recalque ✓   Folga de potência do motor ✓', step: 6 },
  { who: 'Verifica', text: '⚠ Parada brusca: golpe de aríete de até ~214 m (limite de Joukowsky).', step: 7 },
  { who: 'Engenheiro', text: 'Válvula de fechamento lento? Volante de inércia? Análise de transiente? Essa decisão é sua.', step: 8 },
]
const COLOR: Record<Line['who'], string> = { Você: 'hm', Agente: 'ag', Ferramenta: 'tool', Verifica: 'ok', Engenheiro: 'hm' }

export function AgenteDemo({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div className="kicker" data-in>Demonstração · agente de engenharia</div>
      <h1 className="h1" data-split style={{ fontSize: 64 }}>Dimensionar um sistema de bombeamento</h1>
      <div data-in style={{ marginTop: 26 }}>
        <PumpSystem mode="sizing" stage={step} width={1664} />
      </div>
      <div className="term term-log" data-in style={{ marginTop: 18 }}>
        {LOG.filter((l) => l.step <= step).map((l, i, arr) => (
          <div key={i} className={`ln ${i < arr.length - 3 ? 'gone' : l.step < step ? 'old' : ''}`}>
            <span className={`who ${COLOR[l.who]}`}>{l.who}</span>
            <span style={l.who === 'Engenheiro' ? { fontWeight: 700 } : undefined}>{l.text}</span>
          </div>
        ))}
      </div>
    </Slide>
  )
}

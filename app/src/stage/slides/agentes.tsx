import { useLayoutEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import PumpSystem, { ROLE } from '../../components/PumpSystem'
import { IcCube, IcGauge, IcPlan, IcTarget, IcTool } from '../../components/Icons'
import { DUR, EASE } from '../../lib/motion'
import type { SlideProps } from '../types'

/* ---------------------------------------------------------------- Definição: malha fechada */

// Blocos do diagrama (coordenadas do SVG 1664×490, desenhado em tamanho real).
// `at` é a distância, ao longo do ciclo, em que o pulso passa pelo bloco (o ciclo começa no somador).
const BW = 280
const BH = 176
const B: { id: keyof typeof ROLE; x: number; y: number; label: string; sub: string; icon: ReactNode; at: number }[] = [
  { id: 'obj', x: 96, y: 10, label: 'Objetivo', sub: 'setpoint', icon: <IcTarget x={96 + BW / 2 - 28} y={10 + 26} size={56} />, at: -1 },
  { id: 'plan', x: 548, y: 10, label: 'Planejar', sub: 'controlador', icon: <IcPlan x={548 + BW / 2 - 28} y={10 + 26} size={56} />, at: 226 },
  { id: 'tool', x: 918, y: 10, label: 'Ferramentas', sub: 'atuador', icon: <IcTool x={918 + BW / 2 - 28} y={10 + 26} size={56} />, at: 596 },
  { id: 'world', x: 1288, y: 10, label: 'Resultado', sub: 'planta', icon: <IcCube x={1288 + BW / 2 - 28} y={10 + 26} size={56} />, at: 966 },
  { id: 'check', x: 918, y: 304, label: 'Verificar', sub: 'sensor', icon: <IcGauge x={918 + BW / 2 - 28} y={304 + 26} size={56} />, at: 1626 },
]
const SUM = { x: 462, y: 98 }
// fios, na ordem em que o ciclo é narrado; cada um termina numa seta
const WIRES = [
  { d: 'M 376 98 H 428', tip: [436, 98, 0] },
  { d: 'M 488 98 H 532', tip: [540, 98, 0] },
  { d: 'M 828 98 H 902', tip: [910, 98, 0] },
  { d: 'M 1198 98 H 1272', tip: [1280, 98, 0] },
  { d: 'M 1428 186 V 392 H 1214', tip: [1206, 392, 180] },
  { d: 'M 918 392 H 462 V 132', tip: [462, 124, -90] },
]
const CYCLE = 'M 462 98 L 1428 98 L 1428 392 L 462 392 Z'
const CYCLE_LEN = 2512

export function AgenteDef({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  const built = useRef(false)
  const loop = useRef<gsap.core.Tween | null>(null)

  useGSAP(
    () => {
      const root = ref.current!
      const q = gsap.utils.selector(root)
      const abs = q('.abs-loop')
      const pid = q('.pid-loop')

      gsap.to(q('.def-lead'), { autoAlpha: step >= 2 ? 0 : 1, y: step >= 2 ? -12 : 0, duration: 0.45, ease: step >= 2 ? EASE.in : EASE.out })

      // pulso que percorre o ciclo: cada bloco acende quando o pulso passa por ele
      const startPulse = (delay: number) => {
        loop.current?.kill()
        const path = root.querySelector<SVGPathElement>('.cycle-path')!
        const dot = root.querySelector<SVGGElement>('.pulse')!
        const glows = B.map((b) => root.querySelector<SVGRectElement>(`.blk-glow[data-k="${b.id}"]`)!)
        const sum = root.querySelector<SVGCircleElement>('.sum-glow')!
        const o = { l: 0 }
        gsap.set(dot, { autoAlpha: 0 })
        loop.current = gsap.to(o, {
          l: CYCLE_LEN,
          duration: 6.5,
          ease: 'none',
          repeat: -1,
          delay,
          onStart: () => gsap.to(dot, { autoAlpha: 1, duration: 0.4 }),
          onUpdate: () => {
            const p = path.getPointAtLength(o.l)
            dot.setAttribute('transform', `translate(${p.x} ${p.y})`)
            B.forEach((b, i) => {
              if (b.at < 0) return
              const d = Math.abs(o.l - b.at)
              glows[i].style.opacity = String(Math.max(0, 1 - d / 190))
            })
            const ds = Math.min(o.l, CYCLE_LEN - o.l)
            sum.style.opacity = String(Math.max(0, 1 - ds / 120))
          },
        })
      }

      if (step >= 2) {
        // "na prática": o diagrama abstrato dá lugar ao sistema real, e os papéis entram na ordem do ciclo
        loop.current?.kill()
        loop.current = null
        gsap.to(abs, { autoAlpha: 0, scale: 0.96, duration: 0.4, ease: EASE.in, transformOrigin: '50% 40%' })
        gsap.fromTo(pid, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.3, ease: EASE.out })
        gsap.fromTo(q('.ps-tag'), { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: EASE.out, stagger: 0.24, delay: 0.85 })
        return
      }
      gsap.to(pid, { autoAlpha: 0, duration: 0.3, ease: EASE.in })
      gsap.to(abs, { autoAlpha: 1, scale: 1, duration: 0.5, ease: EASE.out })
      if (step < 1) {
        loop.current?.kill()
        loop.current = null
        built.current = false
        return
      }
      if (built.current) {
        if (!loop.current) startPulse(0.3)
        return
      }
      built.current = true

      // construção na ordem da frase: objetivo, planejar, ferramentas, resultado, verificar, e o ciclo se fecha
      const tl = gsap.timeline()
      const order = [q('.blk-obj'), q('.sum'), q('.blk-plan'), q('.blk-tool'), q('.blk-world'), q('.blk-check')]
      const AT = [0, 0.16, 0.3, 0.56, 0.82, 1.12]
      order.forEach((el, i) => tl.fromTo(el, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: DUR.base, ease: EASE.out }, AT[i]))
      const WAT = [0.12, 0.26, 0.5, 0.76, 1.02, 1.4]
      const WD = [0.25, 0.25, 0.3, 0.3, 0.55, 0.7]
      q('.wire').forEach((w, i) => {
        tl.fromTo(w, { drawSVG: '0%' }, { drawSVG: '100%', duration: WD[i], ease: EASE.draw }, WAT[i])
        tl.fromTo(q('.tip')[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, WAT[i] + WD[i] - 0.05)
      })
      startPulse(2.2)
      return () => {
        built.current = false
        loop.current = null
      }
    },
    { scope: ref, dependencies: [step] },
  )

  return (
    <Slide step={step}>
      <div ref={ref} className="fill">
        <div className="kicker" data-in>O que é um agente de IA</div>
        <h1 className="h1" data-split>Chatbot responde. Agente executa.</h1>
        <div className="def-lead">
          <p className="lead" data-in style={{ marginTop: 28, color: '#fff', maxWidth: 1600 }}>
          Um modelo de IA que recebe um <b className="accent-t">objetivo</b>, planeja os passos, usa <b className="accent-t">ferramentas</b> e{' '}
          <b className="accent-t">verifica</b> o próprio resultado, em ciclo, até entregar.
        </p>
        </div>
        <div data-step="1" style={{ marginTop: 44, position: 'relative' }}>
          <div className="pid-loop" style={{ position: 'absolute', left: 0, right: 0, top: -170, visibility: 'hidden' }}>
            <div className="label" style={{ marginBottom: 10 }}>NA PRÁTICA · MALHA DE VAZÃO DE UM SISTEMA DE BOMBEAMENTO</div>
            <PumpSystem mode="loop" width={1600} />
          </div>
          <svg className="abs-loop loopd" viewBox="0 0 1664 490" width="1664" height="490" style={{ overflow: 'visible', display: 'block' }}>
            <defs>
              <linearGradient id="blk-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2B2764" />
                <stop offset="1" stopColor="#1A1744" />
              </linearGradient>
              <filter id="blk-blur" x="-30%" y="-40%" width="160%" height="180%">
                <feGaussianBlur stdDeviation="14" />
              </filter>
              <radialGradient id="pulse-g">
                <stop offset="0" stopColor="#fff" />
                <stop offset="0.35" stopColor="#E6DBFF" />
                <stop offset="1" stopColor="#9156F1" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path className="cycle-path" d={CYCLE} fill="none" stroke="none" />
            {WIRES.map((w) => (
              <g key={w.d}>
                <path className="wire" d={w.d} />
                <path className="tip" d="M 0 0 L -15 -8.5 V 8.5 Z" transform={`translate(${w.tip[0]} ${w.tip[1]}) rotate(${w.tip[2]})`} />
              </g>
            ))}
            {/* o pulso corre pelos fios e passa por trás dos blocos, que acendem na passagem */}
            <g className="pulse">
              <circle r="26" fill="url(#pulse-g)" />
              <circle r="7" fill="#fff" />
            </g>
            {B.map((b) => (
              <g key={b.id} className={`blk blk-${b.id}`} style={{ color: ROLE[b.id] }}>
                <rect className="blk-glow" data-k={b.id} x={b.x} y={b.y} width={BW} height={BH} rx="22" fill="currentColor" filter="url(#blk-blur)" />
                <rect x={b.x} y={b.y} width={BW} height={BH} rx="22" fill="url(#blk-fill)" stroke="currentColor" strokeOpacity="0.7" strokeWidth="3" />
                {b.icon}
                <text x={b.x + BW / 2} y={b.y + 124} textAnchor="middle" fill="#fff" fontSize="38" fontWeight="700" fontFamily="Poppins" letterSpacing="-0.4">{b.label}</text>
                <text x={b.x + BW / 2} y={b.y + 157} textAnchor="middle" fill="currentColor" fontSize="25" fontWeight="600" fontFamily="JetBrains Mono">{b.sub}</text>
              </g>
            ))}
            <g className="sum">
              <circle className="sum-glow" cx={SUM.x} cy={SUM.y} r="30" fill="#fff" filter="url(#blk-blur)" />
              <circle cx={SUM.x} cy={SUM.y} r="26" fill="#1A1744" stroke="#fff" strokeWidth="3.5" />
              <text x={SUM.x} y={SUM.y + 11} textAnchor="middle" fill="#fff" fontSize="30" fontWeight="700" fontFamily="Poppins">Σ</text>
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

/**
 * Registro do agente: a linha nova entra por baixo e empurra as anteriores, como num terminal.
 * As linhas antigas perdem peso; a da vez fica em branco pleno.
 */
function TermLog({ step }: { step: number }) {
  const inner = useRef<HTMLDivElement>(null)
  const lastH = useRef<number | null>(null)
  useLayoutEffect(() => {
    const el = inner.current!
    const h = el.offsetHeight
    if (lastH.current !== null && h !== lastH.current) {
      // o bloco é ancorado embaixo: compensa a mudança de altura e desliza até o lugar
      const from = (Number(gsap.getProperty(el, 'y')) || 0) + (h - lastH.current)
      gsap.fromTo(el, { y: from }, { y: 0, duration: 0.6, ease: EASE.out, overwrite: true })
    }
    lastH.current = h
  }, [step])
  return (
    <div className="term term-log" data-in style={{ marginTop: 18 }}>
      <div className="term-scroll" ref={inner}>
        {LOG.filter((l) => l.step <= step).map((l, i) => (
          <div key={i} className={`ln ${l.step === step ? 'now' : 'old'} ${l.who === 'Engenheiro' ? 'key' : ''}`}>
            <span className={`who ${COLOR[l.who]}`}>{l.who}</span>
            <span className="txt">{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AgenteDemo({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div className="kicker" data-in>Demonstração · agente de engenharia</div>
      <h1 className="h1" data-split style={{ fontSize: 64 }}>Dimensionar um sistema de bombeamento</h1>
      <div data-in="fade" style={{ marginTop: 26 }}>
        <PumpSystem mode="sizing" stage={step} width={1664} />
      </div>
      <TermLog step={step} />
    </Slide>
  )
}

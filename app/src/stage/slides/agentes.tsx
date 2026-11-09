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
      // pulso percorrendo o ciclo
      const path = ref.current!.querySelector<SVGPathElement>('.cycle-path')!
      const len = path.getTotalLength()
      const dot = ref.current!.querySelector<SVGCircleElement>('.pulse')!
      const o = { l: 0 }
      tl.to(o, {
        l: len, duration: 4, ease: 'none', repeat: -1,
        onUpdate: () => {
          const p = path.getPointAtLength(o.l)
          dot.setAttribute('cx', String(p.x))
          dot.setAttribute('cy', String(p.y))
        },
      }, 1.4)
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
            <path className="wire" d={LOOP} stroke="rgba(255,255,255,.7)" strokeWidth="5" fill="none" />
            <path className="cycle-path" d="M 330 245 L 1350 245 L 1350 455 L 330 455 Z" fill="none" stroke="none" />
            {B.map((b) => (
              <g key={b.id} className="blk">
                <rect x={b.x} y={b.y} width={b.w} height={H} rx="14" fill="#201E4B" stroke={b.c} strokeWidth="4" />
                <text x={b.x + b.w / 2} y={b.y + 52} textAnchor="middle" fill="#fff" fontSize="38" fontWeight="700" fontFamily="Poppins">{b.label}</text>
                <text x={b.x + b.w / 2} y={b.y + 90} textAnchor="middle" fill={b.c} fontSize="26" fontWeight="600" fontFamily="JetBrains Mono">{b.sub}</text>
              </g>
            ))}
            <circle className="blk" cx="330" cy="245" r="22" fill="#120F2E" stroke="#fff" strokeWidth="4" />
            <text x="330" y="256" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="700" fontFamily="Poppins">Σ</text>
            <circle className="pulse" cx="330" cy="245" r="14" fill="#FFB547" style={{ filter: 'drop-shadow(0 0 12px #FFB547)' }} />
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

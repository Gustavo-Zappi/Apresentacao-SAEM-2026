import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import PumpSystem, { ROLE } from '../../components/PumpSystem'
import type { SlideProps } from '../types'

/* ---------------------------------------------------------------- Definição: malha fechada */

// Ciclo do agente (SVG 700×540): blocos empilhados, realimentação pela esquerda.
const BX = 96
const BW = 470
const BH = 76
const PITCH = 104
const B = [
  { id: 'obj', label: 'Objetivo', sub: 'setpoint', c: ROLE.obj, a: 'sp' },
  { id: 'plan', label: 'Planejar', sub: 'controlador', c: ROLE.plan, a: 'fic' },
  { id: 'tool', label: 'Ferramentas', sub: 'atuador', c: ROLE.tool, a: 'vfdTop' },
  { id: 'world', label: 'Resultado', sub: 'planta', c: ROLE.world, a: 'plant' },
  { id: 'check', label: 'Verificar', sub: 'sensor', c: ROLE.check, a: 'ft' },
].map((b, i) => ({ ...b, y: i * PITCH, cy: i * PITCH + BH / 2 }))
const CX = BX + BW / 2
const SIG_Y = (B[0].y + BH + B[1].y) / 2 // somador entre Objetivo e Planejar
const FB_X = 34 // linha de realimentação
const CYCLE = `M ${CX} ${SIG_Y} L ${CX} ${B[4].cy} L ${FB_X} ${B[4].cy} L ${FB_X} ${SIG_Y} Z`
const WIRES = [
  `M ${CX} ${B[0].y + BH} V ${B[1].y}`,
  ...[1, 2, 3].map((i) => `M ${CX} ${B[i].y + BH} V ${B[i + 1].y}`),
  `M ${BX} ${B[4].cy} H ${FB_X} V ${SIG_Y} H ${CX - 22}`,
]
const WIRE_LABEL = [
  { y: (B[1].y + BH + B[2].y) / 2, t: 'plano' },
  { y: (B[2].y + BH + B[3].y) / 2, t: 'ação' },
  { y: (B[3].y + BH + B[4].y) / 2, t: 'medição' },
]
// posição do slide (px) onde o SVG do ciclo é desenhado, para ligar cada bloco ao elemento da planta
const LOOP_AT = { x: 128, y: 318 }
const LINKS = B.map((b) => ({ a: b.a, color: b.c, from: [LOOP_AT.x + BX + BW + 10, LOOP_AT.y + b.cy] as [number, number] }))
const SHIFT: [number, number] = [352, 70]

// Ícones de traço (caixa 40×40, centro em 0,0)
const ICON: Record<string, string> = {
  obj: 'M 0 -17 A 17 17 0 1 1 -0.1 -17 M 0 -9 A 9 9 0 1 1 -0.1 -9 M 0 -2 A 2 2 0 1 1 -0.1 -2 M 6 -6 L 18 -18 M 13 -18 H 18 V -13',
  plan: 'M -16 -14 H -10 M -4 -14 H 16 M -16 0 H -10 M -4 0 H 12 M -16 14 H -10 M -4 14 H 16',
  tool: 'M 10 -16 A 8 8 0 1 0 16 -10 L 10 -4 L 4 -10 Z M 6 -6 L -14 14 A 3 3 0 0 1 -18 10 L 2 -10',
  world: 'M -18 16 H 18 M -12 16 V 4 M -2 16 V -6 M 8 16 V -14 M -16 -2 L -4 -12 L 4 -6 L 16 -18',
  check: 'M -16 10 A 18 18 0 1 1 16 10 M 0 4 L 9 -9 M -8 14 L 0 6 L 4 10',
}
const ERR = [42, 17, 6, 1.2]

/** Slide único, sem cliques: o ciclo do agente se monta à esquerda e a malha de vazão acende à direita. */
export function AgenteDef({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(0)
  useGSAP(
    () => {
      const root = ref.current!
      const tl = gsap.timeline({ delay: 1.1 })
      tl.fromTo('.blk', { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.16, duration: 0.6, ease: 'back.out(1.6)' })
      tl.fromTo('.wire', { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, stagger: 0.14, ease: 'power1.inOut' }, 0.35)
      tl.fromTo('.sum, .wlbl', { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, stagger: 0.07, duration: 0.4, ease: 'back.out(2)' }, 0.9)
      tl.call(() => setLive(1), [], 1.7)
      tl.fromTo('.iter-g, .pulse', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 1.5)
      tl.fromTo('.def-close', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 3.4)
      // o sinal percorre o ciclo: cada bloco acende quando o sinal passa por ele
      const path = root.querySelector<SVGPathElement>('.cycle-path')!
      const len = path.getTotalLength()
      const dots = gsap.utils.toArray<SVGCircleElement>('.pulse', root)
      const glows = gsap.utils.toArray<SVGRectElement>('.blk-glow', root)
      const at = [-1, B[1].cy - SIG_Y, B[2].cy - SIG_Y, B[3].cy - SIG_Y, B[4].cy - SIG_Y + 60]
      const readout = root.querySelector<SVGTextElement>('.iter')!
      const bar = root.querySelector<SVGRectElement>('.iter-bar')!
      const o = { l: 0, k: 0 }
      const show = (k: number) => {
        const i = k % (ERR.length + 1)
        if (i === ERR.length) {
          readout.textContent = '✓ entregue: erro dentro da tolerância'
          bar.setAttribute('width', '0')
        } else {
          readout.textContent = `iteração ${i + 1} · erro ${String(ERR[i]).replace('.', ',')}%`
          bar.setAttribute('width', String((ERR[i] / ERR[0]) * 300))
        }
      }
      show(0)
      tl.to(o, {
        l: len, duration: 3.4, ease: 'none', repeat: -1,
        onRepeat: () => show(++o.k),
        onUpdate: () => {
          dots.forEach((d, j) => {
            const p = path.getPointAtLength((o.l - j * 24 + len) % len)
            d.setAttribute('cx', String(p.x))
            d.setAttribute('cy', String(p.y))
          })
          glows.forEach((g, i) => g.setAttribute('opacity', String(i === 0 ? 0.25 : Math.max(0, 1 - Math.abs(o.l - at[i]) / 70))))
        },
      }, 1.5)
    },
    { scope: ref },
  )

  return (
    <Slide step={step} className="no-pad">
      <PumpSystem mode="loop" stage={live} shift={SHIFT} links={LINKS} />
      <div className="p3-scrim" />
      <div ref={ref}>
        <div className="p3-head">
          <div className="kicker" data-in>O que é um agente de IA</div>
          <h1 className="h1" data-split style={{ fontSize: 80 }}>Chatbot responde. Agente executa.</h1>
          <p className="lead" data-in style={{ marginTop: 18, color: '#fff', fontSize: 34, maxWidth: 1664 }}>
            Um modelo de IA que recebe um <b className="accent-t">objetivo</b>, planeja os passos, usa <b className="accent-t">ferramentas</b> e{' '}
            <b className="accent-t">verifica</b> o próprio resultado, em ciclo, até entregar.
          </p>
        </div>
        <svg className="def-loop" viewBox="0 0 700 540" width="700" height="540" style={{ left: LOOP_AT.x, top: LOOP_AT.y }}>
          <defs>
            {B.map((b) => (
              <linearGradient key={b.id} id={`g-${b.id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={b.c} stopOpacity="0.3" />
                <stop offset="1" stopColor="#14112f" stopOpacity="0.96" />
              </linearGradient>
            ))}
          </defs>
          {WIRES.map((d, i) => (
            <path key={i} className="wire" d={d} stroke="rgba(255,255,255,.8)" strokeWidth="4.5" fill="none" strokeLinejoin="round" />
          ))}
          {[1, 2, 3, 4].map((i) => (
            <path key={i} className="wlbl" d="M -9 -13 L 0 0 L 9 -13" transform={`translate(${CX} ${B[i].y - 2})`} stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          <path className="wlbl" d="M -13 -9 L 0 0 L -13 9" transform={`translate(${CX - 24} ${SIG_Y})`} stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path className="cycle-path" d={CYCLE} fill="none" stroke="none" />
          {[0, 1, 2, 3].map((j) => (
            <circle key={j} className="pulse" cx={CX} cy={SIG_Y} r={13 - j * 3} fill="#FFB547" opacity={1 - j * 0.25} style={j === 0 ? { filter: 'drop-shadow(0 0 12px #FFB547)' } : undefined} />
          ))}
          {WIRE_LABEL.map((w) => (
            <text key={w.t} className="wlbl" x={CX + 22} y={w.y + 7} fill="rgba(255,255,255,.85)" fontSize="21" fontWeight="600" fontFamily="JetBrains Mono">{w.t}</text>
          ))}
          <text className="wlbl" x={CX + 30} y={SIG_Y + 7} fill="rgba(255,255,255,.85)" fontSize="21" fontWeight="600" fontFamily="JetBrains Mono">erro</text>
          <text className="wlbl" fill="rgba(255,255,255,.85)" fontSize="21" fontWeight="600" fontFamily="JetBrains Mono" textAnchor="middle" transform={`translate(${FB_X - 12} ${(SIG_Y + B[4].cy) / 2}) rotate(-90)`}>realimentação</text>
          {B.map((b) => (
            <g key={b.id} className="blk">
              <rect className="blk-glow" x={BX - 7} y={b.y - 7} width={BW + 14} height={BH + 14} rx="20" fill="none" stroke={b.c} strokeWidth="5" opacity="0" style={{ filter: `drop-shadow(0 0 14px ${b.c})` }} />
              <rect x={BX} y={b.y} width={BW} height={BH} rx="14" fill="#14112f" />
              <rect x={BX} y={b.y} width={BW} height={BH} rx="14" fill={`url(#g-${b.id})`} stroke={b.c} strokeWidth="3.5" />
              <g transform={`translate(${BX + 44} ${b.cy})`}>
                <circle r="25" fill={b.c} opacity={0.16} />
                <path d={ICON[b.id]} stroke={b.c} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="scale(0.88)" />
              </g>
              <text x={BX + 84} y={b.cy + 11} fill="#fff" fontSize="31" fontWeight="700" fontFamily="Poppins">{b.label}</text>
              <text x={BX + BW - 22} y={b.cy + 8} textAnchor="end" fill={b.c} fontSize="23" fontWeight="600" fontFamily="JetBrains Mono">{b.sub}</text>
            </g>
          ))}
          <g className="sum">
            <circle cx={CX} cy={SIG_Y} r="0" />
          </g>
          <g className="iter-g">
            <rect x={BX} y="505" width="300" height="9" rx="4.5" fill="rgba(255,255,255,.14)" />
            <rect className="iter-bar" x={BX} y="505" width="300" height="9" rx="4.5" fill="#3DDC97" />
            <text className="iter" x={BX} y="536" fill="#fff" fontSize="21" fontWeight="600" fontFamily="JetBrains Mono">iteração 1</text>
          </g>
        </svg>
        <p className="lead def-close">
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
    <Slide step={step} className="no-pad">
      <PumpSystem mode="sizing" stage={step} />
      <div className="p3-scrim" />
      <div className="p3-head">
        <div className="kicker" data-in>Demonstração · agente de engenharia</div>
        <h1 className="h1" data-split style={{ fontSize: 60 }}>Dimensionar um sistema de bombeamento</h1>
      </div>
      <div className="term term-log p3-term" data-in>
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

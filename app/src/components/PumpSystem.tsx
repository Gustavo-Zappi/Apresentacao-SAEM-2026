import { useEffect, useRef, type ReactNode } from 'react'
import { PumpScene, type PumpMode } from '../three/pump'

/**
 * Sistema de bombeamento em 3D (cena em `src/three/pump.ts`) + camada HTML ancorada na cena:
 *  - mode="loop":   malha de controle de vazão simulada (FT → controlador → inversor), com o papel de
 *                   cada elemento no agente. `stage` 0 mostra só a planta; 1 acende a malha e as etiquetas.
 *  - mode="sizing": dimensionamento item a item. `stage`: 0 pedido · 1 plano · 2 fluido · 3 tubo ·
 *                   4 acessórios · 5 altura · 6 bomba · 7 golpe de aríete · 8 decisão.
 * Números conferidos: água 20 °C, 30 m³/h, DN 80 (D = 77,9 mm), 120 m, Δz = 18 m, aço ε = 0,045 mm,
 * Colebrook, ΣK = 8, η = 70%, celeridade a ≈ 1200 m/s.
 *
 * A camada HTML (selos, etiquetas, balões) é reposicionada a cada quadro pela projeção das âncoras 3D,
 * então acompanha os movimentos de câmera.
 */

export const ROLE = {
  obj: '#FFFFFF',
  plan: '#CBB3FF',
  tool: '#FFB547',
  world: '#5AB0FF',
  check: '#3DDC97',
} as const

const PLAN = [
  { t: 'Fluido', r: 'ρ = 998 kg/m³' },
  { t: 'Tubulação', r: 'hf = 4,8 m' },
  { t: 'Acessórios', r: 'hm = 1,25 m' },
  { t: 'Altura', r: 'H ≈ 24 m' },
  { t: 'Bomba', r: 'P = 2,8 kW' },
  { t: 'Riscos', r: 'golpe ≈ 214 m' },
]

type Call = { x: number; y: number; a: string; from: [number, number]; tone?: 'red'; body: ReactNode }

// Balão do passo: posição fixa no palco (px) + linha de chamada até a âncora 3D.
const CALLS: Record<number, Call> = {
  2: {
    x: 1000, y: 470, a: 'tank1', from: [1000, 540],
    body: (<><b>1 · Fluido</b><span>água a 20 °C</span><span>ρ = 998 kg/m³ · ν = 1,0·10⁻⁶ m²/s</span></>),
  },
  3: {
    x: 560, y: 610, a: 'pipe', from: [900, 610],
    body: (<><b>2 · Tubulação · DN 80 (D = 77,9 mm)</b><span>v = Q/A = 1,75 m/s · Re = 1,36·10⁵</span><span>f = 0,0199 (Colebrook) → hf = 4,8 m</span></>),
  },
  4: {
    x: 1080, y: 470, a: 'valves', from: [1080, 545],
    body: (<><b>3 · Acessórios</b><span>válvulas, curvas, entrada e saída: ΣK = 8</span><span>hm = ΣK · v²/2g = 1,25 m</span></>),
  },
  5: {
    x: 560, y: 470, a: 'dz', from: [1010, 545],
    body: (<><b>4 · Altura manométrica</b><span>H = Δz + hf + hm</span><span>H = 18 + 4,8 + 1,25 ≈ 24 m</span></>),
  },
  6: {
    x: 1200, y: 300, a: 'pump', from: [1200, 420],
    body: (<><b>5 · Bomba e motor</b><span>P = ρ·g·Q·H / η = 2,8 kW (η = 70%)</span><span>→ motor de 4 kW</span></>),
  },
  7: {
    x: 1000, y: 600, a: 'gauge', from: [1000, 670], tone: 'red',
    body: (<><b>⚠ Parada brusca: golpe de aríete</b><span>ΔH = a·Δv/g = 1200 × 1,75 / 9,81</span><span>≈ 214 m no pior caso (fechamento instantâneo)</span></>),
  },
}
CALLS[8] = { ...CALLS[7], x: 890, y: 560, from: [890, 630] }

/** Curva da bomba × curva do sistema: o ponto de operação é o que o agente calculou (30 m³/h, 24 m). */
function HQ() {
  const X = (q: number) => 46 + (q / 50) * 300
  const Y = (h: number) => 196 - (h / 36) * 170
  const curve = (f: (q: number) => number) => Array.from({ length: 26 }, (_, i) => `${i ? 'L' : 'M'} ${X(i * 2).toFixed(1)} ${Y(f(i * 2)).toFixed(1)}`).join(' ')
  return (
    <svg className="p3-hq" viewBox="0 0 380 232" width="380" height="232">
      <path d={`M 46 16 V 196 H 356`} stroke="rgba(255,255,255,.7)" strokeWidth="2.5" fill="none" />
      <text x="356" y="222" textAnchor="end">Q (m³/h)</text>
      <text x="54" y="26">H (m)</text>
      <path className="draw" d={curve((q) => 18 + 6.05 * (q / 30) ** 2)} stroke="#5AB0FF" strokeWidth="4" fill="none" />
      <path className="draw late" d={curve((q) => 30 - 6 * (q / 30) ** 2)} stroke="#CBB3FF" strokeWidth="4" fill="none" />
      <text x={X(50)} y={Y(34.8) + 30} fill="#5AB0FF" textAnchor="end">sistema</text>
      <text x={X(50)} y={Y(13.3) + 26} fill="#CBB3FF" textAnchor="end">bomba</text>
      <path className="pt" d={`M ${X(30)} 196 V ${Y(24)} H 46`} stroke="#FFB547" strokeWidth="2" strokeDasharray="5 5" fill="none" />
      <circle className="pt" cx={X(30)} cy={Y(24)} r="8" fill="#FFB547" />
      <circle className="pt ring" cx={X(30)} cy={Y(24)} r="8" fill="none" stroke="#FFB547" strokeWidth="2.5" />
      <text className="pt" x={X(30) - 12} y={Y(24) + 58} textAnchor="end" fill="#FFB547" fontWeight="700">30 m³/h · 24 m</text>
    </svg>
  )
}

function Anchor({ a, on = true, className = '', children }: { a: string; on?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className="p3-a" data-a={a}>
      <div className={`p3-in ${on ? 'on' : ''} ${className}`}>{children}</div>
    </div>
  )
}

function Tag({ a, color, role, text, on, dx = 0, dy = 0, live }: { a: string; color: string; role: string; text: string; on: boolean; dx?: number; dy?: number; live?: string }) {
  return (
    <div className="p3-a" data-a={a}>
      <div className={`p3-in p3-tag ${on ? 'on' : ''}`} style={{ borderColor: color, transform: `translate(${dx}px, ${dy}px)` }}>
        <b style={{ color }}>{role}</b>
        <span>{text}{live && <i className="mono" data-live={live} style={{ color }} />}</span>
      </div>
    </div>
  )
}

const fmt = (v: number, d = 1) => v.toFixed(d).replace('.', ',')

export default function PumpSystem({
  mode,
  stage = 0,
  width = 1920,
  height = 1080,
  shift,
  links,
}: {
  mode: PumpMode
  stage?: number
  width?: number
  height?: number
  /** Desloca a cena no quadro (px), para abrir espaço ao conteúdo do slide. */
  shift?: [number, number]
  /** Linhas que ligam um ponto fixo do slide (px) a uma âncora da cena, na cor do papel. */
  links?: { a: string; from: [number, number]; color: string }[]
}) {
  const host = useRef<HTMLDivElement>(null)
  const over = useRef<HTMLDivElement>(null)
  const scene = useRef<PumpScene | null>(null)
  const stageRef = useRef(stage)
  stageRef.current = stage

  useEffect(() => {
    const s = new PumpScene(host.current!, width, height, mode, shift)
    scene.current = s
    if (import.meta.env.DEV) (window as unknown as { __pump?: PumpScene }).__pump = s
    s.setStage(stageRef.current)
    const o = { x: 0, y: 0 }
    let n = 0
    s.onFrame = () => {
      const root = over.current
      if (!root) return
      root.querySelectorAll<HTMLElement>('[data-a]').forEach((el) => {
        const ok = s.project(el.dataset.a!, o)
        el.style.transform = `translate(${o.x.toFixed(1)}px, ${o.y.toFixed(1)}px)`
        el.style.visibility = ok ? 'visible' : 'hidden'
      })
      root.querySelectorAll<SVGLineElement>('[data-lead]').forEach((el) => {
        if (!s.project(el.dataset.lead!, o)) return
        el.setAttribute('x2', o.x.toFixed(1))
        el.setAttribute('y2', o.y.toFixed(1))
        const dot = el.nextElementSibling
        dot?.setAttribute('cx', o.x.toFixed(1))
        dot?.setAttribute('cy', o.y.toFixed(1))
      })
      if (n++ % 6) return
      const L = s.live
      root.querySelectorAll<HTMLElement>('[data-live]').forEach((el) => {
        const k = el.dataset.live
        if (k === 'q') el.textContent = fmt(L.q)
        else if (k === 'hz') el.textContent = fmt(L.hz) + ' Hz'
        else if (k === 'qtag') el.textContent = ' ' + fmt(L.q) + ' m³/h'
        else if (k === 'hztag') el.textContent = ' ' + fmt(L.hz) + ' Hz'
        else if (k === 'disturb') (el.parentElement as HTMLElement).classList.toggle('on', L.disturb > 0.5 && stageRef.current >= 1)
        if (k === 'q') el.classList.toggle('bad', Math.abs(L.q - L.sp) > 1.2)
      })
    }
    return () => {
      s.onFrame = null
      s.dispose()
      scene.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, width, height, shift?.[0], shift?.[1]])

  useEffect(() => {
    scene.current?.setStage(stage)
  }, [stage])

  const sizing = mode === 'sizing'
  const call = sizing ? CALLS[stage] : undefined
  const overview = stage <= 1 || stage === 8

  return (
    <div className={`p3 ${sizing ? 'sizing' : 'loop'}`} style={{ width, height }}>
      <div ref={host} className="p3-gl" />
      <div ref={over} className="p3-over">
        {sizing ? (
          <>
            {/* plano do agente: cada item acende ao ser calculado e guarda o resultado */}
            <div className={`p3-plan ${stage >= 1 ? 'on' : ''}`}>
              {PLAN.map((p, i) => {
                const st = stage > i + 2 || stage === 8 ? 'done' : stage === i + 2 ? 'now' : 'todo'
                return (
                  <div key={p.t} className={`p3-step ${st} ${i === 5 ? 'risk' : ''}`} style={{ transitionDelay: `${stage === 1 ? i * 0.09 : 0}s` }}>
                    <i>{i === 5 ? '!' : i + 1}</i>
                    <div>
                      <b>{p.t}</b>
                      <span>{st === 'todo' ? '···' : st === 'now' && i < 5 ? 'calculando' : p.r}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <Anchor a="tank1top" on={stage >= 1 && overview} className="p3-badge">1</Anchor>
            <Anchor a="pipeTop" on={stage >= 1 && overview} className="p3-badge">2</Anchor>
            <Anchor a="valves" on={stage >= 1 && overview} className="p3-badge">3</Anchor>
            <Anchor a="dzBadge" on={stage >= 1 && overview} className="p3-badge">4</Anchor>
            <Anchor a="pumpTop" on={stage >= 1 && overview} className="p3-badge">5</Anchor>

            <Anchor a="tank1lbl" on={overview || stage === 2} className="p3-lbl">reservatório inferior</Anchor>
            <Anchor a="tank2lbl" on={overview || stage === 5} className="p3-lbl">reservatório superior</Anchor>
            <Anchor a="pipeLbl" on={overview || stage === 3} className="p3-lbl below">DN 80 · aço · 120 m</Anchor>
            <Anchor a="check" on={stage === 4} className="p3-lbl left">retenção</Anchor>
            <Anchor a="gate" on={stage === 4} className="p3-lbl left">gaveta</Anchor>
            <Anchor a="sucValve" on={stage === 4} className="p3-lbl">gaveta</Anchor>
            <Anchor a="dz" on={stage === 5} className="p3-lbl big right">Δz = 18 m</Anchor>
            <Anchor a="egl0" on={stage === 3} className="p3-lbl amber up">linha de energia: cai hf = 4,8 m</Anchor>
            <Anchor a="meter" on={stage !== 6} className="p3-lcd"><span data-live="q">30,0</span><small>m³/h</small></Anchor>
            <Anchor a="motorSide" on={stage >= 7} className="p3-trip">PARADA</Anchor>

            <svg className="p3-leads" viewBox={`0 0 ${width} ${height}`}>
              {call && (
                <g key={stage} className={call.tone ?? 'amber'}>
                  <line x1={call.from[0]} y1={call.from[1]} x2={call.from[0]} y2={call.from[1]} data-lead={call.a} />
                  <circle r="7" />
                </g>
              )}
            </svg>
            {call && (
              <div key={stage} className={`p3-call ${call.tone ?? 'amber'} ${stage === 6 ? 'col' : ''}`} style={{ left: call.x, top: call.y }}>
                <div className="p3-call-t">{call.body}</div>
                {stage === 6 && <HQ />}
              </div>
            )}
          </>
        ) : (
          <>
            <svg className="p3-leads p3-links" viewBox={`0 0 ${width} ${height}`}>
              {links?.map((l) => (
                <g key={l.a} className={stage >= 1 ? 'on' : ''} style={{ color: l.color }}>
                  <line x1={l.from[0]} y1={l.from[1]} x2={l.from[0]} y2={l.from[1]} data-lead={l.a} />
                  <circle r="7" />
                </g>
              ))}
            </svg>
            <Tag a="ft" on={stage >= 1} color={ROLE.check} role="medidor de vazão" text="" live="qtag" dx={-120} dy={-92} />
            <Tag a="fic" on={stage >= 1} color={ROLE.plan} role="controlador PID" text="compara e corrige" dx={-70} dy={-96} />
            <Tag a="sp" on={stage >= 1} color={ROLE.obj} role="setpoint" text="30 m³/h" dx={30} dy={-96} />
            <Tag a="vfdTop" on={stage >= 1} color={ROLE.tool} role="inversor + bomba" text="" live="hztag" dx={44} dy={-10} />
            <Tag a="plant" on={stage >= 1} color={ROLE.world} role="planta" text="vazão que chega" dx={-150} dy={112} />
            <Anchor a="disturb" on={false} className="p3-disturb"><span data-live="disturb" />perturbação: válvula fecha</Anchor>
          </>
        )}
      </div>
    </div>
  )
}

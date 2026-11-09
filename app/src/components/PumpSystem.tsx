import type { ReactNode } from 'react'

/**
 * Sistema de bombeamento (desenho técnico ilustrado, viewBox 1660×560), usado em dois slides:
 *  - mode="loop":   malha de controle de vazão (FT → FIC → inversor), com o papel de cada elemento no agente.
 *  - mode="sizing": dimensionamento item a item (fluido, tubulação, acessórios, desnível, bomba, golpe de aríete).
 * Números conferidos: água 20 °C, 30 m³/h, DN 80 (D = 77,9 mm), 120 m, Δz = 18 m, aço ε = 0,045 mm,
 * Colebrook, ΣK = 8, η = 70%, celeridade a ≈ 1200 m/s.
 *
 * Representação: tubulação em corte (metal com sombreamento cilíndrico e "janela" mostrando a água),
 * curvas de raio real, flanges, válvulas com volante, bomba centrífuga com voluta em corte, motor com
 * aletas, manômetro (o ponteiro dispara no golpe de aríete) e medidor de vazão com leitura digital.
 */

export const ROLE = {
  obj: '#FFFFFF',
  plan: '#CBB3FF',
  tool: '#FFB547',
  world: '#5AB0FF',
  check: '#3DDC97',
} as const

export type Part = 'agua' | 'tubo' | 'acess' | 'dz' | 'bomba' | 'golpe'

const LINE = '#c9cce0'
const R = 26 // raio das curvas (linha de centro)
const PD = 22 // diâmetro do tubo no desenho

// rotas da água (linha de centro): sucção e recalque
const SUC = 'M 300 470 H 452'
const DIS = `M 516 428 V ${40 + R} A ${R} ${R} 0 0 1 ${516 + R} 40 H ${1450 - R} A ${R} ${R} 0 0 1 1450 ${40 + R} V 84`

/* ------------------------------------------------------------------ peças */

function PipeH({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return <rect x={x1} y={y - PD / 2} width={x2 - x1} height={PD} fill="url(#ps-pipe-h)" />
}
function PipeV({ y1, y2, x }: { y1: number; y2: number; x: number }) {
  return <rect x={x - PD / 2} y={y1} width={PD} height={y2 - y1} fill="url(#ps-pipe-v)" />
}
/** Curva de 90° (arco de raio R) com faixa de brilho. */
function Elbow({ d }: { d: string }) {
  return (
    <g>
      <path d={d} stroke="#7d84a3" strokeWidth={PD} fill="none" />
      <path d={d} stroke="#d9def0" strokeWidth={5} fill="none" opacity={0.55} transform="translate(-2 -2)" />
      <path d={d} stroke="#2f3349" strokeWidth={3} fill="none" opacity={0.5} transform="translate(3 3)" />
    </g>
  )
}
function Flange({ x, y, vertical = false }: { x: number; y: number; vertical?: boolean }) {
  return vertical ? (
    <g>
      <rect x={x - 18} y={y - 4} width={36} height={8} rx={1.5} fill="url(#ps-flange-v)" stroke="#20233a" strokeWidth={1} />
      <circle cx={x - 13} cy={y} r={1.8} fill="#20233a" />
      <circle cx={x + 13} cy={y} r={1.8} fill="#20233a" />
    </g>
  ) : (
    <g>
      <rect x={x - 4} y={y - 18} width={8} height={36} rx={1.5} fill="url(#ps-flange-h)" stroke="#20233a" strokeWidth={1} />
      <circle cx={x} cy={y - 13} r={1.8} fill="#20233a" />
      <circle cx={x} cy={y + 13} r={1.8} fill="#20233a" />
    </g>
  )
}

/** Válvula: corpo em "gravata" metálico; gaveta com castelo e volante; retenção com seta de fluxo. */
function Valve({ x, y, vertical = false, check = false }: { x: number; y: number; vertical?: boolean; check?: boolean }) {
  const s = 17
  return (
    <g transform={`translate(${x} ${y}) rotate(${vertical ? -90 : 0})`}>
      <path d={`M ${-s} ${-s} L ${s} ${s} L ${s} ${-s} L ${-s} ${s} Z`} fill="url(#ps-valve)" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      {check ? (
        <>
          <path d={`M ${-s} ${-s} L 0 0 L ${-s} ${s} Z`} fill={LINE} opacity={0.9} />
          <path d={`M ${s + 8} 0 l -9 -6 v 12 z`} fill={LINE} opacity={0.85} />
        </>
      ) : (
        <>
          <rect x={-5} y={-s - 12} width={10} height={14} fill="#5a6080" stroke={LINE} strokeWidth={2} />
          <path d={`M 0 ${-s - 12} V ${-s - 24}`} stroke={LINE} strokeWidth={3} />
          <ellipse cx={0} cy={-s - 26} rx={16} ry={5} fill="none" stroke="#e3634a" strokeWidth={4} />
          <path d={`M -16 ${-s - 26} H 16 M 0 ${-s - 31} V ${-s - 21}`} stroke="#e3634a" strokeWidth={2} />
        </>
      )}
    </g>
  )
}

/** Reservatório com paredes, água com superfície animada (duas camadas de ondas). */
function Tank({ id, x, y, w, h, level, flowing }: { id: string; x: number; y: number; w: number; h: number; level: number; flowing: boolean }) {
  const wy = y + level
  const T = 8
  const wave = (x0: number, yy: number, amp: number) => {
    const n = Math.ceil((w + 160) / 40)
    let d = `M ${x0} ${yy}`
    for (let i = 0; i < n; i++) d += ` q 10 ${-amp} 20 0 t 20 0`
    return d + ` V ${y + h} H ${x0} Z`
  }
  return (
    <g>
      <clipPath id={`ps-clip-${id}`}>
        <rect x={x + T} y={y - 20} width={w - 2 * T} height={h - T + 20} />
      </clipPath>
      <g clipPath={`url(#ps-clip-${id})`}>
        <rect x={x} y={wy + 2} width={w} height={h} fill="url(#ps-water)" />
        <g className={`ps-wavex ${flowing ? '' : 'calm'}`}><path d={wave(x - 80, wy, 4)} fill="#a9d6ff" opacity={0.45} /></g>
        <g className={`ps-wavex slow ${flowing ? '' : 'calm'}`}><path d={wave(x - 60, wy + 3, 3)} fill="#5aa6ff" opacity={0.55} /></g>
        <rect x={x} y={wy + 26} width={w} height={2} fill="#bfe1ff" opacity={0.12} />
        <rect x={x} y={wy + 58} width={w} height={2} fill="#bfe1ff" opacity={0.08} />
      </g>
      <rect x={x} y={y} width={T} height={h} fill="url(#ps-wall)" />
      <rect x={x + w - T} y={y} width={T} height={h} fill="url(#ps-wall)" />
      <rect x={x} y={y + h - T} width={w} height={T} fill="#8a90ad" />
      <rect x={x - 4} y={y - 4} width={T + 8} height={6} rx={2} fill="#d5d9ea" />
      <rect x={x + w - T - 4} y={y - 4} width={T + 8} height={6} rx={2} fill="#d5d9ea" />
    </g>
  )
}

/** Manômetro: mostrador claro, faixa vermelha e ponteiro (0 a 25 bar). */
function Gauge({ x, y, bar, surge }: { x: number; y: number; bar: number; surge: boolean }) {
  const ang = -135 + (Math.min(25, Math.max(0, bar)) / 25) * 270
  const tick = (i: number) => {
    const a = ((-135 + i * 22.5) * Math.PI) / 180
    const r1 = i % 2 ? 19 : 17
    return <line key={i} x1={Math.sin(a) * r1} y1={-Math.cos(a) * r1} x2={Math.sin(a) * 22} y2={-Math.cos(a) * 22} stroke="#2a2840" strokeWidth={i % 2 ? 1.2 : 2} />
  }
  const arc = (b0: number, b1: number) => {
    const a0 = ((-135 + (b0 / 25) * 270) * Math.PI) / 180
    const a1 = ((-135 + (b1 / 25) * 270) * Math.PI) / 180
    const r = 20
    return `M ${Math.sin(a0) * r} ${-Math.cos(a0) * r} A ${r} ${r} 0 0 1 ${Math.sin(a1) * r} ${-Math.cos(a1) * r}`
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={31} fill="#2b2e45" />
      <circle r={28} fill="url(#ps-face)" stroke="#9aa0bd" strokeWidth={2.5} />
      <path d={arc(16, 25)} stroke="#e0443b" strokeWidth={4} fill="none" />
      {Array.from({ length: 13 }, (_, i) => tick(i))}
      <text y={14} textAnchor="middle" fontSize={8} fontWeight={700} fill="#2a2840" fontFamily="JetBrains Mono">bar</text>
      <g className={`ps-needle ${surge ? 'surge' : ''}`} style={{ transform: surge ? undefined : `rotate(${ang}deg)` }}>
        <path d="M -2 4 L 0 -23 L 2 4 Z" fill="#c42f2f" />
      </g>
      <circle r={3.5} fill="#2a2840" />
    </g>
  )
}

function Callout({ x, y, w, children, tone = 'amber', lead }: { x: number; y: number; w: number; children: ReactNode; tone?: 'amber' | 'red' | 'dim'; lead?: [number, number, number, number] }) {
  const c = tone === 'red' ? '#ff6b6b' : tone === 'dim' ? 'rgba(255,255,255,.4)' : '#FFB547'
  return (
    <g>
      {lead && (
        <g className="ps-lead">
          <path d={`M ${lead[0]} ${lead[1]} L ${lead[2]} ${lead[3]}`} stroke={c} strokeWidth={2.5} fill="none" />
          <circle cx={lead[2]} cy={lead[3]} r={5} fill={c} />
        </g>
      )}
      <foreignObject x={x} y={y} width={w} height={240} style={{ overflow: 'visible' }}>
        <div className={`ps-call ${tone}`}>{children}</div>
      </foreignObject>
    </g>
  )
}

function Badge({ x, y, n, on }: { x: number; y: number; n: number; on: boolean }) {
  return (
    <g className="ps-badge" style={{ opacity: on ? 1 : 0, transform: `translate(${x}px, ${y}px) scale(${on ? 1 : 0.4})` }}>
      <circle r="24" fill="#120F2E" opacity={0.6} />
      <circle r="21" fill="#FFB547" stroke="#fff" strokeWidth={2} />
      <text y="9" textAnchor="middle" fontSize="25" fontWeight="800" fill="#120F2E" fontFamily="Poppins">{n}</text>
    </g>
  )
}

function Tag({ x, y, color, role, text, on = true }: { x: number; y: number; color: string; role: string; text: string; on?: boolean }) {
  return (
    <foreignObject x={x} y={y} width={360} height={90} style={{ overflow: 'visible', opacity: on ? 1 : 0, transition: 'opacity .6s' }}>
      <div className="ps-tag" style={{ borderColor: color }}>
        <b style={{ color }}>{role}</b>
        <span>{text}</span>
      </div>
    </foreignObject>
  )
}

export default function PumpSystem({
  mode,
  stage = 0,
  width = 1660,
}: {
  mode: 'loop' | 'sizing'
  /** sizing: 0 pedido · 1 plano · 2 fluido · 3 tubo · 4 acessórios · 5 desnível · 6 bomba · 7 golpe · 8 decisão */
  stage?: number
  width?: number
}) {
  const sizing = mode === 'sizing'
  const FOCUS: (Part | null)[] = [null, null, 'agua', 'tubo', 'acess', 'dz', 'bomba', 'golpe', 'golpe']
  const focus = sizing ? FOCUS[Math.min(stage, FOCUS.length - 1)] : null
  const cls = (p: Part) => (focus ? (focus === p ? 'ps-part hi' : 'ps-part dim') : 'ps-part')
  const past = (s: number) => sizing && stage > s
  const now = (s: number) => sizing && stage === s
  const hammer = sizing && stage >= 7
  const flowing = !hammer
  const flowSpeed = sizing ? (stage === 3 ? 0.5 : 0.95) : 0.95

  return (
    <svg viewBox="0 0 1660 560" width={width} height={(width * 560) / 1660} className="ps" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id="ps-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fb8ff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#2f68c8" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="ps-pipe-h" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3c405a" />
          <stop offset="0.22" stopColor="#b9c0da" />
          <stop offset="0.38" stopColor="#eef1fa" />
          <stop offset="0.6" stopColor="#959cba" />
          <stop offset="1" stopColor="#2c3046" />
        </linearGradient>
        <linearGradient id="ps-pipe-v" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3c405a" />
          <stop offset="0.22" stopColor="#b9c0da" />
          <stop offset="0.38" stopColor="#eef1fa" />
          <stop offset="0.6" stopColor="#959cba" />
          <stop offset="1" stopColor="#2c3046" />
        </linearGradient>
        <linearGradient id="ps-flange-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5b6180" />
          <stop offset="0.5" stopColor="#c3c8dc" />
          <stop offset="1" stopColor="#4a4f6a" />
        </linearGradient>
        <linearGradient id="ps-flange-v" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6180" />
          <stop offset="0.5" stopColor="#c3c8dc" />
          <stop offset="1" stopColor="#4a4f6a" />
        </linearGradient>
        <linearGradient id="ps-valve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7b82a6" />
          <stop offset="1" stopColor="#363a58" />
        </linearGradient>
        <linearGradient id="ps-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a607e" />
          <stop offset="0.5" stopColor="#c9cee2" />
          <stop offset="1" stopColor="#5a607e" />
        </linearGradient>
        <radialGradient id="ps-volute" cx="0.38" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#7a80d8" />
          <stop offset="0.55" stopColor="#3e4398" />
          <stop offset="1" stopColor="#1d205a" />
        </radialGradient>
        <linearGradient id="ps-motor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a55d6" />
          <stop offset="0.28" stopColor="#6a35b0" />
          <stop offset="1" stopColor="#2c1052" />
        </linearGradient>
        <linearGradient id="ps-cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4e66" />
          <stop offset="1" stopColor="#24263a" />
        </linearGradient>
        <radialGradient id="ps-face" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9d5c8" />
        </radialGradient>
        <pattern id="ps-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="14" height="14" fill="rgba(255,255,255,0.03)" />
          <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        </pattern>
        <marker id="ps-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={ROLE.plan} />
        </marker>
        <marker id="ps-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={LINE} />
        </marker>
      </defs>

      {/* piso de concreto */}
      <rect x="0" y="520" width="1660" height="34" fill="url(#ps-hatch)" />
      <path d="M 0 520 H 1660" stroke="rgba(255,255,255,.35)" strokeWidth="3" />

      {/* reservatórios (fluido) */}
      <g className={cls('agua')}>
        <Tank id="inf" x={30} y={330} w={270} h={180} level={30} flowing={flowing} />
        <g>
          {/* estrutura metálica do reservatório elevado */}
          <rect x="1394" y="250" width="12" height="270" fill="url(#ps-wall)" />
          <rect x="1594" y="250" width="12" height="270" fill="url(#ps-wall)" />
          <path d="M 1404 380 L 1596 300 M 1404 300 L 1596 380 M 1404 456 H 1596 M 1404 300 H 1596" stroke="#8a90ad" strokeWidth="5" fill="none" />
          <rect x="1386" y="512" width="28" height="8" fill="#8a90ad" />
          <rect x="1586" y="512" width="28" height="8" fill="#8a90ad" />
          <Tank id="sup" x={1380} y={60} w={240} h={190} level={40} flowing={flowing} />
        </g>
        {/* bocal de entrada da sucção, submerso */}
        <path d="M 300 461 H 270 L 262 455 V 485 L 270 479 H 300 Z" fill="url(#ps-pipe-h)" opacity={0.9} />
        <text x="165" y="496" textAnchor="middle" className="ps-lbl sm" fill="#fff">reservatório inferior</text>
        {sizing && <text x="1500" y="238" textAnchor="middle" className="ps-lbl sm">reservatório superior</text>}
      </g>

      {/* desnível */}
      <g className={cls('dz')} style={{ opacity: sizing ? undefined : 0 }}>
        <path d="M 300 360 H 1360" stroke={LINE} strokeWidth="2" strokeDasharray="10 10" opacity="0.5" />
        <path d="M 1360 100 H 1380" stroke={LINE} strokeWidth="2" opacity="0.7" />
        <path d="M 1360 108 V 352" stroke={LINE} strokeWidth="3" markerStart="url(#ps-dim)" markerEnd="url(#ps-dim)" />
        <text x="1346" y="240" textAnchor="end" className="ps-lbl big">Δz = 18 m</text>
      </g>

      {/* tubulação: metal + janela em corte com a água escoando */}
      <g className={`${cls('tubo')} ${hammer && stage === 7 ? 'ps-shake' : ''}`}>
        <PipeH x1={300} x2={452} y={470} />
        <PipeV x={516} y1={40 + R} y2={432} />
        <Elbow d={`M 516 ${40 + R} A ${R} ${R} 0 0 1 ${516 + R} 40`} />
        <PipeH x1={516 + R} x2={1450 - R} y={40} />
        <Elbow d={`M ${1450 - R} 40 A ${R} ${R} 0 0 1 1450 ${40 + R}`} />
        <PipeV x={1450} y1={40 + R} y2={84} />
        {[SUC, DIS].map((d) => (
          <g key={d}>
            <path d={d} stroke="#123a6e" strokeWidth={10} fill="none" opacity={0.85} />
            <path d={d} stroke="#5fb0ff" strokeWidth={7} fill="none" opacity={flowing ? 0.85 : 0.45} style={{ transition: 'opacity .6s' }} />
            <path d={d} className="ps-flow" stroke="#e6f4ff" strokeWidth={5} fill="none" style={{ animationDuration: `${flowSpeed}s`, opacity: flowing ? 1 : 0 }} />
          </g>
        ))}
        {/* jato caindo no reservatório superior + ondulação */}
        <g style={{ opacity: flowing ? 1 : 0, transition: 'opacity .6s' }}>
          <rect x="1444" y="84" width="12" height="18" fill="#7cc0ff" opacity={0.85} className="ps-jet" />
          <ellipse cx="1450" cy="101" rx="18" ry="4" fill="none" stroke="#cfe8ff" strokeWidth="2" className="ps-ripple" />
          <ellipse cx="1450" cy="101" rx="18" ry="4" fill="none" stroke="#cfe8ff" strokeWidth="2" className="ps-ripple late" />
        </g>
        {/* flanges e suportes */}
        <Flange x={306} y={470} />
        <Flange x={448} y={470} />
        <Flange x={516} y={432} vertical />
        <Flange x={1450} y={84} vertical />
        {[640, 1050].map((x) => (
          <g key={x}>
            <path d={`M ${x} 0 V 27`} stroke="#8a90ad" strokeWidth={4} />
            <path d={`M ${x - 13} 27 V 40 A 13 13 0 0 0 ${x + 13} 40 V 27 Z`} stroke="#8a90ad" strokeWidth={3} fill="none" />
          </g>
        ))}
        {/* marca de comprimento longo */}
        {sizing && (
          <g>
            <rect x="944" y="16" width="40" height="48" fill="#120F2E" />
            <path d="M 938 68 L 956 12 M 970 68 L 988 12" stroke={LINE} strokeWidth="4" />
            <text x="1240" y="16" textAnchor="middle" className="ps-lbl">DN 80 · aço · 120 m</text>
          </g>
        )}
        {/* medidor de vazão em linha (carretel) */}
        <rect x="742" y="24" width="36" height="32" rx="4" fill="url(#ps-cab)" stroke={LINE} strokeWidth={2} />
        <Flange x={740} y={40} />
        <Flange x={780} y={40} />
        {sizing && (
          <g>
            <rect x="752" y="56" width="16" height="8" fill="#5a6080" />
            <rect x="722" y="64" width="76" height="30" rx="5" fill="url(#ps-cab)" stroke={LINE} strokeWidth={2} />
            <rect x="728" y="69" width="64" height="20" rx="3" fill="#0b1d15" />
            <text x="760" y="84" textAnchor="middle" className="ps-lcd" fill={flowing ? '#5dffb0' : '#ff7a7a'}>{flowing ? '30,0' : '0,0'}</text>
            <text x="760" y="108" textAnchor="middle" className="ps-lbl sm">m³/h</text>
          </g>
        )}
      </g>

      {/* manômetro no recalque */}
      <g className={cls('golpe')}>
        <path d="M 527 238 H 600 V 228" stroke="#9aa0bd" strokeWidth={5} fill="none" />
        <Gauge x={600} y={196} bar={flowing ? 2.4 : 0} surge={hammer} />
      </g>

      {/* acessórios: válvulas e curvas */}
      <g className={cls('acess')}>
        <Valve x={372} y={470} />
        <Valve x={516} y={372} vertical check />
        <Valve x={516} y={296} vertical />
        <circle cx={516} cy={40} r={30} fill="none" stroke={LINE} strokeWidth={2} strokeDasharray="4 5" opacity={0.6} />
        <circle cx={1450} cy={40} r={30} fill="none" stroke={LINE} strokeWidth={2} strokeDasharray="4 5" opacity={0.6} />
        {sizing && (
          <>
            <text x="452" y="379" textAnchor="end" className="ps-lbl sm">retenção</text>
            <text x="452" y="303" textAnchor="end" className="ps-lbl sm">gaveta</text>
          </>
        )}
      </g>

      {/* bomba centrífuga + motor */}
      <g className={cls('bomba')}>
        <rect x="424" y="506" width="282" height="14" rx="2" fill="#6e7493" />
        <rect x="424" y="506" width="282" height="3" fill="#b5bad0" />
        {[440, 520, 610, 690].map((x) => <circle key={x} cx={x} cy={513} r={3} fill="#2c2f45" />)}
        {/* voluta */}
        <path d="M 496 420 A 48 48 0 1 1 452 488 L 448 470 A 44 44 0 0 1 496 424 Z" fill="#2a2d6a" opacity={0.6} />
        <circle cx="496" cy="468" r="45" fill="url(#ps-volute)" stroke="#c9cce0" strokeWidth={3} />
        <rect x="505" y="414" width="22" height="30" fill="url(#ps-volute)" stroke="#c9cce0" strokeWidth={2} />
        {/* janela em corte: rotor */}
        <circle cx="496" cy="468" r="29" fill="#0d0f2e" stroke="#8a90c8" strokeWidth={2} />
        <g className={`ps-imp ${flowing ? 'spin' : ''}`} style={{ transformOrigin: '496px 468px' }}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d="M 496 468 q 13 -9 25 -5" stroke="#cfd4ee" strokeWidth={4} strokeLinecap="round" fill="none" transform={`rotate(${a} 496 468)`} />
          ))}
          <circle cx="496" cy="468" r="7" fill="#cfd4ee" />
        </g>
        {/* mancal + protetor do acoplamento */}
        <rect x="532" y="452" width="14" height="34" rx="3" fill="#4a4f6a" />
        <rect x="544" y="448" width="16" height="42" rx="3" fill="#FFB547" stroke="#a86b14" strokeWidth={1.5} />
        <path d="M 546 452 L 558 486 M 546 466 L 554 488" stroke="#a86b14" strokeWidth={2} opacity={0.6} />
        {/* motor TEFC: carcaça aletada, caixa de ligação e tampa do ventilador */}
        <rect x="562" y="438" width="130" height="64" rx="10" fill="url(#ps-motor)" stroke="#c9cce0" strokeWidth={2.5} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M 570 ${445 + i * 7.4} H 684`} stroke="rgba(255,255,255,.18)" strokeWidth={2} />
        ))}
        <rect x="604" y="424" width="32" height="15" rx="3" fill="#4b2386" stroke="#c9cce0" strokeWidth={1.5} />
        <path d="M 692 446 h 10 a 6 6 0 0 1 6 6 v 36 a 6 6 0 0 1 -6 6 h -10 z" fill="#3a1c66" stroke="#c9cce0" strokeWidth={2} />
        <rect x="578" y="500" width="22" height="8" fill="#4a4f6a" />
        <rect x="656" y="500" width="22" height="8" fill="#4a4f6a" />
        {hammer && (
          <g className="ps-trip">
            <rect x="596" y="398" width="66" height="22" rx="11" fill="#c42f2f" />
            <text x="629" y="414" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="JetBrains Mono">PARADA</text>
          </g>
        )}
      </g>

      {/* golpe de aríete: onda de pressão no recalque */}
      {hammer && (
        <g>
          <path d={DIS} className="ps-wave" stroke="#ff4d4d" strokeWidth="14" fill="none" strokeLinejoin="round" />
          <g transform="translate(516 372)">
            <circle r="34" fill="none" stroke="#ff4d4d" strokeWidth="4" className="ps-ring" />
          </g>
        </g>
      )}

      {/* ---------------------------------------------------------- malha de controle (slide 9) */}
      {!sizing && (
        <g>
          {/* sinais */}
          <path d="M 760 142 V 250 H 1024" stroke={ROLE.plan} strokeWidth="4" strokeDasharray="12 9" fill="none" markerEnd="url(#ps-arr)" className="ps-sig" />
          <path d="M 1060 286 V 470 H 912" stroke={ROLE.plan} strokeWidth="4" strokeDasharray="12 9" fill="none" markerEnd="url(#ps-arr)" className="ps-sig" />
          <path d="M 1200 250 H 1098" stroke={ROLE.obj} strokeWidth="4" fill="none" markerEnd="url(#ps-arr)" />
          <path d="M 772 478 H 708" stroke={ROLE.tool} strokeWidth="6" fill="none" className="ps-power" />
          {/* FT */}
          <path d="M 760 56 V 82" stroke={ROLE.check} strokeWidth="4" />
          <circle cx="760" cy="112" r="30" fill="#0f2a22" stroke={ROLE.check} strokeWidth="4" />
          <text x="760" y="122" textAnchor="middle" className="ps-inst" fill={ROLE.check}>FT</text>
          {/* FIC */}
          <circle cx="1060" cy="250" r="36" fill="#2a1f55" stroke={ROLE.plan} strokeWidth="4" />
          <path d="M 1024 250 H 1096" stroke={ROLE.plan} strokeWidth="2" opacity="0.6" />
          <text x="1060" y="243" textAnchor="middle" className="ps-inst" fill={ROLE.plan} style={{ fontSize: 21 }}>FIC</text>
          {/* SP */}
          <rect x="1200" y="222" width="190" height="56" rx="8" fill="#1d1a44" stroke={ROLE.obj} strokeWidth="3" />
          <text x="1295" y="259" textAnchor="middle" className="ps-inst" fill="#fff" fontSize="24">SP 30 m³/h</text>
          {/* inversor de frequência: armário com display */}
          <rect x="772" y="430" width="140" height="80" rx="8" fill="url(#ps-cab)" stroke={ROLE.tool} strokeWidth="3" />
          <rect x="786" y="440" width="84" height="26" rx="3" fill="#0b1d15" />
          <text x="828" y="459" textAnchor="middle" className="ps-lcd" fill="#5dffb0">45,0 Hz</text>
          <circle cx="890" cy="447" r="4" fill="#3DDC97" className="ps-led" />
          <circle cx="890" cy="461" r="4" fill="#FFB547" opacity={0.5} />
          <text x="842" y="496" textAnchor="middle" className="ps-inst" fill={ROLE.tool} fontSize="20">inversor</text>

          <Tag x={800} y={86} color={ROLE.check} role="VERIFICAR · sensor" text="medidor de vazão (FT)" />
          <Tag x={760} y={290} color={ROLE.plan} role="PLANEJAR · controlador" text="PID compara e corrige" />
          <Tag x={1150} y={296} color={ROLE.obj} role="OBJETIVO · setpoint" text="30 m³/h" />
          <Tag x={1084} y={414} color={ROLE.tool} role="FERRAMENTAS · atuador" text="inversor + bomba" />
          <Tag x={40} y={200} color={ROLE.world} role="RESULTADO · planta" text="vazão que chega ao reservatório" />
        </g>
      )}

      {/* ---------------------------------------------------------- dimensionamento (slide 10) */}
      {sizing && (
        <g>
          <Badge x={60} y={390} n={1} on={stage >= 1} />
          <Badge x={850} y={40} n={2} on={stage >= 1} />
          <Badge x={560} y={296} n={3} on={stage >= 1} />
          <Badge x={1360} y={176} n={4} on={stage >= 1} />
          <Badge x={724} y={432} n={5} on={stage >= 1} />

          {now(2) && (
            <Callout x={30} y={150} w={460} lead={[165, 286, 165, 380]}>
              <b>1 · Fluido</b>
              <span>água a 20 °C</span>
              <span>ρ = 998 kg/m³ · ν = 1,0·10⁻⁶ m²/s</span>
            </Callout>
          )}
          {past(2) && <Callout x={30} y={262} w={300} tone="dim"><span>água 20 °C · ρ 998</span></Callout>}

          {now(3) && (
            <Callout x={760} y={88} w={660} lead={[880, 88, 880, 52]}>
              <b>2 · Tubulação · DN 80 (D = 77,9 mm)</b>
              <span>v = Q/A = 1,75 m/s · Re = 1,36·10⁵</span>
              <span>f = 0,0199 (Colebrook) → hf = 4,8 m</span>
            </Callout>
          )}
          {past(3) && <Callout x={880} y={64} w={250} tone="dim"><span>hf = 4,8 m</span></Callout>}

          {now(4) && (
            <Callout x={640} y={140} w={600} lead={[640, 270, 540, 300]}>
              <b>3 · Acessórios</b>
              <span>válvulas, curvas, entrada e saída: ΣK = 8</span>
              <span>hm = ΣK · v²/2g = 1,25 m</span>
            </Callout>
          )}
          {past(4) && <Callout x={650} y={150} w={260} tone="dim"><span>hm = 1,25 m</span></Callout>}

          {now(5) && (
            <Callout x={960} y={240} w={400}>
              <b>4 · Altura manométrica</b>
              <span>H = Δz + hf + hm</span>
              <span>H = 18 + 4,8 + 1,25 ≈ 24 m</span>
            </Callout>
          )}
          {past(5) && <Callout x={1110} y={150} w={240} tone="dim"><span>H ≈ 24 m</span></Callout>}

          {now(6) && (
            <Callout x={760} y={370} w={600} lead={[760, 430, 712, 462]}>
              <b>5 · Bomba e motor</b>
              <span>P = ρ·g·Q·H / η = 2,8 kW (η = 70%)</span>
              <span>→ motor de 4 kW</span>
            </Callout>
          )}
          {past(6) && <Callout x={760} y={440} w={420} tone="dim"><span>P ≈ 2,8 kW → motor 4 kW</span></Callout>}

          {stage >= 7 && (
            <Callout x={660} y={246} w={660} tone="red" lead={[660, 268, 632, 210]}>
              <b>⚠ Parada brusca: golpe de aríete</b>
              <span>ΔH = a·Δv/g = 1200 × 1,75 / 9,81</span>
              <span>≈ 214 m no pior caso (fechamento instantâneo)</span>
            </Callout>
          )}
        </g>
      )}
    </svg>
  )
}

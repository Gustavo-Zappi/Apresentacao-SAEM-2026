import type { ReactNode } from 'react'

/**
 * Sistema de bombeamento (desenho esquemático, viewBox 1660×560), usado em dois slides:
 *  - mode="loop":   malha de controle de vazão (FT → FIC → inversor), com o papel de cada elemento no agente.
 *  - mode="sizing": dimensionamento item a item (fluido, tubulação, acessórios, desnível, bomba, golpe de aríete).
 * Números conferidos: água 20 °C, 30 m³/h, DN 80 (D = 77,9 mm), 120 m, Δz = 18 m, aço ε = 0,045 mm,
 * Colebrook, ΣK = 8, η = 70%, celeridade a ≈ 1200 m/s.
 */

export const ROLE = {
  obj: '#FFFFFF',
  plan: '#CBB3FF',
  tool: '#FFB547',
  world: '#5AB0FF',
  check: '#3DDC97',
} as const

export type Part = 'agua' | 'tubo' | 'acess' | 'dz' | 'bomba' | 'golpe'

const WATER = '#4d9bff'
const PIPE = '#9aa0bd'
const LINE = '#c9cce0'

// rotas da água: sucção e recalque
const SUC = 'M 300 470 H 452'
const DIS = 'M 516 428 V 40 H 1450 V 98'

function Valve({ x, y, vertical = false, check = false }: { x: number; y: number; vertical?: boolean; check?: boolean }) {
  const s = 17
  return (
    <g transform={`translate(${x} ${y}) rotate(${vertical ? 90 : 0})`}>
      <path d={`M ${-s} ${-s} L ${s} ${s} L ${s} ${-s} L ${-s} ${s} Z`} fill="#26234f" stroke={LINE} strokeWidth="4" strokeLinejoin="round" />
      {check ? (
        <path d={`M ${-s} ${-s} L 0 0 L ${-s} ${s} Z`} fill={LINE} />
      ) : (
        <path d={`M 0 0 V ${-s - 14} M -12 ${-s - 14} H 12`} stroke={LINE} strokeWidth="4" strokeLinecap="round" />
      )}
    </g>
  )
}

function Tank({ x, y, w, h, level }: { x: number; y: number; w: number; h: number; level: number }) {
  const wy = y + level
  const n = Math.max(2, Math.round(w / 40))
  const sw = w / n
  const waves = Array.from({ length: n }, (_, i) => `Q ${x + i * sw + sw / 4} ${wy - 7} ${x + i * sw + sw / 2} ${wy} T ${x + (i + 1) * sw} ${wy}`).join(' ')
  return (
    <g>
      <path d={`M ${x} ${wy} ${waves} V ${y + h} H ${x} Z`} fill="url(#ps-water)" />
      <path d={`M ${x} ${y} V ${y + h} H ${x + w} V ${y}`} fill="none" stroke={LINE} strokeWidth="6" strokeLinejoin="round" />
    </g>
  )
}

function Callout({ x, y, w, children, tone = 'amber' }: { x: number; y: number; w: number; children: ReactNode; tone?: 'amber' | 'red' | 'dim' }) {
  return (
    <foreignObject x={x} y={y} width={w} height={240} style={{ overflow: 'visible' }}>
      <div className={`ps-call ${tone}`}>{children}</div>
    </foreignObject>
  )
}

function Badge({ x, y, n, on }: { x: number; y: number; n: number; on: boolean }) {
  return (
    <g className="ps-badge" style={{ opacity: on ? 1 : 0, transform: `translate(${x}px, ${y}px) scale(${on ? 1 : 0.4})` }}>
      <circle r="22" fill="#FFB547" />
      <text y="9" textAnchor="middle" fontSize="26" fontWeight="800" fill="#120F2E" fontFamily="Poppins">{n}</text>
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
  const flowSpeed = sizing ? (stage === 3 ? 0.55 : stage >= 7 ? 99 : 1.1) : 1
  const flowing = !hammer

  return (
    <svg viewBox="0 0 1660 560" width={width} height={(width * 560) / 1660} className="ps" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id="ps-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fb2ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2a5bb8" stopOpacity="0.85" />
        </linearGradient>
        <marker id="ps-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={ROLE.plan} />
        </marker>
        <marker id="ps-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={LINE} />
        </marker>
      </defs>

      {/* chão */}
      <path d="M 0 520 H 1660" stroke="rgba(255,255,255,.25)" strokeWidth="3" />
      <path d="M 0 520 H 1660" stroke="rgba(255,255,255,.08)" strokeWidth="26" strokeDasharray="3 14" transform="translate(0 14)" />

      {/* reservatórios (fluido) */}
      <g className={cls('agua')}>
        <Tank x={30} y={330} w={270} h={180} level={30} />
        <g>
          <path d="M 1400 250 L 1392 520 M 1600 250 L 1608 520 M 1396 380 L 1604 300 M 1396 300 L 1604 380 M 1394 450 L 1606 450" stroke={PIPE} strokeWidth="6" fill="none" />
          <Tank x={1380} y={60} w={240} h={190} level={40} />
        </g>
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

      {/* tubulação */}
      <g className={cls('tubo')}>
        {[SUC, DIS].map((d) => (
          <g key={d}>
            <path d={d} stroke={PIPE} strokeWidth="22" fill="none" strokeLinejoin="round" />
            <path d={d} stroke="#1b1840" strokeWidth="13" fill="none" strokeLinejoin="round" />
            <path
              d={d}
              className="ps-flow"
              stroke={WATER}
              strokeWidth="6"
              fill="none"
              strokeLinejoin="round"
              style={{ animationDuration: `${flowSpeed}s`, opacity: flowing ? 1 : 0 }}
            />
          </g>
        ))}
        {/* marca de comprimento longo */}
        {sizing && (
          <g>
            <rect x="944" y="18" width="40" height="44" fill="#120F2E" />
            <path d="M 938 66 L 956 14 M 970 66 L 988 14" stroke={LINE} strokeWidth="4" />
            <text x="1210" y="16" textAnchor="middle" className="ps-lbl">DN 80 · aço · 120 m</text>
          </g>
        )}
      </g>

      {/* acessórios: válvulas e curvas */}
      <g className={cls('acess')}>
        <Valve x={372} y={470} />
        <Valve x={516} y={372} vertical check />
        <Valve x={516} y={296} vertical />
        <circle cx="516" cy="40" r="14" fill="none" stroke={LINE} strokeWidth="4" />
        <circle cx="1450" cy="40" r="14" fill="none" stroke={LINE} strokeWidth="4" />
        {sizing && (
          <>
            <text x="452" y="379" textAnchor="end" className="ps-lbl sm">retenção</text>
            <text x="452" y="303" textAnchor="end" className="ps-lbl sm">gaveta</text>
          </>
        )}
      </g>

      {/* bomba + motor */}
      <g className={cls('bomba')}>
        <rect x="430" y="508" width="270" height="12" fill={PIPE} />
        <circle cx="496" cy="468" r="44" fill="#2e2b5c" stroke={LINE} strokeWidth="5" />
        <path d="M 496 424 L 540 424 L 540 440" fill="#2e2b5c" stroke={LINE} strokeWidth="5" />
        <g className={`ps-imp ${flowing ? 'spin' : ''}`} style={{ transformOrigin: '496px 468px' }}>
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d="M 496 468 q 14 -10 26 -6" stroke={LINE} strokeWidth="4" fill="none" transform={`rotate(${a} 496 468)`} />
          ))}
          <circle cx="496" cy="468" r="7" fill={LINE} />
        </g>
        <rect x="540" y="458" width="14" height="22" fill={PIPE} />
        <rect x="554" y="436" width="140" height="68" rx="10" fill="#4a1b7a" stroke={LINE} strokeWidth="4" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M ${574 + i * 20} 440 V 500`} stroke="rgba(255,255,255,.25)" strokeWidth="3" />
        ))}
        <text x="624" y="480" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff" fontFamily="Poppins">M</text>
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
          <path d="M 1060 286 V 470 H 906" stroke={ROLE.plan} strokeWidth="4" strokeDasharray="12 9" fill="none" markerEnd="url(#ps-arr)" className="ps-sig" />
          <path d="M 1200 250 H 1098" stroke={ROLE.obj} strokeWidth="4" fill="none" markerEnd="url(#ps-arr)" />
          <path d="M 760 470 H 700" stroke={ROLE.tool} strokeWidth="7" fill="none" />
          {/* FT */}
          <path d="M 760 52 V 82" stroke={ROLE.check} strokeWidth="4" />
          <circle cx="760" cy="112" r="30" fill="#0f2a22" stroke={ROLE.check} strokeWidth="4" />
          <text x="760" y="122" textAnchor="middle" className="ps-inst" fill={ROLE.check}>FT</text>
          {/* FIC */}
          <circle cx="1060" cy="250" r="36" fill="#2a1f55" stroke={ROLE.plan} strokeWidth="4" />
          <path d="M 1024 250 H 1096" stroke={ROLE.plan} strokeWidth="2" opacity="0.6" />
          <text x="1060" y="243" textAnchor="middle" className="ps-inst" fill={ROLE.plan} style={{ fontSize: 21 }}>FIC</text>
          {/* SP */}
          <rect x="1200" y="222" width="190" height="56" rx="8" fill="#1d1a44" stroke={ROLE.obj} strokeWidth="3" />
          <text x="1295" y="259" textAnchor="middle" className="ps-inst" fill="#fff" fontSize="24">SP 30 m³/h</text>
          {/* inversor */}
          <rect x="770" y="436" width="136" height="68" rx="8" fill="#3a2a10" stroke={ROLE.tool} strokeWidth="4" />
          <text x="838" y="478" textAnchor="middle" className="ps-inst" fill={ROLE.tool} fontSize="24">inversor</text>

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
          <Badge x={820} y={40} n={2} on={stage >= 1} />
          <Badge x={560} y={296} n={3} on={stage >= 1} />
          <Badge x={1360} y={176} n={4} on={stage >= 1} />
          <Badge x={720} y={436} n={5} on={stage >= 1} />

          {now(2) && (
            <Callout x={30} y={150} w={460}>
              <b>1 · Fluido</b>
              <span>água a 20 °C</span>
              <span>ρ = 998 kg/m³ · ν = 1,0·10⁻⁶ m²/s</span>
            </Callout>
          )}
          {past(2) && <Callout x={30} y={262} w={300} tone="dim"><span>água 20 °C · ρ 998</span></Callout>}

          {now(3) && (
            <Callout x={720} y={70} w={660}>
              <b>2 · Tubulação · DN 80 (D = 77,9 mm)</b>
              <span>v = Q/A = 1,75 m/s · Re = 1,36·10⁵</span>
              <span>f = 0,0199 (Colebrook) → hf = 4,8 m</span>
            </Callout>
          )}
          {past(3) && <Callout x={850} y={64} w={250} tone="dim"><span>hf = 4,8 m</span></Callout>}

          {now(4) && (
            <Callout x={560} y={140} w={600}>
              <b>3 · Acessórios</b>
              <span>válvulas, curvas, entrada e saída: ΣK = 8</span>
              <span>hm = ΣK · v²/2g = 1,25 m</span>
            </Callout>
          )}
          {past(4) && <Callout x={560} y={180} w={260} tone="dim"><span>hm = 1,25 m</span></Callout>}

          {now(5) && (
            <Callout x={960} y={240} w={400}>
              <b>4 · Altura manométrica</b>
              <span>H = Δz + hf + hm</span>
              <span>H = 18 + 4,8 + 1,25 ≈ 24 m</span>
            </Callout>
          )}
          {past(5) && <Callout x={1110} y={150} w={240} tone="dim"><span>H ≈ 24 m</span></Callout>}

          {now(6) && (
            <Callout x={740} y={370} w={600}>
              <b>5 · Bomba e motor</b>
              <span>P = ρ·g·Q·H / η = 2,8 kW (η = 70%)</span>
              <span>→ motor de 4 kW</span>
            </Callout>
          )}
          {past(6) && <Callout x={730} y={440} w={420} tone="dim"><span>P ≈ 2,8 kW → motor 4 kW</span></Callout>}

          {stage >= 7 && (
            <Callout x={580} y={246} w={660} tone="red">
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

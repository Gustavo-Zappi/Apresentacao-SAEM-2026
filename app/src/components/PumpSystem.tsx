import type { CSSProperties, ReactNode } from 'react'

/**
 * Sistema de bombeamento (desenho esquemático, viewBox 1660×560), usado em dois slides:
 *  - mode="loop":   malha de controle de vazão (FT → FIC → inversor), com o papel de cada elemento no agente.
 *  - mode="sizing": dimensionamento item a item (fluido, tubulação, acessórios, desnível, bomba, golpe de aríete).
 * Números conferidos: água 20 °C, 30 m³/h, DN 80 (D = 77,9 mm), 120 m, Δz = 18 m, aço ε = 0,045 mm,
 * Colebrook, ΣK = 8, η = 70%, celeridade a ≈ 1200 m/s.
 *
 * Linguagem visual (a mesma dos outros diagramas do palco):
 *  - contorno claro de 4 px, peças em azul-escuro, água em azul, um único tom de destaque (âmbar) e vermelho só para risco;
 *  - o item em análise acende em âmbar e o resto recua;
 *  - a conta do item aparece num quadro ao lado da peça e, concluída, vira uma etiqueta de resultado junto dela.
 * Tudo que entra e sai é transição de CSS: funciona igual para frente e para trás e não trava se o clique for rápido.
 */

export const ROLE = {
  obj: '#FFFFFF',
  plan: '#CBB3FF',
  tool: '#FFB547',
  world: '#5AB0FF',
  check: '#3DDC97',
} as const

export type Part = 'agua' | 'tubo' | 'acess' | 'dz' | 'bomba' | 'golpe'

const WATER = '#5AB0FF'
const FILL = '#1C1947'
const BORE = '#131033'
/** Contorno e parede de tubo: variáveis de CSS, para o item em análise mudar de cor em transição. */
const LN = 'var(--ps-ln)'
const WALL = 'var(--ps-wall)'

// rotas da água: sucção e recalque
const SUC = 'M 300 470 H 452'
const DIS = 'M 516 428 V 40 H 1450 V 98'

function Valve({ x, y, vertical = false, check = false }: { x: number; y: number; vertical?: boolean; check?: boolean }) {
  const s = 17
  return (
    <g transform={`translate(${x} ${y}) rotate(${vertical ? 90 : 0})`}>
      <path d={`M ${-s} ${-s} L ${s} ${s} L ${s} ${-s} L ${-s} ${s} Z`} fill={FILL} stroke={LN} strokeWidth="4" strokeLinejoin="round" />
      {check ? (
        <path d={`M ${-s} ${-s} L 0 0 L ${-s} ${s} Z`} fill={LN} />
      ) : (
        <path d={`M 0 0 V ${-s - 14} M -12 ${-s - 14} H 12`} stroke={LN} strokeWidth="4" strokeLinecap="round" />
      )}
    </g>
  )
}

function Tank({ x, y, w, h, level }: { x: number; y: number; w: number; h: number; level: number }) {
  const wy = y + level
  const n = Math.max(2, Math.round(w / 40))
  const sw = w / n
  const waves = Array.from({ length: n }, (_, i) => `Q ${x + i * sw + sw / 4} ${wy - 6} ${x + i * sw + sw / 2} ${wy} T ${x + (i + 1) * sw} ${wy}`).join(' ')
  return (
    <g>
      <path d={`M ${x} ${wy} ${waves} V ${y + h - 10} Q ${x + w} ${y + h} ${x + w - 10} ${y + h} H ${x + 10} Q ${x} ${y + h} ${x} ${y + h - 10} Z`} fill="url(#ps-water)" />
      <path d={`M ${x} ${wy} ${waves}`} fill="none" stroke="#A8D2FF" strokeWidth="3" opacity="0.8" />
      {/* reflexo no vidro */}
      <path d={`M ${x + 16} ${wy + 16} V ${y + h - 22}`} stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.14" />
      <path d={`M ${x} ${y} V ${y + h - 10} Q ${x} ${y + h} ${x + 10} ${y + h} H ${x + w - 10} Q ${x + w} ${y + h} ${x + w} ${y + h - 10} V ${y}`} fill="none" stroke={LN} strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

/** Quadro com a conta do item em análise. */
function Callout({ x, y, w, on, tone = 'warn', children }: { x: number; y: number; w: number; on: boolean; tone?: 'warn' | 'danger'; children: ReactNode }) {
  return (
    <foreignObject x={x} y={y} width={w} height={240} style={{ overflow: 'visible', pointerEvents: 'none' }}>
      <div className={`ps-call ${tone} ${on ? 'on' : ''}`}>{children}</div>
    </foreignObject>
  )
}

/** Etiqueta de resultado: o que ficou da conta depois que o agente seguiu adiante. */
function Result({ x, y, on, children }: { x: number; y: number; on: boolean; children: ReactNode }) {
  return (
    <foreignObject x={x} y={y} width={460} height={60} style={{ overflow: 'visible', pointerEvents: 'none' }}>
      <div className={`ps-res ${on ? 'on' : ''}`}>{children}</div>
    </foreignObject>
  )
}

function Badge({ x, y, n, on }: { x: number; y: number; n: number; on: boolean }) {
  return (
    <g className={`ps-badge ${on ? 'on' : ''}`} style={{ '--x': `${x}px`, '--y': `${y}px`, '--d': `${(n - 1) * 0.13}s` } as CSSProperties}>
      <circle r="23" fill="#FFB547" />
      <circle r="23" fill="none" stroke="#120F2E" strokeWidth="3" opacity="0.35" />
      <text y="9.5" textAnchor="middle" fontSize="27" fontWeight="800" fill="#120F2E" fontFamily="Poppins">{n}</text>
    </g>
  )
}

function Tag({ x, y, color, role, text }: { x: number; y: number; color: string; role: string; text: string }) {
  return (
    <foreignObject x={x} y={y} width={420} height={96} style={{ overflow: 'visible' }}>
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
  const flowSpeed = sizing ? (stage === 3 ? 0.55 : 1.1) : 1
  const flowing = !hammer

  return (
    <svg viewBox="0 0 1660 560" width={width} height={(width * 560) / 1660} className="ps" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id="ps-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6DB6FF" stopOpacity="0.92" />
          <stop offset="1" stopColor="#2552B0" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="ps-motor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6A2AA6" />
          <stop offset="1" stopColor="#3F1670" />
        </linearGradient>
        <pattern id="ps-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,.16)" strokeWidth="3" />
        </pattern>
        <marker id="ps-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={ROLE.plan} />
        </marker>
        <marker id="ps-arr-w" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={ROLE.obj} />
        </marker>
      </defs>

      {/* chão */}
      <rect x="0" y="522" width="1660" height="16" fill="url(#ps-hatch)" />
      <path d="M 0 521 H 1660" stroke="rgba(255,255,255,.32)" strokeWidth="3" />

      {/* reservatórios (fluido) */}
      <g className={cls('agua')}>
        <Tank x={30} y={330} w={270} h={180} level={30} />
        <g>
          <path d="M 1400 250 L 1392 520 M 1600 250 L 1608 520" stroke={WALL} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M 1396 380 L 1604 300 M 1396 300 L 1604 380 M 1394 450 L 1606 450" stroke={WALL} strokeWidth="4" fill="none" opacity="0.7" />
          <Tank x={1380} y={60} w={240} h={190} level={40} />
        </g>
        <text x="165" y="452" textAnchor="middle" className="ps-lbl on-water">reservatório</text>
        <text x="165" y="480" textAnchor="middle" className="ps-lbl on-water">inferior</text>
        {sizing && (
          <>
            <text x="1500" y="196" textAnchor="middle" className="ps-lbl on-water">reservatório</text>
            <text x="1500" y="224" textAnchor="middle" className="ps-lbl on-water">superior</text>
          </>
        )}
      </g>

      {/* desnível */}
      <g className={cls('dz')} style={{ opacity: sizing ? undefined : 0 }}>
        <path d="M 300 360 H 1360" stroke={LN} strokeWidth="2.5" strokeDasharray="10 10" opacity="0.5" />
        <path d="M 1348 100 H 1380" stroke={LN} strokeWidth="2.5" opacity="0.7" />
        <path d="M 1360 112 V 348" stroke={LN} strokeWidth="3.5" />
        <path d="M 1360 101 L 1351 119 H 1369 Z M 1360 359 L 1351 341 H 1369 Z" fill={LN} />
        <text x="1342" y="318" textAnchor="end" className="ps-lbl big">Δz = 18 m</text>
      </g>

      {/* tubulação */}
      <g className={cls('tubo')}>
        {[SUC, DIS].map((d) => (
          <g key={d}>
            <path d={d} stroke={WALL} strokeWidth="22" fill="none" strokeLinejoin="round" />
            <path d={d} stroke={BORE} strokeWidth="13" fill="none" strokeLinejoin="round" />
            <path
              d={d}
              className="ps-flow"
              stroke={WATER}
              strokeWidth="6"
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ animationDuration: `${flowSpeed}s`, opacity: flowing ? 1 : 0 }}
            />
          </g>
        ))}
        {/* marca de comprimento longo */}
        {sizing && (
          <g>
            <rect x="944" y="18" width="40" height="44" fill="#16123A" />
            <path d="M 938 66 L 956 14 M 970 66 L 988 14" stroke={LN} strokeWidth="4" strokeLinecap="round" />
            <text x="1210" y="14" textAnchor="middle" className="ps-lbl">DN 80 · aço · 120 m</text>
          </g>
        )}
      </g>

      {/* acessórios: válvulas e curvas */}
      <g className={cls('acess')}>
        <Valve x={372} y={470} />
        <Valve x={516} y={372} vertical check />
        <Valve x={516} y={296} vertical />
        <circle cx="516" cy="40" r="15" fill={BORE} stroke={LN} strokeWidth="4" />
        <circle cx="1450" cy="40" r="15" fill={BORE} stroke={LN} strokeWidth="4" />
        {sizing && (
          <>
            <text x="476" y="380" textAnchor="end" className="ps-lbl">retenção</text>
            <text x="476" y="304" textAnchor="end" className="ps-lbl">gaveta</text>
          </>
        )}
      </g>

      {/* bomba + motor */}
      <g className={cls('bomba')}>
        <rect x="430" y="507" width="284" height="14" rx="3" fill={WALL} />
        <path d="M 572 502 V 508 M 680 502 V 508" stroke={WALL} strokeWidth="10" />
        {/* voluta com saída tangencial */}
        <path d="M 452 468 A 44 44 0 1 0 540 468 V 424 H 496 A 44 44 0 0 0 452 468 Z" fill={FILL} stroke={LN} strokeWidth="5" strokeLinejoin="round" />
        <g className={`ps-imp ${flowing ? 'spin' : ''}`} style={{ transformOrigin: '496px 468px' }}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d="M 496 468 q 13 -12 27 -7" stroke={LN} strokeWidth="4" fill="none" strokeLinecap="round" transform={`rotate(${a} 496 468)`} />
          ))}
          <circle cx="496" cy="468" r="7.5" fill={LN} />
        </g>
        <rect x="540" y="458" width="16" height="22" fill={WALL} />
        <rect x="556" y="434" width="140" height="68" rx="12" fill="url(#ps-motor)" stroke={LN} strokeWidth="4" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M ${578 + i * 24} 444 V 492`} stroke="rgba(255,255,255,.2)" strokeWidth="3" strokeLinecap="round" />
        ))}
        <rect x="696" y="446" width="12" height="44" rx="3" fill={WALL} />
        <text x="626" y="479" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff" fontFamily="Poppins">M</text>
      </g>

      {/* golpe de aríete: onda de pressão no recalque. No último passo ela assenta, para não disputar com a fala. */}
      <g className={`ps-hammer ${hammer ? 'on' : ''} ${stage >= 8 ? 'calm' : ''}`}>
        <path d={DIS} className="ps-tint" stroke="#FF5D5D" strokeWidth="13" fill="none" strokeLinejoin="round" />
        <path d={DIS} className="ps-wave" stroke="#FF5D5D" strokeWidth="14" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <g transform="translate(516 372)">
          <circle r="34" fill="none" stroke="#FF5D5D" strokeWidth="4" className="ps-ring" />
        </g>
      </g>

      {/* ---------------------------------------------------------- malha de controle (slide 9) */}
      {!sizing && (
        <g>
          {/* sinais */}
          <path d="M 760 142 V 250 H 1022" stroke={ROLE.plan} strokeWidth="4" strokeDasharray="12 9" fill="none" markerEnd="url(#ps-arr)" className="ps-sig" />
          <path d="M 1060 288 V 470 H 908" stroke={ROLE.plan} strokeWidth="4" strokeDasharray="12 9" fill="none" markerEnd="url(#ps-arr)" className="ps-sig" />
          <path d="M 1200 250 H 1100" stroke={ROLE.obj} strokeWidth="4" fill="none" markerEnd="url(#ps-arr-w)" />
          <path d="M 770 470 H 708" stroke={ROLE.tool} strokeWidth="7" fill="none" strokeLinecap="round" />
          {/* FT */}
          <path d="M 760 52 V 82" stroke={ROLE.check} strokeWidth="4" />
          <circle cx="760" cy="112" r="31" fill="#0E2A22" stroke={ROLE.check} strokeWidth="4" />
          <text x="760" y="122" textAnchor="middle" className="ps-inst" fill={ROLE.check}>FT</text>
          {/* FIC */}
          <circle cx="1060" cy="250" r="37" fill="#2A1F55" stroke={ROLE.plan} strokeWidth="4" />
          <path d="M 1023 250 H 1097" stroke={ROLE.plan} strokeWidth="2" opacity="0.6" />
          <text x="1060" y="243" textAnchor="middle" className="ps-inst" fill={ROLE.plan} style={{ fontSize: 22 }}>FIC</text>
          {/* SP */}
          <rect x="1200" y="221" width="196" height="58" rx="10" fill={FILL} stroke={ROLE.obj} strokeWidth="3" />
          <text x="1298" y="259" textAnchor="middle" className="ps-inst" fill="#fff" style={{ fontSize: 25 }}>SP 30 m³/h</text>
          {/* inversor */}
          <rect x="770" y="436" width="138" height="68" rx="10" fill="#3A2A10" stroke={ROLE.tool} strokeWidth="4" />
          <text x="839" y="479" textAnchor="middle" className="ps-inst" fill={ROLE.tool} style={{ fontSize: 25 }}>inversor</text>

          {/* papéis, na ordem do ciclo do agente */}
          <Tag x={1092} y={298} color={ROLE.obj} role="OBJETIVO · setpoint" text="30 m³/h" />
          <Tag x={690} y={298} color={ROLE.plan} role="PLANEJAR · controlador" text="PID compara e corrige" />
          <Tag x={1076} y={410} color={ROLE.tool} role="FERRAMENTAS · atuador" text="inversor + bomba" />
          <Tag x={40} y={196} color={ROLE.world} role="RESULTADO · planta" text="vazão que chega ao reservatório" />
          <Tag x={806} y={80} color={ROLE.check} role="VERIFICAR · sensor" text="medidor de vazão (FT)" />
        </g>
      )}

      {/* ---------------------------------------------------------- dimensionamento (slide 10) */}
      {sizing && (
        <g>
          <Badge x={60} y={390} n={1} on={stage >= 1} />
          <Badge x={820} y={40} n={2} on={stage >= 1} />
          <Badge x={560} y={296} n={3} on={stage >= 1} />
          <Badge x={1360} y={176} n={4} on={stage >= 1} />
          <Badge x={722} y={434} n={5} on={stage >= 1} />

          <Result x={30} y={258} on={past(2)}>água 20 °C · ρ 998</Result>
          <Result x={852} y={66} on={past(3)}>hf = 4,8 m</Result>
          <Result x={250} y={186} on={past(4)}>hm = 1,25 m</Result>
          <Result x={1168} y={326} on={past(5)}>H ≈ 24 m</Result>
          <Result x={756} y={410} on={past(6)}>P ≈ 2,8 kW → motor 4 kW</Result>

          <Callout x={30} y={122} w={470} on={now(2)}>
            <b>1 · Fluido</b>
            <span>água a 20 °C</span>
            <span>ρ = 998 kg/m³ · ν = 1,0·10⁻⁶ m²/s</span>
          </Callout>
          <Callout x={600} y={78} w={660} on={now(3)}>
            <b>2 · Tubulação · DN 80 (D = 77,9 mm)</b>
            <span>v = Q/A = 1,75 m/s · Re = 1,36·10⁵</span>
            <span>f = 0,0199 (Colebrook) → hf = 4,8 m</span>
          </Callout>
          <Callout x={600} y={138} w={640} on={now(4)}>
            <b>3 · Acessórios</b>
            <span>válvulas, curvas, entrada e saída: ΣK = 8</span>
            <span>hm = ΣK · v²/2g = 1,25 m</span>
          </Callout>
          <Callout x={880} y={118} w={440} on={now(5)}>
            <b>4 · Altura manométrica</b>
            <span>H = Δz + hf + hm</span>
            <span>H = 18 + 4,8 + 1,25 ≈ 24 m</span>
          </Callout>
          <Callout x={770} y={372} w={600} on={now(6)}>
            <b>5 · Bomba e motor</b>
            <span>P = ρ·g·Q·H / η = 2,8 kW (η = 70%)</span>
            <span>→ motor de 4 kW</span>
          </Callout>
          <Callout x={600} y={150} w={720} on={stage >= 7} tone="danger">
            <b>⚠ Parada brusca: golpe de aríete</b>
            <span>ΔH = a·Δv/g = 1200 × 1,75 / 9,81</span>
            <span>≈ 214 m no pior caso (fechamento instantâneo)</span>
          </Callout>
        </g>
      )}
    </svg>
  )
}

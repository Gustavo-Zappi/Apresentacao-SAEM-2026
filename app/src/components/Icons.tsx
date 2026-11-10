import type { ReactNode } from 'react'

/**
 * Família única de ícones do palco: grade 48×48, traço de 2,6 com pontas e cantos arredondados,
 * sem preenchimento. A cor vem do texto (currentColor). Por padrão ocupam 100% do contêiner;
 * dentro de um diagrama SVG, passe x, y e size.
 */
type IconProps = { size?: number | string; x?: number; y?: number; className?: string }

const G = ({ children, size = '100%', x, y, className }: IconProps & { children: ReactNode }) => (
  <svg
    viewBox="0 0 48 48"
    width={size}
    height={size}
    x={x}
    y={y}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
)

/* ---------------------------------------------------------------- trajetória */
export const IcGrad = (p: IconProps) => <G {...p}><path d="M4 19 L24 10 L44 19 L24 28 Z" /><path d="M13 23.5 V32 C13 35.5 18 38 24 38 S35 35.5 35 32 V23.5" /><path d="M44 19 V30" /></G>
export const IcPlane = (p: IconProps) => <G {...p}><path d="M24 5 C26 7.5 27 10.5 27 14 V35 L24 43 L21 35 V14 C21 10.5 22 7.5 24 5 Z" /><path d="M21 19 L5 26 V30 L21 27" /><path d="M27 19 L43 26 V30 L27 27" /><path d="M21 35.5 L15 38.5 V41 L22 40" /><path d="M27 35.5 L33 38.5 V41 L26 40" /></G>
export const IcBoard = (p: IconProps) => <G {...p}><rect x="6" y="7" width="36" height="25" rx="3" /><path d="M13 15 H25 M13 21 H33 M13 26 H20" /><path d="M17 41 L21 32 M31 41 L27 32" /></G>
export const IcPump = (p: IconProps) => <G {...p}><circle cx="21" cy="26" r="11" /><circle cx="21" cy="26" r="3.4" /><path d="M21 15 V8 H37 M37 4.5 V11.5" /><path d="M10 26 H4 M4 22 V30" /><path d="M14 35 L11.5 42 H30.5 L28 35" /></G>
export const IcCrane = (p: IconProps) => <G {...p}><path d="M13 42 V7 H41" /><path d="M13 16 L22 7" /><path d="M13 7 L7 12 V17 H13" /><path d="M34 7 V21" /><rect x="29" y="21" width="10" height="9" rx="1.5" /><path d="M6 42 H21" /></G>
export const IcServer = (p: IconProps) => <G {...p}><rect x="8" y="6" width="32" height="10" rx="3" /><rect x="8" y="19" width="32" height="10" rx="3" /><rect x="8" y="32" width="32" height="10" rx="3" /><path d="M14 11 H14.01 M14 24 H14.01 M14 37 H14.01" /><path d="M21 11 H33 M21 24 H33 M21 37 H33" /></G>
export const IcSpark = (p: IconProps) => <G {...p}><path d="M21 5 C22 15 26 19 36 20 C26 21 22 25 21 35 C20 25 16 21 6 20 C16 19 20 15 21 5 Z" /><path d="M36 29 C36.5 33 37.5 34 41.5 34.5 C37.5 35 36.5 36 36 40 C35.5 36 34.5 35 30.5 34.5 C34.5 34 35.5 33 36 29 Z" /></G>

/* ---------------------------------------------------------------- IA na engenharia */
export const IcTrain = (p: IconProps) => <G {...p}><rect x="11" y="5" width="26" height="31" rx="7" /><path d="M11 23 H37" /><path d="M19 11 H29" /><path d="M17.5 29.5 H17.51 M30.5 29.5 H30.51" /><path d="M16 43 L19.5 36 M32 43 L28.5 36" /></G>
export const IcWave = (p: IconProps) => <G {...p}><path d="M4 24 H10 L13.5 14 L18.5 34 L23.5 7 L28.5 41 L33 17 L36 29 L38 24 H44" /></G>
export const IcAntenna = (p: IconProps) => <G {...p}><path d="M12 43 H36" /><path d="M24 43 V30" /><path d="M24 30 L15 24 L21 17 L12 9" /><path d="M24 30 L33 25 L27 18 L37 11" /><path d="M24 30 V22 L29 8" /></G>
export const IcLattice = (p: IconProps) => <G {...p}><rect x="8" y="5" width="32" height="38" rx="4" /><path d="M8 20 L21 5" /><path d="M21 5 L24 25 L40 14" /><path d="M24 25 L8 34" /><path d="M24 25 L31 43" /><path d="M24 25 L40 30" /><path d="M8 34 L17 43" /></G>
export const IcBracket = (p: IconProps) => <G {...p}><path d="M8 40 C8 28 14 23 20 13 C22 9 28 9 30 13 C35 23 40 28 40 40 Z" /><path d="M24 24 C20 28 18.5 31.5 20.5 34 H27.5 C29.5 31.5 28 28 24 24 Z" /><circle cx="25" cy="16" r="2.4" /></G>
export const IcCube = (p: IconProps) => <G {...p}><path d="M24 5 L41 14 V34 L24 43 L7 34 V14 Z" /><path d="M7 14 L24 23 L41 14" /><path d="M24 23 V43" /></G>
export const IcRocket = (p: IconProps) => <G {...p}><path d="M24 4 C31 10 33 21 30 32 H18 C15 21 17 10 24 4 Z" /><circle cx="24" cy="17" r="3.3" /><path d="M18 26 L11 34 L18.5 32.5" /><path d="M30 26 L37 34 L29.5 32.5" /><path d="M21 36 L24 44 L27 36" /></G>
export const IcChat = (p: IconProps) => <G {...p}><path d="M9 8 H39 C41 8 43 10 43 12 V28 C43 30 41 32 39 32 H23 L13 41 V32 H9 C7 32 5 30 5 28 V12 C5 10 7 8 9 8 Z" /><path d="M13 17 H35 M13 24 H27" /></G>
export const IcFlow = (p: IconProps) => <G {...p}><path d="M4 14 C12 8 18 20 26 14 S38 8 44 12" /><path d="M4 24 C12 18 18 30 26 24 S38 18 44 22" /><path d="M4 34 C12 28 18 40 26 34 S38 28 44 32" /></G>
export const IcFactory = (p: IconProps) => <G {...p}><path d="M5 42 V24 L16 17 V24 L27 17 V24 L38 17 V6 H43 V42 Z" /><path d="M12 33 H18 M24 33 H30" /></G>

/* ---------------------------------------------------------------- gargalos */
export const IcRuler = (p: IconProps) => <G {...p}><path d="M6 34 L34 6 L42 14 L14 42 Z" /><path d="M13 27 L17 31 M19 21 L22 24 M25 15 L29 19 M31 9 L34 12" /></G>
export const IcGauge = (p: IconProps) => <G {...p}><path d="M8.5 33 A16.5 16.5 0 1 1 39.5 33" /><path d="M24 30 L33 16.5" /><circle cx="24" cy="30" r="3.2" /><path d="M12 39 H36" /></G>
export const IcShield = (p: IconProps) => <G {...p}><path d="M24 5 L40 11 V23 C40 33 33 40 24 43 C15 40 8 33 8 23 V11 Z" /><path d="M17 24 L22 29 L32 18" /></G>

/* ---------------------------------------------------------------- ciclo do agente */
export const IcTarget = (p: IconProps) => <G {...p}><circle cx="24" cy="24" r="17" /><circle cx="24" cy="24" r="9.5" /><path d="M24 24 H24.01" /></G>
export const IcPlan = (p: IconProps) => <G {...p}><path d="M9 12 L12 15 L17 9" /><path d="M9 24 L12 27 L17 21" /><path d="M10 37 H16" /><path d="M24 12 H40 M24 24 H40 M24 37 H34" /></G>
export const IcTool = (p: IconProps) => <G {...p}><rect x="5" y="8" width="38" height="32" rx="4" /><path d="M13 18 L20 24 L13 30" /><path d="M25 30 H34" /></G>
export const IcCheck = (p: IconProps) => <G {...p}><circle cx="24" cy="24" r="18" /><path d="M15 24.5 L21.5 31 L33.5 17.5" /></G>

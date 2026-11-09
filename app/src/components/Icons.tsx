// Ícones de traço grosso (legíveis no projetor). viewBox 0 0 64 64.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 3.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const S = ({ children }: { children: React.ReactNode }) => <svg viewBox="0 0 64 64" width="100%" height="100%">{children}</svg>

export const IcPlane = () => <S><path {...P} d="M6 34 L58 22 L50 30 L58 42 L30 34 L22 46 L18 46 L22 34 Z" /></S>
export const IcBoard = () => <S><rect {...P} x="8" y="10" width="48" height="32" rx="2" /><path {...P} d="M18 52 L24 42 M46 52 L40 42 M16 22 H34 M16 30 H44" /></S>
export const IcPump = () => <S><circle {...P} cx="28" cy="34" r="14" /><path {...P} d="M28 20 V8 H52 M42 34 H58 M20 48 L14 58 H42 L36 48" /><path {...P} d="M28 34 L34 26" /></S>
export const IcCrane = () => <S><path {...P} d="M12 58 V14 L52 14 M12 22 L22 14 M12 30 L44 14 M44 14 V30" /><rect {...P} x="38" y="30" width="12" height="10" /><path {...P} d="M6 58 H22" /></S>
export const IcServer = () => <S><rect {...P} x="12" y="8" width="40" height="14" rx="2" /><rect {...P} x="12" y="26" width="40" height="14" rx="2" /><rect {...P} x="12" y="44" width="40" height="14" rx="2" /><path {...P} d="M20 15 H22 M20 33 H22 M20 51 H22" /></S>
export const IcSpark = () => <S><path {...P} d="M32 6 L37 27 L58 32 L37 37 L32 58 L27 37 L6 32 L27 27 Z" /></S>
export const IcGrad = () => <S><path {...P} d="M4 24 L32 12 L60 24 L32 36 Z" /><path {...P} d="M16 30 V44 C24 52 40 52 48 44 V30 M56 26 V42" /></S>
export const IcTrain = () => <S><rect {...P} x="14" y="8" width="36" height="40" rx="8" /><path {...P} d="M14 30 H50 M22 56 L26 48 M42 56 L38 48" /><circle {...P} cx="24" cy="40" r="2" /><circle {...P} cx="40" cy="40" r="2" /></S>
export const IcWave = () => <S><path {...P} d="M4 32 L12 32 L16 18 L22 46 L28 12 L34 52 L40 24 L46 38 L50 32 L60 32" /></S>
export const IcAntenna = () => <S><path {...P} d="M32 58 V30 M32 30 L22 20 L28 14 L18 8 M32 30 L42 22 L36 16 L46 10 M32 40 L44 36 M32 44 L20 40" /></S>
export const IcLattice = () => <S><path {...P} d="M8 56 L20 8 L32 56 L44 8 L56 56 M14 32 H50 M8 56 H56" /></S>
export const IcBracket = () => <S><path {...P} d="M10 52 C18 30 26 30 30 16 M30 16 C36 30 46 34 54 52 M10 52 H54 M30 16 C30 30 22 42 22 52 M30 16 C32 32 40 42 42 52" /></S>
export const IcCube = () => <S><path {...P} d="M32 6 L56 18 V46 L32 58 L8 46 V18 Z M8 18 L32 30 L56 18 M32 30 V58" /></S>
export const IcRocket = () => <S><path {...P} d="M32 6 C44 16 46 32 40 46 H24 C18 32 20 16 32 6 Z M24 46 L18 56 L28 52 M40 46 L46 56 L36 52" /><circle {...P} cx="32" cy="24" r="5" /></S>
export const IcChat = () => <S><path {...P} d="M8 12 H56 V42 H28 L16 54 V42 H8 Z M18 24 H46 M18 32 H38" /></S>
export const IcFlow = () => <S><path {...P} d="M4 20 C18 10 28 30 42 20 S56 14 60 18 M4 34 C18 24 28 44 42 34 S56 28 60 32 M4 48 C18 38 28 58 42 48 S56 42 60 46" /></S>
export const IcFactory = () => <S><path {...P} d="M6 56 V30 L20 22 V30 L34 22 V30 L48 22 V8 H56 V56 Z M14 44 H22 M30 44 H38" /></S>
export const IcRuler = () => <S><path {...P} d="M6 46 L46 6 L58 18 L18 58 Z M16 36 L22 42 M24 28 L28 32 M32 20 L38 26 M40 12 L44 16" /></S>
export const IcGauge = () => <S><path {...P} d="M10 44 A24 24 0 1 1 54 44" /><path {...P} d="M32 40 L44 22" /><circle {...P} cx="32" cy="40" r="4" /></S>
export const IcShield = () => <S><path {...P} d="M32 6 L54 14 V30 C54 44 44 54 32 58 C20 54 10 44 10 30 V14 Z M22 32 L30 40 L44 24" /></S>
export const IcPaper = () => <S><path {...P} d="M10 8 H46 L54 16 V56 H10 Z M18 20 H40 M18 30 H46 M18 38 H46 M18 46 H34" /></S>
export const IcBolt = () => <S><path {...P} d="M36 4 L14 36 H30 L26 60 L50 26 H34 Z" /></S>

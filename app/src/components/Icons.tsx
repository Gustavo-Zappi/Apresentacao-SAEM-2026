// Ícones de traço grosso (legíveis no projetor). viewBox 0 0 64 64.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 3.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const S = ({ children }: { children: React.ReactNode }) => <svg viewBox="0 0 64 64" width="100%" height="100%">{children}</svg>

export const IcPlane = () => <S><path {...P} d="M6 34 L58 22 L50 30 L58 42 L30 34 L22 46 L18 46 L22 34 Z" /></S>
export const IcBoard = () => <S><rect {...P} x="8" y="10" width="48" height="32" rx="2" /><path {...P} d="M18 52 L24 42 M46 52 L40 42 M16 22 H34 M16 30 H44" /></S>
export const IcPump = () => <S><circle {...P} cx="28" cy="34" r="14" /><path {...P} d="M28 20 V8 H52 M42 34 H58 M20 48 L14 58 H42 L36 48" /><path {...P} d="M28 34 L34 26" /></S>
export const IcCrane = () => <S><path {...P} d="M12 58 V14 L52 14 M12 22 L22 14 M12 30 L44 14 M44 14 V30" /><rect {...P} x="38" y="30" width="12" height="10" /><path {...P} d="M6 58 H22" /></S>
export const IcServer = () => <S><rect {...P} x="12" y="8" width="40" height="14" rx="2" /><rect {...P} x="12" y="26" width="40" height="14" rx="2" /><rect {...P} x="12" y="44" width="40" height="14" rx="2" /><path {...P} d="M20 15 H22 M20 33 H22 M20 51 H22" /></S>
export const IcSpark = () => <S><path {...P} d="M32 6 L37 27 L58 32 L37 37 L32 58 L27 37 L6 32 L27 27 Z" /></S>

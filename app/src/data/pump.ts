/** Referência didática: regime permanente, água a 20 °C e hipóteses explícitas. */
export const PUMP_INPUT = {
  flowM3h: 30, diameterM: 0.0779, lengthM: 120, staticHeadM: 18,
  roughnessM: 0.000045, localK: 8, density: 998, kinematicViscosity: 1e-6,
  efficiency: 0.70, gravity: 9.81, waveSpeedMs: 1200,
}
export function calculatePump() {
  const p = PUMP_INPUT
  const q = p.flowM3h / 3600
  const velocity = q / (Math.PI * p.diameterM ** 2 / 4)
  const reynolds = velocity * p.diameterM / p.kinematicViscosity
  let darcy = 0.02
  for (let i = 0; i < 40; i++) {
    darcy = 1 / (-2 * Math.log10(p.roughnessM / (3.7 * p.diameterM) + 2.51 / (reynolds * Math.sqrt(darcy)))) ** 2
  }
  const frictionHead = darcy * p.lengthM / p.diameterM * velocity ** 2 / (2 * p.gravity)
  const localHead = p.localK * velocity ** 2 / (2 * p.gravity)
  const totalHead = p.staticHeadM + frictionHead + localHead
  const shaftPowerKw = p.density * p.gravity * q * totalHead / p.efficiency / 1000
  const surgeHead = p.waveSpeedMs * velocity / p.gravity
  return { velocity, reynolds, darcy, frictionHead, localHead, totalHead, shaftPowerKw, surgeHead }
}
export const pt = (value: number, digits = 1) => value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

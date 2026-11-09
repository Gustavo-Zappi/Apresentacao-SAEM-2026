import { useEffect, useState } from 'react'

/**
 * Relógio digital de 7 segmentos com a hora oficial de Brasília (America/Sao_Paulo),
 * independente do fuso configurado no notebook. Os dois-pontos piscam a cada segundo
 * e os segmentos apagados ficam visíveis como "fantasma", como num display de LED.
 */
const FMT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

export function brasiliaTime(d = new Date()) {
  const p = Object.fromEntries(FMT.formatToParts(d).map((x) => [x.type, x.value]))
  return { h: p.hour ?? '00', m: p.minute ?? '00', s: p.second ?? '00' }
}

// Geometria de um dígito (viewBox 20×36). Segmentos hexagonais, com folga entre eles.
const W = 20
const H = 36
const T = 3.4 // espessura
const M = T / 2
const G = 0.7 // folga
function hSeg(cx: number, cy: number, L: number) {
  const a = L / 2
  const b = T / 2
  return `${cx - a},${cy} ${cx - a + b},${cy - b} ${cx + a - b},${cy - b} ${cx + a},${cy} ${cx + a - b},${cy + b} ${cx - a + b},${cy + b}`
}
function vSeg(cx: number, cy: number, L: number) {
  const a = L / 2
  const b = T / 2
  return `${cx},${cy - a} ${cx + b},${cy - a + b} ${cx + b},${cy + a - b} ${cx},${cy + a} ${cx - b},${cy + a - b} ${cx - b},${cy - a + b}`
}
const LH = W - 2 * M - 2 * G
const LV = H / 2 - M - 2 * G
const SEG: Record<string, string> = {
  a: hSeg(W / 2, M, LH),
  b: vSeg(W - M, (M + H / 2) / 2, LV),
  c: vSeg(W - M, (H / 2 + H - M) / 2, LV),
  d: hSeg(W / 2, H - M, LH),
  e: vSeg(M, (H / 2 + H - M) / 2, LV),
  f: vSeg(M, (M + H / 2) / 2, LV),
  g: hSeg(W / 2, H / 2, LH),
}
const DIGIT: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
  '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
}

function Digit({ ch, h }: { ch: string; h: number }) {
  const on = DIGIT[ch] ?? ''
  return (
    <svg viewBox={`-1 -1 ${W + 2} ${H + 2}`} height={h} width={(h * (W + 2)) / (H + 2)} className="seg7" aria-hidden>
      {Object.entries(SEG).map(([k, pts]) => (
        <polygon key={k} points={pts} className={on.includes(k) ? 'on' : 'off'} />
      ))}
    </svg>
  )
}

export default function Clock() {
  const [t, setT] = useState(brasiliaTime)
  useEffect(() => {
    let timer = 0
    const tick = () => {
      setT(brasiliaTime())
      // alinha a atualização à virada do segundo
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 15)
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [])
  const blink = Number(t.s) % 2 === 0
  return (
    <div className="clock" title="Hora de Brasília (tecla T oculta)" role="timer" aria-label={`${t.h}:${t.m} horário de Brasília`}>
      <div className="clock-main">
        <Digit ch={t.h[0]} h={38} />
        <Digit ch={t.h[1]} h={38} />
        <svg viewBox="0 0 8 38" width={9} height={38} className="seg7" aria-hidden>
          <rect x="2" y="10" width="4" height="4" rx="1" className={blink ? 'on' : 'off'} />
          <rect x="2" y="25" width="4" height="4" rx="1" className={blink ? 'on' : 'off'} />
        </svg>
        <Digit ch={t.m[0]} h={38} />
        <Digit ch={t.m[1]} h={38} />
      </div>
      <div className="clock-side">
        <div className="clock-sec">
          <Digit ch={t.s[0]} h={18} />
          <Digit ch={t.s[1]} h={18} />
        </div>
        <div className="clock-tz">BRASÍLIA</div>
      </div>
    </div>
  )
}

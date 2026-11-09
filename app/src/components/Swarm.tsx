import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Enxame de agentes: N pontos (1 ponto = 1 agente) que acendem em ondas a partir do centro,
 * no ritmo do contador, e depois ficam "trabalhando": cada ponto pulsa em momentos diferentes
 * e, de tempos em tempos, um pacote de mensagem cruza a grade de um agente a outro.
 */
export default function Swarm({ size = 660, cols = 100, duration = 2.6, delay = 0.2 }: { size?: number; cols?: number; duration?: number; delay?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = size * dpr
    cv.height = size * dpr
    const ctx = cv.getContext('2d')!
    ctx.scale(dpr, dpr)
    const n = cols * cols
    const gap = size / cols
    const r = gap * 0.25
    // ordem de acendimento: distância ao centro com ruído (frente de onda irregular)
    const order = new Float32Array(n)
    const phase = new Float32Array(n)
    let max = 0
    for (let i = 0; i < n; i++) {
      const x = (i % cols) - cols / 2 + 0.5
      const y = Math.floor(i / cols) - cols / 2 + 0.5
      const d = Math.hypot(x, y) / (cols * 0.71) + Math.random() * 0.18
      order[i] = d
      if (d > max) max = d
      phase[i] = Math.random() * Math.PI * 2
    }
    for (let i = 0; i < n; i++) order[i] /= max

    const st = { p: 0 }
    const tw = gsap.to(st, { p: 1, duration, delay, ease: 'power1.inOut' })
    type Msg = { a: number; b: number; t: number }
    const msgs: Msg[] = []
    let raf = 0
    let last = performance.now()
    const t0 = last
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = (now - t0) / 1000
      ctx.clearRect(0, 0, size, size)
      // pontos apagados
      ctx.fillStyle = 'rgba(203,179,255,0.08)'
      for (let i = 0; i < n; i++) {
        if (order[i] <= st.p) continue
        ctx.fillRect((i % cols) * gap + gap / 2 - r, Math.floor(i / cols) * gap + gap / 2 - r, 2 * r, 2 * r)
      }
      // pontos acesos, em 3 níveis de brilho (poucas trocas de cor)
      const levels = ['rgba(145,86,241,0.6)', 'rgba(203,179,255,0.9)', '#ffffff']
      for (let lv = 0; lv < 3; lv++) {
        ctx.fillStyle = levels[lv]
        for (let i = 0; i < n; i++) {
          if (order[i] > st.p) continue
          const fresh = st.p - order[i] < 0.04 // frente de onda: branco
          const s = Math.sin(t * 2.2 + phase[i])
          const L = fresh ? 2 : s > 0.985 ? 2 : s > 0.72 ? 1 : 0
          if (L !== lv) continue
          const rr = L === 2 ? r * 1.35 : r
          ctx.fillRect((i % cols) * gap + gap / 2 - rr, Math.floor(i / cols) * gap + gap / 2 - rr, 2 * rr, 2 * rr)
        }
      }
      // mensagens entre agentes (depois que o enxame acendeu)
      if (st.p > 0.6) {
        if (msgs.length < 22 && Math.random() < dt * 14) msgs.push({ a: (Math.random() * n) | 0, b: (Math.random() * n) | 0, t: 0 })
        ctx.lineWidth = 2
        for (let k = msgs.length - 1; k >= 0; k--) {
          const m = msgs[k]
          m.t += dt * 0.9
          if (m.t >= 1) { msgs.splice(k, 1); continue }
          const ax = (m.a % cols) * gap + gap / 2, ay = Math.floor(m.a / cols) * gap + gap / 2
          const bx = (m.b % cols) * gap + gap / 2, by = Math.floor(m.b / cols) * gap + gap / 2
          const e = m.t < 0.5 ? 2 * m.t * m.t : 1 - (-2 * m.t + 2) ** 2 / 2
          const x = ax + (bx - ax) * e, y = ay + (by - ay) * e
          const fade = Math.sin(Math.PI * m.t)
          ctx.strokeStyle = `rgba(255,181,71,${0.6 * fade})`
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x, y); ctx.stroke()
          ctx.fillStyle = `rgba(255,200,110,${fade})`
          ctx.beginPath(); ctx.arc(x, y, 4.6, 0, Math.PI * 2); ctx.fill()
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      tw.kill()
    }
  }, [size, cols, duration, delay])

  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} aria-label={`${cols * cols} agentes`} />
}

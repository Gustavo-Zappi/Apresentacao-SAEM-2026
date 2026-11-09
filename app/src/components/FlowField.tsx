import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Fundo vivo: partículas advectadas por um campo de velocidade.
 * É a "assinatura" visual da palestra (escoamento → Navier-Stokes) e muda de regime por slide:
 * laminar (calmo), turbulent (caos controlado) e still (quase parado, para leitura).
 */
export type FlowMode = 'laminar' | 'turbulent' | 'still' | 'surge' | 'none'

const PRESETS: Record<FlowMode, { speed: number; freq: number; swirl: number; alpha: number; drift: number }> = {
  still: { speed: 0.35, freq: 0.0016, swirl: 0.6, alpha: 0.025, drift: 1 },
  laminar: { speed: 1.1, freq: 0.0018, swirl: 0.9, alpha: 0.12, drift: 1 },
  turbulent: { speed: 2.4, freq: 0.0058, swirl: 3.2, alpha: 0.5, drift: 0.25 },
  none: { speed: 0.35, freq: 0.0016, swirl: 0.6, alpha: 0, drift: 1 },
  surge: { speed: 4.2, freq: 0.0024, swirl: 1.2, alpha: 0.6, drift: 1.6 },
}

const params = { ...PRESETS.still }

export function setFlow(mode: FlowMode, duration = 1.8) {
  gsap.to(params, { ...PRESETS[mode], duration, ease: 'power2.inOut', overwrite: true })
}

const COLORS = ['#9156F1', '#58178B', '#b48cff', '#ffffff']

export default function FlowField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let t = 0
    type P = { x: number; y: number; px: number; py: number; c: number; life: number }
    let ps: P[] = []

    const spawn = (p: P, anywhere: boolean) => {
      p.x = anywhere ? Math.random() * w : -10 - Math.random() * 40
      p.y = Math.random() * h
      p.px = p.x
      p.py = p.y
      p.c = Math.random() < 0.08 ? 3 : Math.floor(Math.random() * 3)
      p.life = 200 + Math.random() * 400
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.min(1800, Math.floor((w * h) / 1300))
      ps = Array.from({ length: n }, () => {
        const p = { x: 0, y: 0, px: 0, py: 0, c: 0, life: 0 }
        spawn(p, true)
        return p
      })
    }
    resize()
    window.addEventListener('resize', resize)

    // campo de velocidade: soma de modos senoidais (barato e suave), com componente de deriva →x
    const field = (x: number, y: number) => {
      const f = params.freq
      const a =
        Math.sin(x * f + t * 0.6) * Math.cos(y * f * 1.3 - t * 0.4) +
        Math.sin((x + y) * f * 0.7 + t * 0.3) * 0.6 +
        Math.cos(y * f * 2.1 + Math.sin(x * f * 0.5 + t)) * 0.35
      const ang = a * params.swirl
      return [Math.cos(ang) * params.speed + params.drift, Math.sin(ang) * params.speed]
    }

    const frame = () => {
      t += 0.004 * (0.5 + params.speed * 0.5)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.075)'
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'
      // modo 'none' (slides 3D): só apaga o rastro, sem desenhar, para poupar a GPU
      if (params.alpha < 0.01) {
        raf = requestAnimationFrame(frame)
        return
      }
      ctx.lineWidth = 1.2
      for (let ci = 0; ci < COLORS.length; ci++) {
        ctx.strokeStyle = COLORS[ci]
        ctx.globalAlpha = params.alpha * (ci === 3 ? 0.6 : 1)
        ctx.beginPath()
        for (const p of ps) {
          if (p.c !== ci) continue
          const [vx, vy] = field(p.x, p.y)
          p.px = p.x
          p.py = p.y
          p.x += vx
          p.y += vy
          p.life--
          if (p.x > w + 10 || p.y < -10 || p.y > h + 10 || p.x < -60 || p.life < 0) {
            spawn(p, p.life < 0)
            continue
          }
          ctx.moveTo(p.px, p.py)
          ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }
    if (!reduce) raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="flow-canvas" aria-hidden />
}

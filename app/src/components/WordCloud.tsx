import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { normalizeWord } from '../data/questions'

type Placed = { word: string; n: number; size: number; x: number; y: number }

const W = 1040
const H = 600

function layout(counts: Record<string, number>): Placed[] {
  const entries = Object.entries(counts)
    .map(([w, n]) => [normalizeWord(w), n] as const)
    .filter((e): e is readonly [string, number] => Boolean(e[0]))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
  if (!entries.length) return []
  const max = entries[0][1]
  const rects: { x: number; y: number; w: number; h: number }[] = []
  const out: Placed[] = []
  for (const [word, n] of entries) {
    const size = Math.round(28 + 84 * Math.sqrt(n / max))
    const w = word.length * size * 0.68 + 28
    const h = size * 1.1
    for (let i = 0; i < 2600; i++) {
      const a = i * 0.21
      const r = 4 * a
      const x = Math.cos(a) * r * 1.9
      const y = Math.sin(a) * r * 0.85
      const box = { x: x - w / 2, y: y - h / 2, w, h }
      if (Math.abs(x) + w / 2 > W / 2 || Math.abs(y) + h / 2 > H / 2) continue
      const hit = rects.some((o) => box.x < o.x + o.w && box.x + box.w > o.x && box.y < o.y + o.h && box.y + box.h > o.y)
      if (!hit) {
        rects.push(box)
        out.push({ word, n, size, x, y })
        break
      }
    }
  }
  return out
}

const PALETTE = ['#9156F1', '#ffffff', '#cbb3ff', '#ffffff', '#b48cff']

export default function WordCloud({ counts }: { counts: Record<string, number> }) {
  const placed = useMemo(() => layout(counts), [counts])
  const ref = useRef<HTMLDivElement>(null)
  const seen = useRef(new Set<string>())

  useLayoutEffect(() => {
    const root = ref.current!
    placed.forEach((p) => {
      const el = root.querySelector<HTMLElement>(`[data-w="${CSS.escape(p.word)}"]`)
      if (!el) return
      const target = { x: p.x, y: p.y, xPercent: -50, yPercent: -50, fontSize: p.size }
      if (!seen.current.has(p.word)) {
        seen.current.add(p.word)
        gsap.fromTo(el, { ...target, scale: 0, rotation: gsap.utils.random(-25, 25), autoAlpha: 0 },
          { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.1, ease: 'elastic.out(1, 0.55)' })
      } else {
        gsap.to(el, { ...target, duration: 0.9, ease: 'power3.inOut' })
      }
    })
  }, [placed])

  return (
    <div ref={ref} className="cloud">
      {placed.map((p, i) => (
        <span key={p.word} data-w={p.word} className="w" style={{ color: i === 0 ? '#9156F1' : PALETTE[i % PALETTE.length] }}>
          {p.word}
        </span>
      ))}
    </div>
  )
}

import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

/**
 * Contêiner de slide com coreografia padrão:
 *  - [data-in]        entra ao abrir o slide (stagger)
 *  - [data-step="n"]  aparece a partir do clique n (e some ao voltar)
 *  - [data-split]     título com letras subindo de uma máscara (SplitText)
 */
export default function Slide({
  step,
  className = '',
  children,
}: {
  step: number
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  // Entrada (uma vez por montagem)
  useGSAP(
    () => {
      const root = ref.current!
      const splits = gsap.utils.toArray<HTMLElement>('[data-split]', root)
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      splits.forEach((el, i) => {
        const s = SplitText.create(el, { type: 'words,chars', mask: 'words' })
        tl.from(s.chars, { yPercent: 115, duration: 1.1, stagger: 0.022 }, i * 0.15)
      })
      const ins = gsap.utils.toArray<HTMLElement>('[data-in]', root)
      if (ins.length) tl.from(ins, { y: 36, autoAlpha: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out' }, splits.length ? 0.35 : 0)
    },
    { scope: ref },
  )

  // Passos
  useGSAP(
    () => {
      const root = ref.current!
      const els = gsap.utils.toArray<HTMLElement>('[data-step]', root)
      let k = 0
      els.forEach((el) => {
        const n = Number(el.dataset.step)
        const visible = n <= step
        const was = el.dataset.vis === '1'
        if (visible && !was) {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 34, filter: 'blur(8px)' },
            { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out', delay: (mounted.current ? 0 : 0.5) + k++ * 0.08 },
          )
        } else if (!visible && (was || !mounted.current)) {
          if (mounted.current) gsap.to(el, { autoAlpha: 0, y: 20, duration: 0.3 })
          else gsap.set(el, { autoAlpha: 0 })
        }
        el.dataset.vis = visible ? '1' : '0'
      })
      mounted.current = true
      return () => {
        mounted.current = false
        els.forEach((el) => delete el.dataset.vis)
      }
    },
    { scope: ref, dependencies: [step], revertOnUpdate: false },
  )

  return (
    <div ref={ref} className={`slide ${className}`}>
      {children}
    </div>
  )
}

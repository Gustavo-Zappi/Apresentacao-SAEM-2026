import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { DUR, EASE, STAGGER } from '../lib/motion'

/**
 * Contêiner de slide com a coreografia padrão do palco.
 *
 * Entrada (uma vez, na ordem em que os elementos aparecem no código, que é a ordem de leitura):
 *  - [data-split]        título: as palavras sobem de trás de uma máscara
 *  - [data-in]           sobe e aparece. Variações: data-in="fade" | "scale" | "left" | "right" | "draw"
 *  - data-delay="0.3"    atraso extra, em segundos
 *
 * Passos (um por clique):
 *  - [data-step="n"]     aparece a partir do clique n e some ao voltar
 *  - [data-sub]          filhos de um passo que entram em cascata (linhas de uma lista)
 *  - data-state          "now" | "past" | "future" em cada passo, para o CSS acentuar o item da vez
 *
 * `focus` (0 a 1) é a opacidade dos passos já apresentados: abaixo de 1, o item da vez fica em
 * evidência e os anteriores recuam, guiando o olhar da plateia sem tirar nada da tela.
 */
const FROM: Record<string, gsap.TweenVars> = {
  up: { y: 30 },
  fade: {},
  scale: { scale: 0.94, transformOrigin: '50% 50%' },
  left: { x: -40 },
  right: { x: 40 },
  /** Filete que se desenha da esquerda para a direita. */
  draw: { scaleX: 0, transformOrigin: '0% 50%' },
}

export default function Slide({
  step,
  className = '',
  focus = 1,
  delay = 0,
  children,
}: {
  step: number
  className?: string
  focus?: number
  /** Atraso da entrada (s). Usado nos slides que chegam por trás da cortina de seção. */
  delay?: number
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)
  /** Quando a entrada do cabeçalho libera os passos (s). */
  const lead = useRef(0.4)

  // Entrada (uma vez por montagem)
  useGSAP(
    () => {
      const root = ref.current!
      const tl = gsap.timeline({ delay })
      let t = 0
      gsap.utils.toArray<HTMLElement>('[data-split], [data-in]', root).forEach((el) => {
        if (el.hasAttribute('data-split')) {
          const s = SplitText.create(el, { type: 'words', mask: 'words' })
          tl.from(s.words, { yPercent: 112, duration: DUR.hero, ease: EASE.outStrong, stagger: STAGGER.words }, t)
          t += 0.22
          return
        }
        const from = FROM[el.dataset.in || 'up'] ?? FROM.up
        tl.from(el, { autoAlpha: 0, ...from, duration: DUR.slow, ease: EASE.out }, t + Number(el.dataset.delay || 0))
        t += STAGGER.items
      })
      lead.current = delay + Math.min(Math.max(t, 0.3), 0.75)
    },
    { scope: ref },
  )

  // Passos
  useGSAP(
    () => {
      const root = ref.current!
      const els = gsap.utils.toArray<HTMLElement>('[data-step]', root)
      const first = !mounted.current
      let k = 0
      els.forEach((el) => {
        const n = Number(el.dataset.step)
        const visible = n <= step
        const was = el.dataset.vis === '1'
        const alpha = n < step ? focus : 1
        el.dataset.state = n > step ? 'future' : n === step ? 'now' : 'past'
        if (visible && !was) {
          const wait = (first ? lead.current : 0) + k++ * STAGGER.items
          const subs = el.querySelectorAll<HTMLElement>('[data-sub]')
          gsap.killTweensOf(el)
          if (subs.length) {
            gsap.fromTo(el, { autoAlpha: 0, y: 0 }, { autoAlpha: alpha, duration: DUR.fast, ease: EASE.soft, delay: wait })
            gsap.fromTo(
              subs,
              { autoAlpha: 0, y: 22 },
              { autoAlpha: 1, y: 0, duration: DUR.base, ease: EASE.out, stagger: STAGGER.items, delay: wait + 0.08, overwrite: true },
            )
          } else {
            gsap.fromTo(el, { autoAlpha: 0, y: 28 }, { autoAlpha: alpha, y: 0, duration: DUR.base, ease: EASE.out, delay: wait })
          }
        } else if (visible && was) {
          gsap.to(el, { autoAlpha: alpha, y: 0, duration: 0.5, ease: EASE.soft, overwrite: 'auto' })
        } else if (!visible && (was || first)) {
          if (first) gsap.set(el, { autoAlpha: 0 })
          else gsap.to(el, { autoAlpha: 0, y: 14, duration: DUR.exit, ease: EASE.in, overwrite: true })
        }
        el.dataset.vis = visible ? '1' : '0'
      })
      mounted.current = true
      return () => {
        mounted.current = false
        els.forEach((el) => {
          delete el.dataset.vis
          delete el.dataset.state
        })
      }
    },
    { scope: ref, dependencies: [step, focus], revertOnUpdate: false },
  )

  return (
    <div ref={ref} className={`slide ${className}`}>
      {children}
    </div>
  )
}

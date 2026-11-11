import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/** Tempo parado (ms) até o anel sumir sozinho: não fica marcando a projeção. */
const IDLE_MS = 2500

/**
 * Anel vermelho ao redor do mouse no palco: ajuda a achar o cursor na tela grande.
 * - Aparece ao mover o mouse e some sozinho quando o mouse para.
 * - `pointer-events: none`: nunca bloqueia o clique que avança o slide.
 * - Fica abaixo da tela preta (tecla B), para o telão continuar preto de verdade.
 */
export default function Pointer({ on }: { on: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!on) {
      // mata a animação em curso: sem isso, um fade-in iniciado agora deixaria
      // o anel aceso por cima da tela preta (tecla B)
      gsap.killTweensOf(el)
      gsap.set(el, { autoAlpha: 0, scale: 0.55 })
      return
    }
    const toX = gsap.quickTo(el, 'x', { duration: 0.12, ease: 'power3.out' })
    const toY = gsap.quickTo(el, 'y', { duration: 0.12, ease: 'power3.out' })
    let visible = false
    let hide: number | undefined
    const move = (e: MouseEvent) => {
      toX(e.clientX)
      toY(e.clientY)
      if (!visible) {
        visible = true
        gsap.to(el, { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'power2.out' })
      }
      window.clearTimeout(hide)
      hide = window.setTimeout(() => {
        visible = false
        gsap.to(el, { autoAlpha: 0, scale: 0.55, duration: 0.45, ease: 'power2.in' })
      }, IDLE_MS)
    }
    window.addEventListener('mousemove', move)
    return () => {
      window.removeEventListener('mousemove', move)
      window.clearTimeout(hide)
      gsap.killTweensOf(el)
    }
  }, [on])

  return <div ref={ref} className="laser" aria-hidden />
}

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { EASE } from '../lib/motion'

const fmt = (v: number, decimals: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

/**
 * Número que "corre" até o valor quando `run` fica verdadeiro.
 * O valor final fica reservado no layout (invisível), então a largura não muda durante a contagem
 * e nada ao redor treme. Prefixo e sufixo saem em <i> para o CSS dar a eles um peso menor.
 */
export default function CountUp({
  to,
  decimals = 0,
  run = true,
  duration = 1.6,
  delay = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  to: number
  decimals?: number
  run?: boolean
  duration?: number
  delay?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const obj = useRef({ v: 0 })

  useEffect(() => {
    const el = ref.current!
    const tw = gsap.to(obj.current, {
      v: run ? to : 0,
      duration: run ? duration : 0.3,
      delay: run ? delay : 0,
      ease: run ? EASE.out : 'none',
      onUpdate: () => {
        el.textContent = fmt(obj.current.v, decimals)
      },
    })
    return () => {
      tw.kill()
    }
  }, [to, run, decimals, duration, delay])

  return (
    <span className={`countup ${className ?? ''}`}>
      {prefix && <i className="cu-pre">{prefix}</i>}
      <span className="cu-num">
        <span className="cu-ghost" aria-hidden>{fmt(to, decimals)}</span>
        <span className="cu-val" ref={ref}>{fmt(0, decimals)}</span>
      </span>
      {suffix && <i className="cu-suf">{suffix}</i>}
    </span>
  )
}

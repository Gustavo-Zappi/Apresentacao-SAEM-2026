import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const fmt = (v: number, decimals: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

/** Número que "corre" até o valor quando `run` fica verdadeiro. */
export default function CountUp({
  to,
  decimals = 0,
  run = true,
  duration = 1.8,
  prefix = '',
  suffix = '',
  className,
}: {
  to: number
  decimals?: number
  run?: boolean
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const obj = useRef({ v: 0 })

  useEffect(() => {
    const el = ref.current!
    const target = run ? to : 0
    const tw = gsap.to(obj.current, {
      v: target,
      duration: run ? duration : 0.3,
      ease: run ? 'expo.out' : 'none',
      onUpdate: () => {
        el.textContent = prefix + fmt(obj.current.v, decimals) + suffix
      },
    })
    return () => {
      tw.kill()
    }
  }, [to, run, decimals, duration, prefix, suffix])

  return <span ref={ref} className={className}>{prefix + fmt(0, decimals) + suffix}</span>
}

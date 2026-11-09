import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import ImageSlot from '../../components/ImageSlot'
import { IcFactory } from '../../components/Icons'
import type { ImgId } from '../../data/images'
import { Factory } from '../../three/factory'
import type { SlideProps } from '../types'

// Fontes: Paul A. David, "The Dynamo and the Computer", AER Papers & Proceedings (1990);
// Ford Highland Park (1913). Edison, Pearl Street Station (1882).
export const CAPTIONS: { yr: string; h: string; p: string; stat: string; img: ImgId }[] = [
  { img: 'hist-1880', yr: '1880', h: 'A fábrica a vapor', p: 'Uma máquina a vapor, um eixo no teto e correias para todas as máquinas. O layout obedecia ao eixo, não ao processo.', stat: '' },
  { img: 'hist-1882', yr: '1882 →', h: 'Chega a eletricidade', p: 'As fábricas trocam a máquina a vapor por um grande motor elétrico. Eixo, correias e layout continuam iguais.', stat: '1899: motor elétrico ≈ 5% da força motriz das fábricas (EUA)' },
  { img: 'hist-1900', yr: '1900–1920', h: 'Um motor por máquina', p: 'Sem eixo e sem correias, a fábrica pode ser redesenhada na ordem do processo.', stat: '≈ 1920: metade da força motriz já é elétrica' },
  { img: 'hist-1913', yr: '1913', h: 'A linha de montagem', p: 'Ford, Highland Park: a peça vai até o operário. O ganho vem do processo novo, não do motor.', stat: 'Montagem do chassi: de mais de 12 h para cerca de 1h30' },
  { img: 'hist-1920', yr: 'Anos 1920', h: 'Enfim, o salto', p: 'A produtividade industrial dispara cerca de 40 anos depois da primeira usina de Edison (1882).', stat: 'Paul David, "The Dynamo and the Computer" (1990)' },
  { img: 'hist-hoje', yr: 'Hoje', h: 'E a IA?', p: 'Colocar IA no processo antigo é trocar o vapor pelo motor elétrico. O ganho vem de redesenhar a fábrica.', stat: '' },
]

export function FabricaHistoria({ step }: SlideProps) {
  const host = useRef<HTMLDivElement>(null)
  const fac = useRef<Factory | null>(null)
  const capRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const f = new Factory(host.current!, 1920, 1080, 380)
    fac.current = f
    if (import.meta.env.DEV) (window as unknown as { __factory?: Factory }).__factory = f
    return () => {
      f.dispose()
      fac.current = null
    }
  }, [])

  useEffect(() => {
    fac.current?.setStep(step)
  }, [step])

  useGSAP(
    () => {
      gsap.fromTo(capRef.current!.children, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.7, ease: 'power3.out', delay: 0.2 })
    },
    { dependencies: [step], scope: capRef },
  )

  const c = CAPTIONS[Math.min(step, CAPTIONS.length - 1)]
  return (
    <Slide step={step} className="no-pad">
      <div ref={host} className="scene3d" />
      <div className="cap" ref={capRef} key={step}>
        <ImageSlot id={c.img} icon={<IcFactory />} height={250} style={{ marginBottom: 26 }} />
        <div className="yr">{c.yr}</div>
        <h2>{c.h}</h2>
        <p>{c.p}</p>
        {c.stat && <div className="stat">{c.stat}</div>}
      </div>
      <div style={{ position: 'absolute', right: 96, bottom: 70, display: 'flex', gap: 12 }}>
        {CAPTIONS.map((_, i) => (
          <i key={i} style={{ width: 46, height: 8, borderRadius: 4, background: i <= step ? '#9156F1' : 'rgba(255,255,255,.25)', display: 'block' }} />
        ))}
      </div>
    </Slide>
  )
}

/** A lição: estamos no ano 4 de uma transformação que, na eletricidade, levou ~40. */
export function Ano4({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.fromTo('.bar-el', { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: 'power2.inOut', delay: 0.5, transformOrigin: 'left' })
      if (step >= 1) gsap.fromTo('.bar-ia', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.out', transformOrigin: 'left' })
    },
    { scope: ref, dependencies: [step] },
  )
  const row = (label: string, sub: string, cls: string, years: number, color: string, s?: number) => (
    <div data-step={s} style={{ marginTop: 56 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 44, fontWeight: 800 }}>{label}</span>
        <span className="mono" style={{ fontSize: 30, fontWeight: 700 }}>{sub}</span>
      </div>
      <div style={{ height: 64, marginTop: 16, background: 'rgba(255,255,255,.1)', borderRadius: 10, overflow: 'hidden' }}>
        <div className={cls} style={{ width: `${(years / 40) * 100}%`, height: '100%', background: color, borderRadius: 10 }} />
      </div>
    </div>
  )
  return (
    <Slide step={step}>
      <div ref={ref}>
        <div className="kicker" data-in>Já vimos esse filme</div>
        <h1 className="h1" data-split>Estamos no começo</h1>
        {row('Eletricidade', '1882 → anos 1920 · ≈ 40 anos', 'bar-el', 40, 'linear-gradient(90deg,#58178B,#9156F1)')}
        {row('IA generativa', '11/2022 → hoje · ≈ 4 anos', 'bar-ia', 4, '#FFB547', 1)}
        <p className="lead" data-step="2" style={{ marginTop: 64, color: '#fff', fontWeight: 600, fontSize: 48 }}>
          A pergunta não é se a fábrica vai ser redesenhada. <span className="accent-t">É quem vai redesenhar.</span>
        </p>
      </div>
    </Slide>
  )
}

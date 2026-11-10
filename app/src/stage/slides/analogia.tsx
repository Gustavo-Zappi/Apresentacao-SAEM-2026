import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import ImageSlot from '../../components/ImageSlot'
import { IcFactory } from '../../components/Icons'
import { EASE } from '../../lib/motion'
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

/**
 * A fábrica em seis tempos. A cena 3D muda a cada clique e a legenda acompanha:
 * o texto atual sai, o painel ajusta a altura sem pulo e o texto novo entra em cascata
 * (ano, título, explicação, dado), a tempo de o palestrante começar a frase.
 * O andamento dos seis tempos fica no topo do painel, longe do relógio.
 */
export function FabricaHistoria({ step }: SlideProps) {
  const host = useRef<HTMLDivElement>(null)
  const fac = useRef<Factory | null>(null)
  const capRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const last = Math.min(step, CAPTIONS.length - 1)
  const [shown, setShown] = useState(last)
  const lastH = useRef(0)

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

  // saída do texto atual
  useGSAP(
    () => {
      const kids = bodyRef.current!.children
      if (shown === last) {
        gsap.to(kids, { autoAlpha: 1, y: 0, duration: 0.3, ease: EASE.out, overwrite: true })
        return
      }
      gsap.to(kids, {
        autoAlpha: 0,
        y: -10,
        duration: 0.2,
        ease: EASE.in,
        stagger: 0.025,
        overwrite: true,
        onComplete: () => {
          lastH.current = capRef.current!.offsetHeight
          setShown(last)
        },
      })
    },
    { dependencies: [last] },
  )

  // entrada do texto novo e ajuste de altura do painel
  useGSAP(
    () => {
      const cap = capRef.current!
      const h = cap.offsetHeight
      const swap = lastH.current > 0
      if (swap && lastH.current !== h) gsap.fromTo(cap, { height: lastH.current }, { height: h, duration: 0.55, ease: EASE.inOut, clearProps: 'height', overwrite: true })
      gsap.fromTo(bodyRef.current!.children, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.65, ease: EASE.out, stagger: 0.09, delay: swap ? 0.08 : 0.45, overwrite: true })
      return () => {
        lastH.current = 0
      }
    },
    { dependencies: [shown] },
  )

  const c = CAPTIONS[shown]
  return (
    <Slide step={step} className="no-pad">
      <div ref={host} className="scene3d" />
      <div className="cap" ref={capRef} data-in="left">
        <div className="cap-steps" aria-hidden>
          {CAPTIONS.map((_, i) => (
            <i key={i} className={i < last ? 'done' : i === last ? 'now' : ''} />
          ))}
        </div>
        <div ref={bodyRef}>
          <ImageSlot key={c.img} id={c.img} icon={<IcFactory />} height={250} style={{ marginBottom: 26 }} />
          <div className="yr">{c.yr}</div>
          <h2>{c.h}</h2>
          <p>{c.p}</p>
          {c.stat && <div className="stat">{c.stat}</div>}
        </div>
      </div>
    </Slide>
  )
}

/**
 * A lição: estamos no ano 4 de uma transformação que, na eletricidade, levou ~40.
 * As duas barras usam a mesma régua de 40 anos (um traço por década), então a diferença se lê sem conta.
 * A barra da eletricidade enche uma vez, na entrada; a da IA entra no clique e a ponta dela pulsa
 * duas vezes ("estamos aqui"). No último clique, as barras recuam e a pergunta assume.
 */
export function Ano4({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.fromTo('.bar-el', { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: EASE.inOut, delay: 0.6 })
    },
    { scope: ref },
  )
  useGSAP(
    () => {
      gsap.to('.bar-ia', { scaleX: step >= 1 ? 1 : 0, duration: step >= 1 ? 0.9 : 0.3, ease: EASE.out, delay: step >= 1 ? 0.3 : 0, overwrite: true })
      gsap.to('.cmp', { opacity: step >= 2 ? 0.7 : 1, duration: 0.6, ease: EASE.soft })
    },
    { scope: ref, dependencies: [step] },
  )
  const row = (label: string, sub: string, cls: string, years: number, s?: number) => (
    <div className="cmp-row" data-step={s} data-in={s === undefined ? 'up' : undefined}>
      <div className="cmp-head">
        <span className="cmp-label">{label}</span>
        <span className="cmp-sub mono">{sub}</span>
      </div>
      <div className="cmp-track">
        <div className={`cmp-fill ${cls}`} style={{ width: `${(years / 40) * 100}%` }} />
        <div className="cmp-ticks" aria-hidden><i /><i /><i /></div>
      </div>
    </div>
  )
  return (
    <Slide step={step}>
      <div ref={ref}>
        <div className="kicker" data-in>Já vimos esse filme</div>
        <h1 className="h1" data-split>Estamos no começo</h1>
        <div className="cmp">
          {row('Eletricidade', '1882 → anos 1920 · ≈ 40 anos', 'bar-el', 40)}
          {row('IA generativa', '11/2022 → hoje · ≈ 4 anos', 'bar-ia', 4, 1)}
        </div>
        <p className="lead strong" data-step="2" style={{ marginTop: 64, fontSize: 48 }}>
          A pergunta não é se a fábrica vai ser redesenhada. <span className="accent-t">É quem vai redesenhar.</span>
        </p>
      </div>
    </Slide>
  )
}

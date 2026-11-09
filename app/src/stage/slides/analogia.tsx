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
      <div style={{ position: 'absolute', right: 96, top: 70, display: 'flex', gap: 12 }}>
        {CAPTIONS.map((_, i) => (
          <i key={i} style={{ width: 46, height: 8, borderRadius: 4, background: i <= step ? '#9156F1' : 'rgba(255,255,255,.25)', display: 'block' }} />
        ))}
      </div>
    </Slide>
  )
}

/** A lição: duas réguas na mesma escala (40 anos). A eletricidade completa; a IA está no ano 4. */
const EL_MARKS = [
  { y: 1882, t: 'Usina de Edison', s: 'Pearl Street' },
  { y: 1899, t: '≈ 5% da força motriz', s: 'motores elétricos (EUA)' },
  { y: 1913, t: 'Linha de montagem', s: 'Ford, Highland Park' },
  { y: 1920, t: '≈ 50% da força motriz', s: 'fábricas redesenhadas' },
]
const SPAN = 40

export function Ano4({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.4 })
      tl.fromTo('.rule-el .rule-fill', { scaleX: 0 }, { scaleX: 1, duration: 2.4, ease: 'power1.inOut' })
      gsap.utils.toArray<HTMLElement>('.rule-el .rule-mark').forEach((m) => {
        const at = Number(m.dataset.at)
        tl.fromTo(m, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(2)' }, 0.1 + at * 2.4)
      })
      tl.fromTo('.rule-el .rule-end', { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 2.5)
      if (step >= 1) {
        gsap.fromTo('.rule-ia .rule-fill', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.out', delay: 0.3 })
        gsap.fromTo('.rule-ia .rule-here', { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 1.1, ease: 'back.out(2)' })
        gsap.fromTo('.rule-ia .rule-ghost', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, delay: 1.4 })
      }
    },
    { scope: ref, dependencies: [step] },
  )
  const pct = (y: number, y0: number) => ((y - y0) / SPAN) * 100
  return (
    <Slide step={step}>
      <div ref={ref}>
        <div className="kicker" data-in>Já vimos esse filme</div>
        <h1 className="h1" data-split>Estamos no começo</h1>

        <div className="rule rule-el" data-in>
          <div className="rule-head">
            <span className="rule-name">Eletricidade</span>
            <span className="rule-span mono">1882 → anos 1920 · ≈ 40 anos</span>
          </div>
          <div className="rule-track">
            <div className="rule-fill" />
            {Array.from({ length: SPAN + 1 }, (_, i) => (
              <i key={i} className={`rule-tick ${i % 10 === 0 ? 'big' : ''}`} style={{ left: `${(i / SPAN) * 100}%` }} />
            ))}
            {EL_MARKS.map((m, i) => (
              <div key={m.y} className={`rule-mark ${i % 2 ? 'low' : ''} ${pct(m.y, 1882) > 70 ? 'right' : ''}`} data-at={pct(m.y, 1882) / 100} style={{ left: `${pct(m.y, 1882)}%` }}>
                <b className="mono">{m.y}</b>
                <span>{m.t}</span>
                <small>{m.s}</small>
              </div>
            ))}
            <div className="rule-end">salto de produtividade</div>
          </div>
        </div>

        <div className="rule rule-ia" data-step="1">
          <div className="rule-head">
            <span className="rule-name">IA generativa</span>
            <span className="rule-span mono">11/2022 → hoje · ≈ 4 anos</span>
          </div>
          <div className="rule-track">
            <div className="rule-fill" style={{ width: `${(4 / SPAN) * 100}%` }} />
            {Array.from({ length: SPAN + 1 }, (_, i) => (
              <i key={i} className={`rule-tick ${i % 10 === 0 ? 'big' : ''}`} style={{ left: `${(i / SPAN) * 100}%` }} />
            ))}
            <div className="rule-mark ia" style={{ left: '0%' }}>
              <b className="mono">11/2022</b>
              <span>ChatGPT</span>
            </div>
            <div className="rule-here" style={{ left: `${(4 / SPAN) * 100}%` }}>
              <i />
              <b className="mono">VOCÊ ESTÁ AQUI</b>
              <small className="mono">≈ 1886 na régua da eletricidade</small>
            </div>
            <div className="rule-ghost">o redesenho da fábrica ainda está por vir</div>
          </div>
        </div>

        <p className="lead" data-step="2" style={{ marginTop: 40, color: '#fff', fontWeight: 600, fontSize: 46 }}>
          A pergunta não é se a fábrica vai ser redesenhada. <span className="accent-t">É quem vai redesenhar.</span>
        </p>
      </div>
    </Slide>
  )
}

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import Photo from '../../components/Photo'
import { IcBoard, IcCrane, IcGrad, IcPlane, IcPump, IcServer, IcSpark } from '../../components/Icons'
import { fotoUrl } from '../../data/fotos'
import { GRADUACAO } from '../speaker'
import type { SlideProps } from '../types'

/** Trajetória 1: a graduação, em ordem. Conexão com a plateia, não o foco da palestra. */
export function Faculdade({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  const items = [
    { img: 'ufsj', icon: <IcGrad />, tag: GRADUACAO.ano, title: `${GRADUACAO.curso} na ${GRADUACAO.escola}`, text: 'Onde tudo começou: as mesmas cadeiras que vocês ocupam hoje.' },
    { img: 'trem-ki-voa', icon: <IcPlane />, tag: 'AERODESIGN', title: 'Trem Ki Voa', text: 'Projetar, construir e fazer voar, com prazo.' },
    { img: 'monitoria', icon: <IcBoard />, tag: 'MONITORIA', title: '5 disciplinas', text: 'Ensinar foi o melhor jeito de aprender.' },
    { img: 'ic', icon: <IcPump />, tag: 'INICIAÇÃO CIENTÍFICA', title: 'Bombeamento em transiente', text: 'Modelagem de sistemas de bombeamento.' },
  ]
  useGSAP(
    () => {
      gsap.to('.tl-line', { scaleX: Math.min(1, (step + 1) / items.length), duration: 1.2, ease: 'power3.inOut' })
    },
    { scope: ref, dependencies: [step] },
  )
  return (
    <Slide step={step}>
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="kicker" data-in>A graduação</div>
        <h1 className="h1" data-split>Eu já estive nessas cadeiras.</h1>
        <div style={{ position: 'relative', marginTop: 52 }}>
          <div style={{ height: 6, background: 'rgba(255,255,255,.18)', borderRadius: 3 }}>
            <div className="tl-line" style={{ position: 'static', height: 6, background: 'var(--c-purple)', transform: 'scaleX(0)', borderRadius: 3 }} />
          </div>
          <div className="grid traj4" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 40, marginTop: 36 }}>
            {items.map((it, i) => (
              <div key={it.img} className="tcard" data-step={i}>
                <Photo src={fotoUrl(it.img)} alt={it.title} icon={it.icon} height={290} />
                <div style={{ marginTop: 24 }}><span className={`tag ${i === 0 ? 'tag-year' : ''}`}>{it.tag}</span></div>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Slide>
  )
}

/** Trajetória 2: da indústria pesada para TI, gestão e IA, com linha conectando as etapas. */
export function Carreira({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  // Ordem editável: troque a posição dos itens se a pós veio antes da TI.
  const items = [
    { img: 'csn', icon: <IcCrane />, tag: 'INDÚSTRIA', title: 'CSN', text: 'Gestão de equipamentos de grande porte.' },
    { img: 'ativos-ti', icon: <IcServer />, tag: 'TECNOLOGIA', title: 'Gestão de Ativos de TI', text: 'De ativos físicos para ativos digitais.' },
    { img: 'usp', icon: <IcGrad />, tag: 'PÓS-GRADUAÇÃO', title: 'Gestão de Negócios · USP', text: 'A ponte da engenharia para a gestão.' },
    { img: 'ia', icon: <IcSpark />, tag: 'HOJE', title: 'Inteligência Artificial', text: 'Head of AI na 4MATT.' },
  ]
  useGSAP(
    () => {
      gsap.to('.tl-line', { scaleX: Math.min(1, (step + 1) / items.length), duration: 1.2, ease: 'power3.inOut' })
    },
    { scope: ref, dependencies: [step] },
  )
  return (
    <Slide step={step}>
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="kicker" data-in>Depois da formatura</div>
        <h1 className="h1" data-split>Da indústria pesada à IA</h1>
        <div style={{ position: 'relative', marginTop: 52 }}>
          <div style={{ height: 6, background: 'rgba(255,255,255,.18)', borderRadius: 3 }}>
            <div className="tl-line" style={{ position: 'static', height: 6, background: 'var(--c-purple)', transform: 'scaleX(0)', borderRadius: 3 }} />
          </div>
          <div className="grid traj4" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 40, marginTop: 36 }}>
            {items.map((it, i) => (
              <div key={it.img} className="tcard" data-step={i}>
                <Photo src={fotoUrl(it.img)} alt={it.title} icon={it.icon} height={290} />
                <div style={{ marginTop: 24 }}><span className="tag">{it.tag}</span></div>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Slide>
  )
}

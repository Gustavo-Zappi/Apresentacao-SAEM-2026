import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import Photo from '../../components/Photo'
import { IcBoard, IcCrane, IcPlane, IcPump, IcServer, IcSpark } from '../../components/Icons'
import { GRADUACAO } from '../speaker'
import type { SlideProps } from '../types'

/** Trajetória 1: a graduação. Conexão com a plateia, não o foco da palestra. */
export function Faculdade({ step }: SlideProps) {
  const items = [
    { img: 'trem-ki-voa', icon: <IcPlane />, tag: 'EQUIPE DE COMPETIÇÃO', title: 'Trem Ki Voa', text: 'AeroDesign: projetar, construir e fazer voar.' },
    { img: 'monitoria', icon: <IcBoard />, tag: 'MONITORIA', title: '5 disciplinas', text: 'Ensinar foi o melhor jeito de aprender.' },
    { img: 'ic', icon: <IcPump />, tag: 'INICIAÇÃO CIENTÍFICA', title: 'Bombeamento em transiente lento', text: 'Modelagem matemática de sistemas de bombeamento.' },
  ]
  return (
    <Slide step={step}>
      <div className="kicker" data-in>{GRADUACAO}</div>
      <h1 className="h1" data-split>Eu já estive nessas cadeiras.</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, marginTop: 64 }}>
        {items.map((it, i) => (
          <div key={it.img} className="tcard" data-step={i}>
            <Photo src={`/fotos/${it.img}.jpg`} alt={it.title} icon={it.icon} height={330} />
            <div style={{ marginTop: 28 }}><span className="tag">{it.tag}</span></div>
            <h3>{it.title}</h3>
            <p>{it.text}</p>
          </div>
        ))}
      </div>
    </Slide>
  )
}

/** Trajetória 2: da indústria pesada para TI e depois para IA, com linha conectando as etapas. */
export function Carreira({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  const items = [
    { img: 'csn', icon: <IcCrane />, tag: 'INDÚSTRIA', title: 'CSN', text: 'Gestão de equipamentos de grande porte.' },
    { img: 'ativos-ti', icon: <IcServer />, tag: 'TECNOLOGIA', title: 'Gestão de Ativos de TI', text: 'De ativos físicos para ativos digitais.' },
    { img: 'ia', icon: <IcSpark />, tag: 'HOJE', title: 'Inteligência Artificial', text: 'Head of AI na 4MATT.' },
  ]
  useGSAP(
    () => {
      gsap.to('.tl-line', { scaleX: Math.min(1, (step + 1) / 3), duration: 1.2, ease: 'power3.inOut' })
    },
    { scope: ref, dependencies: [step] },
  )
  return (
    <Slide step={step}>
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="kicker" data-in>Depois da formatura</div>
        <h1 className="h1" data-split>Da indústria pesada à IA</h1>
        <div style={{ position: 'relative', marginTop: 56 }}>
          <div style={{ height: 6, background: 'rgba(255,255,255,.18)', borderRadius: 3 }}>
            <div className="tl-line" style={{ position: 'static', height: 6, background: 'var(--c-purple)', transform: 'scaleX(0)', borderRadius: 3 }} />
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, marginTop: 40 }}>
            {items.map((it, i) => (
              <div key={it.img} className="tcard" data-step={i}>
                <Photo src={`/fotos/${it.img}.jpg`} alt={it.title} icon={it.icon} height={300} />
                <div style={{ marginTop: 28 }}><span className="tag">{it.tag}</span></div>
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

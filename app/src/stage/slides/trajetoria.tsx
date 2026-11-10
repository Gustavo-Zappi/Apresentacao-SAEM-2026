import { useRef, type CSSProperties, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import Photo from '../../components/Photo'
import { IcBoard, IcCrane, IcGrad, IcPlane, IcPump, IcServer, IcSpark } from '../../components/Icons'
import { EASE } from '../../lib/motion'
import { GRADUACAO } from '../speaker'
import type { SlideProps } from '../types'

type Stop = { img: string; icon: ReactNode; tag: string; title: string; text: string; warn?: boolean }

/**
 * Trilha: um trilho com uma parada por etapa e um cartão embaixo de cada parada.
 * A cada clique o trilho avança até o fim do cartão da vez, a parada acende e o cartão sobe.
 * As etapas já contadas recuam (ficam na tela, com menos peso): o olhar vai para a etapa atual.
 */
function Trail({ step, kicker, title, items, photoH, gap, dense }: SlideProps & { kicker: string; title: string; items: Stop[]; photoH: number; gap: number; dense?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  const n = items.length
  useGSAP(
    () => {
      const rail = ref.current!.querySelector<HTMLElement>('.trail-rail')!
      const w = rail.offsetWidth
      // fim do cartão da etapa atual (as colunas têm a mesma largura e um vão fixo entre elas)
      const x = Math.min(w, ((step + 1) * (w + gap)) / n - gap)
      gsap.to('.trail-fill', { scaleX: x / w, duration: 1.1, ease: EASE.inOut, delay: first.current ? 0.55 : 0, overwrite: true })
      first.current = false
    },
    { scope: ref, dependencies: [step] },
  )
  return (
    <Slide step={step} focus={0.66}>
      <div ref={ref} className="fill">
        <div className="kicker" data-in>{kicker}</div>
        <h1 className="h1" data-split>{title}</h1>
        <div className={`trail ${dense ? 'dense' : ''}`} style={{ '--n': n, '--gap': `${gap}px` } as CSSProperties}>
          <div className="trail-rail" data-in="fade">
            <div className="trail-fill" />
            {items.map((it, i) => (
              <i key={it.img} className={`trail-node ${i <= step ? 'on' : ''} ${i === step ? 'now' : ''}`} style={{ '--i': i } as CSSProperties} />
            ))}
          </div>
          <div className="trail-grid">
            {items.map((it, i) => (
              <div key={it.img} className="tcard" data-step={i}>
                <Photo src={`/fotos/${it.img}.jpg`} alt={it.title} icon={it.icon} height={photoH} />
                <div className="tcard-tag"><span className={`tag ${it.warn ? 'warn tag-year' : ''}`}>{it.tag}</span></div>
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

/** Trajetória 1: a graduação, em ordem. Conexão com a plateia, não o foco da palestra. */
export function Faculdade({ step }: SlideProps) {
  const items: Stop[] = [
    { img: 'ufsj', icon: <IcGrad />, tag: GRADUACAO.ano, warn: true, title: `${GRADUACAO.curso} na ${GRADUACAO.escola}`, text: 'Onde tudo começou: as mesmas cadeiras que vocês ocupam hoje.' },
    { img: 'trem-ki-voa', icon: <IcPlane />, tag: 'AERODESIGN', title: 'Trem Ki Voa', text: 'Projetar, construir e fazer voar, com prazo.' },
    { img: 'monitoria', icon: <IcBoard />, tag: 'MONITORIA', title: '5 disciplinas', text: 'Ensinar foi o melhor jeito de aprender.' },
    { img: 'ic', icon: <IcPump />, tag: 'INICIAÇÃO CIENTÍFICA', title: 'Bombeamento em transiente', text: 'Modelagem de sistemas de bombeamento.' },
  ]
  return <Trail step={step} kicker="A graduação" title="Eu já estive nessas cadeiras." items={items} photoH={280} gap={40} dense />
}

/** Trajetória 2: da indústria pesada para TI e depois para IA, com o mesmo trilho conectando as etapas. */
export function Carreira({ step }: SlideProps) {
  const items: Stop[] = [
    { img: 'csn', icon: <IcCrane />, tag: 'INDÚSTRIA', title: 'CSN', text: 'Gestão de equipamentos de grande porte.' },
    { img: 'ativos-ti', icon: <IcServer />, tag: 'TECNOLOGIA', title: 'Gestão de Ativos de TI', text: 'De ativos físicos para ativos digitais.' },
    { img: 'ia', icon: <IcSpark />, tag: 'HOJE', title: 'Inteligência Artificial', text: 'Head of AI na 4MATT.' },
  ]
  return <Trail step={step} kicker="Depois da formatura" title="Da indústria pesada à IA" items={items} photoH={300} gap={48} />
}

import Slide from '../../components/Slide'
import { IcPump, IcCrane, IcServer, IcSpark } from '../../components/Icons'
import { GRADUACAO } from '../speaker'
import type { SlideProps } from '../types'
import { Heading } from './shared'

export function Trajetoria({ step }: SlideProps) {
  const items = [
    { icon: <IcPump />, tag: 'FORMAÇÃO', title: 'Engenharia Mecânica', text: 'Trem Ki Voa, monitoria e pesquisa em bombeamento.' },
    { icon: <IcCrane />, tag: 'INDÚSTRIA', title: 'CSN', text: 'Gestão de equipamentos de grande porte.' },
    { icon: <IcServer />, tag: 'TECNOLOGIA', title: 'Ativos de TI', text: 'A gestão de ativos chega aos sistemas digitais.' },
    { icon: <IcSpark />, tag: 'HOJE', title: 'Inteligência Artificial', text: 'Head of AI na 4MATT.' },
  ]
  return <Slide step={step}>
    <Heading kicker={GRADUACAO}>A engenharia conecta essa trajetória</Heading>
    <div className="journey" style={{ marginTop: 70 }}>
      {items.map((it, i) => <div key={it.title} className="journey-stop" data-step={Math.min(i, 2)}><div className="journey-icon">{it.icon}</div><div className="small-label">{it.tag}</div><h2>{it.title}</h2><p>{it.text}</p></div>)}
    </div>
    <p className="takeaway" data-step="2">Modelar um sistema e entender suas falhas continua sendo uma base valiosa.</p>
  </Slide>
}

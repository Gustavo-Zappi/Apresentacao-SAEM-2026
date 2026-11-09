import Slide from '../../components/Slide'
import QR from '../../components/QR'
import { resourcesUrl, resourcesUrlLabel } from '../../config'
import { CAREERS } from '../../data/careers'
import { SPEAKER } from '../speaker'
import type { SlideProps } from '../types'
import { Heading, Source } from './shared'

function CareerSlide({ step, track }: SlideProps & { track: 'tecnologia' | 'gestao' }) {
  return <Slide step={step}>
    <Heading kicker="Frentes de atuação para quem vem da engenharia">{track === 'tecnologia' ? 'Carreiras em tecnologia' : 'Carreiras em gestão'}</Heading>
    <div className="career-grid" style={{ marginTop: 48 }}>
      {CAREERS.filter(c=>c.track===track).map((c,i)=><div className="career-card" key={c.title} data-step={i}><h2>{c.title}</h2><p className="career-deliver">{c.deliver}</p><div className="career-bridge"><span>Você traz</span><p>{c.base}</p><span>Você acrescenta</span><p>{c.add}</p></div></div>)}
    </div>
    <p className="takeaway" data-step="2">Competências que podem integrar funções existentes ou novas especializações.</p>
    <Source ids={['autor']} note="Projetos de entrada e detalhes no material de apoio" />
  </Slide>
}
export function CarreirasTecnologia(p: SlideProps) { return <CareerSlide {...p} track="tecnologia" /> }
export function CarreirasGestao(p: SlideProps) { return <CareerSlide {...p} track="gestao" /> }

export function Conclusao({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Voltando à bomba do início">Em quais condições você confiaria?</Heading>
    <div className="closing-questions" style={{ marginTop: 56 }}>
      <div data-in><span>01</span><p>Que evidências sustentam a recomendação?</p></div>
      <div data-step="1"><span>02</span><p>Quem define o objetivo e pode contestar?</p></div>
      <div data-step="2"><span>03</span><p>Que competência você quer desenvolver para participar?</p></div>
    </div>
    <p className="takeaway" data-step="2">A formação em engenharia ajuda a construir sistemas e reconhecer seus limites.</p>
  </Slide>
}
export function Obrigado({ step }: SlideProps) {
  return <Slide step={step} className="closing-slide">
    <div data-in><div className="kicker">SAEM 2026 · UFJF</div><h1 className="h-display" data-split>Perguntas?</h1><p className="lead" style={{ marginTop: 36 }}>Obrigado por participar.</p><div className="closing-person"><strong>{SPEAKER.name}</strong><p>{SPEAKER.role}</p><img src="/logo-4matt-branco.png" alt="4MATT" /></div></div>
    <div data-in className="closing-material"><div className="qr-card"><QR url={resourcesUrl()} /><div className="url">{resourcesUrlLabel()}</div></div><h2>Seu próximo projeto</h2><p>Plano de 30 dias, referências<br />e projetos por frente de atuação.</p></div>
  </Slide>
}

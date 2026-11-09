import Slide from '../../components/Slide'
import QR from '../../components/QR'
import { audienceUrl, audienceUrlLabel } from '../../config'
import { SPEAKER } from '../speaker'
import type { SlideProps } from '../types'
import { Heading, PumpSystem } from './shared'

export function Capa({ step }: SlideProps) {
  return <Slide step={step} className="cover-v3">
    <div className="kicker" data-in>II SAEM · Engenharia Mecânica · UFJF · 11/11/2026</div>
    <div className="cover-layout">
      <div>
        <h1 className="cover-title" data-split>Inteligência Artificial: <span className="accent-t">transformando organizações</span> e criando novas carreiras.</h1>
        <p className="lead" data-in style={{ marginTop: 36, maxWidth: 1000 }}>Tecnologia, decisões e caminhos para quem vem da engenharia</p>
      </div>
      <div data-in className="cover-qr"><div className="qr-card"><QR url={audienceUrl()} /><div className="url">{audienceUrlLabel()}</div></div><p>Participe da conversa</p></div>
    </div>
    <div className="cover-signature" data-in><div><strong>{SPEAKER.name}</strong><p>{SPEAKER.role}</p></div><img src="/logo-4matt-branco.png" alt="4MATT" /></div>
  </Slide>
}
export function Dilema({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Uma decisão dentro da fábrica">A IA recomendou parar a bomba</Heading>
    <div className="split-layout" style={{ marginTop: 44 }}>
      <div className="pump-story" data-in><PumpSystem active /><p className="diagram-caption">Situação hipotética para acompanhar a palestra</p></div>
      <div className="decision-story">
        <p className="lead" data-in>A manutenção vê risco de falha.<br />A produção precisa cumprir o turno.</p>
        <p className="big-question" data-step="1">Quem define o objetivo?<br /><span className="accent-t">Quem pode discordar?</span></p>
      </div>
    </div>
    <p className="takeaway" data-step="1">A recomendação passa a fazer parte de uma decisão organizacional.</p>
  </Slide>
}

import Slide from '../../components/Slide'
import QR from '../../components/QR'
import { audienceUrl, audienceUrlLabel } from '../../config'
import { SPEAKER } from '../speaker'
import type { SlideProps } from '../types'

export function Capa({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div className="kicker" data-in>II SAEM · Engenharia Mecânica · UFJF · 11/11/2026</div>
      <h1 className="h-display" data-split style={{ maxWidth: 1300, marginTop: 120 }}>
        Do vapor aos <span className="accent">agentes de IA</span>
      </h1>
      <p className="lead" data-in style={{ marginTop: 40, maxWidth: 1100 }}>
        A IA na engenharia, nas empresas e na sua carreira
      </p>
      <div data-in style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 28 }}>
        <div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{SPEAKER.name}</div>
          <div className="muted" style={{ fontSize: 32, marginTop: 8 }}>{SPEAKER.role}</div>
        </div>
      </div>
      <div data-in style={{ position: 'absolute', right: 128, bottom: 96, width: 380, textAlign: 'center' }}>
        <div className="qr-card" style={{ padding: 22, borderRadius: 22 }}>
          <QR url={audienceUrl()} />
          <div className="url" style={{ fontSize: 24 }}>{audienceUrlLabel()}</div>
        </div>
        <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 18, letterSpacing: '0.06em' }}>
          ENTRE AGORA E VOTE
        </div>
      </div>
    </Slide>
  )
}

export function Secao({ step, n, title, sub }: SlideProps & { n: string; title: string; sub: string }) {
  return (
    <Slide step={step}>
      <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
        <div className="mono accent-t" data-in style={{ fontSize: 260, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.05em', opacity: 0.9 }}>{n}</div>
        <h1 className="h-display" data-split style={{ maxWidth: 1500, marginTop: 24 }}>{title}</h1>
        <p className="lead" data-in style={{ marginTop: 32 }}>{sub}</p>
      </div>
    </Slide>
  )
}

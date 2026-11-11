import Slide from '../../components/Slide'
import QR from '../../components/QR'
import { audienceUrl, audienceUrlLabel } from '../../config'
import { SPEAKER, TITULO } from '../speaker'
import ImageSlot from '../../components/ImageSlot'
import SectionArt from '../../components/SectionArt'
import type { ImgId } from '../../data/images'
import type { SlideProps } from '../types'

export function Capa({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div className="kicker" data-in>II SAEM · Engenharia Mecânica · UFJF · 11/11/2026</div>
      <img data-in src="/logo-4matt-branco.png" alt="4MATT" style={{ position: 'absolute', right: 128, top: 84, height: 92, display: 'block' }} />
      <h1 className="h-display" data-split style={{ fontSize: 120, marginTop: 96 }}>
        {TITULO.principal}:
      </h1>
      <h2 className="h-display accent-t" data-split style={{ fontSize: 76, lineHeight: 1.08, maxWidth: 1250, marginTop: 22, fontWeight: 700 }}>
        {TITULO.sub}
      </h2>
      <p className="lead" data-in style={{ marginTop: 40, maxWidth: 1100, fontSize: 34 }}>
        Do vapor aos agentes de IA: o que a história da engenharia ensina sobre o que vem agora
      </p>
      <div data-in style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 36 }}>
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

export function Secao({ step, n, title, sub, img }: SlideProps & { n: string; title: string; sub: string; img?: ImgId }) {
  return (
    <Slide step={step}>
      <SectionArt n={n} />
      {img && <ImageSlot id={img} height="100%" width="58%" optional className="secao-bg" radius={0} />}
      <div style={{ marginTop: 'auto', marginBottom: 'auto', position: 'relative' }}>
        <div className="mono accent-t" data-in style={{ fontSize: 260, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.05em', opacity: 0.9 }}>{n}</div>
        <h1 className="h-display" data-split style={{ maxWidth: 960, marginTop: 24 }}>{title}</h1>
        <p className="lead" data-in style={{ marginTop: 32, maxWidth: 940 }}>{sub}</p>
      </div>
    </Slide>
  )
}

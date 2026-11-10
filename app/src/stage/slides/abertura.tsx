import Slide from '../../components/Slide'
import QR from '../../components/QR'
import { audienceUrl, audienceUrlLabel } from '../../config'
import { SPEAKER, TITULO } from '../speaker'
import ImageSlot from '../../components/ImageSlot'
import type { ImgId } from '../../data/images'
import type { SlideProps } from '../types'

/** Capa: fica no ar enquanto a plateia entra. Ordem de leitura: evento, título, promessa, quem fala, QR. */
export function Capa({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div className="kicker" data-in>II SAEM · Engenharia Mecânica · UFJF · 11/11/2026</div>
      <h1 className="h-display" data-split style={{ fontSize: 120, marginTop: 96 }}>
        {TITULO.principal}:
      </h1>
      <h2 className="h-display accent-t" data-split style={{ fontSize: 76, lineHeight: 1.08, maxWidth: 1250, marginTop: 22, fontWeight: 700 }}>
        {TITULO.sub}
      </h2>
      <p className="lead" data-in style={{ marginTop: 40, maxWidth: 1100, fontSize: 34 }}>
        Do vapor aos agentes de IA: o que a história da engenharia ensina sobre o que vem agora
      </p>
      <div data-in style={{ marginTop: 'auto' }}>
        <div className="speaker-name">{SPEAKER.name}</div>
        <div className="speaker-role">{SPEAKER.role}</div>
      </div>
      <div className="cover-qr" data-in="scale" data-delay="0.15">
        <div className="qr-card sm">
          <QR url={audienceUrl()} />
          <div className="url">{audienceUrlLabel()}</div>
        </div>
        <div className="cover-cta">ENTRE AGORA E VOTE</div>
      </div>
    </Slide>
  )
}

/**
 * Abertura de seção. Chega por trás da cortina: a entrada espera a cortina liberar o lado esquerdo
 * e então segue número, filete, título e subtítulo.
 */
export function Secao({ step, n, title, sub, img }: SlideProps & { n: string; title: string; sub: string; img?: ImgId }) {
  return (
    <Slide step={step} delay={0.5}>
      {img && <ImageSlot id={img} height="100%" width="58%" optional className="secao-bg" radius={0} />}
      <div className="secao">
        <div className="secao-n" data-in>{n}</div>
        <div className="secao-rule" data-in="draw" />
        <h1 className="h-display" data-split style={{ maxWidth: 1500 }}>{title}</h1>
        <p className="lead" data-in style={{ marginTop: 32 }}>{sub}</p>
      </div>
    </Slide>
  )
}

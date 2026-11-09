import type { ReactNode } from 'react'
import Slide from '../../components/Slide'
import ImageSlot from '../../components/ImageSlot'
import { IcBoard, IcCube, IcFactory, IcFlow, IcGauge, IcRocket, IcRuler, IcShield, IcSpark, IcWave } from '../../components/Icons'
import type { ImgId } from '../../data/images'
import QR from '../../components/QR'
import { audienceUrl } from '../../config'
import { SPEAKER } from '../speaker'
import type { SlideProps } from '../types'

export function Gargalos({ step }: SlideProps) {
  const G: [string, string, ImgId, ReactNode][] = [
    ['Especificar', 'Como a cota e a tolerância no desenho: quem especifica bem comanda a ferramenta.', 'gargalo-especificar', <IcRuler />],
    ['Validar', 'Como ensaio e metrologia: resultado sem verificação é só uma opinião rápida.', 'gargalo-validar', <IcGauge />],
    ['Governar', 'Como FMEA e normas: dados, riscos e o que pode entrar numa ferramenta de IA.', 'gargalo-governar', <IcShield />],
  ]
  return (
    <Slide step={step}>
      <div className="kicker" data-in>O gargalo mudou de lugar</div>
      <h1 className="h1" data-split>Três novos gargalos</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 56 }}>
        {G.map(([t, d, img, icon], i) => (
          <div key={t} className="card" data-step={i} style={{ paddingTop: 28 }}>
            <ImageSlot id={img} icon={icon} height={200} style={{ marginBottom: 26 }} />
            <h3 style={{ fontSize: 44 }}><span className="accent-t mono" style={{ marginRight: 18 }}>{i + 1}</span>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </Slide>
  )
}

const TEC: [string, string, ReactNode][] = [
  ['IA na manufatura e Indústria 4.0', 'processos, automação, qualidade', <IcFactory />],
  ['Simulação acelerada e gêmeo digital', 'CAE, FEA, CFD, termociências', <IcFlow />],
  ['Confiabilidade e manutenção preditiva', 'vibrações, manutenção', <IcWave />],
  ['Engenharia de soluções e agentes', 'pensamento sistêmico, controle', <IcSpark />],
  ['Verificação e validação de IA', 'metrologia, ensaios, normas', <IcGauge />],
]
const GES: [string, string, ReactNode][] = [
  ['Transformação e consultoria com IA', 'processos, gestão de projetos', <IcBoard />],
  ['Product management de IA', 'projeto de produto, requisitos', <IcCube />],
  ['Governança, risco e compliance', 'FMEA, segurança, normas', <IcShield />],
  ['Liderança de IA', 'a sua trajetória', <IcRocket />],
]

export function Carreiras({ step }: SlideProps) {
  const col = (title: string, rows: [string, string, ReactNode][], s: number, tone: 'tec' | 'ges') => (
    <div data-step={s}>
      <div className="mono accent-t" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 14 }}>{title}</div>
      {rows.map(([f, p, icon]) => (
        <div key={f} className={`car-row ${tone}`}>
          <div className="car-ic">{icon}</div>
          <div>
            <div className="car-t">{f}</div>
            <div className="car-chips">
              <span className="car-from mono">da mecânica</span>
              {p.split(', ').map((c) => <span key={c} className="car-chip">{c}</span>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
  return (
    <Slide step={step}>
      <div className="kicker" data-in>Quem vai redesenhar a fábrica</div>
      <h1 className="h1" data-split>Cada gargalo vira uma função</h1>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 72, marginTop: 36 }}>
        {col('TECNOLOGIA', TEC, 0, 'tec')}
        {col('GESTÃO', GES, 1, 'ges')}
      </div>
    </Slide>
  )
}

export function Acoes({ step }: SlideProps) {
  const A = [
    ['Use IA como colega de estudo', 'e verifique a resposta como verificaria uma conta.'],
    ['Faça um projeto que junte mecânica e dados', 'TCC, iniciação científica, equipe de competição.'],
    ['Aprenda a especificar bem', 'quem escreve a melhor especificação comanda a ferramenta.'],
  ]
  return (
    <Slide step={step}>
      <div className="kicker" data-in>Fechamento</div>
      <h1 className="h1" data-split>Três ações para segunda-feira</h1>
      <div style={{ marginTop: 72 }}>
        {A.map(([t, d], i) => (
          <div key={t} data-step={i} style={{ display: 'flex', gap: 48, alignItems: 'baseline', padding: '30px 0', borderTop: '1px solid rgba(255,255,255,.12)' }}>
            <span className="mono accent-t" style={{ fontSize: 72, fontWeight: 700 }}>{i + 1}</span>
            <div>
              <div style={{ fontSize: 50, fontWeight: 700, letterSpacing: '-0.02em' }}>{t}</div>
              <div className="lead" style={{ fontSize: 36, marginTop: 6 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  )
}

export function Obrigado({ step }: SlideProps) {
  return (
    <Slide step={step} className="center">
      <h1 className="h-display" data-split style={{ fontSize: 180 }}>Perguntas?</h1>
      <p className="lead" data-in style={{ marginTop: 32 }}>Obrigado, SAEM 2026.</p>
      <div data-in style={{ marginTop: 72, display: 'flex', gap: 56, alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{SPEAKER.name}</div>
          <div className="muted" style={{ fontSize: 32, marginTop: 6 }}>{SPEAKER.role}</div>
        </div>
        <img src="/logo-4matt-branco.png" alt="4MATT" style={{ height: 64 }} />
        <div className="qr-card" style={{ width: 200, padding: 14, borderRadius: 16 }}>
          <QR url={audienceUrl()} />
        </div>
      </div>
    </Slide>
  )
}

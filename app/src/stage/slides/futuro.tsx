import type { ReactNode } from 'react'
import Slide from '../../components/Slide'
import ImageSlot from '../../components/ImageSlot'
import { IcGauge, IcRuler, IcShield } from '../../components/Icons'
import type { ImgId } from '../../data/images'
import QR from '../../components/QR'
import { audienceUrl } from '../../config'
import { SPEAKER } from '../speaker'
import type { SlideProps } from '../types'

/** Três gargalos, um por clique. O cartão da vez acende (borda e número); os outros ficam inteiros na tela. */
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
            <h3 style={{ fontSize: 44 }}><span className="num mono">{i + 1}</span>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </Slide>
  )
}

const TEC = [
  ['IA na manufatura e Indústria 4.0', 'processos, automação, qualidade'],
  ['Simulação acelerada e gêmeo digital', 'CAE, FEA, CFD, termociências'],
  ['Confiabilidade e manutenção preditiva', 'vibrações, manutenção'],
  ['Engenharia de soluções e agentes', 'pensamento sistêmico, controle'],
  ['Verificação e validação de IA', 'metrologia, ensaios, normas'],
]
const GES = [
  ['Transformação e consultoria com IA', 'processos, gestão de projetos'],
  ['Product management de IA', 'projeto de produto, requisitos'],
  ['Governança, risco e compliance', 'FMEA, segurança, normas'],
  ['Liderança de IA', 'a sua trajetória'],
]

/** Frentes de carreira: cada trilha entra num clique, com as linhas em cascata (ritmo de leitura da lista). */
export function Carreiras({ step }: SlideProps) {
  const col = (title: string, rows: string[][], s: number) => (
    <div className="lane" data-step={s}>
      <div className="label lane-h" data-sub>{title}</div>
      {rows.map(([f, p]) => (
        <div key={f} className="lane-row" data-sub>
          <div className="lane-t">{f}</div>
          <div className="lane-p"><b>ponte:</b> {p}</div>
        </div>
      ))}
    </div>
  )
  return (
    <Slide step={step}>
      <div className="kicker" data-in>Quem vai redesenhar a fábrica</div>
      <h1 className="h1" data-split>Cada gargalo vira uma função</h1>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 80, marginTop: 48 }}>
        {col('TECNOLOGIA', TEC, 0)}
        {col('GESTÃO', GES, 1)}
      </div>
    </Slide>
  )
}

/** Três ações, uma por clique. O número da ação da vez fica preenchido; nada some nem perde leitura. */
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
      <div style={{ marginTop: 64 }}>
        {A.map(([t, d], i) => (
          <div key={t} className="action" data-step={i}>
            <span className="action-n mono">{i + 1}</span>
            <div>
              <div className="action-t">{t}</div>
              <div className="lead action-d">{d}</div>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  )
}

export function Obrigado({ step }: SlideProps) {
  return (
    <Slide step={step} className="center" delay={0.5}>
      <h1 className="h-display" data-split style={{ fontSize: 180 }}>Perguntas?</h1>
      <p className="lead" data-in style={{ marginTop: 32 }}>Obrigado, SAEM 2026.</p>
      <div className="closing" data-in>
        <div style={{ textAlign: 'left' }}>
          <div className="speaker-name">{SPEAKER.name}</div>
          <div className="speaker-role" style={{ marginTop: 6 }}>{SPEAKER.role}</div>
        </div>
        <i className="closing-div" aria-hidden />
        <img src="/logo-4matt-branco.png" alt="4MATT" style={{ height: 64 }} />
        <div className="qr-card xs">
          <QR url={audienceUrl()} />
        </div>
      </div>
    </Slide>
  )
}

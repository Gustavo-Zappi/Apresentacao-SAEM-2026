import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import CountUp from '../../components/CountUp'
import type { SlideProps } from '../types'

export function Manchete({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.2 })
      tl.from('.paper', { rotation: -14, scale: 0.4, autoAlpha: 0, duration: 1.1, ease: 'expo.out' })
      tl.to('.glitch', { x: () => gsap.utils.random(-8, 8), skewX: () => gsap.utils.random(-8, 8), duration: 0.06, repeat: 9, yoyo: true, ease: 'none' }, '-=0.2')
      tl.set('.glitch', { x: 0, skewX: 0 })
    },
    { scope: ref },
  )
  return (
    <Slide step={step} className="center">
      <div ref={ref}>
        <div className="paper" style={{ background: '#f4f1ea', color: '#111', padding: '56px 96px 64px', borderRadius: 6, boxShadow: '0 60px 160px rgba(0,0,0,.6)', maxWidth: 1500 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, letterSpacing: '0.3em', borderBottom: '3px double #111', paddingBottom: 14, marginBottom: 32 }}>
            EDIÇÃO EXTRA · 08/09/2026
          </div>
          <div className="glitch" style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 112, lineHeight: 1, letterSpacing: '-0.02em' }}>
            IA resolve Navier-Stokes
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 34, marginTop: 28, color: '#444' }}>
            Problema do Milênio de US$ 1 milhão estaria resolvido
          </div>
        </div>
        <p className="lead" data-step="1" style={{ marginTop: 64 }}>
          Quem não conhece a equação lê a manchete errado.
        </p>
      </div>
    </Slide>
  )
}

const ROWS = [
  ['IA resolveu Navier-Stokes', 'Alegação de prova de blow-up: singularidade em tempo finito a partir de condições suaves (com força externa suave)'],
  ['Problema do Milênio resolvido', 'Clay Institute não reconheceu. Regra: publicação, dois anos de escrutínio, aceitação geral'],
  ['A IA fez sozinha', '~10.000 agentes em 88 h, sobre base intelectual de Córdoba e Martínez-Zoroa'],
  ['Vitória limpa', 'Disputa de crédito com resultados anunciados ~12 h antes por outros pesquisadores'],
  ['Agora a CFD está resolvida', 'Não. RANS, LES e modelos de turbulência seguem iguais amanhã'],
]

export function ManchetexFato({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div className="kicker" data-in>Bloco 1b · Manchete × fato</div>
      <div style={{ display: 'grid', gridTemplateColumns: '700px 1fr', columnGap: 56, rowGap: 0, marginTop: 24 }}>
        <div className="mono muted" data-in style={{ fontSize: 22, letterSpacing: '0.14em', paddingBottom: 18 }}>A MANCHETE</div>
        <div className="mono accent" data-in style={{ fontSize: 22, letterSpacing: '0.14em', paddingBottom: 18 }}>O FATO (EM 28/10/2026)</div>
        {ROWS.map(([h, f], i) => (
          <Row key={h} headline={h} fact={f} on={step >= i + 1} />
        ))}
      </div>
    </Slide>
  )
}

function Row({ headline, fact, on }: { headline: string; fact: string; on: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const strike = ref.current!.querySelector('.strike')
      const f = ref.current!.nextElementSibling
      if (on) {
        gsap.to(strike, { scaleX: 1, duration: 0.5, ease: 'power3.inOut' })
        gsap.to(ref.current, { color: 'rgba(255,255,255,.4)', duration: 0.5 })
        gsap.fromTo(f, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.7, delay: 0.25, ease: 'power3.out' })
      } else {
        gsap.set(strike, { scaleX: 0 })
        gsap.set(ref.current, { color: '#fff' })
        gsap.set(f, { autoAlpha: 0 })
      }
    },
    { dependencies: [on] },
  )
  return (
    <>
      <div ref={ref} data-in style={{ fontSize: 34, fontWeight: 700, padding: '22px 0', whiteSpace: 'nowrap', borderTop: '1px solid rgba(255,255,255,.12)', position: 'relative' }}>
        <span style={{ position: 'relative' }}>
          “{headline}”
          <i className="strike" style={{ position: 'absolute', left: -6, right: -6, top: '52%', height: 4, background: '#9156F1', transform: 'scaleX(0)', transformOrigin: 'left', display: 'block' }} />
        </span>
      </div>
      <div style={{ fontSize: 28, lineHeight: 1.4, fontWeight: 300, padding: '22px 0', borderTop: '1px solid rgba(255,255,255,.12)' }}>{fact}</div>
    </>
  )
}

export function Escala({ step }: SlideProps) {
  const items = [
    { to: 10000, label: 'agentes em paralelo', prefix: '~' },
    { to: 88, label: 'horas de execução', suffix: ' h' },
    { to: 2.7, label: 'milhões de mensagens', decimals: 1, suffix: ' mi' },
    { to: 130, label: 'bilhões de tokens', prefix: '~', suffix: ' bi' },
  ]
  return (
    <Slide step={step}>
      <div className="kicker" data-in>O que mudou de verdade</div>
      <h1 className="h1" data-split>Escala de trabalho intelectual industrial</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 80 }}>
        {items.map((it) => (
          <div key={it.label} className="card" data-in>
            <div className="num" style={{ fontSize: 96 }}>
              <CountUp to={it.to} decimals={it.decimals ?? 0} prefix={it.prefix} suffix={it.suffix} duration={2.6} />
            </div>
            <p style={{ fontSize: 28 }}>{it.label}</p>
          </div>
        ))}
      </div>
      <p className="lead" data-step="1" style={{ marginTop: 72 }}>
        Formalização em Lean em ~17 h por outro modelo. Custo estimado em vários milhões de dólares.
      </p>
      <p className="lead" data-step="2" style={{ marginTop: 20, color: '#fff' }}>
        Escala cria gargalos novos: <span className="accent" style={{ fontWeight: 600 }}>validação, crédito e uso de dados.</span>
      </p>
    </Slide>
  )
}

export function Licoes({ step }: SlideProps) {
  const L = [
    ['Engenharia', 'Quem não sabe Navier-Stokes leu a manchete errado. A base é o que permite interpretar a IA.'],
    ['Organizações', 'Escala muda o jogo e cria gargalos: validação, crédito, dados confidenciais em ferramentas de IA.'],
    ['Carreiras', 'Cada gargalo vira uma função: quem verifica, quem governa os dados, quem decide o que entra na ferramenta.'],
  ]
  return (
    <Slide step={step}>
      <div className="kicker" data-in>Três lições, uma por camada</div>
      <h1 className="h1" data-split>A ponte da palestra</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 72, flex: 1, alignItems: 'start' }}>
        {L.map(([t, d], i) => (
          <div key={t} className="card" data-step={i}>
            <div className="num">0{i + 1}</div>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </Slide>
  )
}

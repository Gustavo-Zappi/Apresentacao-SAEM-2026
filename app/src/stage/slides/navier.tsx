import { useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import CountUp from '../../components/CountUp'
import ImageSlot from '../../components/ImageSlot'
import { IcFlow } from '../../components/Icons'
import { EASE } from '../../lib/motion'
import type { ImgId } from '../../data/images'
import type { SlideProps } from '../types'

const MURAL: { d: string; t: string; s: string; r: number; x: number; y: number; img: ImgId; hot?: boolean }[] = [
  { d: '09/01/2024', t: 'Ansys lança SimAI: simulação com IA generativa', s: 'Ansys', r: -3, x: 0, y: 0, img: 'simai' },
  { d: '06/2024', t: 'Motor de foguete projetado por IA passa no primeiro teste a quente', s: 'LEAP 71 · Metal AM', r: 2, x: 560, y: 30, img: 'leap71' },
  { d: 'AU 2025', t: 'Autodesk anuncia neural CAD: IA que gera geometria CAD editável', s: 'Autodesk', r: -1.5, x: 1120, y: -10, img: 'neuralcad' },
  { d: '12/2025', t: 'TRELLIS.2: uma imagem vira um modelo 3D, em código aberto', s: 'Microsoft', r: 2.5, x: 120, y: 350, img: 'trellis' },
  { d: '08/09/2026', t: 'IA teria resolvido um Problema do Milênio: Navier-Stokes', s: 'Quanta Magazine', r: -2, x: 800, y: 345, img: 'turbulencia', hot: true },
]

/**
 * Mural: os recortes pousam na ordem cronológica (a da leitura), um a cada 0,2 s.
 * No clique, os outros recuam e o de Navier-Stokes avança, endireita e ganha o contorno:
 * só então ele se diferencia dos demais, no momento em que o palestrante o anuncia.
 */
export function Mural({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useGSAP(
    () => {
      gsap.from('.clip', {
        y: 64,
        rotation: (i, el: HTMLElement) => Number(el.dataset.r) + (i % 2 ? 4 : -4),
        scale: 0.96,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.2,
        ease: EASE.out,
        delay: 0.5,
      })
    },
    { scope: ref },
  )
  useGSAP(
    () => {
      const mounting = first.current
      first.current = false
      if (step >= 1) {
        gsap.to('.clip:not(.hot)', { autoAlpha: 0.3, scale: 0.95, duration: 0.6, ease: EASE.soft, overwrite: 'auto' })
        gsap.to('.clip.hot', { scale: 1.12, rotation: 0, duration: 0.85, ease: EASE.out, overwrite: 'auto' })
        gsap.to('.clip-ring', { autoAlpha: 1, scale: 1, duration: 0.6, ease: EASE.out, delay: 0.15 })
      } else if (!mounting) {
        gsap.to('.clip:not(.hot)', { autoAlpha: 1, scale: 1, duration: 0.45, ease: EASE.soft, overwrite: 'auto' })
        gsap.to('.clip.hot', { scale: 1, rotation: (_i, el: HTMLElement) => Number(el.dataset.r), duration: 0.5, ease: EASE.out, overwrite: 'auto' })
        gsap.to('.clip-ring', { autoAlpha: 0, scale: 1.03, duration: 0.3 })
      }
      return () => {
        first.current = true
      }
    },
    { scope: ref, dependencies: [step] },
  )
  return (
    <Slide step={step}>
      <div ref={ref} className="fill">
        <div className="kicker" data-in>As manchetes</div>
        <h1 className="h1" data-split>A engenharia virou notícia</h1>
        <div style={{ position: 'relative', flex: 1, marginTop: 40 }}>
          {MURAL.map((m) => (
            <div key={m.t} className={`clip ${m.hot ? 'hot' : ''}`} data-r={m.r} style={{ left: m.x, top: m.y, transform: `rotate(${m.r}deg)`, zIndex: m.hot ? 2 : 1 }}>
              {m.hot && <i className="clip-ring" />}
              <div className="clip-date">{m.d}</div>
              <ImageSlot id={m.img} height={92} radius={2} className="news-photo" style={{ marginTop: 10 }} />
              <div className="clip-title">{m.t}</div>
              <div className="clip-src">{m.s}</div>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

/**
 * A manchete. Sem tremor nem falha de imagem: o jornal assenta na mesa, a manchete sobe palavra por
 * palavra e um avanço muito lento sustenta a pausa. No clique, o jornal recua e a frase assume.
 */
export function Manchete({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.25 })
      tl.from('.paper', { y: 56, scale: 0.94, rotation: -1.6, autoAlpha: 0, duration: 1.1, ease: EASE.outStrong })
      tl.from('.paper-rule', { scaleX: 0, transformOrigin: '50% 50%', duration: 0.8, ease: EASE.inOut }, 0.25)
      const s = SplitText.create('.paper-h', { type: 'words', mask: 'words' })
      tl.from(s.words, { yPercent: 112, duration: 0.95, ease: EASE.outStrong, stagger: 0.1 }, 0.4)
      tl.from('.paper-sub, .paper .islot', { autoAlpha: 0, y: 14, duration: 0.7, ease: EASE.out, stagger: 0.14 }, 1.0)
      tl.to('.paper-zoom', { scale: 1.03, duration: 10, ease: 'sine.out' }, 1.3)
    },
    { scope: ref },
  )
  useGSAP(
    () => {
      const mounting = first.current
      first.current = false
      if (mounting && step < 1) return
      gsap.to('.paper-dim', { opacity: step >= 1 ? 0.88 : 1, scale: step >= 1 ? 0.95 : 1, y: step >= 1 ? -14 : 0, duration: 0.7, ease: EASE.out })
      return () => {
        first.current = true
      }
    },
    { scope: ref, dependencies: [step] },
  )
  return (
    <Slide step={step} className="center">
      <div ref={ref}>
        <div className="paper-dim">
          <div className="paper-zoom">
            <div className="paper">
              <div className="paper-mast">EDIÇÃO EXTRA · 08/09/2026</div>
              <i className="paper-rule" />
              <div className="paper-h">IA resolve Navier-Stokes</div>
              <div className="paper-sub">Problema do Milênio de US$ 1 milhão estaria resolvido</div>
              <ImageSlot id="turbulencia" icon={<IcFlow />} height={230} radius={2} className="news-photo" style={{ marginTop: 28 }} />
            </div>
          </div>
        </div>
        <p className="lead" data-step="1" style={{ marginTop: 52, color: '#fff' }}>
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

/**
 * Manchete × fato: um par por clique. A manchete é riscada, perde peso e o fato entra ao lado;
 * uma faixa marca a linha da vez e as já discutidas recuam. Tudo em transição de CSS (ver .mf-row).
 */
export function ManchetexFato({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div className="kicker" data-in>Manchete × fato</div>
      <div className="mf">
        <div className="mf-head" data-in>
          <div className="label" style={{ color: '#fff' }}>A MANCHETE</div>
          <div className="label">O FATO (EM 28/10/2026)</div>
        </div>
        {ROWS.map(([h, f], i) => (
          <div key={h} className={`mf-row ${step > i + 1 ? 'past' : step === i + 1 ? 'now' : 'todo'}`} data-in>
            <div className="mf-h">
              <span>
                “{h}”
                <i className="strike" />
              </span>
            </div>
            <div className="mf-f">{f}</div>
          </div>
        ))}
      </div>
    </Slide>
  )
}

/**
 * Escala: os quatro números contam um depois do outro, da esquerda para a direita, enquanto são lidos.
 * As duas frases entram uma por clique; a segunda (a conclusão) fica em evidência.
 */
export function Escala({ step }: SlideProps) {
  const items = [
    { to: 10000, label: 'agentes em paralelo', prefix: '~' },
    { to: 88, label: 'horas de execução', suffix: ' h' },
    { to: 2.7, label: 'milhões de mensagens', decimals: 1, suffix: ' mi' },
    { to: 130, label: 'bilhões de tokens', prefix: '~', suffix: ' bi' },
  ]
  return (
    <Slide step={step} focus={0.62}>
      <div className="kicker" data-in>O que mudou de verdade</div>
      <h1 className="h1" data-split>Escala de trabalho intelectual industrial</h1>
      <div className="stats">
        {items.map((it, i) => (
          <div key={it.label} className="card stat" data-in>
            <div className="stat-n">
              <CountUp to={it.to} decimals={it.decimals ?? 0} prefix={it.prefix} suffix={it.suffix} duration={1.5} delay={0.6 + i * 0.16} />
            </div>
            <p>{it.label}</p>
          </div>
        ))}
      </div>
      <p className="lead" data-step="1" style={{ marginTop: 72 }}>
        Formalização em Lean em ~17 h por outro modelo. Custo estimado em vários milhões de dólares.
      </p>
      <p className="lead" data-step="2" style={{ marginTop: 20, color: '#fff' }}>
        Escala cria gargalos novos: <span className="accent-t" style={{ fontWeight: 600 }}>validação, crédito e uso de dados.</span>
      </p>
    </Slide>
  )
}

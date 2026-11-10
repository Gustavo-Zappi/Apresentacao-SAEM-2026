import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import TurbineCloud from '../../components/TurbineCloud'
import ImageSlot from '../../components/ImageSlot'
import type { ImgId } from '../../data/images'
import { IcAntenna, IcBracket, IcChat, IcCube, IcLattice, IcRocket, IcTrain, IcWave, IcFlow } from '../../components/Icons'
import { EASE } from '../../lib/motion'
import type { SlideProps } from '../types'

/* ---------------------------------------------------------------- Passado */

const PASSADO: { y: string; t: string; d: string; s: string; img: ImgId; icon: ReactNode }[] = [
  { y: '1987', t: 'Metrô de Sendai', d: 'Lógica fuzzy (Hitachi) controla partidas e frenagens.', s: 'primeira linha de metrô com fuzzy', img: 'passado-sendai', icon: <IcTrain /> },
  { y: 'Anos 90', t: 'Redes neurais na manutenção', d: 'Diagnóstico de falhas em máquinas pela vibração.', s: '', img: 'passado-vibracao', icon: <IcWave /> },
  { y: '2006', t: 'NASA ST5', d: 'Antena projetada por algoritmo evolutivo voa no espaço.', s: 'primeiro hardware "evoluído" em órbita', img: 'passado-st5', icon: <IcAntenna /> },
  { y: '2015', t: 'Airbus', d: 'Partição "biônica" por design generativo: 45% mais leve.', s: 'com Autodesk, impressão 3D', img: 'passado-airbus', icon: <IcLattice /> },
  { y: '2018', t: 'GM + Autodesk', d: 'Suporte 40% mais leve e 20% mais resistente: 8 peças viram 1.', s: 'prova de conceito', img: 'passado-gm', icon: <IcBracket /> },
]

/**
 * Linha do tempo de 1987 a 2018. A linha é desenhada da esquerda para a direita e cada marco
 * aparece quando a linha chega nele: a plateia percorre as décadas na ordem em que são citadas.
 * No clique, a conclusão entra e a linha do tempo recua para dar o palco à frase.
 */
export function Passado({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const T0 = 0.6 // depois do título
      const SPAN = 2.0 // tempo para a linha cruzar as cinco décadas
      const tl = gsap.timeline()
      tl.fromTo('.tl-fill', { scaleX: 0 }, { scaleX: 1, duration: SPAN + 0.3, ease: 'none' }, T0)
      gsap.utils.toArray<HTMLElement>('.tl-item', ref.current).forEach((it, i, all) => {
        const t = T0 + (SPAN * i) / all.length
        tl.from(it.querySelector('.tl-dot'), { scale: 0, duration: 0.45, ease: EASE.out }, t)
        tl.from(it.querySelector('.islot'), { autoAlpha: 0, y: 18, scale: 0.97, duration: 0.7, ease: EASE.out }, t)
        tl.from(it.querySelectorAll('.tl-year, .tl-title, .tl-text, .src'), { autoAlpha: 0, y: 16, duration: 0.6, ease: EASE.out, stagger: 0.06 }, t + 0.08)
      })
    },
    { scope: ref },
  )
  useGSAP(
    () => {
      gsap.to('.tl', { opacity: step >= 1 ? 0.62 : 1, duration: 0.6, ease: EASE.soft })
    },
    { scope: ref, dependencies: [step] },
  )
  return (
    <Slide step={step}>
      <div ref={ref} className="fill">
        <div className="kicker" data-in>Não é de hoje</div>
        <h1 className="h1" data-split>A IA está na engenharia há décadas</h1>
        <div className="tl tl-img">
          <div className="tl-line"><div className="tl-fill" /></div>
          {PASSADO.map((p) => (
            <div key={p.y} className="tl-item">
              <ImageSlot id={p.img} icon={p.icon} height={210} />
              <div className="tl-dot" />
              <div className="tl-year">{p.y}</div>
              <div className="tl-title">{p.t}</div>
              <div className="tl-text">{p.d}</div>
              {p.s && <div className="src">{p.s}</div>}
            </div>
          ))}
        </div>
        <p className="lead strong" data-step="1" style={{ marginTop: 'auto', fontSize: 36 }}>
          Por décadas, IA na engenharia foi <span className="accent-t">controlar e otimizar</span> dentro de regras que nós escrevíamos.
        </p>
      </div>
    </Slide>
  )
}

/* ---------------------------------------------------------------- Nova era: fotos → 3D */

export function Fotos3D({ step }: SlideProps) {
  return (
    <Slide step={step} focus={0.58}>
      <div style={{ display: 'grid', gridTemplateColumns: '860px 1fr', gap: 72, height: '100%', alignItems: 'center' }}>
        <div data-in="fade">
          <TurbineCloud size={860} sim={step >= 2} />
        </div>
        <div>
          <div className="kicker" data-in>Uma nova era</div>
          <h1 className="h1" data-split style={{ fontSize: 64 }}>Fotos viram modelo 3D</h1>
          <div style={{ marginTop: 36 }}>
            <div className="era-row" data-step="0" style={{ gridTemplateColumns: '180px 1fr' }}>
              <div className="k">2023</div>
              <div>
                <div className="t">3D Gaussian Splatting</div>
                <div className="d">Fotos viram cena 3D em tempo real. Ainda não é IA generativa.</div>
              </div>
            </div>
            <div className="era-row" data-step="1" style={{ gridTemplateColumns: '180px 1fr' }}>
              <div className="k">12/2025</div>
              <div>
                <div className="t">TRELLIS.2 (Microsoft)</div>
                <div className="d"><b style={{ color: '#fff' }}>Uma única imagem</b> gera um modelo 3D. Código aberto.</div>
              </div>
            </div>
            <div className="era-row" data-step="2" style={{ gridTemplateColumns: '180px 1fr' }}>
              <div className="k">E daí?</div>
              <div>
                <div className="t">Da peça física à simulação</div>
                <div className="d">Engenharia reversa e base para o gêmeo digital. Metrologia ainda manda.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  )
}

/* ---------------------------------------------------------------- Nova era: a IA passa a propor */

const NOVA: { k: string; t: string; d: string; img: ImgId; icon: ReactNode }[] = [
  { img: 'neuralcad', icon: <IcCube />, k: 'TEXTO → CAD', t: 'Peça editável a partir de uma frase', d: 'Zoo Text-to-CAD gera sólidos B-rep (STEP). Autodesk neural CAD (AU 2025) gera a geometria e o histórico de comandos.' },
  { img: 'simai', icon: <IcFlow />, k: 'SIMULAÇÃO', t: 'Resultado de CFD/FEA em segundos', d: 'Ansys SimAI (01/2024) aprende com simulações anteriores. A Ansys fala em 10 a 100× mais rápido.' },
  { img: 'leap71', icon: <IcRocket />, k: 'PROJETO', t: 'Motor de foguete sem desenhista', d: 'LEAP 71 (2024): projetado por modelo computacional, impresso em cobre, testado a quente com 5 kN.' },
  { img: 'copiloto', icon: <IcChat />, k: 'COPILOTO', t: 'Conversar com o CAD', d: 'SOLIDWORKS 2026 (AURA), PTC Creo 13 e Siemens NX já têm assistentes dentro do software.' },
]

export function NovaEra({ step }: SlideProps) {
  return (
    <Slide step={step} focus={0.58}>
      <div className="kicker" data-in>IA generativa na engenharia mecânica</div>
      <h1 className="h1" data-split>Agora a IA propõe</h1>
      <div style={{ marginTop: 40 }}>
        {NOVA.map((n, i) => (
          <div key={n.k} className="era-row era-img" data-step={i}>
            <div className="era-thumb">
              <ImageSlot id={n.img} icon={n.icon} height={138} />
              <span className="era-tag">{n.k}</span>
            </div>
            <div>
              <div className="t">{n.t}</div>
              <div className="d">{n.d}</div>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  )
}

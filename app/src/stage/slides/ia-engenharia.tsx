import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import PartCloud from '../../components/PartCloud'
import type { SlideProps } from '../types'

/* ---------------------------------------------------------------- Passado */

const PASSADO = [
  { y: '1987', t: 'Metrô de Sendai', d: 'Lógica fuzzy (Hitachi) controla partidas e frenagens.', s: 'primeira linha de metrô com fuzzy' },
  { y: 'Anos 90', t: 'Redes neurais na manutenção', d: 'Diagnóstico de falhas em máquinas pela vibração.', s: '' },
  { y: '2006', t: 'NASA ST5', d: 'Antena projetada por algoritmo evolutivo voa no espaço.', s: 'primeiro hardware "evoluído" em órbita' },
  { y: '2015', t: 'Airbus', d: 'Partição "biônica" por design generativo: 45% mais leve.', s: 'com Autodesk, impressão 3D' },
  { y: '2018', t: 'GM + Autodesk', d: 'Suporte 40% mais leve e 20% mais resistente: 8 peças viram 1.', s: 'prova de conceito' },
]

export function Passado({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.fromTo('.tl-line', { scaleX: 0 }, { scaleX: 1, duration: 2.2, ease: 'power2.inOut', delay: 0.5 })
    },
    { scope: ref },
  )
  return (
    <Slide step={step}>
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="kicker" data-in>Não é de hoje</div>
        <h1 className="h1" data-split>A IA está na engenharia há décadas</h1>
        <div className="tl">
          <div className="tl-line" />
          {PASSADO.map((p) => (
            <div key={p.y} className="tl-item" data-in>
              <div className="tl-dot" />
              <div className="tl-year">{p.y}</div>
              <div className="tl-title">{p.t}</div>
              <div className="tl-text">{p.d}</div>
              {p.s && <div className="src">{p.s}</div>}
            </div>
          ))}
        </div>
        <p className="lead" data-step="1" style={{ marginTop: 'auto', color: '#fff', fontWeight: 600 }}>
          Por décadas, IA na engenharia foi <span className="accent-t">controlar e otimizar</span> dentro de regras que nós escrevíamos.
        </p>
      </div>
    </Slide>
  )
}

/* ---------------------------------------------------------------- Nova era: fotos → 3D */

export function Fotos3D({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div style={{ display: 'grid', gridTemplateColumns: '860px 1fr', gap: 72, height: '100%', alignItems: 'center' }}>
        <div data-in>
          <PartCloud size={860} />
        </div>
        <div>
          <div className="kicker" data-in>Uma nova era</div>
          <h1 className="h1" data-split style={{ fontSize: 64 }}>Fotos viram modelo 3D</h1>
          <div style={{ marginTop: 36 }}>
            <div className="era-row" data-in style={{ gridTemplateColumns: '180px 1fr' }}>
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
                <div className="t">Engenharia reversa</div>
                <div className="d">Gêmeo digital com o celular. Metrologia ainda manda.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  )
}

/* ---------------------------------------------------------------- Nova era: a IA passa a propor */

const NOVA = [
  { k: 'TEXTO → CAD', t: 'Peça editável a partir de uma frase', d: 'Zoo Text-to-CAD gera sólidos B-rep (STEP). Autodesk neural CAD (AU 2025) gera a geometria e o histórico de comandos.' },
  { k: 'SIMULAÇÃO', t: 'Resultado de CFD/FEA em segundos', d: 'Ansys SimAI (01/2024) aprende com simulações anteriores. A Ansys fala em 10 a 100× mais rápido.' },
  { k: 'PROJETO', t: 'Motor de foguete sem desenhista', d: 'LEAP 71 (2024): projetado por modelo computacional, impresso em cobre, testado a quente com 5 kN.' },
  { k: 'COPILOTO', t: 'Conversar com o CAD', d: 'SOLIDWORKS 2026 (AURA), PTC Creo 13 e Siemens NX já têm assistentes dentro do software.' },
]

export function NovaEra({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div className="kicker" data-in>IA generativa na engenharia mecânica</div>
      <h1 className="h1" data-split>Agora a IA propõe</h1>
      <div style={{ marginTop: 40 }}>
        {NOVA.map((n, i) => (
          <div key={n.k} className="era-row" data-step={i}>
            <div className="k">{n.k}</div>
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

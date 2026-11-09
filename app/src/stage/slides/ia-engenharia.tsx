import Slide from '../../components/Slide'
import PartCloud from '../../components/PartCloud'
import type { SlideProps } from '../types'
import { Heading, Source } from './shared'

export function Passado({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Uma história anterior aos chatbots">IA já participa de projetos de engenharia</Heading>
    <div className="grid evidence-pair" style={{ marginTop: 64 }}>
      <div className="card" data-in><div className="small-label">NASA ST5 · 2006</div><div className="num">Busca evolutiva</div><h3>Uma antena projetada por algoritmo</h3><p>O algoritmo explora alternativas conforme critérios de desempenho.</p></div>
      <div className="card" data-step="1"><div className="small-label">AIRBUS · PARTIÇÃO BIÔNICA</div><div className="num">Design generativo</div><h3>Alternativas para reduzir massa</h3><p>Requisitos, materiais e fabricação delimitam o espaço de projeto.</p></div>
    </div>
    <p className="takeaway" data-step="1">A geração de alternativas já existia. A interação e a integração entre ferramentas estão se ampliando.</p>
    <Source ids={['nasa', 'airbus']} />
  </Slide>
}
export function Tecnologias({ step }: SlideProps) {
  const rows = [
    ['PREVER', 'Modelos preditivos', 'Estimar falha ou desempenho a partir de dados.'],
    ['GERAR', 'Modelos generativos', 'Produzir texto, código ou alternativas de geometria.'],
    ['CONSULTAR', 'Busca em documentos', 'Recuperar contexto autorizado e indicar suas fontes.'],
    ['AGIR', 'Sistemas agentes', 'Coordenar ferramentas dentro de permissões e limites.'],
  ]
  return <Slide step={step}>
    <Heading kicker="As tecnologias por trás da transformação">Capacidades diferentes no mesmo sistema</Heading>
    <div className="capability-list" style={{ marginTop: 38 }}>
      {rows.map(([k, t, d], i) => <div className="capability" key={k} data-step={i}><div className="small-label">{k}</div><h2>{t}</h2><p>{d}</p></div>)}
    </div>
    <p className="takeaway" data-step="3">Simulação, medição e cálculo oferecem referências para avaliar as saídas.</p>
  </Slide>
}
export function Fotos3D({ step }: SlideProps) {
  return <Slide step={step}>
    <div className="model-layout">
      <div data-in><PartCloud size={780} /><p className="diagram-caption">Animação ilustrativa. A peça não foi reconstruída de fotos.</p></div>
      <div>
        <Heading kicker="Capacidade e limite">Uma imagem 3D precisa de verificação</Heading>
        <div className="model-point" data-in><h2>Representar uma cena</h2><p>Gaussian Splatting sintetiza novas vistas a partir de imagens.</p></div>
        <div className="model-point" data-step="1"><h2>Gerar um ativo 3D</h2><p>TRELLIS.2 produz geometria e aparência a partir de uma imagem.</p></div>
        <p className="model-limit" data-step="1">Dimensões, tolerâncias e uso em engenharia exigem avaliação própria.</p>
      </div>
    </div>
    <Source ids={['gaussian', 'trellis']} />
  </Slide>
}

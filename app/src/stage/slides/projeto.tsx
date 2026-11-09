import Slide from '../../components/Slide'
import Poll from '../../components/Poll'
import { useResponses } from '../../lib/useResponses'
import type { SlideProps } from '../types'
import { Heading } from './shared'

const EXAMPLES = {
  dados: { title: 'Dados e simulação', project: 'Compare um modelo simples com uma referência de vibração ou simulação.', evidence: 'Mostre o erro em dados que o modelo não viu e registre suas limitações.' },
  agentes: { title: 'Sistemas agentes', project: 'Conecte um manual autorizado a uma memória de cálculo reproduzível.', evidence: 'Teste dados ausentes, unidades e condições de parada.' },
  gestao: { title: 'Gestão e governança', project: 'Mapeie um processo e proponha um piloto com limites de autonomia.', evidence: 'Defina indicador de benefício, aprovação e critério de interrupção.' },
}
export function PlanoProjeto(props: SlideProps) {
  return props.step === 0 ? <Poll qid="trilha-projeto-v3" step={0} kicker="Seu próximo passo" /> : <ProjetoResultado {...props} />
}
function ProjetoResultado({ step }: SlideProps) {
  const { counts, total } = useResponses('trilha-projeto-v3')
  const ranked = (Object.keys(EXAMPLES) as (keyof typeof EXAMPLES)[]).sort((a,b)=>(counts[b]||0)-(counts[a]||0))
  const top = ranked[0]
  const tied = total > 0 && (counts[ranked[0]]||0)===(counts[ranked[1]]||0)
  const choice = EXAMPLES[top]
  return <Slide step={step}>
    <Heading kicker="Da palestra para um projeto">Um projeto em 30 dias</Heading>
    {step === 1 ? <div className="project-choice" data-in>
      <div className="small-label">{!total ? 'EXEMPLO PARA COMEÇAR · SEM VOTOS' : tied ? 'EMPATE · UM EXEMPLO ENTRE AS MAIS VOTADAS' : 'FRENTE MAIS VOTADA'}</div>
      <h2>{choice.title}</h2><p className="lead">{choice.project}</p><p className="project-evidence">{choice.evidence}</p>
    </div> : <div className="week-grid" data-in>
      {[['01','Referência','Escolha um problema pequeno e resolva uma versão de referência.'],['02','Aplicação','Use IA em uma etapa e registre as entradas e saídas.'],['03','Verificação','Teste unidades, dados ausentes e condições diferentes.'],['04','Demonstração','Apresente resultado, comparação e limites em uma página.']].map(([n,t,d])=><div key={n}><div className="week-number">{n}</div><h2>{t}</h2><p>{d}</p></div>)}
    </div>}
    <p className="takeaway">Um projeto que você consegue explicar oferece uma evidência de competência.</p>
  </Slide>
}

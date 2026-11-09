import Slide from '../../components/Slide'
import type { SlideProps } from '../types'
import { Heading, Source } from './shared'

export function BombaEmpresa({ step }: SlideProps) {
  const rows = [
    ['Operação', 'Condições reais, disponibilidade e histórico do ativo.'],
    ['Engenharia e manutenção', 'Alternativas, confiabilidade e critérios de aceitação.'],
    ['Compras', 'Fornecedores, prazos e custo ao longo da vida útil.'],
    ['Responsável pelo processo', 'Permissões, aprovações e acompanhamento do resultado.'],
  ]
  return <Slide step={step}>
    <Heading kicker="Transformação das organizações">A bomba faz parte de uma empresa</Heading>
    <div className="ownership-list" style={{ marginTop: 48 }}>
      {rows.map(([t,d],i)=><div key={t} data-step={Math.min(i,2)}><h2>{t}</h2><p>{d}</p></div>)}
    </div>
    <p className="takeaway" data-step="2">O fluxo integra áreas que compartilham dados, mas respondem por decisões diferentes.</p>
  </Slide>
}
export function Processo({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Operação e estrutura">Como o trabalho pode mudar</Heading>
    <div className="process-comparison" style={{ marginTop: 48 }}>
      <div data-in><div className="small-label">PROCESSO FRAGMENTADO</div><ol><li>Dados em planilhas e documentos separados.</li><li>Repasses manuais entre as áreas.</li><li>Revisão concentra-se no final.</li></ol></div>
      <div data-step="1"><div className="small-label">PROCESSO COM IA INTEGRADA</div><ol><li>Dados autorizados e referências compartilhadas.</li><li>Agente prepara análises e solicitações.</li><li>Verificações e aprovações ao longo do fluxo.</li></ol></div>
    </div>
    <p className="takeaway" data-step="2">O piloto mede tempo total, retrabalho, falsos alertas e resultado operacional.</p>
    <div className="slide-source">Exemplo didático de redesenho de processo. Sem resultados atribuídos a clientes.</div>
  </Slide>
}
export function Evidencia({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Adoção na prática · estudo publicado">IA no atendimento: ganhos diferentes</Heading>
    <div className="study-layout" style={{ marginTop: 56 }}>
      <div className="study-number" data-in>+15%<p>questões resolvidas por hora<br />em média</p></div>
      <div className="study-context" data-in><div className="small-label">5.172 PROFISSIONAIS · QJE, 2025</div><p>Assistente conversacional integrado a uma operação de atendimento.</p><p data-step="1">Menos experientes tiveram ganhos maiores. Entre os mais experientes, houve pequenos declínios de qualidade.</p></div>
    </div>
    <p className="takeaway" data-step="2">Esse resultado descreve aquela operação. Um piloto de engenharia precisa de sua própria avaliação.</p>
    <Source ids={['work']} />
  </Slide>
}
export function Objetivos({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Informação e poder de decisão">O que a empresa quer otimizar?</Heading>
    <div className="tradeoff-layout" style={{ marginTop: 66 }}>
      <div data-in><div className="small-label">OPERAÇÃO</div><h2>Produção neste turno</h2><p>O custo imediato de interromper a linha.</p></div>
      <div className="tradeoff-symbol" data-in>?</div>
      <div data-step="1"><div className="small-label">CONFIABILIDADE</div><h2>Disponibilidade do ativo</h2><p>O risco de falha e suas consequências futuras.</p></div>
    </div>
    <p className="big-question" data-step="2" style={{ marginTop: 64 }}>Quem escolhe os critérios?<br /><span className="accent-t">Quem pode contestar a recomendação?</span></p>
    <Source ids={['harari']} note="Perguntas desta palestra, inspiradas na relação entre informação e poder" />
  </Slide>
}
export function Autonomia({ step }: SlideProps) {
  const rows = [
    ['Consultar manual', 'Automática', 'Documento vigente e acesso autorizado.'],
    ['Preparar cálculo', 'Com registro', 'Entradas, hipóteses e ferramentas rastreáveis.'],
    ['Solicitar compra', 'Com aprovação', 'Escopo e valor conforme política da empresa.'],
    ['Alterar operação', 'Responsável designado', 'Análise de impacto e procedimento de autorização.'],
  ]
  return <Slide step={step}>
    <Heading kicker="Governança no processo">Qual autonomia conceder ao sistema?</Heading>
    <table className="autonomy-table" style={{ marginTop: 42 }}><thead><tr><th>Ação</th><th>Autonomia proposta</th><th>Condição</th></tr></thead><tbody>
      {rows.map(([a,b,c],i)=><tr key={a} data-step={Math.min(i,2)}><th scope="row">{a}</th><td>{b}</td><td>{c}</td></tr>)}
    </tbody></table>
    <p className="takeaway" data-step="2">A empresa precisa conseguir identificar, contestar e corrigir uma decisão.</p>
    <div className="slide-source">Proposta de desenho para o exemplo didático de bombeamento.</div>
  </Slide>
}
export function Aprendizagem({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Tarefas, empregos e formação">Como formar os próximos especialistas?</Heading>
    <div className="learning-layout" style={{ marginTop: 54 }}>
      <div data-in><div className="small-label">QUANDO TAREFAS MUDAM</div><h2>O trabalho de entrada também muda</h2><p>Automatizar uma etapa pode retirar uma oportunidade de prática.</p></div>
      <div data-step="1"><div className="small-label">UMA ESCOLHA DE GESTÃO</div><h2>Aprendizagem precisa de espaço</h2><p>Comparar soluções, investigar erros e receber retorno de quem tem experiência.</p></div>
    </div>
    <p className="takeaway" data-step="2">Novas tarefas e competências podem ampliar possibilidades. A criação de vagas depende de escolhas e contexto.</p>
    <Source ids={['autor','tasks']} />
  </Slide>
}

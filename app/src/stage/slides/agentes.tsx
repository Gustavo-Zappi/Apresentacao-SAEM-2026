import Slide from '../../components/Slide'
import { calculatePump, pt } from '../../data/pump'
import type { SlideProps } from '../types'
import { Heading, PumpSystem, Source } from './shared'

export function AgenteDef({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Ferramentas, autonomia e limites">Como funciona um sistema agente</Heading>
    <p className="lead" data-in style={{ marginTop: 32 }}>Recebe um objetivo, planeja ações e usa ferramentas para trabalhar.</p>
    <div className="agent-loop" data-step="1">
      <svg viewBox="0 0 1600 390" role="img" aria-label="Planejar, usar ferramentas, observar e avaliar, com retorno para planejar">
        <path d="M300 125 H430 M730 125 H860 M1160 125 H1290 M1440 195 V310 H150 V195" fill="none" stroke="#CBB3FF" strokeWidth="5" />
        {[150,580,1010,1440].map((x,i) => <g key={x}><rect x={x-150} y="55" width="300" height="140" rx="20" fill="#201E4B" stroke="#CBB3FF" strokeWidth="3" /><text x={x} y="138" textAnchor="middle" fill="#FFFFFF" fontSize="38">{['Planejar','Ferramentas','Observar','Avaliar'][i]}</text></g>)}
        <path d="M395 110 L425 125 L395 140 M825 110 L855 125 L825 140 M1255 110 L1285 125 L1255 140 M135 225 L150 199 L165 225" fill="none" stroke="#FFFFFF" strokeWidth="5" />
        <text x="800" y="365" textAnchor="middle" fill="#CBB3FF" fontSize="32">Permissões · critérios de aceitação · orçamento de execução</text>
      </svg>
    </div>
    <p className="takeaway" data-step="2">Pode corrigir, parar ou pedir ajuda. A avaliação precisa de evidências além da própria resposta.</p>
  </Slide>
}
export function AgentePedido({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Demonstração · entradas e hipóteses">Um dimensionamento preliminar</Heading>
    <div className="split-layout" style={{ marginTop: 32 }}>
      <div data-in><PumpSystem active /><div className="prompt-box">“Calcule a altura e a potência. Registre hipóteses e aponte o que falta para selecionar a bomba.”</div></div>
      <div className="input-list" data-step="1">
        <div><b>Água</b><span>20 °C · 998 kg/m³</span></div>
        <div><b>Tubo</b><span>D interno 77,9 mm · 120 m</span></div>
        <div><b>Rugosidade</b><span>0,045 mm · aço comercial</span></div>
        <div><b>Hipóteses</b><span>K = 8 · rendimento 70%</span></div>
        <div><b>Método</b><span>Darcy–Weisbach e Colebrook</span></div>
      </div>
    </div>
    <p className="takeaway" data-step="1">Vazão de 30 m³/h e desnível de 18 m. Entradas explícitas permitem reproduzir a conta.</p>
  </Slide>
}
export function AgenteExec({ step }: SlideProps) {
  const r = calculatePump()
  return <Slide step={step}>
    <Heading kicker="Demonstração · cálculo local de referência">Uma resposta que podemos reproduzir</Heading>
    <div className="calculation-steps" style={{ marginTop: 42 }}>
      <div data-in><span className="small-label">ESCOAMENTO</span><p>v = {pt(r.velocity,2)} m/s<br />Re ≈ 1,36 × 10⁵</p></div>
      <div data-step="1"><span className="small-label">PERDAS</span><p>f = {pt(r.darcy,4)}<br />h = {pt(r.frictionHead+r.localHead,2)} m</p></div>
      <div data-step="2"><span className="small-label">RESULTADO</span><p>H = 18 m + perdas<br />P = ρ g Q H / η</p></div>
    </div>
    <div className="result-pair" data-step="2"><div><b>{pt(r.totalHead)}<small> m</small></b><p>altura manométrica</p></div><div><b>{pt(r.shaftPowerKw)}<small> kW</small></b><p>potência no eixo</p></div></div>
    <p className="takeaway" data-step="2">O slide executa o cálculo de referência. A demonstração do agente usa as mesmas entradas.</p>
  </Slide>
}
export function AgenteLimites({ step }: SlideProps) {
  const r = calculatePump()
  return <Slide step={step}>
    <Heading kicker="Demonstração · condições para decidir">O que ainda falta verificar?</Heading>
    <div className="grid evidence-pair" style={{ marginTop: 56 }}>
      <div className="card" data-in><h3>Seleção da bomba</h3><p>Curva do fabricante e ponto de operação.</p><p>Condições de sucção, NPSH e faixa de trabalho.</p></div>
      <div className="card" data-step="1"><h3>Comportamento transiente</h3><div className="surge-number">≈ {pt(r.surgeHead,0)} m</div><p>Joukowsky, com a = 1.200 m/s e perda rápida de toda a velocidade.</p></div>
    </div>
    <p className="takeaway" data-step="2">Esses dados sustentam uma análise preliminar. A ação exige contexto, evidências e autorização.</p>
    <Source ids={['pump','operating']} note="O valor de transiente depende das hipóteses" />
  </Slide>
}

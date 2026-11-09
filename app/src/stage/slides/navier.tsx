import Slide from '../../components/Slide'
import type { SlideProps } from '../types'
import { Heading, Source } from './shared'

export function Navier({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Navier–Stokes · fontes consultadas em 08/11/2026">Anúncio, verificação e aplicação</Heading>
    <div className="navier-stages" style={{ marginTop: 54 }}>
      <div data-in><div className="small-label">O ANÚNCIO · 08/09</div><h2>Uma prova com força externa suave</h2><p>A OpenAI publicou um resultado de singularidade em tempo finito e sua formalização em Lean.</p></div>
      <div data-step="1"><div className="small-label">A AVALIAÇÃO · CLAY, 11/09</div><h2>O processo de reconhecimento</h2><p>O Clay falou em aparente resolução e em avaliação sem pressa, conforme suas regras.</p></div>
      <div data-step="2"><div className="small-label">A APLICAÇÃO · ENGENHARIA</div><h2>O alcance de cada evidência</h2><p>O anúncio não demonstra a resolução de qualquer problema prático de CFD.</p></div>
    </div>
    <p className="takeaway" data-step="2">Uma afirmação ganha valor quando entendemos suas hipóteses, evidências e limites.</p>
    <Source ids={['openai','clay']} />
  </Slide>
}

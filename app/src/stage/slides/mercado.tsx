import Slide from '../../components/Slide'
import type { SlideProps } from '../types'
import { Heading, Source } from './shared'

export function Mercado({ step }: SlideProps) {
  return <Slide step={step}>
    <Heading kicker="Engenharia em diferentes setores">Sua formação abre mais caminhos</Heading>
    <div className="market-grid" style={{ marginTop: 42 }}>
      <div data-in><div className="small-label">ONDE ENGENHEIROS ATUAM</div><h2>Setor público<br />Serviços de engenharia<br />Construção</h2><p>Líderes no recorte de engenheiros típicos registrados e com carteira assinada.</p><span className="market-scope">Mútua, 2023 · base RAIS 2019<br />Estoque de vínculos, não novas vagas.</span></div>
      <div data-step="1"><div className="small-label">BANCOS E FINANÇAS</div><div className="market-number">42%</div><p>dos bancos consultados pretendem ampliar suas equipes de TI em 2026.</p><span className="market-scope">Febraban, 2026<br />IA e dados entre os perfis demandados.</span></div>
      <div data-step="2"><div className="small-label">TECNOLOGIA</div><div className="market-number">+33 mil</div><p>empregos formais projetados no macrossetor TIC para 2026.</p><span className="market-scope">Brasscom, 2026 · projeção<br />Todas as formações, além de engenharia.</span></div>
    </div>
    <p className="takeaway" data-step="2">Engenharia ensina a formular problemas e testar soluções. Com dados e IA, essa base ganha novos campos de aplicação.</p>
    <Source ids={['mutua','febraban','brasscom']} />
  </Slide>
}

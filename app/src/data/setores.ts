/**
 * Parcela de oportunidades por setor (slide "Onde estão as oportunidades").
 * Fonte: Ipea. `quatro` marca os setores em que a 4MATT atua (serviços e tecnologia).
 * "Demais setores" fica sempre por último, fora da ordenação.
 */
export const FONTE_SETORES = 'Fonte: Ipea'

export interface Setor {
  nome: string
  inclui: string
  pct: number
  quatro?: boolean
  outros?: boolean
}

export const SETORES: Setor[] = [
  { nome: 'Construção e mercado imobiliário', inclui: 'Construção, atividades imobiliárias e locação', pct: 17.88 },
  { nome: 'Serviços para empresas', inclui: 'Serviços prestados a outras empresas', pct: 15.72, quatro: true },
  { nome: 'Indústria de transformação', inclui: 'Máquinas, equipamentos elétricos, alimentos, autopeças, veículos, aço e produtos metálicos', pct: 14.06 },
  { nome: 'Energia, petróleo e saneamento', inclui: 'Eletricidade, gás, água, esgoto, limpeza urbana, petróleo e refino', pct: 11.99 },
  { nome: 'Administração pública e educação', inclui: 'Administração pública, seguridade social e educação privada', pct: 11.45 },
  { nome: 'Comércio', inclui: 'Atividades comerciais', pct: 5.78 },
  { nome: 'Tecnologia e informação', inclui: 'Setor de serviços de informação', pct: 3.97, quatro: true },
  { nome: 'Transporte e logística', inclui: 'Transporte, armazenagem e correios', pct: 2.46 },
  { nome: 'Agro e setor florestal', inclui: 'Agricultura, silvicultura e exploração florestal', pct: 1.41 },
  { nome: 'Demais setores', inclui: 'Categoria "outros serviços" e setores fora dos 20 primeiros', pct: 15.27, outros: true },
]

export const pctBR = (v: number) => v.toFixed(2).replace('.', ',') + '%'

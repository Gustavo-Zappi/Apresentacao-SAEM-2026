/**
 * Espaços de imagem da apresentação.
 *
 * Como usar: salve a imagem em app/public/imagens/ com o nome em `file` (jpg, png ou webp).
 * Sem o arquivo, o palco mostra um ícone no lugar (nada quebra). Em `npm run dev` o espaço
 * vazio mostra o nome do arquivo e a sugestão de busca, para facilitar o ensaio.
 * Preencha `credit` com a fonte (ex.: "NASA", "Wikimedia Commons, CC BY-SA 4.0").
 *
 * `hint` é só sugestão de pesquisa: confira licença e fonte de cada imagem antes de usar.
 */
export interface ImgDef {
  file: string
  alt: string
  hint: string
  credit?: string
  /** object-position da imagem (ex.: 'center top'). */
  pos?: string
  /** Arquivo em app/src/images (nome exato, com extensão). Tem prioridade sobre public/imagens. */
  src?: string
}

export const IMAGES = {
  /* ------------------------------------------------ fundos das aberturas de seção (opcionais) */
  'secao-01': { file: 'secao-01', alt: 'Engenharia e IA', hint: 'Sala de turbinas, linha de usinagem CNC ou bancada de ensaios: foto ampla e escura' },
  'secao-02': { file: 'secao-02', alt: 'Sala de controle', hint: 'Sala de controle industrial (painéis SCADA, operador): a ideia de malha fechada' },
  'secao-03': { file: 'secao-03', alt: 'Manchetes', hint: 'Pilha de jornais, rotativa de impressão ou redação de jornal' },
  'secao-04': { file: 'secao-04', alt: 'Fábrica com eixos e correias', hint: 'Fábrica c. 1900 com eixo de transmissão e correias ("line shaft", Wikimedia Commons)' },
  'secao-05': { file: 'secao-05', alt: 'Estudantes de engenharia', hint: 'Foto sua com equipe/alunos, laboratório da UFJF ou equipe de competição' },

  /* ------------------------------------------------ slide 5: IA na engenharia há décadas */
  'passado-sendai': { src: 'Metrodesundai2.jpg', file: 'passado-sendai', alt: 'Metrô de Sendai', hint: 'Metrô de Sendai, Linha Namboku, série 1000 (Wikimedia Commons)' },
  'passado-vibracao': { src: 'Ia Na manutenção mecanica.jpeg', file: 'passado-vibracao', alt: 'Análise de vibração', hint: 'Acelerômetro em mancal de motor ou espectro de vibração de máquina rotativa' },
  'passado-st5': { src: 'nasa_ST5_lg-jpg.webp', file: 'passado-st5', alt: 'Antena da NASA ST5', hint: 'NASA ST5 evolved antenna (NASA, domínio público; há cópia no Wikimedia Commons)' },
  'passado-airbus': { src: 'airbusbionica.webp', file: 'passado-airbus', alt: 'Partição biônica Airbus', hint: 'Airbus "bionic partition" A320 (sala de imprensa Airbus ou Autodesk)' },
  'passado-gm': { src: 'autodesk-gm.webp', file: 'passado-gm', alt: 'Suporte GM por design generativo', hint: 'GM seat bracket generative design Autodesk 2018 (press release GM)' },

  /* ------------------------------------------------ slides 7 e 12: nova era e manchetes */
  neuralcad: { file: 'neuralcad', alt: 'Texto para CAD', hint: 'Captura de tela do Zoo Text-to-CAD ou do Autodesk neural CAD (AU 2025)' },
  simai: { file: 'simai', alt: 'Ansys SimAI', hint: 'Captura do Ansys SimAI: campo de pressão em um carro ou peça (site Ansys)' },
  leap71: { file: 'leap71', alt: 'Motor LEAP 71', hint: 'LEAP 71 Noyron, motor de foguete impresso em cobre, teste a quente 2024' },
  copiloto: { file: 'copiloto', alt: 'Assistente de IA no CAD', hint: 'SOLIDWORKS AURA, Creo ou Siemens NX com o painel do assistente aberto' },
  trellis: { file: 'trellis', alt: 'TRELLIS.2', hint: 'Imagem de entrada e modelo 3D gerado (página do projeto TRELLIS.2, Microsoft)' },
  turbulencia: { file: 'turbulencia', alt: 'Escoamento turbulento', hint: 'Fumaça turbulenta, esteira de von Kármán ou visualização de CFD' },

  /* ------------------------------------------------ slide 19: fábrica (foto histórica em cada passo) */
  'hist-1880': { file: 'hist-1880', alt: 'Fábrica a vapor com eixo e correias', hint: 'Oficina c. 1880-1900 com eixo de transmissão no teto e correias (domínio público)' },
  'hist-1882': { file: 'hist-1882', alt: 'Dínamo de Edison', hint: 'Dínamo "Jumbo" de Edison, Pearl Street Station, 1882 (domínio público)' },
  'hist-1900': { file: 'hist-1900', alt: 'Máquina com motor individual', hint: 'Torno ou plaina com motor elétrico próprio, c. 1910 ("unit drive")' },
  'hist-1913': { file: 'hist-1913', alt: 'Linha de montagem Ford, 1913', hint: 'Ford Highland Park, linha de montagem do Model T, 1913 (domínio público)' },
  'hist-1920': { file: 'hist-1920', alt: 'Fábrica elétrica nos anos 1920', hint: 'Fábrica eletrificada dos anos 1920: galpão claro, máquinas em linha' },
  'hist-hoje': { file: 'hist-hoje', alt: 'Fábrica atual com IA', hint: 'Fábrica atual: robôs, sensores, painel de dados ou gêmeo digital' },

  /* ------------------------------------------------ slide 21: três novos gargalos */
  'gargalo-especificar': { file: 'gargalo-especificar', alt: 'Desenho técnico', hint: 'Desenho técnico com cotas e tolerâncias (de preferência um seu)' },
  'gargalo-validar': { file: 'gargalo-validar', alt: 'Metrologia', hint: 'Máquina de medição por coordenadas (CMM) ou ensaio em bancada' },
  'gargalo-governar': { file: 'gargalo-governar', alt: 'Análise de risco', hint: 'Planilha FMEA, matriz de risco ou reunião de comitê' },
} satisfies Record<string, ImgDef>

export type ImgId = keyof typeof IMAGES

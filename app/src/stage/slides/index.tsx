import { useEffect, useState, type ReactNode } from 'react'
import Poll from '../../components/Poll'
import { QUESTION_BY_ID } from '../../data/questions'
import type { SlideDef, SlideProps } from '../types'
import type { ImgId } from '../../data/images'
import { Capa, Secao } from './abertura'
import { Carreira, Faculdade } from './trajetoria'
import { Fotos3D, NovaEra, Passado } from './ia-engenharia'
import { AgenteDef, AgenteDemo } from './agentes'
import { Escala, Manchete, ManchetexFato, Mural } from './navier'
import { Ano4, FabricaHistoria } from './analogia'
import { Acoes, Carreiras, Gargalos, Obrigado, Oportunidades } from './futuro'

const poll = (id: string, qid: string, minutes: number, notes: string, kicker?: string): SlideDef => ({
  id,
  title: `Votação: ${QUESTION_BY_ID[qid].prompt}`,
  steps: 2,
  flow: 'still',
  question: qid,
  minutes,
  notes,
  Component: ({ step }) => <Poll qid={qid} step={step} kicker={kicker} />,
})

/**
 * Slide sem cliques: os passos internos do componente avançam sozinhos nos instantes `at`
 * (segundos depois de o slide abrir). Para o deck o slide tem um passo só.
 */
function auto(Comp: (p: SlideProps) => ReactNode, at: number[]) {
  return function AutoBuild() {
    const [s, setS] = useState(0)
    useEffect(() => {
      const timers = at.map((t, i) => window.setTimeout(() => setS(i + 1), t * 1000))
      return () => timers.forEach((t) => window.clearTimeout(t))
    }, [])
    return <Comp step={s} />
  }
}

const secao = (id: string, n: string, title: string, sub: string, img?: ImgId, notes?: string): SlideDef => ({
  id, title: `Seção ${n}`, steps: 1, flow: 'surge', transition: 'wipe', minutes: 0.5, notes,
  Component: ({ step }) => <Secao step={step} n={n} title={title} sub={sub} img={img} />,
})

export const SLIDES: SlideDef[] = [
  {
    id: 'capa', title: 'Capa', steps: 1, flow: 'laminar', minutes: 1,
    notes: 'Deixe no ar enquanto a plateia entra. O QR leva ao app: quem entrar agora vota na primeira pergunta.\nSe a sala permitir, reduza a luz perto da tela: o fundo escuro ganha contraste.',
    Component: Capa,
  },
  // ---------------------------------------------------------------- conexão pessoal (curta)
  {
    id: 'faculdade', title: 'Trajetória: a graduação', steps: 1, flow: 'still', minutes: 2.5,
    notes: 'Conexão, não currículo. O slide se monta sozinho (sem cliques): fale por cima.\n0. 2016, Engenharia Mecânica na UFSJ: "eu estava exatamente onde vocês estão".\n1. Trem Ki Voa: o que a equipe ensinou (prazo, projeto que precisa voar).\n2. Monitoria em 5 disciplinas: ensinar para aprender.\n3. IC em bombeamento em regime transiente lento: guarde, ela volta na demo do agente.\nFotos: app/src/images (mapeamento em src/data/fotos.ts).',
    Component: auto(Faculdade, [1.5, 2.4, 3.3]),
  },
  {
    id: 'carreira', title: 'Trajetória: CSN → TI → gestão → IA', steps: 1, flow: 'still', minutes: 3.5,
    notes: 'O slide se monta sozinho (sem cliques). Conte com suas palavras:\n1. CSN: gestão de equipamentos de grande porte. O que você aprendeu ali.\n2. Por que e como migrou para Gestão de Ativos de TI (o fio: gestão de ativos, de físicos para digitais).\n3. Pós-graduação em Gestão de Negócios pela USP: a ponte da engenharia para a gestão (antecipa as duas trilhas do slide de carreiras: tecnologia e gestão).\n4. Como se encontrou na IA. A 4MATT em uma frase: "uma empresa de serviços e tecnologia, ServiceNow Elite Partner no Brasil, que coloca IA para trabalhar dentro de grandes empresas".\nMensagem: a formação em mecânica é uma base, não uma gaiola.',
    Component: auto(Carreira, [1.5, 2.4, 3.3]),
  },
  // Pergunta ao público 1 de 2: logo depois da apresentação pessoal
  poll('p-uso', 'uso-ia', 1.5,
    'Primeira das duas perguntas ao público. "A maioria já usa. A pergunta de hoje é o que muda quando a IA deixa de responder e passa a executar."',
    'Agora é com vocês'),

  // ---------------------------------------------------------------- IA na engenharia: passado e nova era
  secao('s1', '01', 'A IA já está na engenharia', 'O que mudou é o tipo de IA.', 'secao-01'),
  {
    id: 'passado', title: 'IA na engenharia há décadas', steps: 1, flow: 'still', minutes: 3,
    notes: 'Sendai 1987 (fuzzy, Hitachi) · redes neurais em diagnóstico por vibração (anos 1990) · NASA ST5 2006 (antena por algoritmo evolutivo, voou de 22/03 a 30/06/2006) · Airbus 2015 (partição biônica, 45% mais leve) · GM 2018 (suporte 40% mais leve, 20% mais resistente, 8 peças em 1, prova de conceito).\nSem cliques: a linha do tempo se desenha e a mensagem entra sozinha.',
    Component: auto(Passado, [3.6]),
  },
  {
    id: 'fotos3d', title: 'Nova era: fotos viram 3D', steps: 3, flow: 'none', minutes: 3,
    notes: 'A animação roda sozinha: fotos → nuvem de pontos → turbina a vapor (rotor de 9 estágios, mancais e meia carcaça). É uma ilustração do conceito.\nClique 2: o modelo vira simulação: campo de temperatura do vapor de 480 °C (alta pressão) a 41,5 °C (condensador a 8 kPa), o mesmo ciclo Rankine do exemplo clássico. Gancho: escanear palhetas para reparo e engenharia reversa já é prática de manutenção.\nGaussian Splatting (SIGGRAPH 2023) reconstrói, não "gera". TRELLIS.2 (Microsoft, 12/2025, MIT) gera 3D a partir de uma imagem.\nHonestidade: precisão ainda não substitui metrologia.',
    Component: Fotos3D,
  },
  {
    id: 'novaera', title: 'Nova era: a IA propõe', steps: 4, flow: 'still', minutes: 4,
    notes: 'Um clique por linha. Números são dos fabricantes (SimAI 10-100×, LEAP 71 5 kN).\nMensagem: antes a IA otimizava dentro das nossas regras; agora ela propõe geometria, escreve código e conversa.',
    Component: NovaEra,
  },

  // ---------------------------------------------------------------- agentes
  secao('s2', '02', 'Agentes de IA', 'Da resposta à execução.', 'secao-02'),
  {
    id: 'agente-def', title: 'O que é um agente', steps: 1, flow: 'none', minutes: 3,
    notes: 'Sem cliques: o ciclo do agente se monta à esquerda (cada bloco tem uma cor) e, à direita, o mesmo ciclo acende num sistema que vocês conhecem: a malha de vazão de um bombeamento, em 3D e simulada de verdade. A cada ~11 s a válvula de gaveta fecha um pouco (perturbação), a vazão cai, o controlador sobe a frequência do inversor e a vazão volta a 30 m³/h: aponte isso na tela de tendência. Mesmas cores:\nObjetivo = setpoint 30 m³/h · Planejar = controlador (FIC/PID) · Ferramentas = inversor + bomba · Resultado = vazão na planta · Verificar = medidor de vazão (FT).\nDiferença: no agente, o controlador entende linguagem e as ferramentas são software (Python, tabelas, catálogo). Ponte com a 4MATT: "é isso que a gente faz na 4MATT: agentes que executam tarefas reais dentro das empresas, com objetivo, ferramentas e verificação".\nGancho: no próximo slide o agente dimensiona exatamente esse sistema.',
    Component: AgenteDef,
  },
  {
    id: 'agente-demo', title: 'Demo: agente dimensiona o sistema de bombeamento', steps: 9, flow: 'none', minutes: 6,
    notes: 'Um clique por item do sistema (a câmera voa até a peça, o plano no topo marca o item e o balão mostra a conta):\n0 pedido · 1 plano (números 1 a 5 na cena) · 2 fluido · 3 tubulação (linha de energia caindo) · 4 acessórios · 5 altura manométrica · 6 bomba e motor (rotor girando, curva da bomba × curva do sistema) · 7 golpe de aríete (bomba desarma, onda vermelha vai e volta no recalque, manômetro dispara) · 8 a decisão é do engenheiro.\nIDEAL: faça ao vivo (Claude ou outro assistente com execução de código) com o mesmo pedido. Este slide é o backup.\nNúmeros conferidos: água 20 °C, DN 80 (D = 77,9 mm), aço comercial ε = 0,045 mm, Colebrook, K acessórios = 8, η = 70%.\nv = 1,75 m/s · Re = 1,36·10⁵ · f = 0,0199 · hf = 4,8 m · hm = 1,25 m · H = 24,0 m · P eixo = 2,8 kW.\nJoukowsky com a ≈ 1200 m/s: ΔH ≈ 214 m (pior caso, fechamento instantâneo).\nGancho: "esse foi o tema da minha IC". A decisão de engenharia continua humana.',
    Component: AgenteDemo,
  },

  // ---------------------------------------------------------------- manchetes
  secao('s3', '03', 'As manchetes', 'E o que está por trás delas.', 'secao-03'),
  {
    id: 'mural', title: 'Mural de manchetes', steps: 2, flow: 'laminar', minutes: 1.5,
    notes: 'Passe rápido pelas manchetes. Clique: destaque para Navier-Stokes.',
    Component: Mural,
  },
  {
    id: 'manchete', title: 'Manchete Navier-Stokes', steps: 2, flow: 'turbulent', minutes: 1,
    notes: 'O fundo entra em regime turbulento de propósito. Pausa dramática.',
    Component: Manchete,
  },
  {
    id: 'fato', title: 'Manchete × fato', steps: 6, flow: 'still', minutes: 3,
    notes: 'Um clique por linha. Status de 28/10/2026: rechecar antes de subir no palco.',
    Component: ManchetexFato,
  },
  {
    id: 'escala', title: 'Escala: 10.000 agentes', steps: 1, flow: 'laminar', minutes: 1.5,
    notes: 'Conecte com a seção de agentes: isto é um sistema com milhares de agentes trabalhando em paralelo.',
    Component: auto(Escala, [3.2, 4.8]),
  },

  // ---------------------------------------------------------------- analogia da eletricidade
  secao('s4', '04', 'Já vimos esse filme', 'A eletricidade levou décadas para mudar as fábricas.', 'secao-04'),
  {
    id: 'fabrica', title: 'A fábrica: do vapor à IA (3D)', steps: 6, flow: 'none', minutes: 6,
    notes: '1880 vapor + eixo no teto + correias.\n1882→ motor elétrico no lugar do vapor, tudo igual (≈5% da força motriz em 1899).\n1900-1920 um motor por máquina: o layout segue o processo (≈50% em 1920).\n1913 linha de montagem, Ford Highland Park.\nAnos 1920: o salto, ~40 anos depois.\nHoje: plugar IA no processo antigo = motor elétrico no eixo.',
    Component: FabricaHistoria,
  },
  {
    id: 'ano4', title: 'Estamos no ano 4', steps: 1, flow: 'laminar', minutes: 2,
    notes: 'Eletricidade ≈ 40 anos; IA generativa popularizada em 11/2022 (ChatGPT) → ≈ 4 anos.\nPergunta: quem vai redesenhar a fábrica? Vocês.',
    Component: auto(Ano4, [3.6, 6.4]),
  },

  // ---------------------------------------------------------------- carreiras e fechamento
  {
    id: 'gargalos', title: 'O que a nova fábrica exige', steps: 1, flow: 'still', minutes: 3,
    notes: 'Especificar (cota e tolerância), validar (ensaio e metrologia), governar (FMEA e normas).\nGovernar, na prática da 4MATT: cada agente tem dono, escopo do que pode fazer, fontes de dados conhecidas e critério para ser desligado. É gestão de ativos aplicada a agentes.',
    Component: auto(Gargalos, [1.4, 2.3]),
  },
  secao('s5', '05', 'Quem vai redesenhar o processo', 'Frentes de carreira para quem vem da engenharia.', 'secao-05'),
  {
    id: 'oportunidades', title: 'Onde estão as oportunidades (Ipea)', steps: 3, flow: 'still', minutes: 2,
    notes: 'Fonte: Ipea (parcela por setor).\n0. As barras crescem: "Quando a gente pensa em engenharia, pensa em indústria. Mas olhem: a indústria de transformação é 14%."\n1. Destaque: serviços para empresas (15,72%) + tecnologia e informação (3,97%) = 19,69%, mais que construção (17,88%), o maior setor isolado. "Somados, serviços e tecnologia são o maior espaço de oportunidade."\n2. 4MATT: "É aqui que a 4MATT atua: serviços e tecnologia para grandes empresas. Somos ServiceNow Elite Partner no Brasil e fomos reconhecidos pela ServiceNow como melhor parceiro de excelência técnica da América Latina em 2024 e 2025. No dia a dia, colocamos agentes de IA para trabalhar com governança: exatamente os gargalos que vimos." Sem exagero: fale do trabalho, não do tamanho da empresa.',
    Component: Oportunidades,
  },
  {
    id: 'carreiras', title: 'Frentes de carreira', steps: 2, flow: 'still', minutes: 4,
    notes: 'Clique 1: trilha de gestão. Use a sua trajetória como prova.\nAs duas trilhas existem dentro da 4MATT: quem implanta e opera a tecnologia, e quem conduz a transformação nos clientes.',
    Component: Carreiras,
  },
  // Pergunta ao público 2 de 2: no fechamento
  poll('p-trilha', 'trilha', 2, 'Segunda e última pergunta ao público. Comente a frente mais votada e conecte a uma ação concreta.'),
  {
    id: 'acoes', title: 'Três ações', steps: 3, flow: 'still', minutes: 2,
    Component: Acoes,
  },
  {
    id: 'fim', title: 'Perguntas', steps: 1, flow: 'surge', transition: 'wipe', minutes: 10,
    notes: 'Perguntas da plateia. Se houver vagas ou estágio na 4MATT, mencione aqui: "se vocês gostaram desse tipo de problema, a 4MATT trabalha com isso todos os dias".',
    Component: Obrigado,
  },
]

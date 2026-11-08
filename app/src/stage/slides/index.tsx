import Poll from '../../components/Poll'
import { QUESTION_BY_ID } from '../../data/questions'
import type { SlideDef } from '../types'
import { Capa, Secao } from './abertura'
import { Carreira, Faculdade } from './trajetoria'
import { Fotos3D, NovaEra, Passado } from './ia-engenharia'
import { AgenteDef, AgenteDemo } from './agentes'
import { Escala, Manchete, ManchetexFato, Mural } from './navier'
import { Ano4, FabricaHistoria } from './analogia'
import { Acoes, Carreiras, Gargalos, Obrigado } from './futuro'

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

const secao = (id: string, n: string, title: string, sub: string, notes?: string): SlideDef => ({
  id, title: `Seção ${n}`, steps: 1, flow: 'surge', transition: 'wipe', minutes: 0.5, notes,
  Component: ({ step }) => <Secao step={step} n={n} title={title} sub={sub} />,
})

export const SLIDES: SlideDef[] = [
  {
    id: 'capa', title: 'Capa', steps: 1, flow: 'laminar', minutes: 1,
    notes: 'Deixe no ar enquanto a plateia entra. O QR leva ao app: quem entrar agora vota na primeira pergunta.\nSe a sala permitir, reduza a luz perto da tela: o fundo escuro ganha contraste.',
    Component: Capa,
  },
  poll('p-uso', 'uso-ia', 1.5,
    'Quebra-gelo. "A maioria já usa. A pergunta de hoje é o que muda quando a IA deixa de responder e passa a executar."',
    'Antes de começar'),

  // ---------------------------------------------------------------- conexão pessoal (curta)
  {
    id: 'faculdade', title: 'Trajetória: a graduação', steps: 3, flow: 'still', minutes: 2,
    notes: 'Conexão, não currículo. Um clique por item.\n1. Trem Ki Voa: o que a equipe ensinou (prazo, projeto que precisa voar).\n2. Monitoria em 5 disciplinas: ensinar para aprender.\n3. IC em bombeamento em regime transiente lento: guarde, ela volta na demo do agente.\nFotos: app/public/fotos (ver LEIA-ME.txt).',
    Component: Faculdade,
  },
  {
    id: 'carreira', title: 'Trajetória: CSN → TI → IA', steps: 3, flow: 'still', minutes: 3,
    notes: 'Conte com suas palavras:\n1. CSN: gestão de equipamentos de grande porte. O que você aprendeu ali.\n2. Por que e como migrou para Gestão de Ativos de TI (o fio: gestão de ativos, de físicos para digitais).\n3. Como se encontrou na IA.\nMensagem: a formação em mecânica é uma base, não uma gaiola.',
    Component: Carreira,
  },

  // ---------------------------------------------------------------- IA na engenharia: passado e nova era
  secao('s1', '01', 'A IA já está na engenharia', 'O que mudou é o tipo de IA.'),
  {
    id: 'passado', title: 'IA na engenharia há décadas', steps: 2, flow: 'still', minutes: 3,
    notes: 'Sendai 1987 (fuzzy, Hitachi) · redes neurais em diagnóstico por vibração (anos 1990) · NASA ST5 2006 (antena por algoritmo evolutivo, voou de 22/03 a 30/06/2006) · Airbus 2015 (partição biônica, 45% mais leve) · GM 2018 (suporte 40% mais leve, 20% mais resistente, 8 peças em 1, prova de conceito).\nClique: a mensagem.',
    Component: Passado,
  },
  {
    id: 'fotos3d', title: 'Nova era: fotos viram 3D', steps: 3, flow: 'none', minutes: 3,
    notes: 'A animação roda sozinha: fotos → nuvem de pontos → sólido. É uma ilustração do conceito.\nGaussian Splatting (SIGGRAPH 2023) reconstrói, não "gera". TRELLIS.2 (Microsoft, 12/2025, MIT) gera 3D a partir de uma imagem.\nHonestidade: precisão ainda não substitui metrologia.',
    Component: Fotos3D,
  },
  {
    id: 'novaera', title: 'Nova era: a IA propõe', steps: 4, flow: 'still', minutes: 4,
    notes: 'Um clique por linha. Números são dos fabricantes (SimAI 10-100×, LEAP 71 5 kN).\nMensagem: antes a IA otimizava dentro das nossas regras; agora ela propõe geometria, escreve código e conversa.',
    Component: NovaEra,
  },

  // ---------------------------------------------------------------- agentes
  secao('s2', '02', 'Agentes de IA', 'Da resposta à execução.'),
  {
    id: 'agente-def', title: 'O que é um agente', steps: 3, flow: 'still', minutes: 2.5,
    notes: 'Clique 1: o diagrama de malha fechada. Clique 2: a analogia com controle.\nObjetivo = setpoint · planejar = controlador · ferramentas = atuador · verificar = sensor.',
    Component: AgenteDef,
  },
  {
    id: 'agente-demo', title: 'Demo: agente dimensiona uma bomba', steps: 5, flow: 'still', minutes: 6,
    notes: 'IDEAL: faça ao vivo (Claude ou outro assistente com execução de código) com o mesmo pedido. Este slide é o backup.\nNúmeros conferidos: água 20 °C, DN 80 (D = 77,9 mm), aço comercial ε = 0,045 mm, Colebrook, K acessórios = 8, η = 70%.\nv = 1,75 m/s · Re = 1,36·10⁵ · f = 0,0199 · hf = 4,8 m · hm = 1,25 m · H = 24,0 m · P eixo = 2,8 kW.\nJoukowsky com a ≈ 1200 m/s: ΔH ≈ 214 m (pior caso, fechamento instantâneo).\nGancho: "esse foi o tema da minha IC". A decisão de engenharia continua humana.',
    Component: AgenteDemo,
  },

  // ---------------------------------------------------------------- manchetes
  secao('s3', '03', 'As manchetes', 'E o que está por trás delas.'),
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
  poll('p-ns', 'ns-manchete', 1.5, 'Tom neutro entre empresas de IA. Revele: alegação em avaliação. RECHECAR o status antes do evento.'),
  {
    id: 'fato', title: 'Manchete × fato', steps: 6, flow: 'still', minutes: 3,
    notes: 'Um clique por linha. Status de 28/10/2026: rechecar antes de subir no palco.',
    Component: ManchetexFato,
  },
  {
    id: 'escala', title: 'Escala: 10.000 agentes', steps: 3, flow: 'laminar', minutes: 1.5,
    notes: 'Conecte com a seção de agentes: isto é um sistema com milhares de agentes trabalhando em paralelo.',
    Component: Escala,
  },

  // ---------------------------------------------------------------- analogia da eletricidade
  secao('s4', '04', 'Já vimos esse filme', 'A eletricidade levou décadas para mudar as fábricas.'),
  poll('p-eletricidade', 'eletricidade', 1.5, 'Chute da plateia. Revele: ≈ 40 anos (Paul David, 1990).'),
  {
    id: 'fabrica', title: 'A fábrica: do vapor à IA (3D)', steps: 6, flow: 'none', minutes: 6,
    notes: '1880 vapor + eixo no teto + correias.\n1882→ motor elétrico no lugar do vapor, tudo igual (≈5% da força motriz em 1899).\n1900-1920 um motor por máquina: o layout segue o processo (≈50% em 1920).\n1913 linha de montagem, Ford Highland Park.\nAnos 1920: o salto, ~40 anos depois.\nHoje: plugar IA no processo antigo = motor elétrico no eixo.',
    Component: FabricaHistoria,
  },
  {
    id: 'ano4', title: 'Estamos no ano 4', steps: 3, flow: 'laminar', minutes: 2,
    notes: 'Eletricidade ≈ 40 anos; IA generativa popularizada em 11/2022 (ChatGPT) → ≈ 4 anos.\nPergunta: quem vai redesenhar a fábrica? Vocês.',
    Component: Ano4,
  },

  // ---------------------------------------------------------------- carreiras e fechamento
  {
    id: 'gargalos', title: 'O que a nova fábrica exige', steps: 3, flow: 'still', minutes: 3,
    notes: 'Especificar (cota e tolerância), validar (ensaio e metrologia), governar (FMEA e normas).',
    Component: Gargalos,
  },
  poll('p-palavra', 'palavra', 2,
    'Nuvem de palavras. Leia 3 ou 4 em voz alta. Trate ansiedade com honestidade: tarefas de nível inicial são as mais expostas.'),
  secao('s5', '05', 'Quem vai redesenhar a fábrica', 'Frentes de carreira para quem vem da mecânica.'),
  {
    id: 'carreiras', title: 'Frentes de carreira', steps: 2, flow: 'still', minutes: 4,
    notes: 'Clique 1: trilha de gestão. Use a sua trajetória como prova.',
    Component: Carreiras,
  },
  poll('p-trilha', 'trilha', 2, 'Comente a frente mais votada e conecte a uma ação concreta.'),
  {
    id: 'acoes', title: 'Três ações', steps: 3, flow: 'still', minutes: 2,
    Component: Acoes,
  },
  {
    id: 'fim', title: 'Perguntas', steps: 1, flow: 'surge', transition: 'wipe', minutes: 10,
    notes: 'Perguntas da plateia. Se houver vagas ou estágio na 4MATT, mencione aqui.',
    Component: Obrigado,
  },
]

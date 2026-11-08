import Poll from '../../components/Poll'
import { QUESTION_BY_ID } from '../../data/questions'
import type { SlideDef } from '../types'
import { Cadeiras, Capa, Secao } from './abertura'
import { Casos, Demo, Rankine } from './engenharia'
import { Escala, Licoes, Manchete, ManchetexFato } from './navier'
import { Acoes, Carreiras, FabricaEscritorio, Gargalos, Obrigado } from './futuro'

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

export const SLIDES: SlideDef[] = [
  {
    id: 'capa', title: 'Capa', steps: 1, flow: 'laminar', minutes: 1,
    notes: 'Deixe este slide no ar enquanto a plateia entra. O QR já leva ao app: quem entrar agora vota na primeira pergunta.',
    Component: Capa,
  },
  poll('p-uso', 'uso-ia', 1.5,
    'Quebra-gelo. Comente o resultado: "a maioria de vocês já usa. A pergunta é como usar sem terceirizar o raciocínio."\nClique para encerrar a votação.',
    'Antes de começar'),
  {
    id: 'cadeiras', title: 'Eu sentei nessas cadeiras', steps: 3, flow: 'laminar', minutes: 2,
    notes: 'Abertura pessoal: engenheiro mecânico que virou Head of AI. Clique 1: trajetória. Clique 2: a pergunta da palestra.',
    Component: Cadeiras,
  },
  {
    id: 's1', title: 'Seção 1', steps: 1, flow: 'surge', transition: 'wipe', minutes: 0.5,
    Component: ({ step }) => <Secao step={step} n="01" title="A IA está mudando a engenharia" sub="O cálculo virou commodity. Formular, verificar e decidir, não." />,
  },
  {
    id: 'rankine', title: 'Ciclo Rankine: o problema', steps: 3, flow: 'laminar', minutes: 2,
    notes: 'Problema clássico (Moran & Shapiro). Clique 1: domo de saturação. Clique 2: ciclo ideal 1-2-3-4. Não revele x ainda.',
    Component: Rankine,
  },
  poll('p-eta', 'rankine-eta', 1.5,
    'Chute da plateia antes da demo. Revele no clique: 37,1%. Destaque que 45% é Carnot (295 °C / 41,5 °C).'),
  {
    id: 'demo', title: 'Demo em três tempos', steps: 3, flow: 'still', minutes: 5,
    notes: 'Tempo 1: foto da tabela de vapor.\nTempo 2: ALT+TAB para a demo ao vivo (prompt para a IA). Vídeo de backup se a rede cair.\nTempo 3: "o número está certo, mas é aceitável?" e siga para a votação.\nSe a IA já sinalizar a umidade sozinha: "então o que sobra para você?" A decisão de projeto.',
    Component: Demo,
  },
  poll('p-x', 'rankine-x', 1.5,
    'x = 0,675 → 32,5% de líquido na turbina: erosão das palhetas. Revele e conecte ao próximo slide (superaquecimento e reaquecimento).'),
  {
    id: 'casos', title: 'Casos A a E', steps: 4, flow: 'still', minutes: 2.5,
    notes: 'Clique 1: superaquecimento e reaquecimento. Clique 2: casos reais (η 85%). Clique 3: a mensagem.\nTrade-off de pressão: 2 MPa η 34,3% x 0,888 · 8 MPa η 39,7% x 0,795 · 15 MPa η 41,7% x 0,744.',
    Component: Casos,
  },
  {
    id: 'manchete', title: 'Manchete Navier-Stokes', steps: 2, flow: 'turbulent', transition: 'wipe', minutes: 1,
    notes: 'O fundo entra em regime turbulento de propósito. Pausa dramática.',
    Component: Manchete,
  },
  poll('p-ns', 'ns-manchete', 1.5,
    'Tom neutro entre empresas de IA. Revele: alegação em avaliação. RECHECAR o status antes do evento.'),
  {
    id: 'fato', title: 'Manchete × fato', steps: 6, flow: 'still', minutes: 3,
    notes: 'Um clique por linha. Status de 28/10/2026: rechecar antes de subir no palco.\nMencione a declaração dos medalhistas Fields (11/09) e a crítica de Terence Tao sobre expor só a rota vencedora.',
    Component: ManchetexFato,
  },
  {
    id: 'escala', title: 'Escala', steps: 3, flow: 'laminar', minutes: 1.5,
    notes: 'Números da própria divulgação. Clique 1: Lean e custo. Clique 2: gargalos novos.',
    Component: Escala,
  },
  {
    id: 'licoes', title: 'Três lições', steps: 3, flow: 'still', minutes: 1.5,
    notes: 'Ponte entre as três camadas: engenharia → organizações → carreiras.',
    Component: Licoes,
  },
  {
    id: 's2', title: 'Seção 2', steps: 1, flow: 'surge', transition: 'wipe', minutes: 0.5,
    Component: ({ step }) => <Secao step={step} n="02" title="A IA está mudando as organizações" sub="Trabalho de conhecimento em escala industrial." />,
  },
  {
    id: 'fabrica', title: 'Fábrica e escritório', steps: 2, flow: 'laminar', minutes: 5,
    notes: 'Ligue cada item a um eixo do evento (manufatura, CAE, manutenção, energia). Casos 4MATT sempre anonimizados. Exemplos de mercado só com fonte validada.',
    Component: FabricaEscritorio,
  },
  {
    id: 'gargalos', title: 'Três novos gargalos', steps: 3, flow: 'still', minutes: 4,
    notes: 'Analogias mecânicas: tolerância, metrologia, FMEA.',
    Component: Gargalos,
  },
  poll('p-palavra', 'palavra', 2,
    'Nuvem de palavras. Leia 3 ou 4 em voz alta. Trate ansiedade com honestidade: tarefas de nível inicial são as mais expostas.'),
  {
    id: 's3', title: 'Seção 3', steps: 1, flow: 'surge', transition: 'wipe', minutes: 0.5,
    Component: ({ step }) => <Secao step={step} n="03" title="A IA está abrindo carreiras" sub="Cada gargalo novo é uma função nova." />,
  },
  {
    id: 'carreiras', title: 'Frentes de carreira', steps: 2, flow: 'laminar', minutes: 6,
    notes: 'Clique 1: trilha de gestão. Use a sua trajetória como prova.',
    Component: Carreiras,
  },
  poll('p-trilha', 'trilha', 2, 'Comente a frente mais votada e conecte a uma ação concreta.'),
  {
    id: 'acoes', title: 'Três ações', steps: 3, flow: 'laminar', minutes: 3,
    Component: Acoes,
  },
  {
    id: 'fim', title: 'Perguntas', steps: 1, flow: 'surge', transition: 'wipe', minutes: 10,
    notes: 'Perguntas da plateia. Se houver vagas ou estágio na 4MATT, mencione aqui.',
    Component: Obrigado,
  },
]

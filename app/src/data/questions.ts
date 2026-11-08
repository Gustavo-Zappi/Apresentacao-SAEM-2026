export type QuestionType = 'choice' | 'words'

export interface Option {
  id: string
  label: string
}

export interface Question {
  id: string
  type: QuestionType
  prompt: string
  /** Texto curto para o celular, se diferente do prompt do palco. */
  mobilePrompt?: string
  options?: Option[]
  /** Para perguntas-quiz: opção correta revelada no palco e no celular. */
  correct?: string
  /** Comentário exibido na revelação. */
  revealNote?: string
  placeholder?: string
}

export const QUESTIONS: Question[] = [
  {
    id: 'uso-ia',
    type: 'choice',
    prompt: 'Com que frequência você usa IA nos estudos ou no trabalho?',
    options: [
      { id: 'dia', label: 'Todo dia' },
      { id: 'semana', label: 'Toda semana' },
      { id: 'raro', label: 'De vez em quando' },
      { id: 'nunca', label: 'Nunca usei' },
    ],
  },
  {
    id: 'rankine-eta',
    type: 'choice',
    prompt: 'Rankine ideal, 8 MPa → 8 kPa, vapor saturado. Qual a eficiência térmica?',
    mobilePrompt: 'Qual a eficiência térmica do ciclo?',
    options: [
      { id: '25', label: '≈ 25%' },
      { id: '37', label: '≈ 37%' },
      { id: '45', label: '≈ 45%' },
      { id: '60', label: '≈ 60%' },
    ],
    correct: '37',
    revealNote: '37,1%. E 45% é Carnot entre as mesmas temperaturas: o teto teórico.',
  },
  {
    id: 'rankine-x',
    type: 'choice',
    prompt: 'Título x = 0,675 na saída da turbina. O que isso significa?',
    options: [
      { id: 'eta', label: 'Eficiência de 67,5%' },
      { id: 'agua', label: '32,5% de líquido: erosão nas palhetas' },
      { id: 'erro', label: 'Erro de cálculo da IA' },
      { id: 'ok', label: 'Nada relevante' },
    ],
    correct: 'agua',
    revealNote: 'A conta a IA faz. A pergunta sobre a palheta, quem faz é o engenheiro.',
  },
  {
    id: 'ns-manchete',
    type: 'choice',
    prompt: '“IA resolve Navier-Stokes.” Você acredita na manchete?',
    mobilePrompt: 'A IA resolveu Navier-Stokes?',
    options: [
      { id: 'sim', label: 'Sim, está resolvido' },
      { id: 'nao', label: 'Não, é hype' },
      { id: 'avaliacao', label: 'É uma alegação em avaliação' },
    ],
    correct: 'avaliacao',
    revealNote: 'Alegação séria, ainda sem reconhecimento do Clay Institute.',
  },
  {
    id: 'palavra',
    type: 'words',
    prompt: 'Em uma palavra: o que você sente sobre IA na sua carreira?',
    placeholder: 'Ex.: curiosidade',
  },
  {
    id: 'trilha',
    type: 'choice',
    prompt: 'Qual frente de carreira mais te atrai?',
    options: [
      { id: 'manufatura', label: 'IA na manufatura' },
      { id: 'simulacao', label: 'Simulação e gêmeo digital' },
      { id: 'confiabilidade', label: 'Manutenção preditiva' },
      { id: 'agentes', label: 'Agentes de IA' },
      { id: 'gestao', label: 'Gestão e transformação' },
      { id: 'governanca', label: 'Governança de IA' },
    ],
  },
]

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))

const BLOCKLIST = [
  'porra', 'caralho', 'merda', 'puta', 'buceta', 'cu', 'foda', 'fdp', 'viado', 'arrombado', 'cacete', 'bosta', 'pinto', 'piroca',
]

/** Normaliza uma palavra enviada pela plateia. Retorna null se inválida. */
export function normalizeWord(raw: string): string | null {
  const w = raw
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (w.length < 2 || w.length > 24) return null
  const plain = w.normalize('NFD').replace(/\p{M}/gu, '')
  if (plain.split(/[\s-]/).some((t) => BLOCKLIST.includes(t))) return null
  return w
}

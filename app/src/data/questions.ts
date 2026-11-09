export type QuestionType = 'choice' | 'words'
export interface Option { id: string; label: string }
export interface Question {
  id: string
  type: QuestionType
  prompt: string
  mobilePrompt?: string
  options?: Option[]
  correct?: string
  revealNote?: string
  placeholder?: string
}
export const QUESTIONS: Question[] = [
  {
    id: 'autonomia-bomba-v3', type: 'choice',
    prompt: 'Que autonomia você daria à IA?',
    mobilePrompt: 'No caso da bomba, que autonomia você daria à IA?',
    options: [
      { id: 'consultar', label: 'Consultar e recomendar' },
      { id: 'preparar', label: 'Preparar uma ordem' },
      { id: 'aprovar', label: 'Agir após aprovação' },
      { id: 'operar', label: 'Agir automaticamente' },
    ],
    revealNote: 'Quais evidências e consequências mudariam sua escolha?',
  },
  {
    id: 'trilha-projeto-v3', type: 'choice',
    prompt: 'Qual projeto você quer começar?',
    options: [
      { id: 'dados', label: 'Dados e simulação' },
      { id: 'agentes', label: 'Sistemas agentes' },
      { id: 'gestao', label: 'Gestão e governança' },
    ],
  },
]
export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map(q=>[q.id,q]))
const BLOCKLIST = ['porra','caralho','merda','puta','buceta','cu','foda','fdp','viado','arrombado','cacete','bosta','pinto','piroca']
export function normalizeWord(raw: string): string | null {
  const w = raw.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, ' ').trim()
  if (w.length < 2 || w.length > 24) return null
  const plain = w.normalize('NFD').replace(/\p{M}/gu, '')
  return plain.split(/[\s-]/).some(t=>BLOCKLIST.includes(t)) ? null : w
}

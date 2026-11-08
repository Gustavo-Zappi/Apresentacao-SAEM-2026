const KEY = 'saem-participant-id'

function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export function participantId(): string {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = uuid()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return uuid()
  }
}

/** Respostas já enviadas por este celular (para lembrar após recarregar a página). */
export function rememberVote(questionId: string, value: string) {
  try {
    const all = JSON.parse(localStorage.getItem('saem-votes') || '{}')
    all[questionId] = value
    localStorage.setItem('saem-votes', JSON.stringify(all))
  } catch { /* sem storage: segue sem memória */ }
}

export function recalledVote(questionId: string): string | null {
  try {
    return JSON.parse(localStorage.getItem('saem-votes') || '{}')[questionId] ?? null
  } catch {
    return null
  }
}

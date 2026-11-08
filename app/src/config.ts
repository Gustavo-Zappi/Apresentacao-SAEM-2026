export const EVENT_ID = 'saem2026'

const env = import.meta.env
export const SUPABASE_URL = (env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
export const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''
export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/** URL que a plateia acessa (vai no QR code). */
export function audienceUrl(): string {
  const base = ((env.VITE_PUBLIC_URL as string | undefined)?.trim() || window.location.origin).replace(/\/$/, '')
  return base + '/'
}

/** URL curta para exibir em texto ao lado do QR. */
export function audienceUrlLabel(): string {
  return audienceUrl().replace(/^https?:\/\//, '').replace(/\/$/, '')
}

/** Intervalo de polling do celular (ms). Polling evita o limite de conexões realtime do plano Free. */
export const AUDIENCE_POLL_MS = 2000

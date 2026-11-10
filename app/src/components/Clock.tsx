import { useEffect, useState } from 'react'

const ZONE = 'America/Sao_Paulo'

// hourCycle h23 evita "24:00:00" à meia-noite; formatToParts garante HH:MM:SS em qualquer localidade.
const FMT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function brasilia(d: Date) {
  const p: Record<string, string> = {}
  for (const part of FMT.formatToParts(d)) p[part.type] = part.value
  return { hh: p.hour, mm: p.minute, ss: p.second }
}

/**
 * Relógio digital do palco: hora oficial de Brasília, HH:MM:SS.
 * Não depende do fuso do notebook: a conversão é feita pelo navegador com a base IANA.
 * O próximo tique é agendado para a virada do segundo, então o mostrador não atrasa nem pula.
 */
export default function Clock() {
  const [t, setT] = useState(() => brasilia(new Date()))

  useEffect(() => {
    let timer = 0
    const tick = () => {
      const now = Date.now()
      setT(brasilia(new Date(now)))
      timer = window.setTimeout(tick, 1000 - (now % 1000) + 4)
    }
    tick()
    // aba em segundo plano atrasa temporizadores: ressincroniza ao voltar
    const resync = () => {
      window.clearTimeout(timer)
      tick()
    }
    document.addEventListener('visibilitychange', resync)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', resync)
    }
  }, [])

  return (
    <time className="clock" dateTime={`${t.hh}:${t.mm}:${t.ss}`} aria-label="Hora de Brasília" title="Hora de Brasília">
      {t.hh}
      <i>:</i>
      {t.mm}
      <i>:</i>
      <span>{t.ss}</span>
    </time>
  )
}

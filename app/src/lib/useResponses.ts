import { useEffect, useMemo, useState } from 'react'
import { live, type Resp } from './live'

/** Respostas de uma pergunta, ao vivo (realtime + polling de segurança). */
export function useResponses(questionId: string | undefined) {
  const [byParticipant, setByParticipant] = useState<Map<string, string>>(new Map())
  const [realtimeOk, setRealtimeOk] = useState(false)

  useEffect(() => {
    if (!questionId) return
    let alive = true
    const load = async () => {
      const list = await live.listResponses(questionId)
      if (!alive) return
      setByParticipant(new Map(list.map((r) => [r.participant_id, r.value])))
    }
    load()
    const add = (r: Resp) => {
      if (r.question_id !== questionId) return
      setByParticipant((m) => {
        if (m.get(r.participant_id) === r.value) return m
        const n = new Map(m)
        n.set(r.participant_id, r.value)
        return n
      })
    }
    const off = live.onResponse(add, setRealtimeOk)
    // polling de segurança: cobre eventos perdidos e resets
    const poll = window.setInterval(load, live.mode === 'supabase' ? 3000 : 1500)
    return () => {
      alive = false
      off()
      window.clearInterval(poll)
    }
  }, [questionId])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    byParticipant.forEach((v) => (c[v] = (c[v] || 0) + 1))
    return c
  }, [byParticipant])

  return { counts, total: byParticipant.size, realtimeOk }
}

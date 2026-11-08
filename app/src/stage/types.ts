import type { ReactNode } from 'react'
import type { FlowMode } from '../components/FlowField'

export interface SlideProps {
  step: number
}

export interface SlideDef {
  id: string
  title: string
  /** Quantidade de "cliques" dentro do slide (mínimo 1). */
  steps: number
  flow?: FlowMode
  transition?: 'fade' | 'wipe'
  /** Pergunta ao vivo: abre no passo 0 e fecha/revela no passo 1. */
  question?: string
  /** Minutos previstos (alimenta o cronômetro das notas). */
  minutes?: number
  notes?: string
  Component: (p: SlideProps) => ReactNode
}

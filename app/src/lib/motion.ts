/**
 * Vocabulário de movimento do palco. Toda animação da apresentação usa estes valores,
 * para que entradas, saídas e destaques tenham o mesmo "sotaque" em todos os slides.
 *
 * Regras:
 *  - Entrar desacelerando (out), sair acelerando (in), deslocar com inOut.
 *  - Nada quica nem treme: sem elastic/bounce.
 *  - Uma revelação por clique termina em menos de 0,8 s: o conteúdo chega antes da frase do palestrante.
 */
export const EASE = {
  /** Entradas de conteúdo. */
  out: 'power3.out',
  /** Entradas longas e títulos (freada mais suave no fim). */
  outStrong: 'expo.out',
  /** Ajustes pequenos (opacidade, cor). */
  soft: 'power2.out',
  /** Saídas. */
  in: 'power2.in',
  /** Deslocamentos, barras de progresso e câmera. */
  inOut: 'power3.inOut',
  /** Traços que "desenham" (linhas do tempo, fios de diagrama). */
  draw: 'power2.inOut',
} as const

export const DUR = {
  exit: 0.26,
  fast: 0.4,
  base: 0.65,
  slow: 0.9,
  hero: 1.05,
} as const

export const STAGGER = {
  /** Palavras de um título. */
  words: 0.045,
  /** Itens de uma lista. */
  items: 0.07,
  /** Blocos (cartões, colunas). */
  blocks: 0.1,
} as const

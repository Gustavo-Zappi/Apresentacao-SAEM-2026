/**
 * Modo projetor: compensa a perda de contraste do projetor (preto vira cinza, sombras somem).
 * - Ligado por padrão no palco; tecla C alterna; fica salvo neste navegador.
 * - `/palco?projetor=0` ou `?projetor=1` força o estado (e salva).
 * Efeitos: CSS (classe `projetor` no <html>) e reforço de exposição/preenchimento nas cenas 3D.
 */
const KEY = 'saem-projetor'
type Listener = (on: boolean) => void
const listeners = new Set<Listener>()

function initial(): boolean {
  try {
    const q = new URLSearchParams(location.search).get('projetor')
    if (q === '0' || q === '1') {
      localStorage.setItem(KEY, q)
      return q === '1'
    }
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

let on = initial()

export const projector = {
  get on() {
    return on
  },
  /** Aplica a classe CSS (chamado pelo palco ao montar). */
  apply() {
    document.documentElement.classList.toggle('projetor', on)
  },
  set(v: boolean) {
    on = v
    try {
      localStorage.setItem(KEY, v ? '1' : '0')
    } catch {
      /* ignora */
    }
    this.apply()
    listeners.forEach((f) => f(v))
  },
  toggle() {
    this.set(!on)
  },
  subscribe(f: Listener) {
    listeners.add(f)
    return () => {
      listeners.delete(f)
    }
  },
}

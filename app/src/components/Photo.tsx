import { useState, type ReactNode } from 'react'

/**
 * Foto opcional da trajetória. Mesma moldura dos demais espaços de imagem (.islot).
 * A placa com o ícone fica por baixo; a foto só aparece depois de carregar, então não há
 * ícone de imagem quebrada nem troca brusca se o arquivo não existir.
 */
export default function Photo({ src, alt, icon, height = 300 }: { src: string; alt: string; icon: ReactNode; height?: number }) {
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')
  const dev = import.meta.env.DEV && state === 'missing'
  return (
    <div className={`islot islot-empty ${dev ? 'dev' : ''}`} style={{ height, width: '100%', borderRadius: 14 }} aria-label={alt}>
      <div className="islot-icon">{icon}</div>
      {dev && <div className="islot-hint"><b>{src.replace(/^\//, '')}</b></div>}
      {state !== 'missing' && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setState('ok')}
          onError={() => setState('missing')}
          style={{ position: 'absolute', inset: 0, opacity: state === 'ok' ? 1 : 0, transition: 'opacity .5s' }}
        />
      )}
    </div>
  )
}

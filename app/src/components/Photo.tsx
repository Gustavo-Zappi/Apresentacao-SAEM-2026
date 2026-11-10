import { useState, type ReactNode } from 'react'

/** Foto opcional da trajetória: se o arquivo não existir, mostra o ícone (e o nome do arquivo em dev). */
export default function Photo({ src, alt, icon, height = 300, pos, fit = 'cover' }: { src: string; alt: string; icon: ReactNode; height?: number; pos?: string; fit?: 'cover' | 'contain' }) {
  const [ok, setOk] = useState(true)
  return (
    <div className={`photo ${fit === 'contain' ? 'photo-contain' : ''}`} style={{ height, position: 'relative' }}>
      {ok ? (
        <img src={src} alt={alt} style={{ objectFit: fit, objectPosition: pos ?? 'center' }} onError={() => setOk(false)} />
      ) : (
        <div className="photo-icon" aria-label={alt}>
          {icon}
          {import.meta.env.DEV && <div className="islot-hint"><b>{src.startsWith('/fotos/') ? `src/images/${src.slice(7)}` : src.replace(/^\//, '')}</b></div>}
        </div>
      )}
    </div>
  )
}

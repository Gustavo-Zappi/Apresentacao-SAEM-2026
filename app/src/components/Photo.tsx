import { useState, type ReactNode } from 'react'

/** Foto opcional da trajetória: se o arquivo não existir, mostra o ícone (e o nome do arquivo em dev). */
export default function Photo({ src, alt, icon, height = 300 }: { src: string; alt: string; icon: ReactNode; height?: number }) {
  const [ok, setOk] = useState(true)
  return (
    <div className="photo" style={{ height, position: 'relative' }}>
      {ok ? (
        <img src={src} alt={alt} onError={() => setOk(false)} />
      ) : (
        <div className="photo-icon" aria-label={alt}>
          {icon}
          {import.meta.env.DEV && <div className="islot-hint"><b>{src.replace(/^\//, '')}</b></div>}
        </div>
      )}
    </div>
  )
}

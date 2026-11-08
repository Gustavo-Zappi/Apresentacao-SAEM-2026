import { useState, type ReactNode } from 'react'

/** Foto opcional da trajetória: se o arquivo não existir, mostra o ícone. */
export default function Photo({ src, alt, icon, height = 300 }: { src: string; alt: string; icon: ReactNode; height?: number }) {
  const [ok, setOk] = useState(true)
  return (
    <div className="photo" style={{ height }}>
      {ok ? <img src={src} alt={alt} onError={() => setOk(false)} /> : <div className="photo-icon" aria-label={alt}>{icon}</div>}
    </div>
  )
}

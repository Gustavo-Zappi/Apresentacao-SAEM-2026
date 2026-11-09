import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { IMAGES, type ImgDef, type ImgId } from '../data/images'

const EXTS = ['jpg', 'png', 'webp', 'jpeg']
const DEV = import.meta.env.DEV

// Resultado da busca por arquivo, compartilhado entre slides (cada imagem é testada uma vez)
const found = new Map<string, Promise<string | null>>()
function probe(file: string) {
  let p = found.get(file)
  if (!p) {
    p = new Promise<string | null>((resolve) => {
      let k = 0
      const next = () => {
        if (k >= EXTS.length) return resolve(null)
        const url = `/imagens/${file}.${EXTS[k++]}`
        const img = new Image()
        img.onload = () => resolve(url)
        img.onerror = next
        img.src = url
      }
      next()
    })
    found.set(file, p)
  }
  return p
}

/**
 * Espaço reservado para uma imagem que o palestrante adiciona em public/imagens/.
 * - Procura <file>.jpg, .png, .webp e .jpeg, nessa ordem, fora da tela.
 * - Sem arquivo: ícone (ou nada, se `optional`). Em dev, mostra o nome e a sugestão de busca.
 * - `credit` do manifesto aparece discreto no canto.
 */
export default function ImageSlot({
  id,
  icon,
  height,
  width = '100%',
  optional = false,
  fit = 'cover',
  radius = 14,
  className = '',
  style,
}: {
  id: ImgId
  icon?: ReactNode
  height: number | string
  width?: number | string
  optional?: boolean
  fit?: 'cover' | 'contain'
  radius?: number
  className?: string
  style?: CSSProperties
}) {
  const def: ImgDef = IMAGES[id]
  const [url, setUrl] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    probe(def.file).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [def.file])
  const box: CSSProperties = { width, height, borderRadius: radius, ...style }

  if (!url) {
    if (optional && (!DEV || url === undefined)) return null
    return (
      <div className={`islot islot-empty ${DEV && url === null ? 'dev' : ''} ${className}`} style={box} aria-label={def.alt}>
        {icon && <div className="islot-icon">{icon}</div>}
        {DEV && url === null && (
          <div className="islot-hint">
            <b>imagens/{def.file}.jpg</b>
            <span>{def.hint}</span>
          </div>
        )}
      </div>
    )
  }
  return (
    <div className={`islot ${className}`} style={box}>
      <img src={url} alt={def.alt} style={{ objectFit: fit, objectPosition: def.pos ?? 'center' }} />
      {def.credit && <span className="islot-credit">{def.credit}</span>}
    </div>
  )
}

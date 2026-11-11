/**
 * Fotos pessoais dos slides de trajetória (#2 e #3).
 *
 * Coloque os arquivos em app/src/images/ (jpg, png ou webp). Cada espaço procura, nesta ordem:
 *   1. o arquivo indicado abaixo em FOTO_ARQUIVO (nome dentro de src/images, sem a pasta);
 *   2. um arquivo em src/images com o mesmo nome do espaço (ex.: ufsj.jpg);
 *   3. public/fotos/<espaço>.jpg (formato antigo).
 * Sem nenhum deles, o card mostra um ícone.
 */
export const FOTO_ARQUIVO: Record<string, string> = {
  // espaço: 'arquivo-em-src-images.jpg'
  // slide 2: graduação
  ufsj: 'ufsj_csa_fachada_2016.jpg',
  'trem-ki-voa': 'TKV5Camisas.jpg',
  ic: 'Iniciaçãocientifica.png',
  // slide 3: carreira
  csn: 'CSN2.jpg',
  'ativos-ti': '4MATT2 - gestão de ativos de TI.webp',
  usp: 'MBA usp.png',
  ia: 'AI 1.jpg',
}

/** Enquadramento por espaço: `pos` = object-position; `fit: 'contain'` mostra a imagem inteira (ex.: documento). */
export const FOTO_AJUSTE: Record<string, { pos?: string; fit?: 'cover' | 'contain' }> = {
  ic: { fit: 'contain' },
  usp: { pos: 'center 35%' },
  ia: { pos: 'center 18%' },
}

// Vite empacota as imagens de src/images (o build da VPS leva junto, com hash no nome)
const files = import.meta.glob('../images/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const norm = (f: string) => f.normalize('NFC').toLowerCase()
const byFile = new Map<string, string>()
const byBase = new Map<string, string>()
for (const [path, url] of Object.entries(files)) {
  const file = path.split('/').pop()!
  byFile.set(norm(file), url)
  byBase.set(file.replace(/\.[^.]+$/, '').toLowerCase(), url)
}

/** URL da foto do espaço `slot`, ou o caminho antigo em public/fotos. */
export function fotoUrl(slot: string): string {
  const mapped = FOTO_ARQUIVO[slot]
  if (mapped && byFile.has(norm(mapped))) return byFile.get(norm(mapped))!
  return byBase.get(slot.toLowerCase()) ?? `/fotos/${slot}.jpg`
}

/** URL de um arquivo de src/images pelo nome exato (sem diferenciar maiúsculas), ou undefined. */
export function srcImageUrl(file: string): string | undefined {
  return byFile.get(norm(file))
}

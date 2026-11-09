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
  // ufsj: 'formatura-2016.jpg',
}

// Vite empacota as imagens de src/images (o build da VPS leva junto, com hash no nome)
const files = import.meta.glob('../images/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const byFile = new Map<string, string>()
const byBase = new Map<string, string>()
for (const [path, url] of Object.entries(files)) {
  const file = path.split('/').pop()!
  byFile.set(file.toLowerCase(), url)
  byBase.set(file.replace(/\.[^.]+$/, '').toLowerCase(), url)
}

/** URL da foto do espaço `slot`, ou o caminho antigo em public/fotos. */
export function fotoUrl(slot: string): string {
  const mapped = FOTO_ARQUIVO[slot]
  if (mapped && byFile.has(mapped.toLowerCase())) return byFile.get(mapped.toLowerCase())!
  return byBase.get(slot.toLowerCase()) ?? `/fotos/${slot}.jpg`
}

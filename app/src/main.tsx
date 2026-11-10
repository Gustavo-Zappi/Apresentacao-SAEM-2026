import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { SplitText } from 'gsap/SplitText'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
// Fontes servidas pelo próprio site (a CSP da VPS bloqueia Google Fonts)
import '@fontsource/poppins/latin-300.css'
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-500.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-700.css'
import '@fontsource/poppins/latin-800.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-600.css'
import './styles.css'

gsap.registerPlugin(useGSAP, SplitText, DrawSVGPlugin)
// Palco guiado por cliques: uma instrução nova para a mesma propriedade substitui a anterior.
// Sem isso, dois cliques rápidos deixam animações antigas disputando o estado final do slide.
gsap.defaults({ overwrite: 'auto' })

// Ensaio/testes: acesso ao GSAP pelo console (só em `npm run dev`).
if (import.meta.env.DEV) (window as unknown as { gsap: typeof gsap }).gsap = gsap

// Rotas: "/" plateia (celular) · "/palco" apresentação · "/notas" notas · "/status" diagnóstico
const Audience = lazy(() => import('./audience/Audience'))
const Deck = lazy(() => import('./stage/Deck'))
const Notes = lazy(() => import('./stage/Notes'))
const Status = lazy(() => import('./status/Status'))

const path = location.pathname.replace(/\/+$/, '') || '/'
const Page = path === '/palco' ? Deck : path === '/notas' ? Notes : path === '/status' ? Status : Audience

document.body.dataset.route = path

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </StrictMode>,
)

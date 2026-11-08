import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { SplitText } from 'gsap/SplitText'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import './styles.css'

gsap.registerPlugin(useGSAP, SplitText, DrawSVGPlugin)

// Rotas: "/" plateia (celular) · "/palco" apresentação · "/notas" notas do apresentador
const Audience = lazy(() => import('./audience/Audience'))
const Deck = lazy(() => import('./stage/Deck'))
const Notes = lazy(() => import('./stage/Notes'))

const path = location.pathname.replace(/\/+$/, '') || '/'
const Page = path === '/palco' ? Deck : path === '/notas' ? Notes : Audience

document.body.dataset.route = path

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </StrictMode>,
)

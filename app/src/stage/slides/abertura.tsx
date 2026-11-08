import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Slide from '../../components/Slide'
import QR from '../../components/QR'
import { audienceUrl, audienceUrlLabel } from '../../config'
import { SPEAKER, TRAJETORIA } from '../speaker'
import type { SlideProps } from '../types'

export function Capa({ step }: SlideProps) {
  return (
    <Slide step={step}>
      <div className="kicker" data-in>II SAEM · Engenharia Mecânica · UFJF · 11/11/2026</div>
      <h1 className="h-display" data-split style={{ maxWidth: 1300, marginTop: 120 }}>
        De Rankine a <span className="accent">Navier-Stokes</span>
      </h1>
      <p className="lead" data-in style={{ marginTop: 40, maxWidth: 1100 }}>
        A IA na engenharia, nas empresas e na sua carreira
      </p>
      <div data-in style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 28 }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>{SPEAKER.name}</div>
          <div className="muted" style={{ fontSize: 22, marginTop: 6 }}>{SPEAKER.role}</div>
        </div>
      </div>
      <div data-in style={{ position: 'absolute', right: 128, bottom: 96, width: 330, textAlign: 'center' }}>
        <div className="qr-card" style={{ padding: 22, borderRadius: 22 }}>
          <QR url={audienceUrl()} />
          <div className="url" style={{ fontSize: 20 }}>{audienceUrlLabel()}</div>
        </div>
        <div className="muted mono" style={{ fontSize: 18, marginTop: 16, letterSpacing: '0.08em' }}>
          ENTRE AGORA · VAMOS VOTAR
        </div>
      </div>
    </Slide>
  )
}

export function Cadeiras({ step }: SlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (step < 1) return
      gsap.fromTo('.traj-line', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.6, ease: 'power2.inOut' })
      gsap.fromTo('.traj-node', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.7, ease: 'back.out(2)', stagger: 0.35, delay: 0.2 })
    },
    { scope: ref, dependencies: [step] },
  )
  const n = TRAJETORIA.length
  const xs = TRAJETORIA.map((_, i) => 80 + (i * 1500) / Math.max(1, n - 1))
  return (
    <Slide step={step} className="center">
      <div ref={ref} style={{ width: '100%' }}>
        <h1 className="h-display" data-split>Eu sentei nessas cadeiras.</h1>
        <div data-step="1" style={{ marginTop: 110 }}>
          <svg viewBox="0 0 1660 220" width="1660" height="220" style={{ overflow: 'visible' }}>
            <path className="traj-line" d={`M ${xs[0]} 60 L ${xs[n - 1]} 60`} stroke="#9156F1" strokeWidth="4" fill="none" />
            {TRAJETORIA.map((t, i) => (
              <g key={t.label}>
                <circle className="traj-node" cx={xs[i]} cy={60} r={i === n - 1 ? 26 : 18} fill={i === n - 1 ? '#9156F1' : '#201E4B'} stroke="#9156F1" strokeWidth="4" />
                <text x={xs[i]} y={140} textAnchor="middle" fill="#fff" fontSize="34" fontWeight="600" fontFamily="Poppins">{t.label}</text>
                <text x={xs[i]} y={186} textAnchor="middle" fill="rgba(255,255,255,.6)" fontSize="24" fontFamily="Poppins">{t.detail}</text>
              </g>
            ))}
          </svg>
        </div>
        <p className="lead" data-step="2" style={{ marginTop: 70 }}>
          Hoje a pergunta não é <i>se</i> a IA chega na engenharia. É <span className="accent">o que sobra para você</span>.
        </p>
      </div>
    </Slide>
  )
}

export function Secao({ step, n, title, sub }: SlideProps & { n: string; title: string; sub: string }) {
  return (
    <Slide step={step}>
      <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
        <div className="mono accent" data-in style={{ fontSize: 260, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.05em', opacity: 0.9 }}>{n}</div>
        <h1 className="h-display" data-split style={{ maxWidth: 1500, marginTop: 24 }}>{title}</h1>
        <p className="lead" data-in style={{ marginTop: 32 }}>{sub}</p>
      </div>
    </Slide>
  )
}

import type { ReactNode } from 'react'
import { SOURCES, type SourceId } from '../../data/sources'

export function Heading({ kicker, children }: { kicker: string; children: ReactNode }) {
  return <><div className="kicker" data-in>{kicker}</div><h1 className="h1" data-split>{children}</h1></>
}
export function Source({ ids, note }: { ids: SourceId[]; note?: string }) {
  return <div className="slide-source" data-in>
    {note && <span>{note} · </span>}
    {ids.map((id, i) => <span key={id}>{i > 0 && ' · '}<a href={SOURCES[id].url} target="_blank" rel="noreferrer">{SOURCES[id].label}</a></span>)}
  </div>
}
/** Esquema didático do sistema que acompanha a narrativa. */
export function PumpSystem({ active = false }: { active?: boolean }) {
  return <svg className="pump-system" viewBox="0 0 1000 410" role="img" aria-label="Reservatório de sucção, bomba e reservatório de recalque com desnível">
    <path d="M50 160 V340 H250 V160 M770 50 V220 H950 V50" fill="none" stroke="#CBB3FF" strokeWidth="6" />
    <path d="M54 242 H246 V336 H54 Z M774 122 H946 V216 H774 Z" fill="rgba(145,86,241,.25)" />
    <path d="M250 290 H400 M520 290 H670 V165 H770" fill="none" stroke="#FFFFFF" strokeWidth="12" strokeLinejoin="round" />
    <circle cx="460" cy="290" r="60" fill="#58178B" stroke="#CBB3FF" strokeWidth="5" />
    <path d="M437 260 L493 290 L437 320 Z" fill="#FFFFFF" />
    <path d="M650 290 H710 M680 260 V320" stroke="#CBB3FF" strokeWidth="5" />
    <path d="M720 166 V288 M710 178 L720 166 L730 178 M710 276 L720 288 L730 276" stroke="#CBB3FF" strokeWidth="3" fill="none" />
    <text x="130" y="215" textAnchor="middle" fill="#FFFFFF" fontSize="30">Água</text>
    <text x="590" y="359" textAnchor="middle" fill="#CBB3FF" fontSize="30">DN 80 · 120 m</text>
    <text x="765" y="270" fill="#CBB3FF" fontSize="30">18 m</text>
    <text x="460" y="398" textAnchor="middle" fill="#FFFFFF" fontSize="30">Bomba</text>
    {active && <><circle cx="560" cy="290" r="10" fill="#FFFFFF"><animateMotion dur="2.6s" repeatCount="indefinite" path="M0 0 H110 V-125 H210" /></circle><text x="860" y="95" textAnchor="middle" fill="#FFFFFF" fontSize="30">30 m³/h</text></>}
  </svg>
}

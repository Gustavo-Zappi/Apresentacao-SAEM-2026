import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

/**
 * Ilustrações em traço das aberturas de seção (viewBox 800×800). Os traços se desenham
 * sozinhos (DrawSVG) e depois ganham um movimento lento: a engrenagem gira, o pulso do agente
 * percorre a malha, as correias correm, o compasso traça o arco.
 */
const S = 'art-stroke'

function gearPath(cx: number, cy: number, teeth: number, rOut: number, rIn: number) {
  const step = (Math.PI * 2) / teeth
  let d = ''
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const pts: [number, number][] = [
      [rIn, a],
      [rOut, a + step * 0.16],
      [rOut, a + step * 0.46],
      [rIn, a + step * 0.62],
    ]
    pts.forEach(([r, ang], k) => {
      const x = (cx + Math.cos(ang) * r).toFixed(1)
      const y = (cy + Math.sin(ang) * r).toFixed(1)
      d += `${i === 0 && k === 0 ? 'M' : 'L'} ${x} ${y} `
    })
  }
  return d + 'Z'
}

/** 01 · engrenagem com uma rede neural dentro */
function Art1() {
  const L = [
    [[285, 330], [285, 400], [285, 470]],
    [[400, 300], [400, 367], [400, 433], [400, 500]],
    [[515, 360], [515, 440]],
  ]
  const lines: ReactNode[] = []
  for (let l = 0; l < 2; l++)
    for (const a of L[l]) for (const b of L[l + 1]) lines.push(<line key={`${a}-${b}`} className={S} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={2} opacity={0.55} />)
  return (
    <>
      <g className="art-spin" style={{ transformOrigin: '400px 400px' }}>
        <path className={S} d={gearPath(400, 400, 18, 318, 282)} strokeWidth={3.5} />
        <circle className={S} cx={400} cy={400} r={236} strokeWidth={2.5} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          return <circle key={i} className={S} cx={400 + Math.cos(a) * 258} cy={400 + Math.sin(a) * 258} r={9} strokeWidth={2.5} />
        })}
      </g>
      {lines}
      {L.flat().map(([x, y], i) => (
        <circle key={i} className={`${S} art-node ${i % 3 === 1 ? 'hot' : ''}`} cx={x} cy={y} r={15} strokeWidth={3} />
      ))}
    </>
  )
}

/** 02 · a malha fechada do agente */
function Art2() {
  const R = 250
  const nodes = [
    { a: -90, icon: 'M 0 -22 A 22 22 0 1 1 -0.1 -22 M 0 -11 A 11 11 0 1 1 -0.1 -11' },
    { a: 0, icon: 'M -20 -16 H -12 M -5 -16 H 20 M -20 0 H -12 M -5 0 H 15 M -20 16 H -12 M -5 16 H 20' },
    { a: 90, icon: 'M 12 -20 A 10 10 0 1 0 20 -12 L 12 -5 L 5 -12 Z M 7 -7 L -17 17' },
    { a: 180, icon: 'M -20 12 A 22 22 0 1 1 20 12 M 0 5 L 11 -11' },
  ]
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [400 + Math.cos((a * Math.PI) / 180) * R, 400 + Math.sin((a * Math.PI) / 180) * R]
    const [x0, y0] = p(a0 + 17)
    const [x1, y1] = p(a1 - 17)
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`
  }
  return (
    <>
      <circle cx={400} cy={400} r={R} className="art-ghost" />
      {nodes.map((n, i) => {
        const nx = nodes[(i + 1) % 4]
        const a1 = nx.a + (nx.a <= n.a ? 360 : 0)
        const end = ((a1 - 17) * Math.PI) / 180
        const ex = 400 + Math.cos(end) * R
        const ey = 400 + Math.sin(end) * R
        const tang = (a1 - 17 + 90) % 360
        return (
          <g key={i}>
            <path className={S} d={arc(n.a, a1)} strokeWidth={3.5} />
            <path className={S} d="M -16 -10 L 0 0 L -16 10" transform={`translate(${ex.toFixed(1)} ${ey.toFixed(1)}) rotate(${tang})`} strokeWidth={3.5} />
          </g>
        )
      })}
      {nodes.map((n, i) => {
        const x = 400 + Math.cos((n.a * Math.PI) / 180) * R
        const y = 400 + Math.sin((n.a * Math.PI) / 180) * R
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            <circle className={`${S} art-node`} r={56} strokeWidth={3.5} />
            <path className={S} d={n.icon} strokeWidth={3.5} transform="scale(1.4)" />
          </g>
        )
      })}
      <circle className={S} cx={400} cy={400} r={46} strokeWidth={3} />
      <path className={S} d="M 382 400 H 418 M 400 382 V 418" strokeWidth={3} />
      <circle className="art-orbit" r={12} cx={400} cy={150} style={{ transformOrigin: '400px 400px' }} />
    </>
  )
}

/** 03 · jornal com a manchete e uma foto de escoamento turbulento */
function Art3() {
  const spiral = (cx: number, cy: number, turns: number, r: number) => {
    let d = ''
    for (let t = 0; t <= turns * 40; t++) {
      const a = (t / 40) * Math.PI * 2
      const rr = (t / (turns * 40)) * r
      d += `${t ? 'L' : 'M'} ${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `
    }
    return d
  }
  return (
    <g transform="rotate(-6 400 400)">
      <rect className={S} x={140} y={90} width={520} height={640} rx={6} strokeWidth={3.5} />
      <path className={S} d="M 170 150 H 630 M 170 160 H 630" strokeWidth={2.5} />
      <path className={S} d="M 270 128 H 530" strokeWidth={9} />
      <path className={S} d="M 175 205 H 625 M 175 245 H 520" strokeWidth={16} />
      <rect className={S} x={175} y={285} width={240} height={190} strokeWidth={3} />
      <path className={`${S} hot`} d={spiral(250, 380, 3.2, 58)} strokeWidth={2.5} />
      <path className={`${S} hot`} d={spiral(345, 370, 2.6, 44)} strokeWidth={2.5} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} className={S} d={`M 440 ${295 + i * 26} H ${i % 3 === 2 ? 560 : 625}`} strokeWidth={4} opacity={0.6} />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path key={`b${i}`} className={S} d={`M 175 ${505 + i * 26} H ${i % 4 === 3 ? 330 : 395} M 425 ${505 + i * 26} H ${i % 3 === 1 ? 560 : 625}`} strokeWidth={4} opacity={0.6} />
      ))}
    </g>
  )
}

/** 04 · fábrica com teto em shed, eixo de transmissão e correias; raio = eletricidade */
function Art4() {
  const px = [210, 330, 450, 570]
  return (
    <>
      <path className={S} d="M 90 300 L 210 190 V 300 L 330 190 V 300 L 450 190 V 300 L 570 190 V 300 L 690 190 V 300" strokeWidth={3.5} />
      <path className={S} d="M 90 300 V 640 H 710 V 300" strokeWidth={3.5} />
      <path className={S} d="M 60 640 H 740" strokeWidth={3} />
      <path className={S} d="M 110 360 H 690" strokeWidth={4} />
      {px.map((x) => (
        <g key={x}>
          <circle className={`${S} art-pulley`} cx={x} cy={360} r={22} strokeWidth={3} style={{ transformOrigin: `${x}px 360px` }} />
          <path className={`${S} art-belt`} d={`M ${x - 20} 368 L ${x - 34} 540 M ${x + 20} 368 L ${x + 6} 540`} strokeWidth={2.5} />
          <rect className={S} x={x - 60} y={540} width={90} height={60} rx={4} strokeWidth={3} />
          <path className={S} d={`M ${x - 52} 600 V 640 M ${x + 22} 600 V 640`} strokeWidth={3} />
        </g>
      ))}
      <path className={S} d="M 40 640 V 120 H 80 V 640" strokeWidth={3} />
      <path className={`${S} art-smoke`} d="M 60 110 C 40 80 90 70 70 40 C 55 20 95 10 80 -15" strokeWidth={3} />
      <path className={`${S} hot`} d="M 640 70 L 590 170 H 632 L 600 260 L 690 140 H 645 L 680 70 Z" strokeWidth={3.5} />
    </>
  )
}

/** 05 · prancheta: grade, peça cotada e compasso traçando um arco */
function Art5() {
  const grid: ReactNode[] = []
  for (let i = 0; i <= 10; i++) {
    grid.push(<path key={`h${i}`} className="art-grid" d={`M 100 ${100 + i * 60} H 700`} />)
    grid.push(<path key={`v${i}`} className="art-grid" d={`M ${100 + i * 60} 100 V 700`} />)
  }
  return (
    <>
      {grid}
      <path className={S} d="M 180 560 V 360 H 330 L 420 450 H 560 V 560 Z" strokeWidth={4} />
      <circle className={S} cx={255} cy={460} r={36} strokeWidth={3.5} />
      <path className={S} d="M 180 610 H 560 M 180 596 V 624 M 560 596 V 624" strokeWidth={2.5} />
      <path className={S} d="M 196 604 L 180 610 L 196 616 M 544 604 L 560 610 L 544 616" strokeWidth={2.5} />
      <path className={S} d="M 610 450 V 560 M 596 450 H 624 M 596 560 H 624" strokeWidth={2.5} />
      <path className={`${S} hot art-arc`} d="M 470 250 A 170 170 0 0 1 640 420" strokeWidth={3.5} />
      <g className="art-compass" style={{ transformOrigin: '470px 420px' }}>
        <path className={S} d="M 470 420 L 520 170 L 560 380" strokeWidth={4} />
        <circle className={S} cx={520} cy={170} r={12} strokeWidth={3.5} />
        <path className={S} d="M 520 158 V 120" strokeWidth={4} />
      </g>
    </>
  )
}

const ARTS: Record<string, () => ReactNode> = { '01': Art1, '02': Art2, '03': Art3, '04': Art4, '05': Art5 }

export default function SectionArt({ n }: { n: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const Art = ARTS[n]
  useGSAP(
    () => {
      const strokes = gsap.utils.toArray<SVGElement>('.art-stroke', ref.current!)
      const tl = gsap.timeline({ delay: 0.5 })
      tl.fromTo(strokes, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.5, stagger: { amount: 1.1 }, ease: 'power2.inOut' })
      const nodes = gsap.utils.toArray<SVGElement>('.art-node', ref.current!)
      if (nodes.length) tl.fromTo(nodes, { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.6, stagger: 0.05 }, '-=0.6')
      const extra = gsap.utils.toArray<SVGElement>('.art-ghost, .art-grid, .art-orbit', ref.current!)
      if (extra.length) tl.fromTo(extra, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 0.2)
      tl.add(() => ref.current?.classList.add('live'))
    },
    { scope: ref },
  )
  if (!Art) return null
  return (
    <svg ref={ref} className="section-art" viewBox="0 0 800 800" aria-hidden>
      <Art />
    </svg>
  )
}

import { useEffect, useRef } from 'react'
import Slide from '../../components/Slide'
import { Factory } from '../../three/factory'
import type { SlideProps } from '../types'

const SCENES = [
  { engine: 0, label: 'FORÇA CENTRAL', title: 'Uma fábrica organizada em torno do eixo', text: 'Correias levam a potência até as máquinas. O arranjo físico acompanha a transmissão.' },
  { engine: 1, label: 'ELETRIFICAÇÃO', title: 'O motor muda. O arranjo permanece.', text: 'Trocar a fonte de força conserva boa parte do processo anterior.' },
  { engine: 3, label: 'REDESENHO', title: 'Motores distribuídos permitem outro fluxo', text: 'Máquinas podem acompanhar a sequência de produção. Processos e competências também mudam.' },
]
export function FabricaHistoria({ step }: SlideProps) {
  const host = useRef<HTMLDivElement>(null)
  const fac = useRef<Factory | null>(null)
  useEffect(()=>{
    const f = new Factory(host.current!,1920,1080,380)
    fac.current=f
    return ()=>{ f.dispose(); fac.current=null }
  },[])
  useEffect(()=>{fac.current?.setStep(SCENES[Math.min(step,2)].engine)},[step])
  const s=SCENES[Math.min(step,2)]
  return <Slide step={step} className="no-pad">
    <div ref={host} className="scene3d" />
    <div className="factory-caption" key={step}>
      <div className="small-label">{s.label}</div><h1>{s.title}</h1><p>{s.text}</p>
      <p className="factory-link">{step===2 ? 'Com IA, integração, aprendizagem e organização do trabalho também precisam mudar.' : 'Analogia histórica simplificada para discutir a transformação dos processos.'}</p>
    </div>
    <div className="factory-steps">{SCENES.map((scene,i)=><span key={scene.label} className={i===step?'active':''}>{i+1} · {scene.label}</span>)}</div>
    <div className="slide-source">Investimentos complementares: Brynjolfsson, Rock e Syverson (2021). Referência no material de apoio.</div>
  </Slide>
}

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import gsap from 'gsap'

/**
 * "De fotos a modelo 3D": câmeras ao redor disparam, a nuvem de pontos se forma
 * e vira uma engrenagem sólida. Ilustração do conceito (fotogrametria / IA 3D),
 * não uma reconstrução real.
 */
const PHASES = ['Fotos', 'Nuvem de pontos', 'Modelo 3D']

function gearShape(teeth = 14, rOut = 1.6, rIn = 1.32, rHole = 0.42) {
  const s = new THREE.Shape()
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const pts = [
      [rIn, a],
      [rOut, a + step * 0.18],
      [rOut, a + step * 0.48],
      [rIn, a + step * 0.66],
    ] as const
    pts.forEach(([r, ang], k) => {
      const x = Math.cos(ang) * r
      const y = Math.sin(ang) * r
      if (i === 0 && k === 0) s.moveTo(x, y)
      else s.lineTo(x, y)
    })
  }
  s.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, 0, rHole, 0, Math.PI * 2, true)
  s.holes.push(hole)
  // furos de alívio
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const h = new THREE.Path()
    h.absarc(Math.cos(a) * 0.88, Math.sin(a) * 0.88, 0.2, 0, Math.PI * 2, true)
    s.holes.push(h)
  }
  return s
}

export default function PartCloud({ size = 860 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const host = ref.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(size, size)
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 2.4, 8.2)
    camera.lookAt(0, 0, 0)
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(4, 6, 5)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x9156f1, 3)
    rim.position.set(-5, -2, -4)
    scene.add(rim)

    const group = new THREE.Group()
    group.rotation.x = -0.55
    scene.add(group)

    // peça
    const geo = new THREE.ExtrudeGeometry(gearShape(), { depth: 0.5, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 24 })
    geo.center()
    const mat = new THREE.MeshStandardMaterial({ color: 0xd9d6f0, metalness: 0.55, roughness: 0.32, transparent: true, opacity: 0 })
    const mesh = new THREE.Mesh(geo, mat)
    group.add(mesh)

    // câmeras ("fotos") ao redor
    const N_CAM = 8
    const frames: THREE.LineSegments[] = []
    const camPos: THREE.Vector3[] = []
    for (let i = 0; i < N_CAM; i++) {
      const a = (i / N_CAM) * Math.PI * 2
      const p = new THREE.Vector3(Math.cos(a) * 3.9, 0.9 + Math.sin(a * 2) * 0.6, Math.sin(a) * 3.9)
      camPos.push(p)
      const f = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.95, 0.68)),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }),
      )
      f.position.copy(p)
      f.lookAt(0, 0, 0)
      scene.add(f)
      frames.push(f)
    }

    // nuvem de pontos: cada ponto sai de uma "foto" e pousa na superfície
    const N = 4200
    const sampler = new MeshSurfaceSampler(mesh).build()
    const target = new Float32Array(N * 3)
    const start = new Float32Array(N * 3)
    const delay = new Float32Array(N)
    const tmp = new THREE.Vector3()
    group.updateMatrixWorld(true)
    for (let i = 0; i < N; i++) {
      sampler.sample(tmp)
      target.set([tmp.x, tmp.y, tmp.z], i * 3)
      const c = i % N_CAM
      const local = group.worldToLocal(camPos[c].clone())
      start.set([local.x + (Math.random() - 0.5) * 0.5, local.y + (Math.random() - 0.5) * 0.4, local.z + (Math.random() - 0.5) * 0.5], i * 3)
      delay[i] = c / N_CAM + Math.random() * 0.15
    }
    const pos = new Float32Array(start)
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const pMat = new THREE.PointsMaterial({ color: 0xcbb3ff, size: 0.045, transparent: true, opacity: 0 })
    const points = new THREE.Points(pGeo, pMat)
    group.add(points)

    const st = { t: 0 }
    const tl = gsap.timeline({ delay: 0.6 })
    frames.forEach((f, i) => {
      tl.to(f.material, { opacity: 1, duration: 0.08 }, i * 0.14)
      tl.to(f.material, { opacity: 0.35, duration: 0.5 }, i * 0.14 + 0.1)
    })
    tl.call(() => setPhase(1), [], 1.2)
    tl.to(pMat, { opacity: 1, duration: 0.4 }, 1.1)
    tl.to(st, { t: 1, duration: 2.6, ease: 'power2.inOut' }, 1.2)
    tl.call(() => setPhase(2), [], 3.9)
    tl.to(mat, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 3.9)
    tl.to(pMat, { opacity: 0.18, duration: 1.2 }, 3.9)
    frames.forEach((f) => tl.to(f.material, { opacity: 0.12, duration: 1 }, 4))

    let raf = 0
    const clock = new THREE.Clock()
    const render = () => {
      const dt = clock.getDelta()
      group.rotation.z += dt * 0.25
      if (st.t > 0 && st.t < 1.001) {
        for (let i = 0; i < N; i++) {
          let k = (st.t * 1.6 - delay[i]) / 0.6
          k = k < 0 ? 0 : k > 1 ? 1 : k
          const e = k * k * (3 - 2 * k)
          const j = i * 3
          pos[j] = start[j] + (target[j] - start[j]) * e
          pos[j + 1] = start[j + 1] + (target[j + 1] - start[j + 1]) * e
          pos[j + 2] = start[j + 2] + (target[j + 2] - start[j + 2]) * e
        }
        pGeo.attributes.position.needsUpdate = true
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(raf)
      tl.kill()
      renderer.dispose()
      geo.dispose()
      pGeo.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [size])

  return (
    <div style={{ width: size }}>
      <div ref={ref} style={{ width: size, height: size }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: -30 }}>
        {PHASES.map((p, i) => (
          <span
            key={p}
            className="mono"
            style={{
              fontSize: 26, fontWeight: 700, padding: '10px 18px', borderRadius: 8,
              background: i === phase ? 'var(--c-purple)' : 'rgba(255,255,255,.08)',
              color: '#fff', transition: 'background .4s',
            }}
          >
            {i + 1} · {p}
          </span>
        ))}
      </div>
    </div>
  )
}

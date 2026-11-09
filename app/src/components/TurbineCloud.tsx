import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import gsap from 'gsap'

/**
 * "De fotos a modelo 3D" com uma turbina a vapor: câmeras ao redor disparam, a nuvem de pontos
 * se forma, vira o sólido (rotor de 9 estágios, mancais e meia carcaça) e, com `sim`, recebe um
 * campo de temperatura do vapor ao longo dos estágios. Ilustração do conceito, não uma reconstrução real.
 *
 * Temperaturas do campo: ciclo Rankine do conceito da palestra (8 MPa, 480 °C → condensador a 8 kPa, 41,5 °C).
 */
const PHASES = ['Fotos', 'Nuvem de pontos', 'Modelo 3D', 'Simulação']
const T_IN = 480
const T_OUT = 41.5

/* ------------------------------------------------------------------ geometria */

const STAGES = 9
const X0 = -1.75 // primeiro estágio (alta pressão)
const X1 = 1.55 // último estágio (baixa pressão)
const stageX = (k: number) => X0 + ((X1 - X0) * k) / (STAGES - 1)
const discR = (k: number) => 0.36 + 0.025 * k
const bladeL = (k: number) => 0.09 + 0.95 * Math.pow(k / (STAGES - 1), 1.8)
const tipR = (k: number) => discR(k) + bladeL(k)

/** Palheta torcida: caixa com segmentos ao longo do raio, girada de a0 (raiz) a a1 (ponta). */
function blade(chord: number, len: number, thick: number, a0: number, a1: number) {
  const g = new THREE.BoxGeometry(chord, len, thick, 1, 6, 1)
  const p = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i)
    const t = (y + len / 2) / len
    const a = a0 + (a1 - a0) * t
    const x = p.getX(i)
    const z = p.getZ(i)
    p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a))
  }
  g.computeVertexNormals()
  return g
}

/** Cilindro com eixo em X. */
function cylX(r: number, len: number, x: number, seg = 40, open = false) {
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, open)
  g.rotateZ(Math.PI / 2)
  g.translate(x, 0, 0)
  return g
}

function buildRotor() {
  const parts: THREE.BufferGeometry[] = []
  parts.push(cylX(0.14, 5.5, 0.05, 32)) // eixo
  parts.push(cylX(0.42, 0.28, -2.05)) // pistão de balanceamento
  parts.push(cylX(0.3, 0.06, -2.3)) // colar de escora
  parts.push(cylX(0.34, 0.09, 2.62)) // flange de acoplamento
  for (let b = 0; b < 8; b++) {
    const a = (b / 8) * Math.PI * 2
    const bolt = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10)
    bolt.rotateZ(Math.PI / 2)
    bolt.translate(2.62, Math.cos(a) * 0.25, Math.sin(a) * 0.25)
    parts.push(bolt)
  }
  for (let k = 0; k < STAGES; k++) {
    const x = stageX(k)
    const rd = discR(k)
    const L = bladeL(k)
    const chord = 0.085 + 0.018 * k
    parts.push(cylX(rd, 0.13 + 0.01 * k, x))
    const n = Math.round(64 - 3.6 * k)
    const proto = blade(chord, L, 0.022, 0.35, 0.35 + 0.9 * (k / (STAGES - 1)))
    const m = new THREE.Matrix4()
    for (let i = 0; i < n; i++) {
      const phi = (i / n) * Math.PI * 2
      const g = proto.clone()
      m.makeRotationX(phi)
      m.setPosition(x, Math.cos(phi) * (rd + L / 2), Math.sin(phi) * (rd + L / 2))
      g.applyMatrix4(m)
      parts.push(g)
    }
    proto.dispose()
    // cinta nas pontas dos estágios de alta pressão
    if (k < 5) parts.push(cylX(rd + L + 0.012, chord * 1.05, x, 64, true))
  }
  const geo = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  return geo
}

/** Meia carcaça inferior (vista em corte) com flange de junta horizontal. */
function buildCasing() {
  const prof: THREE.Vector2[] = []
  const xs = [-2.3, -2.1]
  for (let k = 0; k < STAGES; k++) xs.push(stageX(k))
  xs.push(1.85, 2.0)
  const rAt = (x: number) => {
    if (x <= X0) return 0.62
    if (x >= X1 + 0.3) return tipR(STAGES - 1) + 0.12
    const k = Math.min(STAGES - 1, Math.max(0, ((x - X0) / (X1 - X0)) * (STAGES - 1)))
    const k0 = Math.floor(k)
    const f = k - k0
    return tipR(k0) * (1 - f) + tipR(Math.min(STAGES - 1, k0 + 1)) * f + 0.1
  }
  prof.push(new THREE.Vector2(0.2, -2.3))
  for (let i = 0; i <= 60; i++) {
    const x = -2.3 + (4.3 * i) / 60
    prof.push(new THREE.Vector2(rAt(x), x))
  }
  prof.push(new THREE.Vector2(0.2, 2.0))
  const shell = new THREE.LatheGeometry(prof, 56, 0, Math.PI)
  shell.rotateZ(-Math.PI / 2)
  // flange da junta horizontal (plano y = 0), dos dois lados
  const flanges: THREE.BufferGeometry[] = []
  for (const side of [1, -1]) {
    const sh = new THREE.Shape()
    const N = 40
    for (let i = 0; i <= N; i++) {
      const x = -2.3 + (4.3 * i) / N
      const r = rAt(x)
      if (i === 0) sh.moveTo(x, r)
      else sh.lineTo(x, r)
    }
    for (let i = N; i >= 0; i--) {
      const x = -2.3 + (4.3 * i) / N
      sh.lineTo(x, rAt(x) + 0.16)
    }
    const g = new THREE.ShapeGeometry(sh, 2)
    g.rotateX(Math.PI / 2)
    if (side < 0) g.scale(1, 1, -1)
    flanges.push(g)
  }
  const geo = mergeGeometries([shell, ...flanges])!
  shell.dispose()
  flanges.forEach((f) => f.dispose())
  return geo
}

function buildBearings() {
  const parts: THREE.BufferGeometry[] = []
  for (const x of [-2.55, 2.32]) {
    const body = new THREE.BoxGeometry(0.34, 0.5, 0.7)
    body.translate(x, -0.3, 0)
    const cap = new THREE.CylinderGeometry(0.3, 0.3, 0.34, 28, 1, false, 0, Math.PI)
    cap.rotateZ(Math.PI / 2)
    cap.rotateX(-Math.PI / 2)
    cap.translate(x, -0.05, 0)
    const foot = new THREE.BoxGeometry(0.5, 0.12, 0.95)
    foot.translate(x, -0.6, 0)
    parts.push(body, cap, foot)
  }
  const geo = mergeGeometries(parts.map((p) => p.toNonIndexed()))!
  parts.forEach((p) => p.dispose())
  return geo
}

/* ------------------------------------------------------------------ cor do campo */

const RAMP = [
  { t: 0, c: new THREE.Color('#ffe9a8') },
  { t: 0.18, c: new THREE.Color('#ffb547') },
  { t: 0.42, c: new THREE.Color('#ff6a3d') },
  { t: 0.66, c: new THREE.Color('#c23ea8') },
  { t: 0.85, c: new THREE.Color('#7a4cf0') },
  { t: 1, c: new THREE.Color('#3b6fe0') },
]
function ramp(t: number, out: THREE.Color) {
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i].t) {
      const a = RAMP[i - 1]
      const b = RAMP[i]
      return out.copy(a.c).lerp(b.c, (t - a.t) / (b.t - a.t))
    }
  }
  return out.copy(RAMP[RAMP.length - 1].c)
}

export default function TurbineCloud({ size = 860, sim = false }: { size?: number; sim?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0)
  const simRef = useRef<(on: boolean) => void>(() => {})

  useEffect(() => {
    const host = ref.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(size, size)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex
    scene.environmentIntensity = 0.55

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
    camera.position.set(0, 2.9, 9.2)
    camera.lookAt(0, -0.15, 0)
    scene.add(new THREE.AmbientLight(0xffffff, 0.35))
    const key = new THREE.DirectionalLight(0xffffff, 2.0)
    key.position.set(4, 7, 5)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x9156f1, 3.2)
    rim.position.set(-6, -1, -5)
    scene.add(rim)

    // grupo do conjunto: inclinado e girando devagar como uma mesa giratória
    const group = new THREE.Group()
    group.rotation.set(0.16, -0.62, 0.08)
    scene.add(group)
    const rotorPivot = new THREE.Group()
    group.add(rotorPivot)

    const rotorGeo = buildRotor()
    const casingGeo = buildCasing()
    const bearingGeo = buildBearings()

    // amostragem da nuvem: tudo junto (o que as fotos "veem")
    const sampleGeo = mergeGeometries([rotorGeo.toNonIndexed(), casingGeo.toNonIndexed(), bearingGeo])!
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(sampleGeo)).build()

    // cores por vértice do rotor (aço → campo de temperatura)
    const pos = rotorGeo.attributes.position as THREE.BufferAttribute
    const steel = new THREE.Color('#b9bdd0')
    const colors = new Float32Array(pos.count * 3)
    const field = new Float32Array(pos.count * 3)
    const xv = new Float32Array(pos.count)
    const tmp = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      xv[i] = x
      // temperatura cai ao longo da expansão (forma ilustrativa)
      const s = Math.min(1, Math.max(0, (x - (X0 - 0.15)) / (X1 + 0.15 - (X0 - 0.15))))
      const T = T_OUT + (T_IN - T_OUT) * Math.pow(1 - s, 1.5)
      ramp(1 - (T - T_OUT) / (T_IN - T_OUT), tmp)
      field.set([tmp.r, tmp.g, tmp.b], i * 3)
      colors.set([steel.r, steel.g, steel.b], i * 3)
    }
    rotorGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const rotorMat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.75, roughness: 0.3, transparent: true, opacity: 0 })
    const casingMat = new THREE.MeshStandardMaterial({ color: 0x5b5f7a, metalness: 0.55, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    const bearingMat = new THREE.MeshStandardMaterial({ color: 0x3c3f58, metalness: 0.5, roughness: 0.55, transparent: true, opacity: 0 })
    const rotor = new THREE.Mesh(rotorGeo, rotorMat)
    rotorPivot.add(rotor)
    group.add(new THREE.Mesh(casingGeo, casingMat), new THREE.Mesh(bearingGeo, bearingMat))

    // câmeras ("fotos") em elipse ao redor do conjunto
    const N_CAM = 10
    const frames: THREE.LineSegments[] = []
    const camPos: THREE.Vector3[] = []
    for (let i = 0; i < N_CAM; i++) {
      const a = (i / N_CAM) * Math.PI * 2
      const p = new THREE.Vector3(Math.cos(a) * 4.3, 1.1 + Math.sin(a * 2) * 0.7, Math.sin(a) * 3.3)
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
    const N = 9000
    const target = new Float32Array(N * 3)
    const start = new Float32Array(N * 3)
    const delay = new Float32Array(N)
    const v = new THREE.Vector3()
    group.updateMatrixWorld(true)
    for (let i = 0; i < N; i++) {
      sampler.sample(v)
      target.set([v.x, v.y, v.z], i * 3)
      const c = i % N_CAM
      const local = group.worldToLocal(camPos[c].clone())
      start.set([local.x + (Math.random() - 0.5) * 0.5, local.y + (Math.random() - 0.5) * 0.4, local.z + (Math.random() - 0.5) * 0.5], i * 3)
      delay[i] = c / N_CAM + Math.random() * 0.15
    }
    sampleGeo.dispose()
    const ppos = new Float32Array(start)
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3))
    const pMat = new THREE.PointsMaterial({ color: 0xcbb3ff, size: 0.032, transparent: true, opacity: 0, depthWrite: false })
    group.add(new THREE.Points(pGeo, pMat))

    const st = { t: 0, spin: 0, sweep: -1 }
    const tl = gsap.timeline({ delay: 0.6 })
    frames.forEach((f, i) => {
      tl.to(f.material, { opacity: 1, duration: 0.08 }, i * 0.12)
      tl.to(f.material, { opacity: 0.35, duration: 0.5 }, i * 0.12 + 0.1)
    })
    tl.call(() => setPhase(1), [], 1.2)
    tl.to(pMat, { opacity: 0.95, duration: 0.4 }, 1.1)
    tl.to(st, { t: 1, duration: 2.8, ease: 'power2.inOut' }, 1.2)
    tl.call(() => setPhase((p) => Math.max(p, 2)), [], 4.1)
    tl.to([rotorMat, casingMat, bearingMat], { opacity: 1, duration: 1.2, ease: 'power2.out' }, 4.1)
    tl.to(pMat, { opacity: 0, duration: 1.4 }, 4.6)
    tl.to(st, { spin: 0.45, duration: 2.5, ease: 'power1.in' }, 5)
    frames.forEach((f) => tl.to(f.material, { opacity: 0.1, duration: 1 }, 4.2))

    // campo de temperatura: varre do estágio de alta para o de baixa pressão
    simRef.current = (on: boolean) => {
      gsap.killTweensOf(st, 'sweep')
      if (on) {
        setPhase(3)
        // garante o sólido visível mesmo se o clique vier antes do fim da animação
        gsap.to([rotorMat, bearingMat], { opacity: 1, duration: 0.6 })
        gsap.to(casingMat, { opacity: 0.28, duration: 1 })
        gsap.to(st, { sweep: 3, duration: 2.2, ease: 'power1.inOut' })
      } else {
        setPhase((p) => (p === 3 ? 2 : p))
        gsap.to(casingMat, { opacity: rotorMat.opacity, duration: 0.6 })
        gsap.to(st, { sweep: -1, duration: 0.6 })
      }
    }

    let lastSweep = -99
    let raf = 0
    const timer = new THREE.Timer()
    timer.connect(document)
    const render = (now?: number) => {
      timer.update(now)
      const dt = Math.min(timer.getDelta(), 0.05)
      const t = timer.getElapsed()
      group.rotation.y = -0.62 + Math.sin(t * 0.22) * 0.32
      rotorPivot.rotation.x += dt * st.spin
      if (st.t > 0 && st.t < 1.001) {
        for (let i = 0; i < N; i++) {
          let k = (st.t * 1.6 - delay[i]) / 0.6
          k = k < 0 ? 0 : k > 1 ? 1 : k
          const e = k * k * (3 - 2 * k)
          const j = i * 3
          ppos[j] = start[j] + (target[j] - start[j]) * e
          ppos[j + 1] = start[j + 1] + (target[j + 1] - start[j + 1]) * e
          ppos[j + 2] = start[j + 2] + (target[j + 2] - start[j + 2]) * e
        }
        pGeo.attributes.position.needsUpdate = true
      }
      // frente de cor: x < frente recebe o campo (transição suave de 0,5)
      if (Math.abs(st.sweep - lastSweep) > 1e-3) {
        lastSweep = st.sweep
        const front = X0 - 0.9 + st.sweep * 1.6
        for (let i = 0; i < xv.length; i++) {
          let w = (front - xv[i]) / 0.5
          w = w < 0 ? 0 : w > 1 ? 1 : w
          const j = i * 3
          colors[j] = steel.r + (field[j] - steel.r) * w
          colors[j + 1] = steel.g + (field[j + 1] - steel.g) * w
          colors[j + 2] = steel.b + (field[j + 2] - steel.b) * w
        }
        rotorGeo.attributes.color.needsUpdate = true
        rotorMat.metalness = 0.75 - 0.45 * Math.min(1, Math.max(0, st.sweep / 3))
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(raf)
      timer.dispose()
      tl.kill()
      gsap.killTweensOf([st, rotorMat, casingMat, bearingMat, pMat])
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mm = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mm)) mm.forEach((x) => x.dispose())
        else mm?.dispose()
      })
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [size])

  useEffect(() => {
    simRef.current(sim)
  }, [sim])

  return (
    <div style={{ width: size, position: 'relative' }}>
      <div ref={ref} style={{ width: size, height: size }} />
      <div className="sim-legend" style={{ opacity: phase === 3 ? 1 : 0 }}>
        <div className="mono">TEMPERATURA DO VAPOR</div>
        <div className="bar" />
        <div className="ends mono"><span>{T_IN} °C entrada</span><span>{String(T_OUT).replace('.', ',')} °C escape</span></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: -34 }}>
        {PHASES.map((p, i) => (
          <span
            key={p}
            className="mono"
            style={{
              fontSize: 22, fontWeight: 700, padding: '10px 14px', borderRadius: 8, whiteSpace: 'nowrap',
              background: i === phase ? (i === 3 ? '#FF6A3D' : 'var(--c-purple)') : 'rgba(255,255,255,.08)',
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

import * as THREE from 'three'
import gsap from 'gsap'

/**
 * Fábrica 3D para a analogia da eletrificação (Paul David, 1990).
 * Passos: 0 vapor · 1 motor elétrico no lugar do vapor · 2 um motor por máquina (layout do processo)
 *         3 linha de montagem (1913) · 4 salto de produtividade (anos 1920) · 5 hoje: IA
 * Cores e espessuras pensadas para projetor: sólidos claros, correias âmbar grossas, sem linhas finas.
 */

const C = {
  floor: 0x221d52,
  floorAI: 0x34206e,
  machine: 0xc9cce0,
  head: 0x8f93b3,
  belt: 0xffb547,
  steel: 0x6c6f8a,
  boiler: 0x4a4458,
  fire: 0xff7a1a,
  purple: 0x9156f1,
  purpleDeep: 0x58178b,
  item: 0xff9a3c,
  person: 0xe8e6f5,
}

const ROW = [-9, -4.5, 0, 4.5].flatMap((x) => [
  { x, z: -3.4 },
  { x, z: 3.4 },
])
const LINE = Array.from({ length: 8 }, (_, i) => ({ x: -10.5 + i * 3, z: -2.4 }))

const CAMS: { p: [number, number, number]; t: [number, number, number] }[] = [
  { p: [3, 14, 27], t: [8, 4, 0] },
  { p: [5, 7.5, 14], t: [13, 3, 0] },
  { p: [13, 14, 15], t: [0, 1, 0] },
  { p: [15, 7, 11], t: [0, 1, 0] },
  { p: [2, 20, 22], t: [0, 0, 0] },
  { p: [0, 18, 19], t: [0, 0, 0] },
]

function mat(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.2, ...extra })
}

export class Factory {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  // fábrica espelhada: a casa de força fica à direita da tela, longe da legenda
  private root = new THREE.Group()
  private camera: THREE.PerspectiveCamera
  private camTarget = new THREE.Vector3(-2, 2, 0)
  private raf = 0
  private clock = new THREE.Clock()
  private step = -1
  private speed = { shaft: 1, smoke: 1, line: 0, agents: 0 }
  private floorMat = mat(C.floor, { roughness: 0.9 })

  private steam = new THREE.Group()
  private bigMotor = new THREE.Group()
  private bigMotorMat = mat(C.purpleDeep, { emissive: C.purple, emissiveIntensity: 0.6 })
  private flywheel = new THREE.Group()
  private shaftSys = new THREE.Group()
  private pulleys: THREE.Object3D[] = []
  private belts: THREE.Mesh[] = []
  private machines: THREE.Group[] = []
  private unitMotors: THREE.Mesh[] = []
  private conveyor = new THREE.Group()
  private items: THREE.Mesh[] = []
  private people = new THREE.Group()
  private agents: THREE.Mesh[] = []
  private smoke: THREE.Mesh[] = []

  constructor(private host: HTMLElement, width: number, height: number, shiftX = 0) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    this.renderer.setSize(width, height)
    host.appendChild(this.renderer.domElement)
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200)
    // desloca o enquadramento para a direita, deixando espaço para a legenda
    if (shiftX) this.camera.setViewOffset(width, height, -shiftX, 0, width, height)
    this.camera.position.set(...CAMS[0].p)
    this.camera.lookAt(this.camTarget)
    this.build()
    this.loop()
  }

  private build() {
    this.root.rotation.y = Math.PI
    this.scene.add(this.root)
    const s = this.root
    this.scene.add(new THREE.HemisphereLight(0xdcd6ff, 0x1a1640, 1.4))
    const sun = new THREE.DirectionalLight(0xffffff, 2.2)
    sun.position.set(10, 18, 12)
    this.scene.add(sun)

    const floor = new THREE.Mesh(new THREE.BoxGeometry(34, 0.4, 16), this.floorMat)
    floor.position.y = -0.2
    s.add(floor)

    // máquinas-ferramenta
    ROW.forEach((p) => {
      const g = new THREE.Group()
      const base = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1.1), mat(C.machine))
      base.position.y = 0.5
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.9), mat(C.head))
      head.position.set(-0.6, 1.35, 0)
      const pul = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 20), mat(C.steel))
      pul.rotation.z = Math.PI / 2
      pul.position.set(0.5, 1.35, 0)
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.7, 20), mat(C.purpleDeep, { emissive: C.purple, emissiveIntensity: 0.9 }))
      motor.rotation.z = Math.PI / 2
      motor.position.set(0.55, 1.35, 0)
      motor.scale.setScalar(0.001)
      motor.visible = false
      this.unitMotors.push(motor)
      g.add(base, head, pul, motor)
      g.position.set(p.x, 0, p.z)
      s.add(g)
      this.machines.push(g)
    })

    // eixo de transmissão no teto, polias e correias
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 27, 16), mat(C.steel, { metalness: 0.6 }))
    shaft.rotation.z = Math.PI / 2
    shaft.position.set(-1, 5.4, 0)
    this.shaftSys.add(shaft)
    for (let i = 0; i < 4; i++) {
      const x = -9 + i * 4.5
      const pul = new THREE.Group()
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 24), mat(C.steel, { metalness: 0.6 }))
      disk.rotation.z = Math.PI / 2
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.0, 0.16), mat(C.belt))
      pul.add(disk, spoke)
      pul.position.set(x + 0.5, 5.4, 0)
      this.pulleys.push(pul)
      this.shaftSys.add(pul)
      // pendurais
      const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.6, 0.18), mat(C.steel))
      hanger.position.set(x - 1.2, 6.3, 0)
      this.shaftSys.add(hanger)
      for (const z of [-3.4, 3.4]) {
        const a = new THREE.Vector3(x + 0.5, 5.4, 0)
        const b = new THREE.Vector3(x + 0.5, 1.35, z)
        const len = a.distanceTo(b)
        const belt = new THREE.Mesh(new THREE.BoxGeometry(0.28, len, 0.12), mat(C.belt, { emissive: C.belt, emissiveIntensity: 0.15 }))
        belt.position.copy(a.clone().add(b).multiplyScalar(0.5))
        belt.lookAt(b)
        belt.rotateX(Math.PI / 2)
        this.belts.push(belt)
        this.shaftSys.add(belt)
      }
    }
    s.add(this.shaftSys)

    // volante (comum ao vapor e ao motor elétrico grande) + correia até o eixo
    const fw = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.28, 12, 40), mat(C.steel, { metalness: 0.7 }))
    fw.rotation.y = Math.PI / 2
    const fwSpoke = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.8, 0.3), mat(C.steel))
    const fwSpoke2 = fwSpoke.clone()
    fwSpoke2.rotation.x = Math.PI / 2
    const fwHub = new THREE.Group()
    fwHub.add(fwSpoke, fwSpoke2)
    this.flywheel.add(fw, fwHub)
    this.flywheel.position.set(-13.4, 2.6, 0)
    const drive = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.14), mat(C.belt))
    drive.position.set(-13.4, 5.0, 0)
    this.shaftSys.add(drive)
    s.add(this.flywheel)

    // máquina a vapor: caldeira, fornalha, chaminé
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 3.6, 24), mat(C.boiler, { metalness: 0.4 }))
    boiler.rotation.z = Math.PI / 2
    boiler.position.set(-15, 1.2, -3.6)
    const fire = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.0), mat(C.fire, { emissive: C.fire, emissiveIntensity: 1.4 }))
    fire.position.set(-13.2, 0.6, -3.6)
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 10, 16), mat(0x3a3548))
    chimney.position.set(-16.2, 5, -4.6)
    const cyl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), mat(C.boiler))
    cyl.position.set(-14.8, 0.9, 0)
    this.steam.add(boiler, fire, chimney, cyl)
    for (let i = 0; i < 26; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshStandardMaterial({ color: 0xbfbccc, transparent: true, opacity: 0.55, roughness: 1 }))
      puff.position.set(-16.2, 10 + Math.random() * 6, -4.6)
      puff.userData.t = Math.random()
      this.smoke.push(puff)
      this.steam.add(puff)
    }
    s.add(this.steam)

    // grande motor elétrico (passo 1): substitui o vapor, mantém eixo e correias
    const bm = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 2.4, 28), this.bigMotorMat)
    bm.rotation.z = Math.PI / 2
    const bmBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 2), mat(C.steel))
    bmBase.position.y = -1.2
    this.bigMotor.add(bm, bmBase)
    this.bigMotor.position.set(-15, 1.45, 0)
    this.bigMotor.scale.setScalar(0.001)
    this.bigMotor.visible = false
    s.add(this.bigMotor)

    // linha de montagem (passo 3)
    const belt = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 1.6), mat(0x3b3760))
    belt.position.set(0, 0.45, 0)
    this.conveyor.add(belt)
    for (let i = 0; i < 9; i++) {
      const it = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.0), mat(C.item, { emissive: C.item, emissiveIntensity: 0.25 }))
      it.position.set(-12 + i * 3, 0.95, 0)
      this.items.push(it)
      this.conveyor.add(it)
    }
    this.conveyor.scale.setScalar(0.001)
    this.conveyor.visible = false
    s.add(this.conveyor)
    LINE.forEach((p) => {
      const person = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.9, 6, 12), mat(C.person))
      person.position.set(p.x, 1.0, 2.0)
      this.people.add(person)
    })
    this.people.scale.setScalar(0.001)
    this.people.visible = false
    s.add(this.people)

    // agentes de IA (passo 5)
    for (let i = 0; i < 10; i++) {
      const a = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshStandardMaterial({ color: 0xcbb3ff, emissive: C.purple, emissiveIntensity: 2 }))
      a.userData.phase = (i / 10) * Math.PI * 2
      a.visible = false
      this.agents.push(a)
      s.add(a)
    }
  }

  private show(obj: THREE.Object3D, on: boolean, d = 0.8) {
    if (on) {
      obj.visible = true
      gsap.to(obj.scale, { x: 1, y: 1, z: 1, duration: d, ease: 'back.out(1.6)' })
    } else if (obj.visible) {
      gsap.to(obj.scale, { x: 0.001, y: 0.001, z: 0.001, duration: d * 0.6, ease: 'power2.in', onComplete: () => { obj.visible = false } })
    }
  }

  setStep(step: number) {
    if (step === this.step) return
    this.step = step
    const cam = CAMS[Math.min(step, CAMS.length - 1)]
    gsap.to(this.camera.position, { x: cam.p[0], y: cam.p[1], z: cam.p[2], duration: 2.2, ease: 'power2.inOut' })
    gsap.to(this.camTarget, { x: cam.t[0], y: cam.t[1], z: cam.t[2], duration: 2.2, ease: 'power2.inOut' })

    this.show(this.steam, step === 0)
    this.show(this.bigMotor, step === 1)
    this.show(this.flywheel, step <= 1)
    this.show(this.shaftSys, step <= 1, 1)
    this.unitMotors.forEach((m, i) => gsap.delayedCall(step >= 2 ? 0.8 + i * 0.08 : 0, () => this.show(m, step >= 2, 0.5)))
    this.show(this.conveyor, step >= 3)
    this.show(this.people, step >= 3)
    this.agents.forEach((a) => (a.visible = step >= 5))

    const layout = step <= 1 ? ROW : LINE
    this.machines.forEach((m, i) => {
      gsap.to(m.position, { x: layout[i].x, z: layout[i].z, duration: 1.6, delay: step >= 2 ? 0.6 + i * 0.05 : 0, ease: 'power3.inOut' })
    })
    gsap.to(this.speed, { shaft: step <= 1 ? 1 : 0, smoke: step === 0 ? 1 : 0, line: step >= 3 ? (step >= 4 ? 2.2 : 1) : 0, agents: step >= 5 ? 1 : 0, duration: 1 })
    gsap.to(this.bigMotorMat, { emissiveIntensity: step === 1 ? 1.2 : 0.6, duration: 1 })
    const fc = new THREE.Color(step >= 5 ? C.floorAI : C.floor)
    gsap.to(this.floorMat.color, { r: fc.r, g: fc.g, b: fc.b, duration: 1.5 })
  }

  private loop = () => {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime
    const w = this.speed.shaft * dt * 5
    this.pulleys.forEach((p) => (p.rotation.x += w))
    this.flywheel.children[1].rotation.x += w * 0.5
    this.smoke.forEach((p) => {
      p.userData.t += dt * 0.25 * this.speed.smoke
      if (p.userData.t > 1) p.userData.t = 0
      const k = p.userData.t
      p.position.set(-16.2 + k * 3, 10 + k * 7, -4.6 - k * 1.5)
      p.scale.setScalar(0.5 + k * 1.8)
      ;(p.material as THREE.MeshStandardMaterial).opacity = 0.6 * (1 - k) * this.speed.smoke
    })
    this.items.forEach((it) => {
      it.position.x += dt * 2.2 * this.speed.line
      if (it.position.x > 13) it.position.x -= 27
    })
    this.agents.forEach((a, i) => {
      const ph = a.userData.phase + t * 0.6
      const st = LINE[i % LINE.length]
      a.position.set(st.x + Math.sin(ph * 2) * 1.5, 3.2 + Math.sin(ph) * 0.8, Math.cos(ph) * 2.8)
      a.scale.setScalar(this.speed.agents * (0.9 + 0.2 * Math.sin(t * 4 + i)))
    })
    this.camera.lookAt(this.camTarget)
    this.renderer.render(this.scene, this.camera)
    this.raf = requestAnimationFrame(this.loop)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    gsap.killTweensOf([this.camera.position, this.camTarget, this.speed])
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose()
      const mm = m.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mm)) mm.forEach((x) => x.dispose())
      else mm?.dispose()
    })
    this.renderer.dispose()
    this.host.removeChild(this.renderer.domElement)
  }
}

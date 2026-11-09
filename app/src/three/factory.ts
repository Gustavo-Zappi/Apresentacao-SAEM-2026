import * as THREE from 'three'
import gsap from 'gsap'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Fábrica 3D da analogia da eletrificação (Paul David, 1990), com acabamento realista:
 * PBR, sombras, mapa de ambiente, bloom, névoa e texturas procedurais (tijolo, assoalho, couro).
 *
 * Passos: 0 vapor (máquina horizontal com biela-manivela, caldeira, eixo no teto e correias)
 *         1 motor elétrico no lugar do vapor (eixo e correias continuam)
 *         2 um motor por máquina: sem eixo, layout na ordem do processo, lâmpadas elétricas
 *         3 linha de montagem (Ford, 1913): o chassi é montado ao longo da linha
 *         4 salto de produtividade (anos 1920): a linha acelera
 *         5 hoje: sensores, rede de dados e um "núcleo" de agentes de IA
 *
 * Qualidade: `?q=baixa` na URL desliga sombras e bloom (notebook fraco).
 */

/* ================================================================== utilidades */

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, color = true) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  draw(cv.getContext('2d')!)
  const t = new THREE.CanvasTexture(cv)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  return t
}

/** Peça com cor própria, para assar várias peças numa única malha (cores por vértice). */
type PartDef = [THREE.BufferGeometry, number, THREE.Matrix4?]
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
function T(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), new THREE.Vector3(sx, sy, sz))
}
function bake(parts: PartDef[]) {
  const geos = parts.map(([g, hex, mtx]) => {
    const gg = g.index ? g.clone() : g.clone()
    if (mtx) gg.applyMatrix4(mtx)
    const c = new THREE.Color(hex)
    const n = gg.attributes.position.count
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3)
    gg.setAttribute('color', new THREE.BufferAttribute(arr, 3))
    if (!gg.index) gg.setIndex([...Array(n).keys()])
    if (!gg.attributes.uv) gg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2))
    return gg
  })
  const out = mergeGeometries(geos)!
  geos.forEach((g) => g.dispose())
  parts.forEach(([g]) => g.dispose())
  return out
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)
const cyl = (r: number, h: number, seg = 24, r2?: number) => new THREE.CylinderGeometry(r2 ?? r, r, h, seg)
/** Cilindro com eixo em X. */
const cylX = (r: number, h: number, seg = 24) => cyl(r, h, seg).rotateZ(Math.PI / 2)
/** Cilindro com eixo em Z. */
const cylZ = (r: number, h: number, seg = 24) => cyl(r, h, seg).rotateX(Math.PI / 2)

/** Polia raiada com eixo em X. */
function pulleyGeo(r: number, w: number, color = 0x8f939f) {
  const parts: PartDef[] = []
  const rim = new THREE.LatheGeometry([new THREE.Vector2(r * 0.9, -w / 2), new THREE.Vector2(r, -w / 2), new THREE.Vector2(r * 1.015, 0), new THREE.Vector2(r, w / 2), new THREE.Vector2(r * 0.9, w / 2), new THREE.Vector2(r * 0.9, -w / 2)], 40)
  parts.push([rim.rotateZ(Math.PI / 2), color])
  parts.push([cylX(r * 0.2, w * 1.3, 16), color])
  for (let i = 0; i < 6; i++) parts.push([box(w * 0.35, r * 0.82, r * 0.09), color, T(0, 0, 0, (i / 6) * Math.PI * 2).multiply(T(0, r * 0.52))])
  return bake(parts)
}

/** Tangentes externas entre duas polias no plano YZ (correia aberta). */
function beltStrands(a: { y: number; z: number; r: number }, b: { y: number; z: number; r: number }) {
  const dy = b.y - a.y
  const dz = b.z - a.z
  const d = Math.hypot(dy, dz)
  const th = Math.atan2(dz, dy)
  const al = Math.acos(Math.max(-1, Math.min(1, (a.r - b.r) / d)))
  return [1, -1].map((s) => {
    const f = th + s * al
    return {
      p1: { y: a.y + a.r * Math.cos(f), z: a.z + a.r * Math.sin(f) },
      p2: { y: b.y + b.r * Math.cos(f), z: b.z + b.r * Math.sin(f) },
      dir: s,
    }
  })
}

/* ================================================================== layout */

// Posições das máquinas: eixo no teto (2 fileiras) e "ordem do processo" (uma fila ao longo da linha)
const ROW_X = [-12, -7.5, -3, 1.5]
const ROW = [...ROW_X.map((x) => ({ x, z: -3.6, ry: 0 })), ...ROW_X.map((x) => ({ x: x + 1.2, z: 3.6, ry: Math.PI }))]
const LINE = Array.from({ length: 8 }, (_, i) => ({ x: -13 + i * 3.05, z: -3.9, ry: 0 }))
const KIND: ('lathe' | 'drill')[] = ['lathe', 'drill', 'lathe', 'lathe', 'drill', 'lathe', 'drill', 'lathe']

const SHAFT_Y = 6.2
const SHAFT_R = 0.42
const DRIVE_X = 12.2
const FLY = { y: 2.3, r: 1.95 }
const LINE_Z = 0.9
const LINE_X0 = -15.5
const LINE_X1 = 11
const N_CHASSIS = 7

const CAMS: { p: [number, number, number]; t: [number, number, number] }[] = [
  { p: [16.5, 7.4, 16.5], t: [10.2, 5.2, -3] },
  { p: [15.8, 6, 13], t: [10.4, 3.4, -2] },
  { p: [7, 7.8, 13], t: [-3, 1.8, -3.5] },
  { p: [9, 5.6, 11.5], t: [-1.5, 1.2, 0] },
  { p: [2, 8.6, 19], t: [-3, 1.4, -1] },
  { p: [5, 7.4, 14.5], t: [-3, 3.4, -1.5] },
]

const COLORS = {
  iron: 0x4a5a52, // verde de máquina
  ironDark: 0x262b2b,
  steel: 0xb4b8c4,
  brass: 0xb88b3f,
  leather: 0x4a2c18,
  paint: 0x14141a,
  rubber: 0x161616,
  wood: 0x6b4a2b,
  purple: 0x9156f1,
  purpleDeep: 0x3a1764,
}

/* ================================================================== cena */

export class Factory {
  private renderer: THREE.WebGLRenderer
  private composer: EffectComposer | null = null
  private bloom: UnrealBloomPass | null = null
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private camTarget = new THREE.Vector3(...CAMS[0].t)
  private raf = 0
  private timer = new THREE.Timer()
  private step = -1
  private low: boolean
  private textures: THREE.Texture[] = []
  private pmremTex: THREE.Texture | null = null

  // estado animado (gsap)
  private st = {
    engine: 1, // rotação da máquina a vapor
    motor: 0, // rotação do motor elétrico grande
    unit: 0, // motores individuais
    smoke: 1,
    fire: 1,
    dust: 1,
    beams: 1,
    lamps: 0,
    line: 0,
    ai: 0,
    grid: 0,
  }
  private theta = 0
  private shaftAngle = 0

  // luzes
  private hemi = new THREE.HemisphereLight(0xffe7c9, 0x3a2a1e, 0.7)
  private sun = new THREE.DirectionalLight(0xffe2b8, 3.2)
  private fireLight = new THREE.PointLight(0xff7a2a, 6, 9, 2)
  private lampLights: THREE.PointLight[] = []

  // materiais compartilhados
  private vc = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.45, roughness: 0.52 })
  private vcMetal = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.9, roughness: 0.28 })
  private floorMat!: THREE.MeshStandardMaterial
  private beltMats: THREE.MeshStandardMaterial[] = []
  private fireMat = new THREE.MeshStandardMaterial({ color: 0x220800, emissive: 0xff6a1a, emissiveIntensity: 3 })
  private bulbMat = new THREE.MeshStandardMaterial({ color: 0x332a1a, emissive: 0xffd69a, emissiveIntensity: 0 })
  private aiMat = new THREE.MeshStandardMaterial({ color: 0x1a0f33, emissive: COLORS.purple, emissiveIntensity: 0, transparent: true, opacity: 0 })
  private aiLineMat = new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  private motorGlow = new THREE.MeshStandardMaterial({ color: 0x1a0f33, emissive: COLORS.purple, emissiveIntensity: 0 })

  // objetos
  private engine = new THREE.Group()
  private flywheel = new THREE.Group()
  private crankDisc = new THREE.Group()
  private conrod!: THREE.Mesh
  private crosshead!: THREE.Mesh
  private pistonRod!: THREE.Mesh
  private governor = new THREE.Group()
  private govBalls: THREE.Mesh[] = []
  private steamBelt = new THREE.Group()
  private bigMotor = new THREE.Group()
  private motorRotor = new THREE.Group()
  private motorBelt = new THREE.Group()
  private shaftSys = new THREE.Group()
  private shaftSpin: THREE.Object3D[] = []
  private machines: THREE.Group[] = []
  private spinners: THREE.Object3D[] = []
  private carriages: THREE.Object3D[] = []
  private unitMotors: THREE.Object3D[] = []
  private conduits = new THREE.Group()
  private lamps = new THREE.Group()
  private conveyor = new THREE.Group()
  private chain!: THREE.Texture
  private chassis: { g: THREE.Group; parts: { o: THREE.Object3D; at: number }[] }[] = []
  private workers: { g: THREE.Group; arms: THREE.Object3D[]; ph: number }[] = []
  private workerGrp = new THREE.Group()
  private smoke: THREE.Sprite[] = []
  private puffs: THREE.Sprite[] = []
  private dust!: THREE.Points
  private dustBase!: Float32Array
  private beams: THREE.Mesh[] = []
  private aiGrp = new THREE.Group()
  private aiCore = new THREE.Group()
  private aiLinks: { curve: THREE.QuadraticBezierCurve3; pulses: THREE.Mesh[] }[] = []
  private grid!: THREE.GridHelper

  constructor(private host: HTMLElement, width: number, height: number, shiftX = 0) {
    this.low = /[?&]q=baixa/.test(location.search)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.low ? 1 : 1.25))
    this.renderer.setSize(width, height)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = !this.low
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    host.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 220)
    if (shiftX) this.camera.setViewOffset(width, height, -shiftX, 0, width, height)
    this.camera.position.set(...CAMS[0].p)
    this.camera.lookAt(this.camTarget)

    const bg = new THREE.Color(0x140f2c)
    this.scene.background = bg
    this.scene.fog = new THREE.FogExp2(0x2a1f2e, 0.024)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.pmremTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    this.scene.environment = this.pmremTex
    this.scene.environmentIntensity = 0.32

    if (!this.low) {
      const composer = new EffectComposer(this.renderer)
      composer.addPass(new RenderPass(this.scene, this.camera))
      this.bloom = new UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), 0.55, 0.5, 0.82)
      composer.addPass(this.bloom)
      composer.addPass(new OutputPass())
      composer.setPixelRatio(this.renderer.getPixelRatio())
      composer.setSize(width, height)
      this.composer = composer
    }

    this.timer.connect(document)
    this.build()
    this.loop()
  }

  /* ---------------------------------------------------------------- construção */

  private build() {
    this.lights()
    this.building()
    this.steamPlant()
    this.electricMotor()
    this.machinesAndShaft()
    this.electricFitout()
    this.assemblyLine()
    this.atmosphere()
    this.aiLayer()
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && m.userData.shadowOnly) m.castShadow = true
      else if (m.isMesh && !m.userData.noShadow) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
  }

  private lights() {
    this.scene.add(this.hemi)
    this.sun.position.set(-9, 22, -24)
    this.sun.target.position.set(-1, 0, 0)
    this.sun.castShadow = true
    const sc = this.sun.shadow.camera
    sc.left = -26
    sc.right = 26
    sc.top = 22
    sc.bottom = -22
    sc.near = 5
    sc.far = 80
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.bias = -0.0004
    this.sun.shadow.normalBias = 0.03
    this.scene.add(this.sun, this.sun.target)
    this.fireLight.position.set(15.3, 1.1, -1.6)
    this.scene.add(this.fireLight)
  }

  private building() {
    // ---- texturas procedurais
    const brickDraw = (bump: boolean) => (c: CanvasRenderingContext2D) => {
      const rr = rng(11)
      c.fillStyle = bump ? '#202020' : '#5f5650'
      c.fillRect(0, 0, 512, 512)
      for (let row = 0; row < 16; row++) {
        const off = (row % 2) * 32
        for (let col = -1; col < 9; col++) {
          const x = col * 64 + off
          const y = row * 32
          const k = rr()
          if (bump) c.fillStyle = `rgb(${200 + k * 40},${200 + k * 40},${200 + k * 40})`
          else c.fillStyle = `hsl(${8 + k * 14}, ${38 + rr() * 22}%, ${24 + rr() * 14}%)`
          c.fillRect(x + 3, y + 3, 58, 26)
          for (let s = 0; s < 18; s++) {
            c.fillStyle = bump ? `rgba(0,0,0,${rr() * 0.25})` : `rgba(${rr() > 0.5 ? 255 : 0},${rr() > 0.5 ? 220 : 0},${rr() > 0.5 ? 200 : 0},${rr() * 0.08})`
            c.fillRect(x + 3 + rr() * 56, y + 3 + rr() * 24, 2 + rr() * 5, 2 + rr() * 3)
          }
        }
      }
    }
    const brick = canvasTex(512, 512, brickDraw(false))
    const brickBump = canvasTex(512, 512, brickDraw(true), false)
    brick.repeat.set(0.5, 0.5)
    brickBump.repeat.set(0.5, 0.5)
    const plank = canvasTex(512, 512, (c) => {
      const rr = rng(23)
      for (let col = 0; col < 8; col++) {
        let y = -rr() * 200
        while (y < 512) {
          const len = 140 + rr() * 220
          const l = 22 + rr() * 12
          c.fillStyle = `hsl(${24 + rr() * 8}, ${32 + rr() * 14}%, ${l}%)`
          c.fillRect(col * 64, y, 64, len)
          c.strokeStyle = 'rgba(20,10,5,0.35)'
          for (let g = 0; g < 6; g++) {
            c.beginPath()
            const gx = col * 64 + 6 + rr() * 52
            c.moveTo(gx, y)
            c.bezierCurveTo(gx + 4, y + len / 3, gx - 4, y + (2 * len) / 3, gx + rr() * 3, y + len)
            c.lineWidth = 0.6 + rr()
            c.stroke()
          }
          c.fillStyle = 'rgba(0,0,0,0.6)'
          c.fillRect(col * 64, y, 64, 2)
          y += len
        }
        c.fillStyle = 'rgba(0,0,0,0.65)'
        c.fillRect(col * 64, 0, 2, 512)
      }
    })
    plank.repeat.set(5, 2.6)
    this.textures.push(brick, brickBump, plank)

    // ---- piso
    this.floorMat = new THREE.MeshStandardMaterial({ map: plank, roughness: 0.82, metalness: 0.02, color: 0xc8b8a8 })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), this.floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(-1, 0, 0)
    this.scene.add(floor)
    // fosso do volante
    const pit = new THREE.Mesh(box(0.8, 0.02, 4.4), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 }))
    pit.position.set(DRIVE_X, 0.011, 0)
    this.scene.add(pit)

    // ---- paredes com janelas em arco (o sol entra pelas janelas e desenha o piso)
    const brickMat = new THREE.MeshStandardMaterial({ map: brick, bumpMap: brickBump, bumpScale: 3, roughness: 0.92, side: THREE.DoubleSide })
    const wallWithWindows = (len: number, h: number, centers: number[]) => {
      const s = new THREE.Shape()
      s.moveTo(-len / 2, 0)
      s.lineTo(len / 2, 0)
      s.lineTo(len / 2, h)
      s.lineTo(-len / 2, h)
      s.closePath()
      centers.forEach((cx) => {
        const hole = new THREE.Path()
        hole.moveTo(cx - 0.8, 3)
        hole.lineTo(cx + 0.8, 3)
        hole.lineTo(cx + 0.8, 6.2)
        hole.absarc(cx, 6.2, 0.8, 0, Math.PI, false)
        hole.lineTo(cx - 0.8, 3)
        s.holes.push(hole)
      })
      return new THREE.ShapeGeometry(s, 12)
    }
    const winX = [-14, -10, -6, -2, 2, 6, 10]
    const back = new THREE.Mesh(wallWithWindows(38, 9.2, winX), brickMat)
    back.position.set(-1, 0, -8)
    this.scene.add(back)
    const left = new THREE.Mesh(wallWithWindows(16, 9.2, [-4, 0, 4]), brickMat)
    left.rotation.y = Math.PI / 2
    left.position.set(-20, 0, 0)
    this.scene.add(left)

    // caixilhos de ferro e vidro
    const sash: PartDef[] = []
    const glassParts: PartDef[] = []
    const addWindow = (mtx: THREE.Matrix4) => {
      for (const dx of [-0.8, -0.27, 0.27, 0.8]) sash.push([box(0.06, 3.4, 0.08), 0x1d1f22, mtx.clone().multiply(T(dx, 4.7))])
      for (const y of [3, 4.1, 5.2, 6.2]) sash.push([box(1.62, 0.06, 0.08), 0x1d1f22, mtx.clone().multiply(T(0, y))])
      glassParts.push([new THREE.PlaneGeometry(1.6, 3.2), 0x9fb4c8, mtx.clone().multiply(T(0, 4.6, -0.02))])
    }
    winX.forEach((x) => addWindow(T(x - 1, 0, -8)))
    ;[-4, 0, 4].forEach((z) => addWindow(T(-20, 0, z, 0, Math.PI / 2).multiply(T(0, 0, 0))))
    this.scene.add(new THREE.Mesh(bake(sash), this.vc))
    const glass = new THREE.Mesh(bake(glassParts), new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.12, roughness: 0.1, metalness: 0, emissive: 0x8aa0c0, emissiveIntensity: 0.25, depthWrite: false }))
    glass.userData.noShadow = true
    this.scene.add(glass)

    // ---- tesouras do telhado, terças e colunas de ferro fundido
    const steelParts: PartDef[] = []
    const trussC = 0x2c2a2a
    for (let x = -18; x <= 16; x += 4) {
      steelParts.push([box(0.16, 0.22, 16.6), trussC, T(x, 8.4)])
      const hyp = Math.hypot(8.3, 2.3)
      const ang = Math.atan2(2.3, 8.3)
      steelParts.push([box(0.16, 0.2, hyp), trussC, T(x, 8.4 + 1.15, -4.15, ang)])
      steelParts.push([box(0.16, 0.2, hyp), trussC, T(x, 8.4 + 1.15, 4.15, -ang)])
      steelParts.push([box(0.12, 2.3, 0.12), trussC, T(x, 9.55)])
      for (const z of [-4.15, 4.15]) steelParts.push([box(0.1, 1.2, 0.1), trussC, T(x, 9.0, z)])
      for (const s of [-1, 1]) steelParts.push([box(0.08, Math.hypot(4.15, 2.3), 0.08), trussC, T(x, 9.55, s * 2.07, s * Math.atan2(4.15, 2.3))])
    }
    steelParts.push([box(36, 0.3, 0.24), 0x3b2a1c, T(-1, 8.25, 0)])
    for (const z of [-8, -4.15, 0, 4.15, 8]) {
      const y = 8.4 + (z === 0 ? 2.3 : Math.abs(z) > 5 ? 0.05 : 1.15)
      steelParts.push([box(36, 0.14, 0.12), trussC, T(-1, y + 0.12, z)])
    }
    for (const x of [-14, -6, 2, 10])
      for (const z of [-6.3, 6.3]) {
        steelParts.push([cyl(0.14, 8.2, 18, 0.12), 0x2a2d2e, T(x, 4.1, z)])
        steelParts.push([box(0.5, 0.25, 0.5), 0x2a2d2e, T(x, 0.12, z)])
        steelParts.push([box(0.42, 0.18, 0.42), 0x2a2d2e, T(x, 8.25, z)])
      }
    this.scene.add(new THREE.Mesh(bake(steelParts), this.vc))

    // telhado: invisível para a câmera (as vistas de cima continuam livres), mas projeta sombra.
    // Assim o sol só entra pelas janelas, como num galpão real.
    const roof = new THREE.Mesh(box(40, 0.3, 20), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }))
    roof.position.set(-1, 11, 0)
    roof.userData.shadowOnly = true
    this.scene.add(roof)

    // feixes de luz das janelas (falso volumétrico)
    const beamTex = canvasTex(64, 256, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 256)
      g.addColorStop(0, 'rgba(255,236,200,0.9)')
      g.addColorStop(1, 'rgba(255,236,200,0)')
      c.fillStyle = g
      c.fillRect(0, 0, 64, 256)
      const h = c.createLinearGradient(0, 0, 64, 0)
      h.addColorStop(0, 'rgba(0,0,0,1)')
      h.addColorStop(0.25, 'rgba(0,0,0,0)')
      h.addColorStop(0.75, 'rgba(0,0,0,0)')
      h.addColorStop(1, 'rgba(0,0,0,1)')
      c.globalCompositeOperation = 'destination-out'
      c.fillStyle = h
      c.fillRect(0, 0, 64, 256)
    })
    this.textures.push(beamTex)
    const dir = this.sun.target.position.clone().sub(this.sun.position).normalize()
    winX.forEach((x) => {
      const start = new THREE.Vector3(x - 1, 4.9, -8)
      const len = start.y / -dir.y
      const end = start.clone().addScaledVector(dir, len)
      const mat = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })
      for (const rot of [0, Math.PI / 2]) {
        const g = new THREE.PlaneGeometry(1.5, len)
        const m = new THREE.Mesh(g, mat)
        m.position.copy(start).add(end).multiplyScalar(0.5)
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), start.clone().sub(end).normalize())
        m.rotateY(rot)
        m.userData.noShadow = true
        this.beams.push(m)
        this.scene.add(m)
      }
    })
  }

  /** Máquina a vapor horizontal (biela-manivela real) + caldeira Lancashire + chaminé. */
  private steamPlant() {
    const E = this.engine
    const ex = 13.55 // plano do mecanismo
    // volante (pit) no plano x = DRIVE_X
    const rim = new THREE.LatheGeometry(
      [new THREE.Vector2(FLY.r - 0.28, -0.2), new THREE.Vector2(FLY.r, -0.2), new THREE.Vector2(FLY.r, 0.2), new THREE.Vector2(FLY.r - 0.28, 0.2), new THREE.Vector2(FLY.r - 0.28, -0.2)],
      64,
    ).rotateZ(Math.PI / 2)
    const fwParts: PartDef[] = [[rim, COLORS.ironDark], [cylX(0.32, 0.5), COLORS.ironDark]]
    for (let i = 0; i < 8; i++) fwParts.push([box(0.12, FLY.r - 0.3, 0.2), COLORS.ironDark, T(0, 0, 0, (i / 8) * Math.PI * 2).multiply(T(0, (FLY.r - 0.3) / 2 + 0.1))])
    this.flywheel.add(new THREE.Mesh(bake(fwParts), this.vc))
    this.flywheel.position.set(DRIVE_X, FLY.y, 0)
    E.add(this.flywheel)

    // árvore de manivelas, mancais e disco de manivela
    const fixed: PartDef[] = []
    fixed.push([cylX(0.13, ex - DRIVE_X + 0.4), COLORS.steel, T((DRIVE_X + ex) / 2, FLY.y)])
    for (const x of [DRIVE_X + 0.5, ex - 0.3]) {
      fixed.push([box(0.45, FLY.y - 0.2, 0.7), COLORS.iron, T(x, (FLY.y - 0.2) / 2)])
      fixed.push([box(0.5, 0.3, 0.8), COLORS.iron, T(x, FLY.y)])
    }
    // base do motor (ferro) ao longo de z
    fixed.push([box(0.9, 1.1, 7.2), COLORS.iron, T(ex, 0.55, -2.6)])
    fixed.push([box(1.4, 0.18, 7.6), 0x5e5852, T(ex, 0.09, -2.6)])
    // cilindro com tampas, caixa de vapor e camisa
    fixed.push([cylZ(0.62, 2.4, 32), COLORS.iron, T(ex, FLY.y, -4.9)])
    for (const z of [-6.1, -3.7]) fixed.push([cylZ(0.72, 0.12, 32), COLORS.ironDark, T(ex, FLY.y, z)])
    fixed.push([box(0.55, 0.55, 1.6), COLORS.iron, T(ex + 0.55, FLY.y + 0.35, -4.9)])
    fixed.push([cylZ(0.12, 1.8, 12), COLORS.brass, T(ex + 0.55, FLY.y + 0.75, -4.9)])
    // guias da cruzeta
    for (const dy of [-0.26, 0.26]) fixed.push([box(0.32, 0.08, 2.2), COLORS.steel, T(ex, FLY.y + dy, -2.4)])
    fixed.push([box(0.5, 0.8, 0.2), COLORS.iron, T(ex, FLY.y, -1.25)])
    E.add(new THREE.Mesh(bake(fixed), this.vc))

    this.crankDisc.add(new THREE.Mesh(bake([[cylX(0.85, 0.16, 40), COLORS.ironDark], [cylX(0.1, 0.3, 12), COLORS.steel, T(0.1, 0, 0.7)]]), this.vc))
    this.crankDisc.position.set(ex - 0.15, FLY.y, 0)
    E.add(this.crankDisc)
    this.crosshead = new THREE.Mesh(bake([[box(0.3, 0.42, 0.42), COLORS.steel]]), this.vcMetal)
    this.pistonRod = new THREE.Mesh(bake([[cylZ(0.06, 1.7, 12), COLORS.steel]]), this.vcMetal)
    this.conrod = new THREE.Mesh(bake([[box(0.12, 0.16, 2.4), COLORS.steel], [cylX(0.16, 0.2, 16), COLORS.steel, T(0, 0, -1.2)], [cylX(0.18, 0.2, 16), COLORS.steel, T(0, 0, 1.2)]]), this.vcMetal)
    E.add(this.crosshead, this.pistonRod, this.conrod)

    // regulador de Watt (bolas giratórias)
    const govFixed = new THREE.Mesh(bake([[cyl(0.04, 1.2, 10), COLORS.brass, T(0, 0.6)], [cyl(0.12, 0.2, 12), COLORS.brass, T(0, 0.05)]]), this.vcMetal)
    this.governor.add(govFixed)
    for (const s of [-1, 1]) {
      const arm = new THREE.Group()
      arm.position.y = 1.15
      const rod = new THREE.Mesh(bake([[cyl(0.02, 0.6, 8), COLORS.brass, T(0, -0.3)]]), this.vcMetal)
      const ball = new THREE.Mesh(bake([[new THREE.SphereGeometry(0.11, 16, 12), COLORS.brass, T(0, -0.62)]]), this.vcMetal)
      arm.add(rod, ball)
      arm.rotation.z = s * 0.5
      this.govBalls.push(arm as unknown as THREE.Mesh)
      this.governor.add(arm)
    }
    this.governor.position.set(ex + 0.55, FLY.y + 0.62, -4.3)
    E.add(this.governor)

    // caldeira Lancashire em alvenaria + fornalha + tubo de vapor
    const boiler: PartDef[] = []
    boiler.push([box(3, 2.2, 5.6), 0x6a4a3c, T(15.9, 1.1, -5.1)])
    boiler.push([cylZ(1.1, 5.8, 32), 0x4a4d52, T(15.9, 2.1, -5.1)])
    boiler.push([cylZ(1.14, 0.1, 32), 0x2a2c30, T(15.9, 2.1, -2.2)])
    boiler.push([cyl(0.18, 0.7, 12), COLORS.brass, T(15.9, 3.4, -5.6)])
    boiler.push([box(0.3, 0.5, 0.06), 0xdddddd, T(16.7, 2.5, -2.15)])
    const bm = new THREE.Mesh(bake(boiler), this.vc)
    E.add(bm)
    for (const dx of [-0.5, 0.5]) {
      const door = new THREE.Mesh(box(0.55, 0.45, 0.08), this.fireMat)
      door.position.set(15.9 + dx, 1.0, -2.2)
      E.add(door)
    }
    const steamPipe = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(15.9, 3.3, -4.6), new THREE.Vector3(15.9, 4.4, -4.4), new THREE.Vector3(14.6, 4.4, -4.6), new THREE.Vector3(ex + 0.55, FLY.y + 1.2, -4.9)]), 32, 0.12, 12),
      new THREE.MeshStandardMaterial({ color: 0xc9c2b2, roughness: 0.9 }),
    )
    E.add(steamPipe)
    // chaminé de tijolo (fora da parede do fundo)
    const chim = new THREE.Mesh(
      bake([[cyl(0.95, 11.4, 24, 0.66), 0x5b3a2e, T(0, 5.7)], [cyl(0.78, 0.6, 24, 0.78), 0x2a1d18, T(0, 11.5)], [box(2.4, 1.2, 2.4), 0x5b3a2e, T(0, 0.6)]]),
      this.vc,
    )
    chim.position.set(13.6, 0, -10.2)
    this.scene.add(chim)
    // correia principal: volante → eixo
    this.addBelt(this.steamBelt, DRIVE_X, { y: FLY.y, z: 0, r: FLY.r }, { y: SHAFT_Y, z: 0, r: 0.75 }, 0.42)
    E.add(this.steamBelt)
    this.scene.add(E)

    // fumaça e baforadas de vapor (sprites)
    const smokeTex = canvasTex(128, 128, (c) => {
      const rr = rng(3)
      for (let i = 0; i < 14; i++) {
        const x = 40 + rr() * 48
        const y = 40 + rr() * 48
        const rad = 18 + rr() * 26
        const g = c.createRadialGradient(x, y, 0, x, y, rad)
        g.addColorStop(0, 'rgba(255,255,255,0.35)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        c.fillStyle = g
        c.fillRect(0, 0, 128, 128)
      }
    })
    this.textures.push(smokeTex)
    for (let i = 0; i < 46; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0x8a8486, transparent: true, depthWrite: false, opacity: 0 }))
      sp.userData.t = i / 46
      sp.userData.rot = (Math.random() - 0.5) * 0.6
      this.smoke.push(sp)
      this.scene.add(sp)
    }
    for (let i = 0; i < 10; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0xf2f2f2, transparent: true, depthWrite: false, opacity: 0 }))
      sp.userData.t = i / 10
      this.puffs.push(sp)
      this.scene.add(sp)
    }
  }

  /** Grande motor elétrico (passo 1): toma o lugar do vapor, mantém eixo e correias. */
  private electricMotor() {
    const M = this.bigMotor
    const body: PartDef[] = [
      [box(1.9, 0.3, 1.8), COLORS.iron, T(13.2, 0.15)],
      [cylX(0.85, 1.3, 40), 0x2b2f3a, T(13.25, 1.15)],
      [cylX(0.7, 1.55, 40), 0x1f222b, T(13.25, 1.15)],
      [box(1.3, 0.5, 1.5), 0x2b2f3a, T(13.25, 0.45)],
      [cylX(0.1, 1.4, 12), COLORS.steel, T(12.6, 1.15)],
    ]
    for (let i = 0; i < 10; i++) body.push([box(1.25, 0.06, 0.1), 0x3a3f4c, T(13.25, 1.15, 0, (i / 10) * Math.PI * 2).multiply(T(0, 0.86))])
    M.add(new THREE.Mesh(bake(body), this.vc))
    const glowRing = new THREE.Mesh(cylX(0.72, 0.12, 40), this.motorGlow)
    glowRing.position.set(13.95, 1.15, 0)
    glowRing.userData.noShadow = true
    M.add(glowRing)
    this.motorRotor.add(new THREE.Mesh(pulleyGeo(0.45, 0.32, 0x9a9ea8), this.vcMetal))
    this.motorRotor.position.set(DRIVE_X, 1.15, 0)
    M.add(this.motorRotor)
    // quadro elétrico (mármore e chaves de faca) + cabo
    const panel: PartDef[] = [[box(1.6, 2.3, 0.12), 0x2b2b2f, T(0, 1.65)], [box(1.7, 0.1, 0.4), 0x1a1a1a, T(0, 0.05)]]
    for (let i = 0; i < 3; i++) {
      panel.push([box(0.12, 0.45, 0.08), COLORS.brass, T(-0.5 + i * 0.5, 2.1, 0.1)])
      panel.push([cylZ(0.14, 0.06, 20), 0xe8e2d0, T(-0.5 + i * 0.5, 1.3, 0.1)])
    }
    const pm = new THREE.Mesh(bake(panel), this.vcMetal)
    pm.position.set(15.6, 0, 2.6)
    pm.rotation.y = -Math.PI / 2
    M.add(pm)
    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(15.5, 0.4, 2.6), new THREE.Vector3(15, 0.05, 2), new THREE.Vector3(14.2, 0.05, 0.9), new THREE.Vector3(13.6, 0.6, 0.7)]), 24, 0.05, 8),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 }),
    )
    M.add(cable)
    this.addBelt(this.motorBelt, DRIVE_X, { y: 1.15, z: 0, r: 0.45 }, { y: SHAFT_Y, z: 0, r: 0.75 }, 0.3)
    M.add(this.motorBelt)
    M.visible = false
    this.scene.add(M)
  }

  /** Máquinas-ferramenta + eixo de transmissão com polias e correias. */
  private machinesAndShaft() {
    const shaftParts: PartDef[] = [[cylX(0.085, DRIVE_X + 0.6 + 14.8), COLORS.steel, T((DRIVE_X + 0.6 - 14.8) / 2, SHAFT_Y)]]
    for (const x of [-14.2, -11.4, -8.6, -5.2, -2.9, -0.7, 2.1, 5.5, 8.5, 11.2]) {
      shaftParts.push([box(0.12, 8.1 - SHAFT_Y, 0.12), COLORS.ironDark, T(x, (8.1 + SHAFT_Y) / 2)])
      shaftParts.push([box(0.3, 0.32, 0.36), COLORS.iron, T(x, SHAFT_Y)])
    }
    const shaftFixed = new THREE.Mesh(bake(shaftParts), this.vcMetal)
    this.shaftSys.add(shaftFixed)
    const drive = new THREE.Mesh(pulleyGeo(0.75, 0.46), this.vcMetal)
    drive.position.set(DRIVE_X, SHAFT_Y, 0)
    this.shaftSys.add(drive)
    this.shaftSpin.push(drive)

    KIND.forEach((kind, i) => {
      const m = this.makeMachine(kind)
      const p = ROW[i]
      m.position.set(p.x, 0, p.z)
      m.rotation.y = p.ry
      this.scene.add(m)
      this.machines.push(m)
      // polia da máquina no mundo → polia correspondente no eixo + correia
      m.updateMatrixWorld(true)
      const mp = (m.userData.pulley as THREE.Vector3).clone().applyMatrix4(m.matrixWorld)
      const sp = new THREE.Mesh(pulleyGeo(SHAFT_R, 0.2), this.vcMetal)
      sp.position.set(mp.x, SHAFT_Y, 0)
      this.shaftSys.add(sp)
      this.shaftSpin.push(sp)
      const belt = new THREE.Group()
      this.addBelt(belt, mp.x, { y: SHAFT_Y, z: 0, r: SHAFT_R }, { y: mp.y, z: mp.z, r: m.userData.pr as number }, 0.14)
      this.shaftSys.add(belt)
    })
    this.scene.add(this.shaftSys)
  }

  private makeMachine(kind: 'lathe' | 'drill') {
    const g = new THREE.Group()
    const parts: PartDef[] = []
    const spin = new THREE.Group()
    const motor = new THREE.Group()
    if (kind === 'lathe') {
      for (const x of [-1.0, 1.0]) parts.push([box(0.28, 1.0, 0.62), COLORS.iron, T(x, 0.5)])
      parts.push([box(2.9, 0.22, 0.5), COLORS.iron, T(0, 1.08)])
      for (const z of [-0.16, 0.16]) parts.push([box(2.8, 0.05, 0.07), COLORS.steel, T(0, 1.21, z)])
      for (const x of [-1.32, -0.82]) parts.push([box(0.14, 0.5, 0.45), COLORS.iron, T(x, 1.42)])
      parts.push([box(0.32, 0.36, 0.42), COLORS.iron, T(0.98, 1.36)])
      parts.push([cylX(0.05, 0.4, 10), COLORS.steel, T(0.72, 1.45)])
      parts.push([box(0.05, 0.4, 0.05), COLORS.steel, T(1.0, 1.75, 0.2)])
      g.userData.pulley = new THREE.Vector3(-1.07, 1.45, 0)
      g.userData.pr = 0.28
      g.userData.top = new THREE.Vector3(-1.07, 2.0, 0)
      // árvore com polia escalonada + placa + peça (gira)
      const sp: PartDef[] = [
        [cylX(0.3, 0.12, 28), 0x8b8f99, T(-1.17)],
        [cylX(0.24, 0.12, 28), 0x8b8f99, T(-1.05)],
        [cylX(0.18, 0.12, 28), 0x8b8f99, T(-0.93)],
        [cylX(0.04, 0.8, 10), COLORS.steel, T(-1.0)],
        [cylX(0.19, 0.16, 24), 0x55585f, T(-0.66)],
        [cylX(0.075, 1.25, 18), 0xd8dbe4, T(0.0)],
      ]
      for (let j = 0; j < 3; j++) sp.push([box(0.08, 0.1, 0.06), 0x33363c, T(-0.6, 0, 0, (j / 3) * Math.PI * 2).multiply(T(0, 0.14))])
      spin.add(new THREE.Mesh(bake(sp), this.vcMetal))
      spin.position.set(0, 1.45, 0)
      g.add(spin)
      const car = new THREE.Mesh(bake([[box(0.36, 0.14, 0.62), COLORS.iron], [box(0.12, 0.14, 0.12), COLORS.steel, T(0, 0.14, 0.12)], [box(0.04, 0.04, 0.3), 0xd8dbe4, T(0, 0.2, -0.05)]]), this.vc)
      car.position.set(0.1, 1.29, 0)
      g.add(car)
      this.carriages.push(car)
      motor.add(new THREE.Mesh(bake([[cylX(0.24, 0.5, 24), 0x2b2f3a], [box(0.4, 0.12, 0.4), COLORS.iron, T(0, -0.24)]]), this.vc))
      const ring = new THREE.Mesh(cylX(0.25, 0.08, 24), this.motorGlow)
      ring.position.x = 0.22
      motor.add(ring)
      motor.position.set(-1.62, 0.5, 0)
    } else {
      parts.push([box(0.9, 0.16, 0.8), COLORS.iron, T(0, 0.08)])
      parts.push([cyl(0.1, 2.2, 16), COLORS.iron, T(0, 1.2, -0.25)])
      parts.push([box(0.5, 0.07, 0.5), COLORS.iron, T(0, 0.9, 0.1)])
      parts.push([box(0.12, 0.08, 0.4), COLORS.iron, T(0, 0.86, -0.1)])
      parts.push([box(0.42, 0.48, 0.62), COLORS.iron, T(0, 1.95, -0.05)])
      parts.push([box(0.2, 0.2, 0.3), COLORS.iron, T(0, 2.3, -0.32)])
      g.userData.pulley = new THREE.Vector3(0, 2.4, -0.45)
      g.userData.pr = 0.26
      g.userData.top = new THREE.Vector3(0, 2.75, -0.1)
      const sp: PartDef[] = [[cyl(0.04, 0.5, 10), COLORS.steel, T(0, -0.05)], [cyl(0.07, 0.12, 12), 0x55585f, T(0, -0.28)], [cyl(0.015, 0.2, 6), 0xd8dbe4, T(0, -0.42)]]
      spin.add(new THREE.Mesh(bake(sp), this.vcMetal))
      spin.position.set(0, 1.55, 0.12)
      spin.userData.axis = 'y'
      g.add(spin)
      const pul = new THREE.Mesh(pulleyGeo(0.26, 0.16), this.vcMetal)
      pul.position.set(0, 2.4, -0.45)
      g.add(pul)
      this.spinners.push(pul)
      motor.add(new THREE.Mesh(bake([[cylX(0.18, 0.38, 20), 0x2b2f3a]]), this.vc))
      const ring = new THREE.Mesh(cylX(0.19, 0.06, 20), this.motorGlow)
      ring.position.x = 0.17
      motor.add(ring)
      motor.position.set(0, 2.42, -0.2)
    }
    g.add(new THREE.Mesh(bake(parts), this.vc))
    motor.scale.setScalar(0.001)
    motor.visible = false
    g.add(motor)
    this.unitMotors.push(motor)
    this.spinners.push(spin)
    return g
  }

  /** Correia aberta entre duas polias no plano x = px (duas pernas com textura de couro que corre). */
  private addBelt(group: THREE.Group, px: number, a: { y: number; z: number; r: number }, b: { y: number; z: number; r: number }, w: number) {
    if (!this.beltMats.length) {
      const tex = canvasTex(64, 256, (c) => {
        c.fillStyle = '#3d2414'
        c.fillRect(0, 0, 64, 256)
        const rr = rng(5)
        for (let i = 0; i < 400; i++) {
          c.fillStyle = `rgba(${rr() > 0.5 ? 120 : 10},${rr() > 0.5 ? 80 : 5},40,${rr() * 0.25})`
          c.fillRect(rr() * 64, rr() * 256, 1 + rr() * 3, 1 + rr() * 6)
        }
        c.fillStyle = '#7a5032'
        c.fillRect(0, 120, 64, 8)
        c.fillStyle = 'rgba(0,0,0,0.5)'
        c.fillRect(0, 0, 4, 256)
        c.fillRect(60, 0, 4, 256)
      })
      const tex2 = tex.clone()
      this.textures.push(tex, tex2)
      this.beltMats = [tex, tex2].map((t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.75, metalness: 0.05, color: 0xb08a6a }))
    }
    beltStrands(a, b).forEach((s, k) => {
      const len = Math.hypot(s.p2.y - s.p1.y, s.p2.z - s.p1.z)
      const geo = box(w, len, 0.03)
      const uv = geo.attributes.uv as THREE.BufferAttribute
      for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * (len / 1.2))
      const m = new THREE.Mesh(geo, this.beltMats[k])
      m.position.set(px, (s.p1.y + s.p2.y) / 2, (s.p1.z + s.p2.z) / 2)
      m.rotation.x = Math.atan2(s.p2.z - s.p1.z, s.p2.y - s.p1.y)
      group.add(m)
    })
  }

  /** Eletrificação da planta: conduítes até cada máquina e luminárias pendentes. */
  private electricFitout() {
    const parts: PartDef[] = [[cylX(0.05, 27.5, 8), 0x1d1d22, T(-0.5, 8.0, -5.0)]]
    LINE.forEach((p, i) => {
      const top = KIND[i] === 'lathe' ? 1.0 : 2.6
      parts.push([cyl(0.04, 8.0 - top, 8), 0x1d1d22, T(p.x + (KIND[i] === 'lathe' ? -1.62 : 0), (8.0 + top) / 2, -5.0 + (KIND[i] === 'lathe' ? 1.1 : 0.6))])
      parts.push([cylZ(0.04, KIND[i] === 'lathe' ? 1.1 : 0.6, 8), 0x1d1d22, T(p.x + (KIND[i] === 'lathe' ? -1.62 : 0), 8.0, -5.0 + (KIND[i] === 'lathe' ? 0.55 : 0.3))])
    })
    this.conduits.add(new THREE.Mesh(bake(parts), this.vc))
    this.conduits.visible = false
    this.scene.add(this.conduits)

    const lampParts: PartDef[] = []
    const lampPos: THREE.Vector3[] = []
    for (let x = -14; x <= 10; x += 4) for (const z of [-2.2, 3.4]) lampPos.push(new THREE.Vector3(x + 2, 5.6, z))
    lampPos.forEach((p) => {
      lampParts.push([cyl(0.015, 8.4 - p.y, 6), 0x111111, T(p.x, (8.4 + p.y) / 2, p.z)])
      const shade = new THREE.CylinderGeometry(0.12, 0.55, 0.32, 24, 1, true)
      lampParts.push([shade, 0x2f5a3a, T(p.x, p.y, p.z)])
    })
    const shadeMat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.3, roughness: 0.45, side: THREE.DoubleSide })
    const lm = new THREE.Mesh(bake(lampParts), shadeMat)
    this.lamps.add(lm)
    lampPos.forEach((p) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), this.bulbMat)
      b.position.set(p.x, p.y - 0.12, p.z)
      b.userData.noShadow = true
      this.lamps.add(b)
    })
    for (let i = 0; i < lampPos.length; i += 4) {
      const l = new THREE.PointLight(0xffd29a, 0, 13, 1.6)
      l.position.copy(lampPos[i]).add(lampPos[i + 1]).multiplyScalar(0.5).setY(4.8)
      this.lampLights.push(l)
      this.scene.add(l)
    }
    this.lamps.visible = false
    this.scene.add(this.lamps)
  }

  /** Linha de montagem (Ford, 1913): trilhos, corrente, chassis e operários. */
  private assemblyLine() {
    const C = this.conveyor
    const rails: PartDef[] = []
    const len = LINE_X1 - LINE_X0 + 1
    for (const dz of [-0.55, 0.55]) rails.push([box(len, 0.16, 0.12), COLORS.steel, T((LINE_X0 + LINE_X1) / 2, 0.08, LINE_Z + dz)])
    for (let x = LINE_X0; x <= LINE_X1; x += 1.2) rails.push([box(0.14, 0.06, 1.4), COLORS.ironDark, T(x, 0.03, LINE_Z)])
    C.add(new THREE.Mesh(bake(rails), this.vcMetal))
    this.chain = canvasTex(32, 128, (c) => {
      c.fillStyle = '#1b1b1d'
      c.fillRect(0, 0, 32, 128)
      c.fillStyle = '#7d808a'
      for (let y = 0; y < 128; y += 32) {
        c.fillRect(6, y + 4, 20, 22)
        c.fillStyle = '#1b1b1d'
        c.fillRect(11, y + 9, 10, 12)
        c.fillStyle = '#7d808a'
      }
    })
    this.chain.repeat.set(1, len / 0.5)
    this.textures.push(this.chain)
    const ch = new THREE.Mesh(new THREE.PlaneGeometry(0.22, len), new THREE.MeshStandardMaterial({ map: this.chain, metalness: 0.6, roughness: 0.4 }))
    ch.rotation.set(-Math.PI / 2, 0, Math.PI / 2)
    ch.position.set((LINE_X0 + LINE_X1) / 2, 0.075, LINE_Z)
    C.add(ch)
    C.visible = false
    this.scene.add(C)

    for (let i = 0; i < N_CHASSIS; i++) {
      const c = this.makeChassis()
      c.g.position.set(LINE_X0 + (i * (LINE_X1 - LINE_X0)) / N_CHASSIS, 0, LINE_Z)
      C.add(c.g)
      this.chassis.push(c)
    }

    const r = rng(42)
    const stations = [-12.5, -9.5, -6.5, -3.5, -0.5, 2.5, 5.5, 8.5]
    stations.forEach((x, i) => {
      for (const side of i % 2 ? [-1] : [-1, 1]) {
        const w = this.makeWorker(r)
        w.g.position.set(x + (r() - 0.5) * 0.6, 0, LINE_Z + side * 1.35)
        w.g.rotation.y = side > 0 ? Math.PI : 0
        this.workerGrp.add(w.g)
        this.workers.push(w)
      }
    })
    this.workerGrp.visible = false
    this.scene.add(this.workerGrp)
  }

  private makeChassis() {
    const g = new THREE.Group()
    const parts: { o: THREE.Object3D; at: number }[] = []
    const add = (defs: PartDef[], at: number, mat = this.vc) => {
      const m = new THREE.Mesh(bake(defs), mat)
      g.add(m)
      parts.push({ o: m, at })
    }
    const black = 0x0e0e12
    // quadro
    add([[box(3.0, 0.12, 0.09), black, T(0, 0.62, -0.36)], [box(3.0, 0.12, 0.09), black, T(0, 0.62, 0.36)], [box(0.09, 0.1, 0.8), black, T(-1.3, 0.62)], [box(0.09, 0.1, 0.8), black, T(0, 0.62)], [box(0.09, 0.1, 0.8), black, T(1.3, 0.62)]], -99)
    // eixos e rodas
    const wheels: PartDef[] = [[cylZ(0.04, 1.4, 10), black, T(-1.1, 0.42)], [cylZ(0.04, 1.4, 10), black, T(1.1, 0.42)]]
    for (const x of [-1.1, 1.1])
      for (const z of [-0.66, 0.66]) {
        wheels.push([new THREE.TorusGeometry(0.36, 0.06, 10, 28), COLORS.rubber, T(x, 0.42, z)])
        wheels.push([cylZ(0.07, 0.12, 12), black, T(x, 0.42, z)])
        for (let s = 0; s < 10; s++) wheels.push([box(0.035, 0.6, 0.035), 0x8a5a2e, T(x, 0.42, z, 0, 0, (s / 10) * Math.PI)])
      }
    add(wheels, LINE_X0 + 3.5)
    // motor
    add([[box(0.72, 0.42, 0.44), 0x3c3f45, T(0.95, 0.88)], [box(0.62, 0.12, 0.4), 0x55585f, T(0.95, 1.14)], [cylX(0.1, 0.3, 12), 0x55585f, T(0.48, 0.8)]], LINE_X0 + 8)
    // radiador e capô
    add([[box(0.14, 0.64, 0.6), COLORS.brass, T(1.48, 1.02)], [box(0.72, 0.36, 0.52), black, T(0.98, 1.24)]], LINE_X0 + 12, this.vcMetal)
    // carroceria
    add([[box(1.35, 0.52, 0.92), black, T(-0.45, 1.06)], [box(0.12, 0.62, 0.92), black, T(-1.06, 1.42)], [box(0.5, 0.12, 0.8), 0x2a1a12, T(-0.55, 1.3)]], LINE_X0 + 16)
    // direção e para-lamas
    add(
      [
        [cyl(0.025, 0.8, 8), black, T(0.32, 1.45, -0.2, 0, 0, -0.6)],
        [new THREE.TorusGeometry(0.17, 0.02, 8, 20), black, T(0.08, 1.8, -0.2, Math.PI / 2, 0, -0.6)],
        [box(0.9, 0.04, 0.22), black, T(1.0, 0.82, -0.68)],
        [box(0.9, 0.04, 0.22), black, T(1.0, 0.82, 0.68)],
        [box(0.9, 0.04, 0.22), black, T(-1.15, 0.82, -0.68)],
        [box(0.9, 0.04, 0.22), black, T(-1.15, 0.82, 0.68)],
      ],
      LINE_X0 + 20,
    )
    return { g, parts }
  }

  private makeWorker(r: () => number) {
    const g = new THREE.Group()
    const cloth = [0x2c3a55, 0x3a3328, 0x2b2f2a, 0x4a3b2c][Math.floor(r() * 4)]
    const skin = [0xc99a7a, 0xa8775a, 0x8a5c42, 0xe0b49a][Math.floor(r() * 4)]
    const cap = [0x2a2622, 0x4a4036, 0x1e2a3a][Math.floor(r() * 3)]
    g.add(
      new THREE.Mesh(
        bake([
          [new THREE.CapsuleGeometry(0.085, 0.55, 4, 8), cloth, T(-0.1, 0.42)],
          [new THREE.CapsuleGeometry(0.085, 0.55, 4, 8), cloth, T(0.1, 0.42)],
          [new THREE.CapsuleGeometry(0.2, 0.42, 4, 10), cloth, T(0, 1.12, 0, 0, 0, 0, 1, 1, 0.75)],
          [new THREE.SphereGeometry(0.12, 14, 10), skin, T(0, 1.58)],
          [cyl(0.13, 0.07, 14, 0.12), cap, T(0, 1.68)],
          [box(0.2, 0.02, 0.12), cap, T(0, 1.65, 0.12)],
          [box(0.36, 0.42, 0.02), 0x6b5a45, T(0, 1.0, 0.16)],
        ]),
        this.vc,
      ),
    )
    const arms: THREE.Object3D[] = []
    for (const s of [-1, 1]) {
      const a = new THREE.Group()
      a.position.set(s * 0.25, 1.36, 0)
      a.add(new THREE.Mesh(bake([[new THREE.CapsuleGeometry(0.06, 0.46, 4, 8), cloth, T(0, -0.27)], [new THREE.SphereGeometry(0.06, 8, 6), skin, T(0, -0.56)]]), this.vc))
      g.add(a)
      arms.push(a)
    }
    // operários olham para a linha (+z local)
    return { g, arms, ph: r() * Math.PI * 2 }
  }

  /** Névoa, poeira em suspensão e, no fim, a camada de IA. */
  private atmosphere() {
    const N = 500
    const pos = new Float32Array(N * 3)
    const r = rng(99)
    for (let i = 0; i < N; i++) pos.set([-18 + r() * 32, 0.5 + r() * 7.5, -7.5 + r() * 14], i * 3)
    this.dustBase = pos.slice()
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const dotTex = canvasTex(32, 32, (c) => {
      const g = c.createRadialGradient(16, 16, 0, 16, 16, 16)
      g.addColorStop(0, 'rgba(255,240,210,1)')
      g.addColorStop(1, 'rgba(255,240,210,0)')
      c.fillStyle = g
      c.fillRect(0, 0, 32, 32)
    })
    this.textures.push(dotTex)
    this.dust = new THREE.Points(geo, new THREE.PointsMaterial({ map: dotTex, size: 0.07, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe6c0 }))
    this.scene.add(this.dust)
  }

  private aiLayer() {
    const A = this.aiGrp
    this.grid = new THREE.GridHelper(36, 36, 0x9156f1, 0x5a2fa8)
    this.grid.position.set(-2, 0.02, 0)
    const gm = this.grid.material as THREE.Material
    gm.transparent = true
    gm.opacity = 0
    A.add(this.grid)
    // núcleo
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), this.aiMat)
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), new THREE.MeshBasicMaterial({ color: 0xcbb3ff, wireframe: true, transparent: true, opacity: 0 }))
    this.aiCore.add(core, shell)
    this.aiCore.position.set(-2, 6.6, -1.4)
    A.add(this.aiCore)
    // sensores nas máquinas (posições do layout do processo) e nas estações da linha
    const targets: THREE.Vector3[] = []
    LINE.forEach((p, i) => targets.push(new THREE.Vector3(p.x + (KIND[i] === 'lathe' ? -1.07 : 0), KIND[i] === 'lathe' ? 2.0 : 2.75, p.z + (KIND[i] === 'lathe' ? 0 : -0.1))))
    for (const x of [-11, -5, 1, 7]) targets.push(new THREE.Vector3(x, 1.9, LINE_Z - 1.6))
    const pulseGeo = new THREE.SphereGeometry(0.07, 10, 8)
    targets.forEach((t, i) => {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), this.aiMat)
      node.position.copy(t)
      A.add(node)
      const mid = this.aiCore.position.clone().add(t).multiplyScalar(0.5)
      mid.y += 1.6
      const curve = new THREE.QuadraticBezierCurve3(this.aiCore.position.clone(), mid, t)
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.018, 6), this.aiLineMat)
      A.add(tube)
      const pulses = [0, 1].map((k) => {
        const p = new THREE.Mesh(pulseGeo, this.aiMat)
        p.userData.t = (i * 0.13 + k * 0.5) % 1
        p.userData.dir = k ? -1 : 1
        A.add(p)
        return p
      })
      this.aiLinks.push({ curve, pulses })
    })
    A.traverse((o) => (o.userData.noShadow = true))
    A.visible = false
    this.scene.add(A)
  }

  /* ---------------------------------------------------------------- passos */

  private show(obj: THREE.Object3D, on: boolean, d = 0.8, delay = 0) {
    gsap.killTweensOf(obj.scale)
    if (on) {
      obj.visible = true
      gsap.to(obj.scale, { x: 1, y: 1, z: 1, duration: d, delay, ease: 'back.out(1.5)' })
    } else if (obj.visible) {
      gsap.to(obj.scale, { x: 0.001, y: 0.001, z: 0.001, duration: d * 0.6, delay, ease: 'power2.in', onComplete: () => { obj.visible = false } })
    }
  }

  /** Entra/sai por deslocamento vertical (afunda no piso ou sobe ao telhado). */
  private reveal(obj: THREE.Object3D, on: boolean, from: number, d = 1, delay = 0) {
    gsap.killTweensOf(obj.position)
    if (on) {
      if (!obj.visible) obj.position.y = from
      obj.visible = true
      gsap.to(obj.position, { y: 0, duration: d, delay, ease: 'power3.out' })
    } else if (obj.visible) {
      gsap.to(obj.position, { y: from, duration: d * 0.8, delay, ease: 'power2.in', onComplete: () => { obj.visible = false } })
    }
  }

  setStep(step: number) {
    if (step === this.step) return
    this.step = step
    const cam = CAMS[Math.min(step, CAMS.length - 1)]
    gsap.to(this.camera.position, { x: cam.p[0], y: cam.p[1], z: cam.p[2], duration: 2.4, ease: 'power2.inOut', overwrite: true })
    gsap.to(this.camTarget, { x: cam.t[0], y: cam.t[1], z: cam.t[2], duration: 2.4, ease: 'power2.inOut', overwrite: true })

    const steam = step === 0
    const shaftOn = step <= 1
    this.reveal(this.engine, steam, -7, 1.2)
    this.reveal(this.bigMotor, step === 1, -4, 1.2, step === 1 ? 0.7 : 0)
    this.reveal(this.shaftSys, shaftOn, 5, 1.2)
    this.reveal(this.conduits, step >= 2, 4, 1, step >= 2 ? 1.6 : 0)
    this.reveal(this.lamps, step >= 2, 3, 1, step >= 2 ? 1.2 : 0)
    this.unitMotors.forEach((m, i) => this.show(m, step >= 2, 0.5, step >= 2 ? 1.8 + i * 0.08 : 0))
    this.reveal(this.conveyor, step >= 3, -1.6, 1.1)
    this.reveal(this.workerGrp, step >= 3, -2.4, 1, step >= 3 ? 0.4 : 0)

    // layout das máquinas
    const layout = shaftOn ? ROW : LINE
    this.machines.forEach((m, i) => {
      const p = layout[i]
      const dl = !shaftOn ? 0.7 + i * 0.06 : 0
      gsap.to(m.position, { x: p.x, z: p.z, duration: 1.8, delay: dl, ease: 'power3.inOut', overwrite: true })
      gsap.to(m.rotation, { y: p.ry, duration: 1.8, delay: dl, ease: 'power3.inOut', overwrite: true })
    })

    // energia, clima e luz
    gsap.to(this.st, {
      engine: steam ? 1 : 0,
      motor: step === 1 ? 1 : 0,
      unit: step >= 2 ? 1 : 0,
      smoke: steam ? 1 : 0,
      fire: steam ? 1 : step === 1 ? 0.15 : 0,
      dust: step <= 1 ? 1 : step <= 3 ? 0.35 : 0.1,
      beams: step <= 1 ? 1 : step <= 4 ? 0.45 : 0.15,
      lamps: step >= 2 ? 1 : 0,
      line: step >= 3 ? (step >= 4 ? 2.3 : 1) : 0,
      ai: step >= 5 ? 1 : 0,
      grid: step >= 5 ? 1 : 0,
      duration: 1.4,
      overwrite: true,
    })
    gsap.to(this.motorGlow, { emissiveIntensity: step >= 1 ? 1.6 : 0, duration: 1 })
    const hemiI = [0.75, 0.8, 1.1, 1.15, 1.25, 1.3][step] ?? 1
    gsap.to(this.hemi, { intensity: hemiI, duration: 1.5 })
    const sky = new THREE.Color(step >= 5 ? 0xd9d4ff : step >= 2 ? 0xfff1dd : 0xffe1bf)
    gsap.to(this.hemi.color, { r: sky.r, g: sky.g, b: sky.b, duration: 1.5 })
    gsap.to(this.sun, { intensity: step >= 5 ? 2.2 : step >= 2 ? 2.8 : 3.4, duration: 1.5 })
    const fog = this.scene.fog as THREE.FogExp2
    const fc = new THREE.Color(step >= 5 ? 0x1c1438 : step >= 2 ? 0x241d2c : 0x2e2228)
    gsap.to(fog, { density: [0.026, 0.022, 0.012, 0.011, 0.008, 0.009][step] ?? 0.01, duration: 1.5 })
    gsap.to(fog.color, { r: fc.r, g: fc.g, b: fc.b, duration: 1.5 })
    const floorC = new THREE.Color(step >= 5 ? 0x8f86b8 : 0xc8b8a8)
    gsap.to(this.floorMat.color, { r: floorC.r, g: floorC.g, b: floorC.b, duration: 1.5 })
  }

  /* ---------------------------------------------------------------- animação */

  private loop = (now?: number) => {
    this.timer.update(now)
    const dt = Math.min(this.timer.getDelta(), 0.05)
    const t = this.timer.getElapsed()
    const st = this.st

    // máquina a vapor: biela-manivela (cilindro em -z, manivela em z = 0)
    const wEngine = st.engine * 2.4
    this.theta += wEngine * dt
    const th = this.theta
    const rc = 0.7
    const L = 2.4
    const pz = rc * Math.cos(th)
    const py = rc * Math.sin(th)
    const hz = pz - Math.sqrt(L * L - py * py)
    this.flywheel.rotation.x = -th
    this.crankDisc.rotation.x = -th
    const ex = 13.55
    this.crosshead.position.set(ex, FLY.y, hz)
    this.pistonRod.position.set(ex, FLY.y, hz - 0.85)
    this.conrod.position.set(ex, FLY.y + py / 2, (hz + pz) / 2)
    this.conrod.rotation.x = -Math.atan2(py, pz - hz)
    this.governor.rotation.y += wEngine * dt * 1.6
    this.govBalls.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * (0.25 + 0.45 * st.engine)))

    // eixo de transmissão: movido pelo volante (passo 0) ou pelo motor (passo 1)
    const shaftW = (st.engine * 2.4 * FLY.r) / 0.75 + st.motor * 7
    this.shaftAngle += shaftW * dt
    this.shaftSpin.forEach((p) => (p.rotation.x = -this.shaftAngle))
    this.motorRotor.rotation.x = -this.shaftAngle
    const beltV = shaftW * 0.75 * dt * 0.8
    if (this.beltMats.length) {
      this.beltMats[0].map!.offset.y += beltV
      this.beltMats[1].map!.offset.y -= beltV
    }

    // máquinas: giram com o eixo (passos 0-1) ou com o próprio motor (2+)
    const machW = Math.min(1, st.engine + st.motor + st.unit) * 9
    this.spinners.forEach((s) => {
      if (s.userData.axis === 'y') s.rotation.y += machW * dt
      else s.rotation.x -= machW * dt
    })
    this.carriages.forEach((c, i) => (c.position.x = 0.1 + Math.sin(t * 0.4 + i) * 0.45 * Math.min(1, machW)))

    // fumaça da chaminé e baforadas no escape do cilindro
    this.smoke.forEach((p) => {
      p.userData.t += dt * 0.07
      if (p.userData.t > 1) p.userData.t -= 1
      const k = p.userData.t
      const m = p.material as THREE.SpriteMaterial
      p.position.set(13.6 - k * 8 + Math.sin(k * 6 + p.userData.rot * 10) * 0.6, 11.9 + k * 5, -10.2 + k * 1.5)
      p.scale.setScalar(1.2 + k * 6)
      m.rotation += p.userData.rot * dt
      m.opacity = 0.75 * Math.sin(Math.PI * Math.min(1, k * 1.4)) * st.smoke
    })
    const beat = (th / Math.PI) % 1
    this.puffs.forEach((p, i) => {
      const k = (beat + i / this.puffs.length) % 1
      const m = p.material as THREE.SpriteMaterial
      p.position.set(13.9 + k * 0.4, FLY.y - 0.5 + k * 1.6, -6.2 - k * 0.6)
      p.scale.setScalar(0.3 + k * 1.2)
      m.opacity = 0.45 * (1 - k) * st.engine
    })
    this.fireLight.intensity = st.fire * (6 + Math.sin(t * 17) * 1.2 + Math.sin(t * 7.3) * 1.6)
    this.fireMat.emissiveIntensity = 0.2 + st.fire * (2.6 + Math.sin(t * 13) * 0.5)

    // poeira e feixes de luz
    const dp = this.dust.geometry.attributes.position as THREE.BufferAttribute
    const arr = dp.array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] = this.dustBase[i] + Math.sin(t * 0.15 + i) * 0.4
      arr[i + 1] = this.dustBase[i + 1] + Math.sin(t * 0.11 + i * 0.7) * 0.3
    }
    dp.needsUpdate = true
    ;(this.dust.material as THREE.PointsMaterial).opacity = 0.55 * st.dust
    this.beams.forEach((b) => ((b.material as THREE.MeshBasicMaterial).opacity = 0.16 * st.beams))

    // luz elétrica
    this.bulbMat.emissiveIntensity = st.lamps * 3.2
    this.lampLights.forEach((l) => (l.intensity = st.lamps * 9))

    // linha de montagem: o chassi ganha peças conforme avança
    if (st.line > 0.001) {
      const span = LINE_X1 - LINE_X0
      this.chain.offset.y -= dt * 0.35 * st.line
      this.chassis.forEach((c) => {
        c.g.position.x += dt * 0.32 * st.line
        if (c.g.position.x > LINE_X1) c.g.position.x -= span
        const x = c.g.position.x
        c.parts.forEach((p) => (p.o.visible = x > p.at))
      })
      this.workers.forEach((w) => {
        const a = Math.sin(t * 2.6 * Math.max(0.6, st.line) + w.ph)
        w.arms[0].rotation.x = -0.7 + a * 0.45
        w.arms[1].rotation.x = -0.5 - a * 0.4
        w.g.children[0].rotation.y = Math.sin(t * 0.8 + w.ph) * 0.08
      })
    }

    // camada de IA
    const ai = st.ai
    this.aiGrp.visible = ai > 0.01 || st.grid > 0.01
    this.aiMat.opacity = ai
    this.aiMat.emissiveIntensity = ai * (2.2 + Math.sin(t * 3) * 0.4)
    this.aiLineMat.opacity = ai * 0.55
    ;(this.grid.material as THREE.Material).opacity = st.grid * 0.22
    ;((this.aiCore.children[1] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = ai * 0.5
    this.aiCore.rotation.y += dt * 0.5
    this.aiCore.rotation.x += dt * 0.2
    if (ai > 0.01) {
      this.aiLinks.forEach((l) =>
        l.pulses.forEach((p) => {
          p.userData.t = (p.userData.t + dt * 0.35 + 1) % 1
          const u = p.userData.dir > 0 ? p.userData.t : 1 - p.userData.t
          l.curve.getPoint(u, p.position)
          p.scale.setScalar(ai)
        }),
      )
    }

    this.camera.lookAt(this.camTarget)
    if (this.composer) this.composer.render()
    else this.renderer.render(this.scene, this.camera)
    this.raf = requestAnimationFrame(this.loop)
  }

  /** Ensaio: posiciona a câmera direto (usado só em dev para enquadrar). */
  debugCam(p: [number, number, number], t: [number, number, number]) {
    gsap.killTweensOf([this.camera.position, this.camTarget])
    this.camera.position.set(...p)
    this.camTarget.set(...t)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.timer.dispose()
    gsap.killTweensOf([this.camera.position, this.camTarget, this.st, this.hemi, this.hemi.color, this.sun, this.motorGlow, this.floorMat.color, this.scene.fog!])
    this.machines.forEach((m) => gsap.killTweensOf([m.position, m.rotation]))
    this.scene.traverse((o) => {
      gsap.killTweensOf([o.scale, o.position])
      const m = o as THREE.Mesh
      m.geometry?.dispose()
      const mm = m.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mm)) mm.forEach((x) => x.dispose())
      else mm?.dispose()
    })
    this.textures.forEach((t) => t.dispose())
    this.pmremTex?.dispose()
    this.composer?.dispose()
    this.renderer.dispose()
    this.host.removeChild(this.renderer.domElement)
  }
}

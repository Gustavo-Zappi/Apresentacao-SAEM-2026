import * as THREE from 'three'
import gsap from 'gsap'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { projector } from '../lib/display'

/**
 * Sistema de bombeamento em 3D (slides do agente): reservatório inferior, sucção, bomba centrífuga
 * de sucção axial com a voluta aberta (rotor girando), recalque com retenção, gaveta e manômetro,
 * medidor de vazão, reservatório elevado. A tubulação é de aço em corte longitudinal: dá para ver a água.
 *
 *  - modo "sizing": o agente dimensiona item a item; a câmera voa até cada peça e, no fim, a bomba
 *    desarma e a onda de pressão do golpe de aríete corre pelo recalque.
 *  - modo "loop": malha fechada de vazão simulada de verdade (planta de 1ª ordem + controlador PI):
 *    uma perturbação derruba a vazão, o inversor acelera a bomba e a vazão volta ao setpoint.
 *
 * Números da narrativa (não mudam): água 20 °C, 30 m³/h, DN 80, 120 m, Δz 18 m, H ≈ 24 m (≈ 2,4 bar),
 * golpe de aríete ΔH ≈ 214 m (≈ 21 bar). A geometria é ilustrativa, fora de escala.
 *
 * Qualidade: `?q=baixa` desliga o bloom e reduz partículas.
 */

export type PumpMode = 'loop' | 'sizing'
export type Part = 'agua' | 'tubo' | 'acess' | 'dz' | 'bomba' | 'golpe' | 'malha'

/* ------------------------------------------------------------------ layout (unidades ≈ metros de desenho) */

const PX = -2.6 // centro da voluta
const PY = 0.82
const SUC_Z = 0.62 // plano da sucção (na frente da bomba)
const RISER_X = PX + 0.6 // bocal de recalque
const NOZ_Y = PY + 0.95
const TOP_Y = 4.95
const DROP_X = 6.0
const PIPE_R = 0.115
const WATER_R = 0.082
const T1 = { x: -6.7, z: 0.75, w: 2.8, d: 2.3, h: 1.9, level: 1.45 } // reservatório inferior
const T2 = { x: 6.3, z: 0, w: 2.6, d: 2.2, h: 1.8, base: 2.62, level: 1.4 } // reservatório elevado
const CHECK_Y = 2.25
const GATE_Y = 2.92
const GAUGE = new THREE.Vector3(RISER_X + 0.78, 3.8, 0.12)
const METER_X = 0.2

const C = {
  steel: 0xaab3c9,
  steelDark: 0x4b5068,
  cast: 0x3f4aa8, // carcaça da bomba (azul de máquina)
  motor: 0x7a3fd0, // roxo da marca
  amber: 0xffb547,
  red: 0xe5533d,
  water: 0x3f8cff,
  waterHi: 0xbfe6ff,
  hammer: 0xff3b30,
  green: 0x3ddc97,
  lilac: 0xcbb3ff,
}

type Pose = { p: [number, number, number]; t: [number, number, number] }

// dimensionamento: 0 pedido · 1 plano · 2 fluido · 3 tubo · 4 acessórios · 5 altura · 6 bomba · 7 golpe · 8 decisão
const SIZING_CAMS: Pose[] = [
  { p: [-2.0, 3.9, 24.2], t: [-0.25, 2.62, 0] },
  { p: [-2.0, 3.9, 24.2], t: [-0.25, 2.62, 0] },
  { p: [-6.6, 2.9, 14.2], t: [-4.3, 1.75, 0.3] },
  { p: [0.9, 5.1, 15.2], t: [1.9, 4.15, 0] },
  { p: [1.6, 3.4, 13.4], t: [-0.9, 2.75, 0.1] },
  { p: [1.4, 3.7, 23.4], t: [0.1, 2.6, 0] },
  { p: [0.9, 2.05, 5.9], t: [-1.55, 1.02, -0.35] },
  { p: [0.4, 3.9, 18.2], t: [1.0, 3.3, 0] },
  { p: [-2.0, 3.9, 24.2], t: [-0.25, 2.62, 0] },
]
const SIZING_FOCUS: (Part | null)[] = [null, null, 'agua', 'tubo', 'acess', 'dz', 'bomba', 'golpe', null]
const LOOP_CAM: Pose = { p: [-5.6, 5.9, 26], t: [-0.1, 2.45, 0] }

/* ------------------------------------------------------------------ utilidades */

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  draw(cv.getContext('2d')!)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** Curva por pontos densos, parametrizada pelo comprimento de arco (robusta em t = 0 e t = 1). */
class PolyCurve extends THREE.Curve<THREE.Vector3> {
  private acc: number[] = [0]
  constructor(private pts: THREE.Vector3[]) {
    super()
    for (let i = 1; i < pts.length; i++) this.acc.push(this.acc[i - 1] + pts[i].distanceTo(pts[i - 1]))
  }
  get total() {
    return this.acc[this.acc.length - 1]
  }
  override getPoint(t: number, target = new THREE.Vector3()) {
    const d = Math.min(1, Math.max(0, t)) * this.total
    let lo = 0
    let hi = this.acc.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (this.acc[mid] <= d) lo = mid
      else hi = mid
    }
    const seg = this.acc[hi] - this.acc[lo]
    return target.copy(this.pts[lo]).lerp(this.pts[hi], seg > 0 ? (d - this.acc[lo]) / seg : 0)
  }
  override getLength() {
    return this.total
  }
}

/** Linha de centro com cantos arredondados (raio r). */
function roundedPath(pts: THREE.Vector3[], r: number) {
  const out: THREE.Vector3[] = [pts[0].clone()]
  const line = (a: THREE.Vector3, b: THREE.Vector3) => {
    const n = Math.max(1, Math.round(a.distanceTo(b) / 0.08))
    for (let i = 1; i <= n; i++) out.push(a.clone().lerp(b, i / n))
  }
  let prev = pts[0].clone()
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]
    if (i < pts.length - 1) {
      const a = p.clone().addScaledVector(p.clone().sub(pts[i - 1]).normalize(), -r)
      const b = p.clone().addScaledVector(pts[i + 1].clone().sub(p).normalize(), r)
      line(prev, a)
      const q = new THREE.QuadraticBezierCurve3(a, p.clone(), b)
      for (let k = 1; k <= 14; k++) out.push(q.getPoint(k / 14))
      prev = b
    } else line(prev, p.clone())
  }
  return new PolyCurve(out)
}

const WATER_VERT = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main() {
    vUv = uv; vP = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`

/** Água dentro do tubo: filetes luminosos correndo + frente de pressão do golpe de aríete. */
const WATER_FRAG = /* glsl */ `
  uniform float uPhase, uLen, uDim, uWave, uWaveOn, uS0, uFlow;
  uniform vec3 uA, uB, uHot;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    float s = vUv.x * uLen;
    float lane = floor(vUv.y * 12.0);
    float d = fract(s * 0.85 - uPhase * (0.7 + 0.6 * hash(lane + 3.0)) + hash(lane) * 7.0);
    float streak = smoothstep(0.0, 0.07, d) * smoothstep(0.6, 0.18, d);
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
    vec3 col = mix(uA, uB, clamp(streak * (0.35 + 0.65 * uFlow) + fres * 0.4, 0.0, 1.0));
    col *= 0.5 + 0.62 * streak * uFlow;
    float w = exp(-pow((s - uWave) / 0.5, 2.0)) * uWaveOn;
    float hp = uWaveOn * smoothstep(uWave + 0.25, uWave - 0.25, s) * step(uS0, s) * 0.42;
    col = mix(col, uHot, clamp(w + hp, 0.0, 1.0));
    col *= 1.0 + w * 2.6;
    col = mix(col, col * 0.2, uDim);
    gl_FragColor = vec4(col, 0.94);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`

/** Água dentro da bomba (visto de frente): canais do rotor girando, voluta e bocal de recalque. */
const SWIRL_FRAG = /* glsl */ `
  uniform float uAng, uPhase, uDim, uFlow, uHot;
  uniform vec3 uA, uB;
  varying vec3 vP;
  void main() {
    float r = length(vP.xy);
    float th = atan(vP.y, vP.x);
    float k;
    if (vP.x > 0.47 && vP.y > 0.05) k = fract(vP.y * 1.6 - uPhase * 1.4);            // bocal: sobe
    else if (r < 0.445) k = fract((th - uAng) * 0.955 + r * 3.2);                      // canais do rotor
    else k = fract(th * 0.8 - uPhase * 1.1 + r * 1.5);                                 // voluta: acompanha a rotação
    float streak = smoothstep(0.0, 0.12, k) * smoothstep(0.75, 0.3, k);
    vec3 col = mix(uA, uB, streak * (0.3 + 0.7 * uFlow));
    col *= 0.42 + 0.6 * streak * uFlow + 0.3 * smoothstep(0.2, 0.7, r);
    col = mix(col, vec3(1.0, 0.25, 0.2) * 1.6, uHot * 0.75);
    col = mix(col, col * 0.2, uDim);
    gl_FragColor = vec4(col, 0.96);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`

/** Superfície/volume de água do reservatório com gradiente vertical. */
const TANK_FRAG = /* glsl */ `
  uniform float uDim, uTime; uniform vec3 uA, uB;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.5);
    float g = smoothstep(-1.0, 1.0, vP.y * 1.3);
    float caust = 0.5 + 0.5 * sin(vP.x * 9.0 + uTime * 1.3 + sin(vP.y * 7.0 + uTime) * 1.2);
    vec3 col = mix(uA, uB, g * 0.75 + fres * 0.35) * (0.72 + 0.16 * caust * g);
    col = mix(col, col * 0.22, uDim);
    gl_FragColor = vec4(col, 0.62 + 0.25 * fres);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`

type DimMat = { m: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial; color: THREE.Color; emissive: number; opacity: number }

export class PumpScene {
  private renderer: THREE.WebGLRenderer
  private composer: EffectComposer | null = null
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private camTarget = new THREE.Vector3()
  private raf = 0
  private timer = new THREE.Timer()
  private low: boolean
  private stage = -1
  private disposed = false
  private textures: THREE.Texture[] = []
  private envTex: THREE.Texture | null = null
  private offProjector: () => void = () => {}
  private tl: gsap.core.Timeline | null = null

  /** Chamado a cada quadro, depois do render (o componente React reposiciona a camada HTML). */
  onFrame: (() => void) | null = null
  /** Leituras ao vivo para a camada HTML. */
  live = { q: 30, hz: 45, bar: 2.4, sp: 30, disturb: 0 }

  private st = {
    flow: 1, // 0 parado · 1 vazão nominal
    spin: 1, // rotação do rotor (fração da nominal)
    hammer: 0, // intensidade do golpe de aríete
    signals: 0, // malha de controle visível
    boost: projector.on ? 1 : 0,
    accRing: 0, // anéis de destaque dos acessórios
    dz: 0, // cota do desnível
    egl: 0, // linha de energia sobre o tubo
    shake: 0,
  }
  private dim: Record<Part, number> = { agua: 0, tubo: 0, acess: 0, dz: 0, bomba: 0, golpe: 0, malha: 0 }
  private dimMats: Record<Part, DimMat[]> = { agua: [], tubo: [], acess: [], dz: [], bomba: [], golpe: [], malha: [] }
  private dimUniforms: Record<Part, { value: number }[]> = { agua: [], tubo: [], acess: [], dz: [], bomba: [], golpe: [], malha: [] }

  private anchors: Record<string, THREE.Vector3> = {}
  private v = new THREE.Vector3()

  // partes animadas
  private impeller = new THREE.Group()
  private fan = new THREE.Group()
  private pipes = new THREE.Group()
  private needle = new THREE.Group()
  private checkFlash!: THREE.Mesh
  private gateWheel = new THREE.Group()
  private waterMats: THREE.ShaderMaterial[] = []
  private swirlMat!: THREE.ShaderMaterial
  private tankMats: THREE.ShaderMaterial[] = []
  private surfaces: { mesh: THREE.Mesh; base: Float32Array; amp: number }[] = []
  private jet!: THREE.Mesh
  private jetTex!: THREE.Texture
  private ripples: THREE.Mesh[] = []
  private accRings: THREE.Mesh[] = []
  private dzGroup = new THREE.Group()
  private eglMat!: THREE.MeshBasicMaterial
  private loopGroup = new THREE.Group()
  private signalMats: THREE.MeshBasicMaterial[] = []
  private signals: { curve: THREE.Curve<THREE.Vector3>; dots: THREE.Mesh[]; speed: number }[] = []
  private trend: { ctx: CanvasRenderingContext2D; tex: THREE.CanvasTexture; hist: number[]; fhist: number[]; acc: number } | null = null
  private ledMat!: THREE.MeshStandardMaterial

  // partículas
  private pts!: THREE.Points
  private pPos!: Float32Array
  private pCol!: Float32Array
  private pData: { path: 0 | 1 | 2; u: number; off: THREE.Vector3; sp: number }[] = []
  private samples: THREE.Vector3[][] = []
  private pathLen = [0, 0]
  private phase = 0
  private ang = 0
  private waveT = 0

  // malha fechada (simulação)
  private sim = { q: 30, f: 45, integ: 0, t: 0, g: 1 }

  constructor(private host: HTMLElement, private width: number, private height: number, private mode: PumpMode, shift: [number, number] = [0, 0]) {
    this.low = /[?&]q=baixa/.test(location.search)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.low ? 1 : 1.25))
    this.renderer.setSize(width, height)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.08
    this.renderer.localClippingEnabled = true
    host.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(mode === 'loop' ? 30 : 27, width / height, 0.1, 200)
    if (shift[0] || shift[1]) this.camera.setViewOffset(width, height, -shift[0], -shift[1], width, height)
    const pose = mode === 'loop' ? LOOP_CAM : SIZING_CAMS[0]
    this.camera.position.set(...pose.p)
    this.camTarget.set(...pose.t)
    this.camera.lookAt(this.camTarget)

    // fundo: o mesmo degradê do palco, para a cena ocupar o slide inteiro sem emenda
    const bg = canvasTex(256, 144, (c) => {
      c.fillStyle = '#100d2a'
      c.fillRect(0, 0, 256, 144)
      c.save()
      c.translate(256 * 0.2, 0)
      c.scale(1.2 * 256, 0.9 * 144)
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 1)
      g.addColorStop(0, '#2b2168')
      g.addColorStop(0.45, '#1a1542')
      g.addColorStop(1, '#100d2a')
      c.fillStyle = g
      c.fillRect(-1, -1, 3, 3)
      c.restore()
    })
    this.textures.push(bg)
    this.scene.background = bg

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    this.scene.environment = this.envTex
    this.scene.environmentIntensity = 0.5

    if (!this.low) {
      const composer = new EffectComposer(this.renderer)
      composer.addPass(new RenderPass(this.scene, this.camera))
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), 0.42, 0.5, 0.86))
      composer.addPass(new OutputPass())
      composer.setPixelRatio(this.renderer.getPixelRatio())
      composer.setSize(width, height)
      this.composer = composer
    }

    this.timer.connect(document)
    this.offProjector = projector.subscribe((v) => gsap.to(this.st, { boost: v ? 1 : 0, duration: 0.8 }))
    this.build()
    this.loop()
  }

  /* ---------------------------------------------------------------- materiais com escurecimento por parte */

  private std(part: Part, p: THREE.MeshStandardMaterialParameters) {
    const m = new THREE.MeshStandardMaterial(p)
    this.dimMats[part].push({ m, color: m.color.clone(), emissive: m.emissiveIntensity, opacity: m.opacity })
    return m
  }
  private basic(part: Part, p: THREE.MeshBasicMaterialParameters) {
    const m = new THREE.MeshBasicMaterial(p)
    this.dimMats[part].push({ m, color: m.color.clone(), emissive: 0, opacity: m.opacity })
    return m
  }
  private mesh(g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    const o = new THREE.Mesh(g, m)
    o.position.set(x, y, z)
    parent.add(o)
    return o
  }

  /* ---------------------------------------------------------------- construção */

  private build() {
    this.lights()
    this.ground()
    this.tanks()
    this.piping()
    this.pump()
    this.fittings()
    this.particles()
    this.annotations()
    if (this.mode === 'loop') this.controlLoop()
  }

  private lights() {
    this.scene.add(new THREE.HemisphereLight(0xdfe4ff, 0x1a1436, 0.7))
    const key = new THREE.DirectionalLight(0xffffff, 2.3)
    key.position.set(6, 12, 10)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight(0x9156f1, 2.6)
    rim.position.set(-10, 4, -8)
    this.scene.add(rim)
    const fill = new THREE.DirectionalLight(0x7fb4ff, 0.7)
    fill.position.set(-4, 2, 12)
    this.scene.add(fill)
  }

  private ground() {
    // grade com esmaecimento radial: sem borda dura
    const tex = canvasTex(1024, 1024, (c) => {
      c.clearRect(0, 0, 1024, 1024)
      c.strokeStyle = 'rgba(170,140,255,0.55)'
      c.lineWidth = 1.6
      for (let i = 0; i <= 40; i++) {
        const p = (i / 40) * 1024
        c.beginPath(); c.moveTo(p, 0); c.lineTo(p, 1024); c.stroke()
        c.beginPath(); c.moveTo(0, p); c.lineTo(1024, p); c.stroke()
      }
      const g = c.createRadialGradient(512, 512, 60, 512, 512, 512)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, 'rgba(0,0,0,1)')
      c.globalCompositeOperation = 'destination-out'
      c.fillStyle = g
      c.fillRect(0, 0, 1024, 1024)
    })
    this.textures.push(tex)
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false }))
    grid.rotation.x = -Math.PI / 2
    grid.position.set(0, 0, -2)
    this.scene.add(grid)
    // sombras de contato
    const blob = canvasTex(128, 128, (c) => {
      const g = c.createRadialGradient(64, 64, 4, 64, 64, 64)
      g.addColorStop(0, 'rgba(4,3,14,0.85)')
      g.addColorStop(1, 'rgba(4,3,14,0)')
      c.fillStyle = g
      c.fillRect(0, 0, 128, 128)
    })
    this.textures.push(blob)
    const bm = new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false })
    for (const [x, z, sx, sz] of [[T1.x, T1.z, 4.6, 3.8], [PX, -0.9, 3.2, 5.2], [T2.x, T2.z, 4.4, 3.8]] as const) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), bm)
      s.rotation.x = -Math.PI / 2
      s.position.set(x, 0.012, z)
      this.scene.add(s)
    }
  }

  /** Reservatório de aço com frente de vidro e água com superfície ondulando. */
  private tank(cx: number, base: number, cz: number, w: number, h: number, d: number, level: number, amp: number) {
    const g = new THREE.Group()
    g.position.set(cx, base, cz)
    const steel = this.std('agua', { color: 0x8f97b3, metalness: 0.8, roughness: 0.4 })
    const dark = this.std('agua', { color: 0x2c3158, metalness: 0.7, roughness: 0.5 })
    const t = 0.06
    this.mesh(new THREE.BoxGeometry(w, t, d), dark, g, 0, t / 2, 0) // fundo
    this.mesh(new THREE.BoxGeometry(w, h, t), dark, g, 0, h / 2, -d / 2 + t / 2) // parede do fundo
    for (const s of [-1, 1]) this.mesh(new THREE.BoxGeometry(t, h, d), dark, g, (s * (w - t)) / 2, h / 2, 0)
    // quadro de cantoneiras
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.mesh(new THREE.BoxGeometry(0.09, h + 0.06, 0.09), steel, g, (sx * w) / 2, h / 2, (sz * d) / 2)
    for (const sz of [-1, 1]) this.mesh(new THREE.BoxGeometry(w + 0.09, 0.09, 0.09), steel, g, 0, h, (sz * d) / 2)
    for (const sx of [-1, 1]) this.mesh(new THREE.BoxGeometry(0.09, 0.09, d), steel, g, (sx * w) / 2, h, 0)
    this.mesh(new THREE.BoxGeometry(w + 0.09, 0.09, 0.09), steel, g, 0, 0.045, d / 2)
    // vidro da frente
    const glass = this.std('agua', { color: 0xbfd4ff, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.08, depthWrite: false })
    this.mesh(new THREE.PlaneGeometry(w, h), glass, g, 0, h / 2, d / 2)
    // água
    const wm = new THREE.ShaderMaterial({
      vertexShader: WATER_VERT,
      fragmentShader: TANK_FRAG,
      uniforms: { uDim: { value: 0 }, uTime: { value: 0 }, uA: { value: new THREE.Color(0x12327e) }, uB: { value: new THREE.Color(0x58aaff) } },
      transparent: true,
      depthWrite: false,
    })
    this.tankMats.push(wm)
    this.dimUniforms.agua.push(wm.uniforms.uDim)
    const body = this.mesh(new THREE.BoxGeometry(w - 2 * t - 0.02, level, d - t - 0.02), wm, g, 0, level / 2 + t, t / 2)
    body.renderOrder = 2
    const sg = new THREE.PlaneGeometry(w - 2 * t - 0.02, d - t - 0.02, 28, 10)
    sg.rotateX(-Math.PI / 2)
    const sm = this.std('agua', { color: 0x6fb4ff, metalness: 0.2, roughness: 0.08, transparent: true, opacity: 0.55, emissive: 0x2a6bd8, emissiveIntensity: 0.35, depthWrite: false, side: THREE.DoubleSide })
    const surf = this.mesh(sg, sm, g, 0, level + t, t / 2)
    surf.renderOrder = 3
    this.surfaces.push({ mesh: surf, base: (sg.attributes.position.array as Float32Array).slice(), amp })
    this.scene.add(g)
    return g
  }

  private tanks() {
    this.tank(T1.x, 0, T1.z, T1.w, T1.h, T1.d, T1.level, 0.022)
    this.tank(T2.x, T2.base, T2.z, T2.w, T2.h, T2.d, T2.level, 0.035)
    // torre do reservatório elevado
    const steel = this.std('agua', { color: 0x7d86a6, metalness: 0.85, roughness: 0.4 })
    const tower = new THREE.Group()
    const hw = T2.w / 2 - 0.1
    const hd = T2.d / 2 - 0.1
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.mesh(new THREE.BoxGeometry(0.12, T2.base, 0.12), steel, tower, T2.x + sx * hw, T2.base / 2, T2.z + sz * hd)
    const brace = (ax: number, az: number, bx: number, bz: number, y0: number, y1: number) => {
      const a = new THREE.Vector3(ax, y0, az)
      const b = new THREE.Vector3(bx, y1, bz)
      const len = a.distanceTo(b)
      const m = this.mesh(new THREE.BoxGeometry(0.05, len, 0.05), steel, tower)
      m.position.copy(a).add(b).multiplyScalar(0.5)
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    }
    for (const sz of [-1, 1]) {
      brace(T2.x - hw, T2.z + sz * hd, T2.x + hw, T2.z + sz * hd, 0.15, T2.base - 0.25)
      brace(T2.x + hw, T2.z + sz * hd, T2.x - hw, T2.z + sz * hd, 0.15, T2.base - 0.25)
      this.mesh(new THREE.BoxGeometry(T2.w - 0.2, 0.07, 0.07), steel, tower, T2.x, T2.base * 0.52, T2.z + sz * hd)
    }
    for (const sx of [-1, 1]) {
      brace(T2.x + sx * hw, T2.z - hd, T2.x + sx * hw, T2.z + hd, 0.15, T2.base - 0.25)
      brace(T2.x + sx * hw, T2.z + hd, T2.x + sx * hw, T2.z - hd, 0.15, T2.base - 0.25)
    }
    this.mesh(new THREE.BoxGeometry(T2.w + 0.2, 0.1, T2.d + 0.2), steel, tower, T2.x, T2.base - 0.05, T2.z)
    this.scene.add(tower)

    this.anchors.tank1 = new THREE.Vector3(T1.x, T1.level * 0.55, T1.z + T1.d / 2)
    this.anchors.tank1top = new THREE.Vector3(T1.x - 0.9, T1.level * 0.6, T1.z + T1.d / 2)
    this.anchors.tank1lbl = new THREE.Vector3(T1.x, T1.h + 0.12, T1.z - T1.d / 2)
    this.anchors.tank2 = new THREE.Vector3(T2.x, T2.base + T2.level * 0.5, T2.z + T2.d / 2)
    this.anchors.tank2lbl = new THREE.Vector3(T2.x + 0.2, T2.base + T2.h + 0.4, T2.z - T2.d / 2)
    this.anchors.tank2top = new THREE.Vector3(T2.x + 0.3, T2.base + T2.h + 0.15, T2.z)
  }

  /** Tubulação de aço em corte longitudinal + água luminosa por dentro. */
  private piping() {
    const suction = roundedPath(
      [new THREE.Vector3(T1.x + 0.5, PY, SUC_Z), new THREE.Vector3(PX, PY, SUC_Z), new THREE.Vector3(PX, PY, 0.2)],
      0.3,
    )
    const discharge = roundedPath(
      [new THREE.Vector3(RISER_X, NOZ_Y - 0.05, 0), new THREE.Vector3(RISER_X, TOP_Y, 0), new THREE.Vector3(DROP_X, TOP_Y, 0), new THREE.Vector3(DROP_X, T2.base + T2.h + 0.12, 0)],
      0.34,
    )
    const paths = [suction, discharge]
    // planos de corte: recalque sem a metade da frente; sucção sem o quadrante de cima/frente
    const clips = [new THREE.Plane(new THREE.Vector3(0, -0.62, -0.78).normalize(), 0), new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.035)]
    clips[0].constant = -clips[0].normal.dot(new THREE.Vector3(0, PY + 0.02, SUC_Z + 0.02))
    paths.forEach((path, k) => {
      const len = path.getLength()
      this.pathLen[k] = len
      const seg = Math.round(len * 14)
      const steel = this.std('tubo', { color: C.steel, metalness: 0.88, roughness: 0.32, side: THREE.DoubleSide, clippingPlanes: [clips[k]] })
      const inner = this.std('tubo', { color: 0x30344c, metalness: 0.6, roughness: 0.6, side: THREE.DoubleSide, clippingPlanes: [clips[k]] })
      this.pipes.add(new THREE.Mesh(new THREE.TubeGeometry(path, seg, PIPE_R, 22), steel))
      this.pipes.add(new THREE.Mesh(new THREE.TubeGeometry(path, seg, PIPE_R - 0.016, 22), inner))
      const wm = new THREE.ShaderMaterial({
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        uniforms: {
          uPhase: { value: 0 }, uLen: { value: len }, uDim: { value: 0 }, uFlow: { value: 1 },
          uWave: { value: 0 }, uWaveOn: { value: 0 }, uS0: { value: 0 },
          uA: { value: new THREE.Color(0x1650c8) }, uB: { value: new THREE.Color(0xa8e2ff) }, uHot: { value: new THREE.Color(1.0, 0.2, 0.16) },
        },
        transparent: true,
      })
      this.waterMats.push(wm)
      this.dimUniforms.tubo.push(wm.uniforms.uDim)
      this.pipes.add(new THREE.Mesh(new THREE.TubeGeometry(path, seg, WATER_R, 14), wm))
      this.samples[k] = path.getSpacedPoints(Math.round(len * 40))
    })
    // boca de sino da sucção, dentro do reservatório
    const bellMat = this.std('tubo', { color: C.steel, metalness: 0.88, roughness: 0.32, side: THREE.DoubleSide })
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(PIPE_R, PIPE_R * 1.9, 0.22, 24, 1, true), bellMat)
    bell.rotation.z = -Math.PI / 2
    bell.position.set(T1.x + 0.42, PY, SUC_Z)
    this.pipes.add(bell)
    // suportes do trecho elevado (pórticos)
    const sup = this.std('tubo', { color: 0x5b6280, metalness: 0.8, roughness: 0.45 })
    for (const x of [1.9, 4.0]) {
      this.mesh(new THREE.CylinderGeometry(0.05, 0.06, TOP_Y - PIPE_R, 12), sup, this.pipes, x, (TOP_Y - PIPE_R) / 2, -0.32)
      this.mesh(new THREE.BoxGeometry(0.3, 0.05, 0.5), sup, this.pipes, x, 0.025, -0.32)
      this.mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), sup, this.pipes, x, TOP_Y - PIPE_R - 0.03, -0.1)
    }
    this.scene.add(this.pipes)

    // jato caindo no reservatório elevado + ondulações
    this.jetTex = canvasTex(32, 128, (c) => {
      c.fillStyle = '#6fb8ff'
      c.fillRect(0, 0, 32, 128)
      for (let i = 0; i < 26; i++) {
        c.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.6})`
        c.fillRect(Math.random() * 32, Math.random() * 128, 2 + Math.random() * 3, 12 + Math.random() * 26)
      }
    })
    this.jetTex.wrapS = this.jetTex.wrapT = THREE.RepeatWrapping
    this.textures.push(this.jetTex)
    const jy0 = T2.base + T2.h + 0.12
    const jy1 = T2.base + T2.level + 0.06
    const jm = this.basic('tubo', { map: this.jetTex, transparent: true, opacity: 0.85, color: 0x9cc4e8 })
    this.jet = this.mesh(new THREE.CylinderGeometry(WATER_R * 0.9, WATER_R * 0.6, jy0 - jy1, 14, 1, true), jm, this.scene, DROP_X, (jy0 + jy1) / 2, 0)
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.19, 40), this.basic('agua', { color: 0xdff1ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }))
      r.rotation.x = -Math.PI / 2
      r.position.set(DROP_X, jy1 + 0.012, 0)
      r.userData.t = i / 3
      r.renderOrder = 4
      this.ripples.push(r)
      this.scene.add(r)
    }
    this.anchors.pipe = new THREE.Vector3(2.9, TOP_Y, 0)
    this.anchors.pipeTop = new THREE.Vector3(2.9, TOP_Y + 0.18, 0)
    this.anchors.pipeLbl = new THREE.Vector3(3.4, TOP_Y - 0.3, 0)
    this.anchors.elbow1 = new THREE.Vector3(RISER_X + 0.1, TOP_Y - 0.1, 0)
    this.anchors.elbow2 = new THREE.Vector3(DROP_X - 0.1, TOP_Y - 0.1, 0)
    this.anchors.riser = new THREE.Vector3(RISER_X, 4.3, 0)
    this.anchors.outlet = new THREE.Vector3(DROP_X, T2.base + T2.h + 0.2, 0)
  }

  /** Bomba centrífuga de sucção axial (eixo em z) com a tampa da frente em vidro, mancal e motor aletado. */
  private pump() {
    const P = new THREE.Group()
    P.position.set(PX, PY, 0)
    const cast = this.std('bomba', { color: C.cast, metalness: 0.55, roughness: 0.42 })
    const castDark = this.std('bomba', { color: 0x262c6e, metalness: 0.5, roughness: 0.55, side: THREE.DoubleSide })
    const steel = this.std('bomba', { color: 0xd3d8ea, metalness: 0.95, roughness: 0.22 })
    const dark = this.std('bomba', { color: C.steelDark, metalness: 0.75, roughness: 0.45 })

    // contorno da voluta (espiral que cresce no sentido anti-horário) + bocal de recalque para cima
    const outline = (inset: number) => {
      const pts: THREE.Vector2[] = []
      const th0 = 0.16
      for (let i = 0; i <= 72; i++) {
        const th = th0 + ((Math.PI * 2 - th0) * i) / 72
        const r = 0.5 + 0.22 * (th / (Math.PI * 2)) - inset
        pts.push(new THREE.Vector2(r * Math.cos(th), r * Math.sin(th)))
      }
      pts.push(new THREE.Vector2(0.72 - inset, 0.95))
      pts.push(new THREE.Vector2(0.48 + inset, 0.95))
      pts.push(new THREE.Vector2(0.48 + inset, 0.12))
      return pts
    }
    const outer = new THREE.Shape(outline(0))
    const wall = new THREE.Shape(outline(0))
    wall.holes.push(new THREE.Path(outline(0.055)))
    const D = 0.36
    const wallGeo = new THREE.ExtrudeGeometry(wall, { depth: D, bevelEnabled: false, curveSegments: 4 })
    wallGeo.translate(0, 0, -D / 2)
    P.add(new THREE.Mesh(wallGeo, cast))
    const back = new THREE.ExtrudeGeometry(outer, { depth: 0.05, bevelEnabled: false })
    back.translate(0, 0, -D / 2 - 0.05)
    P.add(new THREE.Mesh(back, cast))
    P.add(new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(outline(0.05))), castDark).translateZ(-D / 2 + 0.002))
    // flange do bocal de recalque e nervuras
    this.mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 28), dark, P, 0.6, 0.95, 0)
    // água dentro da bomba
    this.swirlMat = new THREE.ShaderMaterial({
      vertexShader: WATER_VERT,
      fragmentShader: SWIRL_FRAG,
      uniforms: { uAng: { value: 0 }, uPhase: { value: 0 }, uDim: { value: 0 }, uFlow: { value: 1 }, uHot: { value: 0 }, uA: { value: new THREE.Color(0x0f3aa8) }, uB: { value: new THREE.Color(0x9fdcff) } },
    })
    this.dimUniforms.bomba.push(this.swirlMat.uniforms.uDim)
    P.add(new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(outline(0.056)), 24), this.swirlMat).translateZ(-D / 2 + 0.03))

    // rotor: disco traseiro, 6 pás curvadas para trás, cubo e porca
    const I = this.impeller
    const rotorMat = this.std('bomba', { color: 0xe0c27a, metalness: 0.9, roughness: 0.28 }) // bronze
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.025, 48), rotorMat)
    disc.rotation.x = Math.PI / 2
    disc.position.z = -0.115
    I.add(disc)
    for (let b = 0; b < 6; b++) {
      const sh = new THREE.Shape()
      const N = 14
      const cl: THREE.Vector2[] = []
      for (let i = 0; i <= N; i++) {
        const u = i / N
        const r = 0.13 + 0.295 * u
        const a = (b / 6) * Math.PI * 2 - 1.05 * u // pá atrasada em relação à rotação
        cl.push(new THREE.Vector2(r * Math.cos(a), r * Math.sin(a)))
      }
      const th = 0.013
      const left: THREE.Vector2[] = []
      const right: THREE.Vector2[] = []
      cl.forEach((p, i) => {
        const q = cl[Math.min(N, i + 1)].clone().sub(cl[Math.max(0, i - 1)]).normalize()
        const n = new THREE.Vector2(-q.y, q.x)
        left.push(p.clone().addScaledVector(n, th))
        right.push(p.clone().addScaledVector(n, -th))
      })
      sh.setFromPoints([...left, ...right.reverse()])
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.17, bevelEnabled: false })
      g.translate(0, 0, -0.105)
      I.add(new THREE.Mesh(g, rotorMat))
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 0.2, 24), rotorMat)
    hub.rotation.x = Math.PI / 2
    hub.position.z = -0.01
    I.add(hub)
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 6), steel)
    nut.rotation.x = Math.PI / 2
    nut.position.z = 0.11
    I.add(nut)
    P.add(I)

    // tampa da frente em vidro + flange de sucção
    const glass = this.std('bomba', { color: 0xcfdcff, metalness: 0.1, roughness: 0.04, transparent: true, opacity: 0.1, depthWrite: false })
    const cover = new THREE.Shape(outline(0))
    cover.holes.push(new THREE.Path().absarc(0, 0, 0.1, 0, Math.PI * 2, true))
    const cg = this.mesh(new THREE.ShapeGeometry(cover, 12), glass, P, 0, 0, D / 2)
    cg.renderOrder = 6
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 12, 36), dark)
    ring.position.z = D / 2 + 0.01
    P.add(ring)
    // aro da tampa (contorno metálico)
    const rimShape = new THREE.Shape(outline(0))
    rimShape.holes.push(new THREE.Path(outline(0.03)))
    const rimGeo = new THREE.ExtrudeGeometry(rimShape, { depth: 0.03, bevelEnabled: false })
    rimGeo.translate(0, 0, D / 2 - 0.005)
    P.add(new THREE.Mesh(rimGeo, steel))

    // suporte de mancal, acoplamento com proteção âmbar, motor aletado, tampa do ventilador
    const z0 = -D / 2 - 0.05
    const brk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.5, 28), cast)
    brk.rotation.x = Math.PI / 2
    brk.position.z = z0 - 0.25
    P.add(brk)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 16), steel)
    shaft.rotation.x = Math.PI / 2
    shaft.position.z = z0 - 0.5
    P.add(shaft)
    const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 28, 1, true, -Math.PI / 2, Math.PI), this.std('bomba', { color: C.amber, metalness: 0.4, roughness: 0.45, side: THREE.DoubleSide, emissive: C.amber, emissiveIntensity: 0.12 }))
    guard.rotation.x = Math.PI / 2
    guard.rotation.y = Math.PI / 2
    guard.position.z = z0 - 0.68
    P.add(guard)
    const motorMat = this.std('bomba', { color: C.motor, metalness: 0.55, roughness: 0.4, emissive: 0x3a1a80, emissiveIntensity: 0.25 })
    const mz = z0 - 0.86
    const ML = 1.45
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, ML, 40), motorMat)
    body.rotation.x = Math.PI / 2
    body.position.z = mz - ML / 2
    P.add(body)
    const finGeo = new THREE.BoxGeometry(0.022, 0.075, ML - 0.2)
    const fins = new THREE.InstancedMesh(finGeo, motorMat, 30)
    const m4 = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a)
      m4.compose(new THREE.Vector3(-Math.sin(a) * 0.43, Math.cos(a) * 0.43, mz - ML / 2), q, new THREE.Vector3(1, 1, 1))
      fins.setMatrixAt(i, m4)
    }
    P.add(fins)
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.14, 40), motorMat)
    bell.rotation.x = Math.PI / 2
    bell.position.z = mz + 0.05
    P.add(bell)
    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.34, 40, 1, true), this.std('bomba', { color: 0x2a1458, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }))
    cowl.rotation.x = Math.PI / 2
    cowl.position.z = mz - ML - 0.15
    P.add(cowl)
    // ventilador visto pela grade
    for (let i = 0; i < 7; i++) {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.02), steel)
      bl.position.set(0, 0.2, 0)
      const piv = new THREE.Group()
      piv.rotation.z = (i / 7) * Math.PI * 2
      bl.rotation.y = 0.5
      piv.add(bl)
      this.fan.add(piv)
    }
    this.fan.position.z = mz - ML - 0.2
    P.add(this.fan)
    this.mesh(new THREE.BoxGeometry(0.34, 0.2, 0.42), this.std('bomba', { color: 0x4b238e, metalness: 0.5, roughness: 0.45 }), P, 0, 0.46, mz - 0.5)
    // base
    const baseY = -PY + 0.05
    this.mesh(new THREE.BoxGeometry(1.5, 0.1, 3.3), dark, P, 0.05, baseY, -1.05)
    this.mesh(new THREE.BoxGeometry(1.5, 0.02, 3.3), steel, P, 0.05, baseY + 0.06, -1.05)
    this.mesh(new THREE.BoxGeometry(0.5, PY - 0.72 + 0.2, 0.3), cast, P, 0, -0.62, -0.02)
    for (const z of [mz - 0.3, mz - ML + 0.3]) this.mesh(new THREE.BoxGeometry(0.95, 0.42, 0.12), dark, P, 0, -0.56, z)
    this.scene.add(P)

    this.anchors.pump = new THREE.Vector3(PX + 0.45, PY - 0.25, 0.3)
    this.anchors.pumpTop = new THREE.Vector3(PX - 0.1, PY + 0.75, 0.2)
    this.anchors.motor = new THREE.Vector3(PX, PY + 0.62, -1.6)
    this.anchors.motorSide = new THREE.Vector3(PX + 0.75, PY - 0.2, -1.2)
  }

  private flange(parent: THREE.Object3D, p: THREE.Vector3, axis: 'x' | 'y' | 'z', mat: THREE.Material, r = 0.2, t = 0.045) {
    const g = new THREE.CylinderGeometry(r, r, t, 28)
    if (axis === 'x') g.rotateZ(Math.PI / 2)
    if (axis === 'z') g.rotateX(Math.PI / 2)
    const m = new THREE.Mesh(g, mat)
    m.position.copy(p)
    parent.add(m)
    return m
  }

  /** Válvula: corpo, flanges, castelo, haste e volante vermelho (o volante sai na direção `dir`). */
  private valve(p: THREE.Vector3, axis: 'x' | 'y', dir: THREE.Vector3, check = false) {
    const g = new THREE.Group()
    g.position.copy(p)
    const body = this.std('acess', { color: 0x5e6ab0, metalness: 0.6, roughness: 0.4 })
    const dark = this.std('acess', { color: C.steelDark, metalness: 0.8, roughness: 0.4 })
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 18), body)
    b.scale.set(axis === 'x' ? 1.25 : 1, axis === 'y' ? 1.25 : 1, 1)
    g.add(b)
    for (const s of [-1, 1]) this.flange(g, new THREE.Vector3(axis === 'x' ? s * 0.25 : 0, axis === 'y' ? s * 0.25 : 0, 0), axis, dark, 0.2, 0.05)
    const up = new THREE.Group()
    up.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    g.add(up)
    if (check) {
      // retenção: tampa da portinhola inclinada
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.1, 20), body)
      cap.position.y = 0.2
      up.add(cap)
      for (let i = 0; i < 4; i++) {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 6), dark)
        const a = (i / 4) * Math.PI * 2 + 0.4
        bolt.position.set(Math.cos(a) * 0.1, 0.26, Math.sin(a) * 0.1)
        up.add(bolt)
      }
    } else {
      const bonnet = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.22, 16), body)
      bonnet.position.y = 0.25
      up.add(bonnet)
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), dark)
      stem.position.y = 0.48
      up.add(stem)
      const wheel = new THREE.Group()
      const red = this.std('acess', { color: C.red, metalness: 0.45, roughness: 0.4, emissive: 0x7a1408, emissiveIntensity: 0.35 })
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 10, 36), red)
      rim.rotation.x = Math.PI / 2
      wheel.add(rim)
      for (let i = 0; i < 2; i++) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.025), red)
        sp.rotation.y = (i * Math.PI) / 2
        wheel.add(sp)
      }
      wheel.position.y = 0.6
      up.add(wheel)
      g.userData.wheel = wheel
    }
    this.scene.add(g)
    return g
  }

  private fittings() {
    const dark = this.std('tubo', { color: C.steelDark, metalness: 0.8, roughness: 0.4 })
    // flanges
    this.flange(this.pipes, new THREE.Vector3(T1.x + T1.w / 2 + 0.03, PY, SUC_Z), 'x', dark, 0.2, 0.05)
    this.flange(this.pipes, new THREE.Vector3(PX, PY, 0.24), 'z', dark, 0.2, 0.05)
    this.flange(this.pipes, new THREE.Vector3(RISER_X, NOZ_Y + 0.03, 0), 'y', dark, 0.2, 0.05)
    this.flange(this.pipes, new THREE.Vector3(DROP_X, T2.base + T2.h + 0.14, 0), 'y', dark, 0.17, 0.04)
    for (const x of [-0.9, 2.9, 4.9]) this.flange(this.pipes, new THREE.Vector3(x, TOP_Y, 0), 'x', dark, 0.17, 0.035)

    // válvulas: gaveta na sucção, retenção e gaveta no recalque
    const front = new THREE.Vector3(0, 0.55, 0.83)
    this.valve(new THREE.Vector3(-4.35, PY, SUC_Z), 'x', new THREE.Vector3(0, 1, 0))
    const chk = this.valve(new THREE.Vector3(RISER_X, CHECK_Y, 0), 'y', new THREE.Vector3(1, 0, 0.25), true)
    const gate = this.valve(new THREE.Vector3(RISER_X, GATE_Y, 0), 'y', front)
    this.gateWheel = gate.userData.wheel as THREE.Group
    // clarão da retenção batendo (golpe)
    this.checkFlash = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 48), new THREE.MeshBasicMaterial({ color: C.hammer, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }))
    this.checkFlash.position.copy(chk.position).setZ(0.25)
    this.scene.add(this.checkFlash)

    // anéis de destaque dos acessórios (válvulas, curvas, entrada e saída)
    const ringAt: THREE.Vector3[] = [
      new THREE.Vector3(-4.35, PY, SUC_Z + 0.3), new THREE.Vector3(RISER_X, CHECK_Y, 0.3), new THREE.Vector3(RISER_X, GATE_Y, 0.3),
      new THREE.Vector3(RISER_X + 0.1, TOP_Y - 0.1, 0.2), new THREE.Vector3(DROP_X - 0.1, TOP_Y - 0.1, 0.2),
      new THREE.Vector3(PX - 0.1, PY, SUC_Z + 0.25), new THREE.Vector3(T1.x + 0.42, PY, SUC_Z + 0.3), new THREE.Vector3(DROP_X, T2.base + T2.h + 0.1, 0.25),
    ]
    ringAt.forEach((p, i) => {
      const r = new THREE.Mesh(new THREE.RingGeometry(0.33, 0.37, 48), new THREE.MeshBasicMaterial({ color: C.amber, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }))
      r.position.copy(p)
      r.userData.ph = i * 0.7
      this.accRings.push(r)
      this.scene.add(r)
    })

    // manômetro no recalque
    const gm = this.std('golpe', { color: 0x9aa2c0, metalness: 0.85, roughness: 0.3 })
    const tap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(RISER_X + 0.1, 3.45, 0), new THREE.Vector3(GAUGE.x - 0.1, 3.45, 0.04), new THREE.Vector3(GAUGE.x, 3.47, GAUGE.z - 0.06), new THREE.Vector3(GAUGE.x, GAUGE.y - 0.3, GAUGE.z - 0.06)]), 24, 0.025, 8), gm)
    this.scene.add(tap)
    const G = new THREE.Group()
    G.position.copy(GAUGE)
    const caseM = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 40), gm)
    caseM.rotation.x = Math.PI / 2
    G.add(caseM)
    const face = canvasTex(256, 256, (c) => {
      c.fillStyle = '#f4f1e6'
      c.beginPath(); c.arc(128, 128, 124, 0, Math.PI * 2); c.fill()
      c.translate(128, 128)
      const ang = (b: number) => ((-135 + (b / 25) * 270) * Math.PI) / 180
      c.strokeStyle = '#e0443b'; c.lineWidth = 16
      c.beginPath(); c.arc(0, 0, 100, ang(16) - Math.PI / 2, ang(25) - Math.PI / 2); c.stroke()
      c.strokeStyle = '#22203a'
      for (let i = 0; i <= 25; i++) {
        const a = ang(i)
        c.lineWidth = i % 5 ? 3 : 7
        const r1 = i % 5 ? 96 : 86
        c.beginPath(); c.moveTo(Math.sin(a) * r1, -Math.cos(a) * r1); c.lineTo(Math.sin(a) * 112, -Math.cos(a) * 112); c.stroke()
      }
      c.fillStyle = '#22203a'; c.font = '700 30px Arial'; c.textAlign = 'center'
      c.fillText('bar', 0, 70)
      for (const b of [0, 10, 20]) { const a = ang(b); c.font = '700 24px Arial'; c.fillText(String(b), Math.sin(a) * 66, -Math.cos(a) * 66 + 9) }
    })
    this.textures.push(face)
    const fm = this.basic('golpe', { map: face, color: 0xb4b4b4 })
    this.mesh(new THREE.CircleGeometry(0.31, 40), fm, G, 0, 0, 0.062)
    const nd = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.3, 0.01), this.basic('golpe', { color: 0xc42f2f }))
    nd.position.y = 0.11
    this.needle.add(nd)
    this.needle.position.z = 0.075
    G.add(this.needle)
    this.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12).rotateX(Math.PI / 2), gm, G, 0, 0, 0.08)
    this.scene.add(G)
    this.anchors.gauge = GAUGE.clone().add(new THREE.Vector3(0.36, 0.1, 0.1))

    // medidor de vazão (carretel eletromagnético + cabeçote)
    const fmat = this.std('tubo', { color: 0x3f6fd8, metalness: 0.5, roughness: 0.4 })
    const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.5, 28), fmat)
    spool.rotation.z = Math.PI / 2
    spool.position.set(METER_X, TOP_Y, -0.02)
    spool.material = this.std('tubo', { color: 0x3f6fd8, metalness: 0.5, roughness: 0.4, clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.035)], side: THREE.DoubleSide })
    this.pipes.add(spool)
    for (const s of [-1, 1]) this.flange(this.pipes, new THREE.Vector3(METER_X + s * 0.28, TOP_Y, 0), 'x', dark, 0.2, 0.05)
    this.mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 12), dark, this.pipes, METER_X, TOP_Y + 0.3, -0.05)
    this.mesh(new THREE.BoxGeometry(0.56, 0.3, 0.22), this.std('tubo', { color: 0x23263c, metalness: 0.6, roughness: 0.4 }), this.pipes, METER_X, TOP_Y + 0.55, -0.02)
    this.anchors.meter = new THREE.Vector3(METER_X, TOP_Y + 0.55, 0.1)
    this.anchors.meterTop = new THREE.Vector3(METER_X, TOP_Y + 0.75, 0)

    this.anchors.gate = new THREE.Vector3(RISER_X - 0.3, GATE_Y, 0)
    this.anchors.check = new THREE.Vector3(RISER_X - 0.3, CHECK_Y, 0)
    this.anchors.valves = new THREE.Vector3(RISER_X + 0.25, (GATE_Y + CHECK_Y) / 2 + 0.1, 0.2)
    this.anchors.sucValve = new THREE.Vector3(-4.35, PY + 0.75, SUC_Z)
  }

  private particles() {
    const n0 = this.low ? 24 : 60
    const n1 = this.low ? 110 : 280
    const n2 = this.low ? 50 : 130
    const N = n0 + n1 + n2
    this.pPos = new Float32Array(N * 3)
    this.pCol = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const path = (i < n0 ? 0 : i < n0 + n1 ? 1 : 2) as 0 | 1 | 2
      const off = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(Math.random() * 0.06)
      this.pData.push({ path, u: Math.random(), off, sp: 0.75 + Math.random() * 0.5 })
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(this.pCol, 3))
    const dot = canvasTex(64, 64, (c) => {
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.3, 'rgba(255,255,255,0.7)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = g
      c.fillRect(0, 0, 64, 64)
    })
    this.textures.push(dot)
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: dot, size: 0.07, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }))
    this.pts.frustumCulled = false
    this.pts.renderOrder = 5
    this.scene.add(this.pts)
  }

  /** Cotas e linhas técnicas: desnível entre os níveis d'água e linha de energia sobre o tubo. */
  private annotations() {
    const y0 = T1.level + 0.06
    const y1 = T2.base + T2.level + 0.06
    const x = 4.2
    const z = 1.25
    const lm = this.basic('dz', { color: 0xffffff, transparent: true, opacity: 0.95 })
    const D = this.dzGroup
    const bar = (a: THREE.Vector3, b: THREE.Vector3, r = 0.016) => {
      const len = a.distanceTo(b)
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), lm)
      m.position.copy(a).add(b).multiplyScalar(0.5)
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
      D.add(m)
    }
    // linhas de chamada tracejadas a partir dos níveis d'água
    const dash = (a: THREE.Vector3, b: THREE.Vector3) => {
      const n = Math.round(a.distanceTo(b) / 0.3)
      for (let i = 0; i < n; i += 2) bar(a.clone().lerp(b, i / n), a.clone().lerp(b, (i + 1) / n), 0.007)
    }
    dash(new THREE.Vector3(T1.x + T1.w / 2, y0, z), new THREE.Vector3(x + 0.3, y0, z))
    dash(new THREE.Vector3(x - 0.3, y1, z), new THREE.Vector3(T2.x - T2.w / 2, y1, z))
    bar(new THREE.Vector3(x, y0 + 0.14, z), new THREE.Vector3(x, y1 - 0.14, z), 0.02)
    for (const [y, s] of [[y0, 1], [y1, -1]] as const) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 14), lm)
      cone.position.set(x, y + s * 0.1, z)
      cone.rotation.z = s > 0 ? Math.PI : 0
      D.add(cone)
    }
    D.visible = false
    this.scene.add(D)
    this.anchors.dz = new THREE.Vector3(x, (y0 + y1) / 2, z)
    this.anchors.dzBadge = new THREE.Vector3(T2.x - T2.w / 2 - 0.4, T2.base + 0.75, T2.z + T2.d / 2)

    // linha de energia: cai ao longo do tubo (perda de carga distribuída)
    const pts = [new THREE.Vector3(RISER_X, TOP_Y + 0.62, 0), new THREE.Vector3(DROP_X, TOP_Y + 0.26, 0)]
    this.eglMat = new THREE.MeshBasicMaterial({ color: C.amber, transparent: true, opacity: 0, depthWrite: false })
    const egl = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(pts[0], pts[1]), 2, 0.022, 8), this.eglMat)
    this.scene.add(egl)
    for (const p of pts) {
      const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, p.y - TOP_Y - PIPE_R, 6), this.eglMat)
      drop.position.set(p.x, (p.y + TOP_Y + PIPE_R) / 2, 0)
      this.scene.add(drop)
    }
    this.anchors.egl0 = pts[0].clone()
    this.anchors.egl1 = pts[1].clone()
  }

  /** Instrumentação da malha de vazão: transmissor (FT), controlador com tela de tendência (FIC) e inversor. */
  private controlLoop() {
    const L = this.loopGroup
    const cab = this.std('malha', { color: 0x2c3048, metalness: 0.7, roughness: 0.4 })
    const dark = this.std('malha', { color: 0x15172a, metalness: 0.5, roughness: 0.5 })
    // inversor de frequência ao lado do motor
    const VX = PX + 2.3
    const VZ = -1.5
    this.mesh(new THREE.BoxGeometry(0.95, 1.5, 0.5), cab, L, VX, 0.8, VZ)
    this.mesh(new THREE.BoxGeometry(1.05, 0.06, 0.6), dark, L, VX, 0.03, VZ)
    this.mesh(new THREE.BoxGeometry(0.62, 0.3, 0.02), dark, L, VX, 1.25, VZ + 0.26)
    this.ledMat = new THREE.MeshStandardMaterial({ color: 0x0a2a1a, emissive: C.green, emissiveIntensity: 2.4 })
    this.mesh(new THREE.SphereGeometry(0.035, 12, 8), this.ledMat, L, VX - 0.3, 0.95, VZ + 0.26)
    for (let i = 0; i < 5; i++) this.mesh(new THREE.BoxGeometry(0.7, 0.025, 0.02), dark, L, VX, 0.3 + i * 0.09, VZ + 0.26)
    this.anchors.vfd = new THREE.Vector3(VX, 1.25, VZ + 0.28)
    this.anchors.vfdTop = new THREE.Vector3(VX, 1.6, VZ)

    // controlador: console com tela de tendência (PV × SP)
    const FX = 2.7
    const FZ = 1.5
    this.mesh(new THREE.BoxGeometry(0.16, 1.5, 0.16), cab, L, FX, 0.75, FZ - 0.1)
    this.mesh(new THREE.BoxGeometry(0.7, 0.06, 0.5), dark, L, FX, 0.03, FZ - 0.1)
    const screen = new THREE.Group()
    screen.position.set(FX, 2.05, FZ)
    screen.rotation.set(-0.12, -0.38, 0)
    this.mesh(new THREE.BoxGeometry(2.3, 1.4, 0.1), cab, screen, 0, 0, -0.06)
    const cv = document.createElement('canvas')
    cv.width = 512
    cv.height = 300
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    this.textures.push(tex)
    this.trend = { ctx: cv.getContext('2d')!, tex, hist: Array(120).fill(30), fhist: Array(120).fill(45), acc: 0 }
    this.mesh(new THREE.PlaneGeometry(2.14, 1.25), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), screen, 0, 0, 0)
    L.add(screen)
    this.anchors.fic = new THREE.Vector3(FX - 0.9, 2.75, FZ + 0.3)
    this.anchors.ficR = new THREE.Vector3(FX + 1.05, 2.3, FZ - 0.4)
    this.anchors.sp = new THREE.Vector3(FX + 0.7, 2.3, FZ - 0.25)

    // sinais: FT → FIC (medição), FIC → inversor (comando), inversor → motor (potência)
    const sig = (pts: THREE.Vector3[], color: number, speed: number, r = 0.022) => {
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35)
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })
      this.signalMats.push(m)
      L.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, r, 8), m))
      const dots = [0, 1, 2].map(() => {
        const d = new THREE.Mesh(new THREE.SphereGeometry(r * 3.2, 12, 8), m)
        L.add(d)
        return d
      })
      this.signals.push({ curve, dots, speed })
    }
    sig([new THREE.Vector3(METER_X, TOP_Y + 0.72, -0.02), new THREE.Vector3(METER_X + 0.5, TOP_Y + 1.0, 0.5), new THREE.Vector3(FX - 0.2, 4.2, FZ - 0.2), new THREE.Vector3(FX, 2.75, FZ - 0.05)], C.green, 0.5)
    sig([new THREE.Vector3(FX, 1.38, FZ - 0.05), new THREE.Vector3(FX - 0.4, 0.5, FZ - 0.5), new THREE.Vector3(VX + 0.9, 0.35, VZ + 0.6), new THREE.Vector3(VX + 0.48, 0.8, VZ + 0.05)], C.lilac, 0.6)
    sig([new THREE.Vector3(VX - 0.48, 0.7, VZ), new THREE.Vector3(VX - 1.0, 0.3, VZ - 0.1), new THREE.Vector3(PX + 0.7, 0.5, VZ - 0.15), new THREE.Vector3(PX + 0.18, PY + 0.5, -1.55)], C.amber, 0.9, 0.03)
    this.scene.add(L)
    this.anchors.plant = new THREE.Vector3(T2.x, T2.base + T2.level, T2.z + T2.d / 2)
    this.anchors.ft = new THREE.Vector3(METER_X - 0.1, TOP_Y + 0.75, 0)
    this.anchors.disturb = new THREE.Vector3(RISER_X - 0.35, GATE_Y + 0.25, 0.4)
    this.st.signals = 0
  }

  /* ---------------------------------------------------------------- API */

  /** Projeta uma âncora 3D para coordenadas do palco (px). */
  project(name: string, out: { x: number; y: number }) {
    const a = this.anchors[name]
    if (!a) return false
    this.v.copy(a).project(this.camera)
    out.x = (this.v.x * 0.5 + 0.5) * this.width
    out.y = (-this.v.y * 0.5 + 0.5) * this.height
    return this.v.z < 1
  }

  /** Ajuste fino de enquadramento em ensaio (dev). */
  debugCam(p: [number, number, number], t: [number, number, number]) {
    gsap.killTweensOf([this.camera.position, this.camTarget])
    this.camera.position.set(...p)
    this.camTarget.set(...t)
  }

  setStage(stage: number) {
    if (stage === this.stage) return
    const first = this.stage < 0
    const prev = this.stage
    this.stage = stage
    const d = first ? 0 : 1
    if (this.mode === 'loop') {
      gsap.to(this.st, { signals: stage >= 1 ? 1 : 0, duration: 1.2 * d, ease: 'power2.out' })
      return
    }
    const s = Math.max(0, Math.min(SIZING_CAMS.length - 1, stage))
    const cam = SIZING_CAMS[s]
    gsap.to(this.camera.position, { x: cam.p[0], y: cam.p[1], z: cam.p[2], duration: 2.1 * d, ease: 'power3.inOut', overwrite: true })
    gsap.to(this.camTarget, { x: cam.t[0], y: cam.t[1], z: cam.t[2], duration: 2.1 * d, ease: 'power3.inOut', overwrite: true })
    const focus = SIZING_FOCUS[s]
    ;(Object.keys(this.dim) as Part[]).forEach((p) => {
      let k = focus && focus !== p ? 1 : 0
      if (focus === 'golpe' && p === 'tubo') k = 0 // a onda corre no tubo
      if (focus === 'dz' && p === 'agua') k = 0 // o desnível é entre os níveis d'água
      if (focus === 'tubo' && p === 'acess') k = 0.55
      gsap.to(this.dim, { [p]: k, duration: 0.9 * d, overwrite: 'auto' })
    })
    const hammer = s >= 7
    this.tl?.kill()
    const tl = (this.tl = gsap.timeline())
    tl.to(this.st, { accRing: s === 4 ? 1 : 0, dz: s === 5 ? 1 : 0, egl: s === 3 || s === 5 ? 1 : 0, duration: 0.8 * d }, 0)
    if (hammer) {
      if (prev < 7 && !first) this.waveT = 0
      // bomba desarma: rotor para, vazão cai, retenção bate e a onda parte
      tl.to(this.st, { spin: 0, duration: 1.1 * d, ease: 'power2.out' }, 0)
      tl.to(this.st, { flow: 0, duration: 0.7 * d, ease: 'power2.out' }, 0)
      tl.to(this.st, { hammer: s === 8 ? 0.55 : 1, duration: 0.5 * d }, 0.45 * d)
      if (prev < 7 && !first) {
        tl.fromTo(this.checkFlash.material, { opacity: 1 }, { opacity: 0, duration: 0.9 }, 0.45)
        tl.fromTo(this.checkFlash.scale, { x: 0.6, y: 0.6 }, { x: 2.6, y: 2.6, duration: 0.9, ease: 'power2.out' }, 0.45)
        tl.fromTo(this.st, { shake: 1 }, { shake: 0.22, duration: 2.2, ease: 'power2.out' }, 0.45)
      } else tl.to(this.st, { shake: s === 8 ? 0.1 : 0.22, duration: 0.6 * d }, 0)
    } else {
      tl.to(this.st, { spin: 1, flow: 1, hammer: 0, shake: 0, duration: 1.0 * d, ease: 'power2.inOut' }, 0)
    }
    this.dzGroup.visible = true
  }

  /* ---------------------------------------------------------------- animação */

  private drawTrend(dt: number) {
    const T = this.trend!
    T.acc += dt
    if (T.acc < 0.08) return
    T.acc = 0
    T.hist.push(this.sim.q)
    T.hist.shift()
    T.fhist.push(this.sim.f)
    T.fhist.shift()
    const c = T.ctx
    const W = 512
    const H = 300
    c.fillStyle = '#070b1c'
    c.fillRect(0, 0, W, H)
    c.strokeStyle = 'rgba(255,255,255,0.08)'
    c.lineWidth = 1
    for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, (i * H) / 6); c.lineTo(W, (i * H) / 6); c.stroke() }
    for (let i = 1; i < 8; i++) { c.beginPath(); c.moveTo((i * W) / 8, 0); c.lineTo((i * W) / 8, H); c.stroke() }
    const yq = (q: number) => 150 - (q - 30) * 16
    // setpoint
    c.strokeStyle = '#ffffff'
    c.lineWidth = 3
    c.setLineDash([12, 9])
    c.beginPath(); c.moveTo(0, yq(30)); c.lineTo(W, yq(30)); c.stroke()
    c.setLineDash([])
    // frequência (comando)
    c.strokeStyle = '#ffb547'
    c.lineWidth = 3
    c.beginPath()
    T.fhist.forEach((f, i) => { const x = (i / 119) * W; const y = 262 - (f - 45) * 9; if (i) c.lineTo(x, y); else c.moveTo(x, y) })
    c.stroke()
    // vazão medida
    c.strokeStyle = '#3ddc97'
    c.lineWidth = 5
    c.shadowColor = '#3ddc97'
    c.shadowBlur = 12
    c.beginPath()
    T.hist.forEach((q, i) => { const x = (i / 119) * W; const y = yq(q); if (i) c.lineTo(x, y); else c.moveTo(x, y) })
    c.stroke()
    c.shadowBlur = 0
    c.font = '700 22px JetBrains Mono, monospace'
    c.fillStyle = '#ffffff'
    c.fillText('SP 30,0', 12, yq(30) - 10)
    c.fillStyle = '#3ddc97'
    c.fillText('PV ' + this.sim.q.toFixed(1).replace('.', ','), 12, 30)
    c.fillStyle = '#ffb547'
    c.textAlign = 'right'
    c.fillText(this.sim.f.toFixed(1).replace('.', ',') + ' Hz', W - 12, 30)
    c.textAlign = 'left'
    T.tex.needsUpdate = true
  }

  private loop = (now?: number) => {
    if (this.disposed) return
    this.timer.update(now)
    const dt = Math.max(0, Math.min(this.timer.getDelta(), 0.05))
    const t = Math.max(0, this.timer.getElapsed())
    const st = this.st

    // malha fechada: planta de 1ª ordem + PI; a "perturbação" é a gaveta do recalque fechando um pouco
    let flow = st.flow
    let spin = st.spin
    if (this.mode === 'loop') {
      const S = this.sim
      S.t = (S.t + dt) % 11
      const gT = S.t > 3.2 && S.t < 7.6 ? 0.86 : 1
      S.g += (gT - S.g) * Math.min(1, dt * 5)
      const qss = S.g * S.f * (30 / 45)
      S.q += (qss - S.q) * Math.min(1, dt / 0.45)
      const e = 30 - S.q
      S.integ += e * dt
      S.f = Math.max(30, Math.min(60, 45 + 0.55 * e + 1.5 * S.integ))
      flow = S.q / 30
      spin = S.f / 45
      this.live.q = S.q
      this.live.hz = S.f
      this.live.disturb = 1 - (S.g - 0.86) / 0.14
      this.gateWheel.rotation.y = (1 - S.g) * 22
      this.drawTrend(dt)
      this.ledMat.emissiveIntensity = 1.5 + Math.sin(t * 9) * 0.9
    } else {
      this.live.q = 30 * flow
      this.live.bar = 2.4 * (0.25 + 0.75 * flow)
    }

    // rotor, ventilador e fase do escoamento
    this.ang += dt * spin * 13
    this.impeller.rotation.z = this.ang
    this.fan.rotation.z = this.ang
    this.phase += dt * flow * 1.25
    this.waterMats.forEach((m) => {
      m.uniforms.uPhase.value = this.phase
      m.uniforms.uFlow.value = Math.min(1.3, flow)
    })
    this.swirlMat.uniforms.uAng.value = this.ang
    this.swirlMat.uniforms.uPhase.value = this.phase
    this.swirlMat.uniforms.uFlow.value = Math.min(1.3, 0.25 + 0.75 * spin)
    this.swirlMat.uniforms.uHot.value = st.hammer * (0.5 + 0.5 * Math.sin(t * 6))
    this.tankMats.forEach((m) => (m.uniforms.uTime.value = t))

    // golpe de aríete: frente de pressão vai e volta entre a retenção e o reservatório
    const L1 = this.pathLen[1]
    const s0 = CHECK_Y - (NOZ_Y - 0.05)
    this.waveT += dt
    const tri = Math.abs(((this.waveT / 1.5) % 2) - 1) // 1 → 0 → 1
    const wave = s0 + (L1 - s0) * (1 - tri)
    const dm = this.waterMats[1].uniforms
    dm.uWave.value = wave
    dm.uWaveOn.value = st.hammer
    dm.uS0.value = s0
    const jit = st.shake * 0.02
    this.pipes.position.set(Math.sin(t * 71) * jit, Math.sin(t * 93 + 1) * jit, 0)
    // ponteiro do manômetro: 2,4 bar em regime; no golpe dispara até a faixa vermelha quando a onda volta à bomba
    const surge = st.hammer * (15 + 6.5 * tri * tri + Math.sin(t * 40) * 0.5)
    const bar = Math.max(this.live.bar * (1 - st.hammer), surge)
    if (this.mode !== 'loop') this.live.bar = bar
    else this.live.bar = 2.4 * flow * flow
    const target = THREE.MathUtils.degToRad(135 - (Math.min(25, this.live.bar) / 25) * 270)
    this.needle.rotation.z += (target - this.needle.rotation.z) * Math.min(1, dt * 9)

    // partículas: sucção, recalque e redemoinho no rotor
    const pos = this.pPos
    const col = this.pCol
    const hm = st.hammer
    for (let i = 0; i < this.pData.length; i++) {
      const p = this.pData[i]
      const j = i * 3
      let bright = 1
      if (p.path === 2) {
        p.u += dt * (0.25 + 0.75 * spin) * 0.85 * p.sp
        if (p.u > 1.3) { p.u = 0; p.off.x = Math.random() * Math.PI * 2 }
        const a = Math.min(p.u, 1)
        const r = 0.07 + 0.37 * Math.pow(a, 0.85) + Math.max(0, p.u - 1) * 0.5
        const th = p.off.x + this.ang * (0.45 + 0.4 * a) + a * 1.2
        pos[j] = PX + Math.cos(th) * r
        pos[j + 1] = PY + Math.sin(th) * r
        pos[j + 2] = 0.02 + p.off.z
        bright = 0.5 + 0.5 * a
      } else {
        p.u += (dt * flow * 1.25 * p.sp) / this.pathLen[p.path]
        p.u = ((p.u % 1) + 1) % 1
        const sm = this.samples[p.path]
        const f = p.u * (sm.length - 1)
        const k = Math.floor(f)
        const a = sm[k]
        const b = sm[Math.min(sm.length - 1, k + 1)]
        const w = f - k
        const jx = flow < 0.05 ? Math.sin(t * 30 + i) * 0.012 * hm : 0
        pos[j] = a.x + (b.x - a.x) * w + p.off.x + jx
        pos[j + 1] = a.y + (b.y - a.y) * w + p.off.y
        pos[j + 2] = a.z + (b.z - a.z) * w + p.off.z
      }
      const dimK = 1 - 0.85 * (p.path === 2 ? this.dim.bomba : this.dim.tubo)
      const red = p.path === 1 ? hm : p.path === 2 ? hm * 0.6 : 0
      col[j] = (0.55 + 0.45 * red) * bright * dimK
      col[j + 1] = (0.85 - 0.6 * red) * bright * dimK
      col[j + 2] = (1 - 0.75 * red) * bright * dimK
    }
    this.pts.geometry.attributes.position.needsUpdate = true
    this.pts.geometry.attributes.color.needsUpdate = true

    // superfícies d'água, jato e ondulações
    this.surfaces.forEach((s, si) => {
      const arr = s.mesh.geometry.attributes.position.array as Float32Array
      const amp = s.amp * (0.35 + 0.65 * flow)
      for (let i = 0; i < arr.length; i += 3) arr[i + 1] = s.base[i + 1] + (Math.sin(s.base[i] * 5 + t * 2.1 + si) + Math.sin(s.base[i + 2] * 7 - t * 1.6)) * amp
      s.mesh.geometry.attributes.position.needsUpdate = true
    })
    this.jetTex.offset.y += dt * 2.4
    const jm = this.jet.material as THREE.MeshBasicMaterial
    this.jet.scale.set(0.3 + 0.7 * Math.min(1, flow), 1, 0.3 + 0.7 * Math.min(1, flow))
    this.jet.visible = flow > 0.03
    this.ripples.forEach((r) => {
      r.userData.t = (r.userData.t + dt * 0.7) % 1
      const k = r.userData.t
      r.scale.setScalar(0.6 + k * 3.2)
      ;(r.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.7 * Math.min(1, flow) * (1 - 0.8 * this.dim.agua)
    })
    void jm

    // destaques e cotas
    this.accRings.forEach((r) => {
      r.lookAt(this.camera.position)
      const k = 0.5 + 0.5 * Math.sin(t * 3.2 + r.userData.ph)
      r.scale.setScalar(0.9 + 0.25 * k)
      ;(r.material as THREE.MeshBasicMaterial).opacity = st.accRing * (0.45 + 0.5 * k)
    })
    this.checkFlash.lookAt(this.camera.position)
    this.dzGroup.scale.y = 1
    this.dzGroup.visible = st.dz > 0.01
    this.dzGroup.children.forEach((o) => (((o as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = st.dz))
    this.eglMat.opacity = st.egl * 0.95

    // malha de controle: sinais e pulsos
    if (this.mode === 'loop') {
      this.signalMats.forEach((m, i) => (m.opacity = st.signals * (i === 2 ? 0.9 : 0.8) * (1 - 0.6 * this.dim.malha)))
      this.signals.forEach((s, i) => {
        s.dots.forEach((d, k) => {
          const u = (((t * s.speed * (i === 2 ? 0.6 + 0.5 * spin : 1) + k / s.dots.length) % 1) + 1) % 1
          s.curve.getPoint(u, d.position)
          d.scale.setScalar(st.signals * (0.7 + 0.5 * Math.sin(u * Math.PI)))
        })
      })
    }

    // escurecimento por parte
    ;(Object.keys(this.dimMats) as Part[]).forEach((part) => {
      const k = this.dim[part]
      this.dimMats[part].forEach((d) => {
        d.m.color.copy(d.color).multiplyScalar(1 - 0.78 * k)
        if ((d.m as THREE.MeshStandardMaterial).isMeshStandardMaterial) (d.m as THREE.MeshStandardMaterial).emissiveIntensity = d.emissive * (1 - 0.8 * k)
      })
      this.dimUniforms[part].forEach((u) => (u.value = k))
    })

    const b = st.boost
    this.renderer.toneMappingExposure = 1.08 + 0.14 * b
    this.scene.environmentIntensity = 0.5 + 0.12 * b

    // câmera: deriva lenta + tremor no golpe
    const dx = Math.sin(t * 0.21) * 0.16 + Math.sin(t * 57) * st.shake * 0.03
    const dy = Math.sin(t * 0.17) * 0.08 + Math.sin(t * 43) * st.shake * 0.03
    this.camera.position.x += dx
    this.camera.position.y += dy
    this.camera.lookAt(this.camTarget)
    this.camera.updateMatrixWorld()
    if (this.composer) this.composer.render()
    else this.renderer.render(this.scene, this.camera)
    this.onFrame?.()
    this.camera.position.x -= dx
    this.camera.position.y -= dy
    this.raf = requestAnimationFrame(this.loop)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.offProjector()
    this.timer.dispose()
    this.tl?.kill()
    gsap.killTweensOf([this.camera.position, this.camTarget, this.st, this.dim, this.checkFlash.material, this.checkFlash.scale])
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose()
      const mm = m.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mm)) mm.forEach((x) => x.dispose())
      else mm?.dispose()
    })
    this.textures.forEach((t) => t.dispose())
    this.envTex?.dispose()
    this.composer?.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentElement === this.host) this.host.removeChild(this.renderer.domElement)
  }
}

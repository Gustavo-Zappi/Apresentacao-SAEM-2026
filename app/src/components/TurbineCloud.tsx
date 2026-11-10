import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import gsap from 'gsap'
import { projector } from '../lib/display'
import './turbine.css'

/**
 * "De fotos a modelo 3D" com uma turbina a vapor. Ilustração do conceito, não uma reconstrução real.
 *
 * Coreografia (roda sozinha ao abrir o slide):
 *  1 Fotos            a peça está no escuro; cada disparo de flash a ilumina e deixa uma foto de verdade
 *                     (miniatura renderizada daquele ponto de vista) flutuando ao redor.
 *  2 Nuvem de pontos  das fotos saem os pontos, coloridos pelo sombreamento da peça, e pousam na superfície.
 *  3 Modelo 3D        uma frente de reconstrução varre o eixo: à frente ficam os pontos, atrás fica o sólido.
 *  4 Simulação (`sim`) a meia carcaça superior fecha em "vidro", o vapor entra pela admissão, percorre os
 *                     estágios em hélice (traços coloridos pela temperatura) e cai para o condensador.
 *
 * Temperaturas do campo: ciclo Rankine do conceito da palestra (8 MPa, 480 °C → condensador a 8 kPa, 41,5 °C).
 * Qualidade: `?q=baixa` reduz partículas e desliga bloom, sombras e antisserrilhamento.
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
const BASE_Y = -1.9 // piso (mesa giratória)
const INLET_X = -1.8 // bocal de admissão

/** Prepara uma peça para a fusão: sem índice, sem UV e com cor por vértice. */
function part(g: THREE.BufferGeometry, hex: number) {
  const out = g.index ? g.toNonIndexed() : g
  if (out !== g) g.dispose()
  out.deleteAttribute('uv')
  const c = new THREE.Color(hex)
  const n = out.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3)
  out.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return out
}
function merge(parts: THREE.BufferGeometry[]) {
  const geo = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  return geo
}

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
    // afina a palheta na ponta
    const k = 1 - 0.3 * t
    p.setXYZ(i, (x * Math.cos(a) - z * Math.sin(a)) * k, y, (x * Math.sin(a) + z * Math.cos(a)) * k)
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
function boxAt(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d)
  g.translate(x, y, z)
  return g
}

const C = {
  shaft: 0xa3a8b8,
  disc: 0x7b8196,
  blade: 0xcbd0de,
  shroud: 0xaab0c3,
  bolt: 0x4d5266,
  paint: 0x363c63, // tinta da carcaça (azul-violeta de máquina)
  machined: 0xa9afc2,
  nozzle: 0x8d93aa,
  plate: 0x555b79,
  support: 0x3a3e58,
  bronze: 0xb08a4e,
}

function buildRotor() {
  const parts: THREE.BufferGeometry[] = []
  parts.push(part(cylX(0.14, 5.5, 0.05, 32), C.shaft)) // eixo
  parts.push(part(cylX(0.42, 0.28, -2.05), C.disc)) // pistão de balanceamento
  for (let i = 0; i < 4; i++) parts.push(part(cylX(0.432, 0.02, -2.15 + i * 0.065, 40), C.shroud)) // labirinto
  parts.push(part(cylX(0.3, 0.06, -2.3), C.shaft)) // colar de escora
  parts.push(part(cylX(0.34, 0.09, 2.62), C.shaft)) // flange de acoplamento
  for (let b = 0; b < 8; b++) {
    const a = (b / 8) * Math.PI * 2
    const bolt = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10)
    bolt.rotateZ(Math.PI / 2)
    bolt.translate(2.62, Math.cos(a) * 0.25, Math.sin(a) * 0.25)
    parts.push(part(bolt, C.bolt))
  }
  for (let k = 0; k < STAGES; k++) {
    const x = stageX(k)
    const rd = discR(k)
    const L = bladeL(k)
    const chord = 0.085 + 0.018 * k
    parts.push(part(cylX(rd, 0.13 + 0.01 * k, x), C.disc))
    parts.push(part(cylX(rd * 0.62, 0.17 + 0.01 * k, x, 32), C.shaft)) // cubo
    const n = Math.round(64 - 3.6 * k)
    const proto = blade(chord, L, 0.022, 0.35, 0.35 + 0.9 * (k / (STAGES - 1)))
    const m = new THREE.Matrix4()
    for (let i = 0; i < n; i++) {
      const phi = (i / n) * Math.PI * 2
      const g = proto.clone()
      m.makeRotationX(phi)
      m.setPosition(x, Math.cos(phi) * (rd + L / 2), Math.sin(phi) * (rd + L / 2))
      g.applyMatrix4(m)
      parts.push(part(g, C.blade))
    }
    proto.dispose()
    // cinta nas pontas dos estágios de alta pressão
    if (k < 5) parts.push(part(cylX(rd + L + 0.012, chord * 1.05, x, 64, true), C.shroud))
  }
  return merge(parts)
}

/** Raio interno da carcaça ao longo do eixo. */
function casingR(x: number) {
  if (x <= X0) return 0.62
  if (x >= X1 + 0.3) return tipR(STAGES - 1) + 0.12
  const k = Math.min(STAGES - 1, Math.max(0, ((x - X0) / (X1 - X0)) * (STAGES - 1)))
  const k0 = Math.floor(k)
  const f = k - k0
  return tipR(k0) * (1 - f) + tipR(Math.min(STAGES - 1, k0 + 1)) * f + 0.1
}

/** Meia casca (inferior ou superior) + flange da junta horizontal. */
function buildShell(upper: boolean) {
  const prof: THREE.Vector2[] = []
  prof.push(new THREE.Vector2(0.2, -2.3))
  for (let i = 0; i <= 60; i++) {
    const x = -2.3 + (4.3 * i) / 60
    prof.push(new THREE.Vector2(casingR(x), x))
  }
  prof.push(new THREE.Vector2(0.2, 2.0))
  const shell = new THREE.LatheGeometry(prof, 56, upper ? Math.PI : 0, Math.PI)
  shell.rotateZ(-Math.PI / 2)
  const parts: THREE.BufferGeometry[] = [part(shell, C.paint)]
  // flange da junta horizontal (plano y = 0), dos dois lados
  for (const side of [1, -1]) {
    const sh = new THREE.Shape()
    const N = 40
    for (let i = 0; i <= N; i++) {
      const x = -2.3 + (4.3 * i) / N
      const r = casingR(x)
      if (i === 0) sh.moveTo(x, r)
      else sh.lineTo(x, r)
    }
    for (let i = N; i >= 0; i--) {
      const x = -2.3 + (4.3 * i) / N
      sh.lineTo(x, casingR(x) + 0.16)
    }
    const g = new THREE.ShapeGeometry(sh, 2)
    g.rotateX(Math.PI / 2)
    if (side < 0) g.scale(1, 1, -1)
    if (upper) g.translate(0, 0.002, 0)
    parts.push(part(g, C.machined))
    // parafusos da junta
    if (!upper)
      for (let i = 0; i < 11; i++) {
        const x = -2.1 + i * 0.4
        const b = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 6)
        b.translate(x, 0.025, side * (casingR(x) + 0.08))
        parts.push(part(b, C.bolt))
      }
  }
  return parts
}

/** Diafragmas: palhetas fixas (bocais) entre os estágios, na metade inferior (presos à carcaça). */
function buildDiaphragms() {
  const parts: THREE.BufferGeometry[] = []
  const m = new THREE.Matrix4()
  for (let k = 0; k < STAGES; k++) {
    const x = k === 0 ? -1.85 : stageX(k) - 0.2
    const rd = discR(k) * 0.96
    const L = bladeL(k) * 0.98
    const rt = rd + L
    // placa do diafragma (meia coroa) e anel externo
    const plate = new THREE.RingGeometry(0.18, rd, 40, 1, Math.PI, Math.PI)
    plate.rotateY(Math.PI / 2)
    plate.translate(x, 0, 0)
    const outer = new THREE.RingGeometry(rt, rt + 0.07, 48, 1, Math.PI, Math.PI)
    outer.rotateY(Math.PI / 2)
    outer.translate(x, 0, 0)
    parts.push(part(plate, C.plate), part(outer, C.plate))
    // bocais: torção oposta à das palhetas móveis
    const n = Math.round(44 - 2.4 * k)
    const proto = blade(0.06 + 0.012 * k, L, 0.018, -0.3, -0.3 - 0.8 * (k / (STAGES - 1)))
    for (let i = 0; i < n; i++) {
      const phi = Math.PI / 2 + ((i + 0.5) / n) * Math.PI // metade inferior (y < 0)
      const g = proto.clone()
      m.makeRotationX(phi)
      m.setPosition(x, Math.cos(phi) * (rd + L / 2), Math.sin(phi) * (rd + L / 2))
      g.applyMatrix4(m)
      parts.push(part(g, C.nozzle))
    }
    proto.dispose()
  }
  return parts
}

/** Carcaça inferior: casca, flange, diafragmas e duto de escape para o condensador. */
function buildCasing() {
  const parts = [...buildShell(false), ...buildDiaphragms()]
  // duto de escape (baixa pressão), para baixo
  const duct = new THREE.CylinderGeometry(0.5, 0.62, 0.5, 4, 1, true)
  duct.rotateY(Math.PI / 4)
  duct.scale(1.0, 1, 1.5)
  duct.translate(1.5, BASE_Y + 0.27, 0)
  parts.push(part(duct, C.paint))
  parts.push(part(boxAt(1.05, 0.06, 1.5, 1.5, BASE_Y + 0.03, 0), C.machined))
  return merge(parts)
}

/** Carcaça superior (aparece em "vidro" na simulação) com bocal de admissão e nervuras. */
function buildUpperCasing() {
  const parts = buildShell(true)
  const noz = new THREE.CylinderGeometry(0.27, 0.27, 1.0, 32, 1, true)
  noz.translate(INLET_X, 1.1, 0)
  parts.push(part(noz, C.paint))
  const fl = new THREE.CylinderGeometry(0.4, 0.4, 0.07, 32)
  fl.translate(INLET_X, 1.6, 0)
  parts.push(part(fl, C.machined))
  for (const x of [-0.9, 0.0, 0.9]) {
    const rib = new THREE.TorusGeometry(casingR(x) + 0.01, 0.03, 8, 40, Math.PI)
    rib.rotateY(Math.PI / 2)
    rib.rotateX(-Math.PI / 2)
    rib.translate(x, 0, 0)
    parts.push(part(rib, C.paint))
  }
  return merge(parts)
}

/** Mancais com capa de bronze, pedestais e base (skid). */
function buildSupports() {
  const parts: THREE.BufferGeometry[] = []
  for (const x of [-2.55, 2.32]) {
    parts.push(part(boxAt(0.34, 0.5, 0.7, x, -0.3, 0), C.support))
    const cap = new THREE.CylinderGeometry(0.3, 0.3, 0.34, 28, 1, false, 0, Math.PI)
    cap.rotateZ(Math.PI / 2)
    cap.rotateX(-Math.PI / 2)
    cap.translate(x, -0.05, 0)
    parts.push(part(cap, C.bronze))
    parts.push(part(boxAt(0.5, 0.12, 0.95, x, -0.6, 0), C.support))
    // pedestal até a base
    const ped = new THREE.CylinderGeometry(0.3, 0.44, BASE_Y + 0.12 + 0.66, 4, 1)
    ped.rotateY(Math.PI / 4)
    ped.scale(1, 1, 1.5)
    ped.translate(x, (BASE_Y + 0.12 - 0.66) / 2, 0)
    parts.push(part(ped, C.support))
  }
  // berços da carcaça
  for (const x of [-1.5, 0.35]) {
    const h = -casingR(x) * 0.82 - (BASE_Y + 0.12)
    parts.push(part(boxAt(0.16, h, 1.5, x, BASE_Y + 0.12 + h / 2, 0), C.support))
  }
  // longarinas e travessas
  for (const z of [-0.72, 0.72]) parts.push(part(boxAt(5.9, 0.12, 0.2, -0.1, BASE_Y + 0.06, z), C.support))
  for (const x of [-2.9, -1.0, 0.6, 2.7]) parts.push(part(boxAt(0.2, 0.1, 1.64, x, BASE_Y + 0.05, 0), C.support))
  return merge(parts)
}

/* ------------------------------------------------------------------ cor do campo */

const RAMP = [
  { t: 0, c: '#ffe9a8' },
  { t: 0.18, c: '#ffb547' },
  { t: 0.42, c: '#ff6a3d' },
  { t: 0.65, c: '#d6409f' },
  { t: 0.84, c: '#8457f5' },
  { t: 1, c: '#3f7ef0' },
]
const GLSL_RAMP = /* glsl */ `
  uniform vec3 uRamp[6];
  vec3 tRamp(float t) {
    vec3 c = uRamp[0];
    c = mix(c, uRamp[1], smoothstep(0.0, 0.18, t));
    c = mix(c, uRamp[2], smoothstep(0.18, 0.42, t));
    c = mix(c, uRamp[3], smoothstep(0.42, 0.65, t));
    c = mix(c, uRamp[4], smoothstep(0.65, 0.84, t));
    c = mix(c, uRamp[5], smoothstep(0.84, 1.0, t));
    return c;
  }
  // posição na rampa (0 quente, 1 frio) ao longo do eixo: a temperatura cai com a expansão
  float tAlong(float x) {
    float s = clamp((x - ${(X0 - 0.15).toFixed(3)}) / ${(X1 + 0.3 - X0).toFixed(3)}, 0.0, 1.0);
    return 1.0 - pow(1.0 - s, 1.5);
  }
`

/* ------------------------------------------------------------------ shaders */

const POINT_VERT = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aColor;
  attribute vec2 aSeed; // atraso, aleatório
  uniform float uT, uTime, uFront, uSize, uScale;
  varying vec3 vColor;
  void main() {
    float k = clamp((uT * 1.55 - aSeed.x) / 0.55, 0.0, 1.0);
    float e = k * k * (3.0 - 2.0 * k);
    float fly = sin(e * 3.14159);
    vec3 p = mix(aStart, position, e);
    p.y += fly * 0.5 * (aSeed.y - 0.35);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.78 + 0.22 * sin(uTime * 3.1 + aSeed.y * 43.0);
    float band = 1.0 - smoothstep(0.0, 0.42, abs(position.x - uFront));
    vColor = aColor * tw * (1.0 + fly * 0.35) + vec3(0.5, 0.32, 1.0) * (fly * 0.3 + band * 1.3);
    float sz = uSize * uScale / -mv.z * (0.7 + 0.6 * fract(aSeed.y * 7.31)) * (1.0 - fly * 0.35 + band * 0.9);
    // ainda não saiu da foto, ou a frente de reconstrução já passou: some
    if (k <= 0.0 || position.x < uFront) { sz = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }
    gl_PointSize = sz;
  }
`
const POINT_FRAG = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    gl_FragColor = vec4(vColor * (0.55 + 0.45 * smoothstep(0.25, 0.02, d)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
const RAY_VERT = /* glsl */ `
  attribute float aDelay;
  attribute float aEnd;
  uniform float uT;
  varying float vA;
  void main() {
    float k = clamp((uT * 1.55 - aDelay) / 0.55, 0.0, 1.0);
    vA = sin(k * 3.14159) * mix(0.55, 0.08, aEnd);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const RAY_FRAG = /* glsl */ `
  varying float vA;
  void main() {
    gl_FragColor = vec4(vec3(0.72, 0.56, 1.0) * 1.5, vA);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
const STEAM_VERT = /* glsl */ `
  attribute vec4 aSeed; // ângulo, raio 0..1, fase, velocidade
  attribute float aTrail; // 0 cabeça, 1 cauda
  attribute float aSide;
  uniform float uTime, uAspect, uWidth, uOpacity, uSpeed;
  varying vec3 vColor;
  varying float vAlpha, vSide;
  ${GLSL_RAMP}
  const float X0 = ${X0.toFixed(3)};
  const float X1 = ${X1.toFixed(3)};
  vec3 path(float s) {
    // o vapor acelera ao expandir: avanço lento na alta pressão, rápido na baixa
    float q = 0.3 * s + 0.7 * s * s;
    float x = (X0 - 0.55) + (X1 + 0.75 - (X0 - 0.55)) * q;
    float ang = aSeed.x + 11.0 * s - 4.5 * s * s;
    float k = clamp((x - X0) / (X1 - X0), 0.0, 1.0) * 8.0;
    float r0 = 0.36 + 0.025 * k;
    float r1 = r0 + 0.09 + 0.95 * pow(k / 8.0, 1.8);
    float r = mix(r0, r1, 0.14 + 0.78 * aSeed.y);
    vec3 p = vec3(x, cos(ang) * r, sin(ang) * r);
    // admissão: desce pelo bocal e entra no canal anular
    float inl = clamp((X0 - 0.12 - x) / 0.43, 0.0, 1.0);
    float ii = inl * inl * (3.0 - 2.0 * inl);
    p.x = mix(p.x, ${INLET_X.toFixed(2)} + (aSeed.y - 0.5) * 0.3, ii);
    p.y = mix(p.y, 0.5 + inl * 1.25, ii);
    p.z = mix(p.z, sin(aSeed.x) * 0.16, ii);
    // escape: depois do último estágio, cai para o condensador
    float ex = clamp((x - (X1 + 0.12)) / 0.63, 0.0, 1.0);
    p.x = min(p.x, X1 + 0.12 + 0.3 * (1.0 - exp(-max(x - X1 - 0.12, 0.0) * 3.0)));
    p.y -= ex * ex * 2.3;
    p.z *= 1.0 - 0.45 * ex;
    return p;
  }
  void main() {
    float s = fract(aSeed.z + uTime * uSpeed * (0.7 + 0.6 * aSeed.w)) - aTrail * 0.07;
    float sc = max(s, 0.0);
    vec3 p = path(sc);
    vec3 p2 = path(sc + 0.004);
    vec4 a = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    vec4 b = projectionMatrix * modelViewMatrix * vec4(p2, 1.0);
    vec2 dir = (b.xy / b.w - a.xy / a.w) * vec2(uAspect, 1.0);
    dir = normalize(dir + vec2(1e-5, 0.0));
    vec2 n = vec2(-dir.y, dir.x);
    n.x /= uAspect;
    float taper = 1.0 - 0.75 * aTrail;
    a.xy += n * aSide * uWidth * projectionMatrix[1][1] * taper;
    gl_Position = a;
    float q = 0.3 * sc + 0.7 * sc * sc;
    float x = (X0 - 0.55) + (X1 + 0.75 - (X0 - 0.55)) * q;
    vColor = tRamp(tAlong(x)) * (0.95 + 0.6 * aSeed.w) * mix(0.7, 1.15, tAlong(x));
    float inlA = clamp((X0 - 0.12 - x) / 0.43, 0.0, 1.0);
    vAlpha = uOpacity * pow(1.0 - aTrail, 1.4) * smoothstep(0.0, 0.03, s) * (1.0 - smoothstep(0.9, 1.0, sc)) * (1.0 - 0.82 * inlA);
    vSide = aSide;
  }
`
const STEAM_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha, vSide;
  void main() {
    float edge = 1.0 - vSide * vSide;
    gl_FragColor = vec4(vColor * (0.6 + 0.8 * edge), vAlpha * (0.35 + 0.65 * edge));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
const GLASS_VERT = /* glsl */ `
  varying vec3 vN, vV;
  varying float vX;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vX = position.x;
    gl_Position = projectionMatrix * mv;
  }
`
const GLASS_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vN, vV;
  varying float vX;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
    float rings = smoothstep(0.9, 1.0, sin(vX * 30.0)) * 0.1;
    gl_FragColor = vec4(uColor * (0.035 + rings * 0.6 + f * 0.95), uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

interface Props {
  /** Largura da coluna (e do canvas, se `canvasW` não for informado). */
  size?: number
  sim?: boolean
  /** Altura do bloco; os chips de fase ficam no rodapé. Padrão: canvas + chips. */
  height?: number
  /** Canvas maior que a coluna, sangrando para fora (ex.: 1060×1080 com offset −128, −96). */
  canvasW?: number
  canvasH?: number
  offsetX?: number
  offsetY?: number
}

export default function TurbineCloud({ size = 860, sim = false, height, canvasW, canvasH, offsetX = 0, offsetY = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const lblIn = useRef<HTMLDivElement>(null)
  const lblOut = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0)
  const [labels, setLabels] = useState(false)
  const simRef = useRef<(on: boolean) => void>(() => {})
  const simOn = useRef(false)
  const W = canvasW ?? size
  const H = canvasH ?? size
  const bleed = W > size

  useEffect(() => {
    const host = ref.current!
    const low = /[?&]q=baixa/.test(location.search)
    // a fase "Simulação" prevalece sobre a animação de entrada, mesmo se o clique vier cedo
    const phaseAtLeast = (n: number) => setPhase((p) => (simOn.current ? 3 : Math.max(p, n)))

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    const pr = Math.min(window.devicePixelRatio || 1, low ? 1 : 1.25)
    renderer.setPixelRatio(pr)
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = projector.on ? 1.2 : 1.05
    renderer.shadowMap.enabled = !low
    renderer.shadowMap.type = THREE.PCFShadowMap
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const disposables: { dispose: () => void }[] = []

    // ---- ambiente de estúdio: sala escura com "softboxes" (dá reflexo de aço usinado, não um branco chapado)
    const envScene = new THREE.Scene()
    const lightBox = (w: number, h: number, d: number, x: number, y: number, z: number, r: number, g: number, b: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(r, g, b), side: THREE.DoubleSide }))
      m.position.set(x, y, z)
      envScene.add(m)
    }
    lightBox(60, 60, 60, 0, 0, 0, 0.012, 0.01, 0.03) // sala
    lightBox(11, 0.3, 5, 0, 9, 1, 5, 5, 5.5) // teto
    lightBox(0.3, 7, 9, -10, 2, -3, 2.4, 1.1, 6.0) // faixa roxa (marca)
    lightBox(0.3, 4, 5, 10, 1.5, 4, 5.2, 3.8, 2.4) // faixa quente
    lightBox(9, 2.5, 0.3, 0, 1.5, 11, 1.0, 1.2, 1.9) // preenchimento frio
    lightBox(30, 0.3, 30, 0, -6, 0, 0.1, 0.08, 0.2) // piso
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(envScene, 0.03).texture
    pmrem.dispose()
    envScene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.geometry.dispose()
        ;(m.material as THREE.Material).dispose()
      }
    })
    scene.environment = envTex

    const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 100)
    const CAM_WIDE = { x: 0.2, y: 5.4, z: 13.2, tx: 0, ty: -0.25, tz: 0 }
    const CAM_HERO = { x: 0, y: 3.3, z: 10.9, tx: 0, ty: -0.62, tz: 0 }
    const CAM_SIM = { x: 0.3, y: 3.0, z: 11.2, tx: 0.05, ty: -0.2, tz: 0 }
    const cam = { ...CAM_WIDE }
    const camTarget = new THREE.Vector3()
    const placeCamera = (c: typeof cam, dx = 0, dy = 0) => {
      camera.position.set(c.x + dx, c.y + dy, c.z)
      camera.lookAt(camTarget.set(c.tx, c.ty, c.tz))
    }
    placeCamera(cam)
    camera.updateMatrixWorld()

    const ambient = new THREE.AmbientLight(0xbfc6ff, 0.1)
    const key = new THREE.DirectionalLight(0xfff4e6, 2.6)
    key.position.set(4.5, 8, 5.5)
    key.castShadow = !low
    key.shadow.mapSize.set(2048, 2048)
    const sc = key.shadow.camera
    sc.left = -4.6
    sc.right = 4.6
    sc.top = 4.6
    sc.bottom = -4.6
    sc.near = 2
    sc.far = 24
    key.shadow.bias = -0.0006
    key.shadow.normalBias = 0.025
    const rim = new THREE.DirectionalLight(0x9156f1, 3.4)
    rim.position.set(-6, 0.5, -5)
    const fill = new THREE.DirectionalLight(0x7f9bff, 0.7)
    fill.position.set(-5, 2, 7)
    const flashes = [0, 1].map(() => new THREE.PointLight(0xfff6e8, 0, 0, 1.5))
    scene.add(ambient, key, rim, fill, ...flashes)

    // ---- conjunto: inclinado; depois de reconstruído, gira devagar como numa mesa giratória
    const group = new THREE.Group()
    const GROUP_RY = -0.62
    group.rotation.set(0.1, GROUP_RY, 0.05)
    scene.add(group)
    const rotorPivot = new THREE.Group()
    group.add(rotorPivot)

    const rotorGeo = buildRotor()
    const casingGeo = buildCasing()
    const supportGeo = buildSupports()
    const upperGeo = buildUpperCasing()

    // uniformes compartilhados: frente de reconstrução, frente do campo de temperatura
    const U = {
      uFront: { value: 99 },
      uFieldFront: { value: -9 },
      uGlow: { value: new THREE.Color(0x9a6bff) },
      uRamp: { value: RAMP.map((r) => new THREE.Color(r.c)) },
    }
    /** Material PBR com corte na frente de reconstrução (borda luminosa) e, opcionalmente, campo de temperatura. */
    const sweepable = <M extends THREE.Material>(mat: M, field = false) => {
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uFront = U.uFront
        sh.uniforms.uFieldFront = U.uFieldFront
        sh.uniforms.uGlow = U.uGlow
        sh.uniforms.uRamp = U.uRamp
        sh.uniforms.uHasField = { value: field ? 1 : 0 }
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying float vSweepX;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSweepX = position.x;')
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', `#include <common>\nvarying float vSweepX;\nuniform float uFront, uFieldFront, uHasField;\nuniform vec3 uGlow;\n${GLSL_RAMP}`)
          .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vSweepX > uFront) discard;')
          .replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            float fw = uHasField * smoothstep(0.0, 0.55, uFieldFront - vSweepX) * smoothstep(-2.45, -2.0, vSweepX) * (1.0 - smoothstep(1.95, 2.35, vSweepX));
            vec3 fcol = tRamp(tAlong(vSweepX));
            diffuseColor.rgb = mix(diffuseColor.rgb, fcol, fw * 0.9);`,
          )
          .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor *= 1.0 - 0.6 * fw;')
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
            totalEmissiveRadiance += uGlow * smoothstep(uFront - 0.2, uFront, vSweepX) * 2.6 + fcol * fw * 0.28;`,
          )
      }
      return mat
    }
    const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide })
    depthMat.onBeforeCompile = (sh) => {
      sh.uniforms.uFront = U.uFront
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vSweepX;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSweepX = position.x;')
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vSweepX;\nuniform float uFront;')
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vSweepX > uFront) discard;')
    }
    disposables.push(depthMat)

    const rotorMat = sweepable(new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.92, roughness: 0.3, envMapIntensity: 1 }), true)
    const casingMat = sweepable(new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.5, roughness: 0.46, side: THREE.DoubleSide }))
    const supportMat = sweepable(new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.55, roughness: 0.5 }))
    const solidMats = [rotorMat, casingMat, supportMat]
    const rotor = new THREE.Mesh(rotorGeo, rotorMat)
    const casing = new THREE.Mesh(casingGeo, casingMat)
    const supports = new THREE.Mesh(supportGeo, supportMat)
    const solids = [rotor, casing, supports]
    solids.forEach((m) => {
      m.castShadow = true
      m.receiveShadow = true
      m.customDepthMaterial = depthMat
    })
    rotorPivot.add(rotor)
    group.add(casing, supports)

    // carcaça superior em "vidro" (só na simulação)
    const glassMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0xb59bff).multiplyScalar(low ? 0.45 : 1) }, uOpacity: { value: 0 } }, // sem bloom/HDR o aditivo satura: mais discreto
      vertexShader: GLASS_VERT,
      fragmentShader: GLASS_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
    const upper = new THREE.Mesh(upperGeo, glassMat)
    upper.visible = false
    upper.renderOrder = 4
    group.add(upper)

    // ---- mesa giratória: disco escuro com anéis e sombra da peça
    const ringsCv = document.createElement('canvas')
    ringsCv.width = ringsCv.height = 1024
    {
      const c = ringsCv.getContext('2d')!
      c.fillStyle = '#000'
      c.fillRect(0, 0, 1024, 1024)
      c.translate(512, 512)
      for (let i = 1; i <= 9; i++) {
        c.beginPath()
        c.arc(0, 0, i * 54, 0, Math.PI * 2)
        c.strokeStyle = i === 9 ? 'rgba(255,255,255,0.95)' : `rgba(255,255,255,${i % 3 === 0 ? 0.3 : 0.12})`
        c.lineWidth = i === 9 ? 5 : 2
        c.stroke()
      }
      for (let i = 0; i < 72; i++) {
        c.rotate(Math.PI / 36)
        c.fillStyle = `rgba(255,255,255,${i % 6 === 5 ? 0.8 : 0.3})`
        c.fillRect(i % 6 === 5 ? 440 : 458, -1.5, i % 6 === 5 ? 46 : 28, 3)
      }
    }
    const ringsTex = new THREE.CanvasTexture(ringsCv)
    ringsTex.anisotropy = 8
    const DISC_R = 3.05
    const discMat = new THREE.MeshStandardMaterial({ color: 0x15122e, metalness: 0.6, roughness: 0.38, emissive: 0x9156f1, emissiveMap: ringsTex, emissiveIntensity: 1.1, transparent: true, opacity: 0.92 })
    const disc = new THREE.Mesh(new THREE.CircleGeometry(DISC_R, 96), discMat)
    disc.rotation.x = -Math.PI / 2
    disc.position.y = BASE_Y - 0.005
    disc.receiveShadow = true
    scene.add(disc)

    // ---- "fotos": miniaturas reais da peça, uma por ponto de vista, com moldura, tronco de visão e flash
    const N_CAM = 10
    const CARD_Y = [0.1, 2.25, 0.85, 2.3, 1.2, 2.35, 1.0, 2.0, 0.6, 0.0]
    const CENTER = new THREE.Vector3(0, -0.1, 0)
    const photoCam = new THREE.PerspectiveCamera(30, 1 / 0.72, 0.5, 40)
    const sparkCv = document.createElement('canvas')
    sparkCv.width = sparkCv.height = 128
    {
      const c = sparkCv.getContext('2d')!
      const g = c.createRadialGradient(64, 64, 0, 64, 64, 64)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.2, 'rgba(255,250,235,0.85)')
      g.addColorStop(0.5, 'rgba(210,190,255,0.25)')
      g.addColorStop(1, 'rgba(160,120,255,0)')
      c.fillStyle = g
      c.fillRect(0, 0, 128, 128)
    }
    const sparkTex = new THREE.CanvasTexture(sparkCv)
    const cardGeo = new THREE.PlaneGeometry(1, 0.72)
    const frameGeo = new THREE.PlaneGeometry(1.08, 0.8)
    const cards = Array.from({ length: N_CAM }, (_, i) => {
      // arco de trás e dos lados, em duas alturas: a frente fica livre para a peça
      const a = ((168 + (i * 204) / (N_CAM - 1)) * Math.PI) / 180
      const pos = new THREE.Vector3(Math.cos(a) * 3.45, CARD_Y[i], Math.sin(a) * 3.1)
      const rt = new THREE.WebGLRenderTarget(384, 276, { samples: low ? 0 : 4 })
      rt.texture.colorSpace = THREE.SRGBColorSpace
      const g = new THREE.Group()
      g.position.copy(pos)
      const frameMat = new THREE.MeshBasicMaterial({ color: 0xf3f0e8, transparent: true, opacity: 0, depthWrite: false })
      const photoMat = new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, opacity: 0, depthWrite: false })
      const frame = new THREE.Mesh(frameGeo, frameMat)
      const photo = new THREE.Mesh(cardGeo, photoMat)
      frame.renderOrder = 6
      photo.renderOrder = 7
      photo.position.z = 0.004
      g.add(frame, photo)
      const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }))
      flash.position.copy(pos)
      flash.renderOrder = 9
      // tronco de visão: do ponto de vista até um quadro na direção da peça
      const d = CENTER.clone().sub(pos).normalize()
      const r = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize()
      const u = new THREE.Vector3().crossVectors(r, d)
      const far = pos.clone().addScaledVector(d, 1.25)
      const cn = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => far.clone().addScaledVector(r, sx * 0.4).addScaledVector(u, sy * 0.29))
      const pts: THREE.Vector3[] = []
      cn.forEach((c, j) => pts.push(pos, c, c, cn[(j + 1) % 4]))
      const lineMat = new THREE.LineBasicMaterial({ color: 0xcbb3ff, transparent: true, opacity: 0, depthWrite: false })
      const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat)
      g.scale.setScalar(0.3)
      g.visible = false
      scene.add(g, flash, lines)
      return { g, pos, rt, frameMat, photoMat, flash, lineMat, roll: ((i * 37) % 9 - 4) * 0.012, st: { o: 0 } }
    })
    disposables.push(sparkTex, ringsTex)

    // tira as "fotos" (uma vez): a peça inteira, iluminada, vista de cada ponto
    {
      scene.environmentIntensity = 0.95
      const bg = new THREE.Color(0x1d1b30)
      scene.background = bg
      cards.forEach((c) => {
        photoCam.position.copy(c.pos).sub(CENTER).normalize().multiplyScalar(10.2).add(CENTER)
        photoCam.lookAt(CENTER)
        renderer.setRenderTarget(c.rt)
        renderer.render(scene, photoCam)
      })
      renderer.setRenderTarget(null)
      scene.background = null
    }

    // ---- nuvem de pontos: cada ponto sai de uma foto e pousa na superfície, com a cor do sombreamento
    const N = low ? 12000 : 42000
    const sampleGeo = mergeGeometries([rotorGeo, casingGeo, supportGeo])!
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(sampleGeo)).setWeightAttribute(null).build()
    const pTarget = new Float32Array(N * 3)
    const pStart = new Float32Array(N * 3)
    const pColor = new Float32Array(N * 3)
    const pSeed = new Float32Array(N * 2)
    const groupQ = new THREE.Quaternion().setFromEuler(group.rotation)
    const groupQi = groupQ.clone().invert()
    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
    const L1 = new THREE.Vector3(0.45, 0.72, 0.52).normalize()
    const L2 = new THREE.Vector3(-0.7, 0.05, -0.6).normalize()
    const v = new THREE.Vector3()
    const nrm = new THREE.Vector3()
    const col = new THREE.Color()
    const w = new THREE.Vector3()
    const RAYS = low ? 60 : 160
    const rayPos = new Float32Array(RAYS * 6)
    const rayDelay = new Float32Array(RAYS * 2)
    const rayEnd = new Float32Array(RAYS * 2)
    let seed = 7
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) | 0
      return (seed >>> 0) / 4294967296
    }
    for (let i = 0; i < N; i++) {
      sampler.sample(v, nrm, col)
      pTarget.set([v.x, v.y, v.z], i * 3)
      nrm.applyQuaternion(groupQ)
      w.copy(v).applyQuaternion(groupQ)
      // a foto que "vê" melhor esse ponto, entre três sorteadas
      let best = 0
      let bestDot = -9
      for (let t = 0; t < 3; t++) {
        const ci = Math.floor(rnd() * N_CAM)
        const dt = Math.abs(nrm.dot(cards[ci].pos.clone().sub(w).normalize()))
        if (dt > bestDot) {
          bestDot = dt
          best = ci
        }
      }
      const cp = cards[best].pos
      const s = new THREE.Vector3().copy(cp).addScaledVector(camRight, (rnd() - 0.5) * 0.92).addScaledVector(camUp, (rnd() - 0.5) * 0.64).applyQuaternion(groupQi)
      pStart.set([s.x, s.y, s.z], i * 3)
      const delay = (best / N_CAM) * 0.42 + rnd() * 0.28
      pSeed.set([delay, rnd()], i * 2)
      const d1 = nrm.dot(L1)
      const lit = 0.2 + 0.55 * Math.abs(d1) + 0.5 * Math.max(0, d1)
      const rimK = Math.pow(Math.abs(nrm.dot(L2)), 1.6) * 0.55
      pColor.set([col.r * lit + 0.3 * rimK, col.g * lit + 0.13 * rimK, col.b * lit + 0.9 * rimK], i * 3)
      if (i < RAYS) {
        const cl = cp.clone().applyQuaternion(groupQi)
        rayPos.set([cl.x, cl.y, cl.z, v.x, v.y, v.z], i * 6)
        rayDelay.set([delay, delay], i * 2)
        rayEnd.set([0, 1], i * 2)
      }
    }
    sampleGeo.dispose()
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pTarget, 3))
    pGeo.setAttribute('aStart', new THREE.BufferAttribute(pStart, 3))
    pGeo.setAttribute('aColor', new THREE.BufferAttribute(pColor, 3))
    pGeo.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 2))
    const fovK = (H * pr * 0.5) / Math.tan((camera.fov * Math.PI) / 360)
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uTime: { value: 0 }, uFront: { value: -99 }, uSize: { value: low ? 0.05 : 0.032 }, uScale: { value: fovK } },
      vertexShader: POINT_VERT,
      fragmentShader: POINT_FRAG,
    })
    const points = new THREE.Points(pGeo, pMat)
    points.frustumCulled = false
    points.visible = false
    group.add(points)

    const rayGeo = new THREE.BufferGeometry()
    rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPos, 3))
    rayGeo.setAttribute('aDelay', new THREE.BufferAttribute(rayDelay, 1))
    rayGeo.setAttribute('aEnd', new THREE.BufferAttribute(rayEnd, 1))
    const rayMat = new THREE.ShaderMaterial({ uniforms: { uT: pMat.uniforms.uT }, vertexShader: RAY_VERT, fragmentShader: RAY_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    const rays = new THREE.LineSegments(rayGeo, rayMat)
    rays.frustumCulled = false
    rays.visible = false
    group.add(rays)

    // anel da frente de reconstrução
    const scanMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(1.1, 0.8, 2.2), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    const scanFill = new THREE.MeshBasicMaterial({ color: 0x9156f1, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    const scan = new THREE.Group()
    const scanRing = new THREE.Mesh(new THREE.RingGeometry(2.02, 2.06, 96), scanMat)
    const scanDisc = new THREE.Mesh(new THREE.CircleGeometry(2.02, 64), scanFill)
    scan.add(scanRing, scanDisc)
    scan.rotation.y = Math.PI / 2
    scan.visible = false
    group.add(scan)

    // ---- vapor: fitas com rastro em hélice, da admissão ao escape, coloridas pela temperatura
    const NS = low ? 320 : 900
    const K = 9
    const sSeed = new Float32Array(NS * K * 2 * 4)
    const sTrail = new Float32Array(NS * K * 2)
    const sSide = new Float32Array(NS * K * 2)
    const sIdx: number[] = []
    for (let i = 0; i < NS; i++) {
      const sd = [rnd() * Math.PI * 2, rnd(), rnd(), rnd()]
      for (let j = 0; j < K; j++)
        for (let s = 0; s < 2; s++) {
          const vi = (i * K + j) * 2 + s
          sSeed.set(sd, vi * 4)
          sTrail[vi] = j / (K - 1)
          sSide[vi] = s ? 1 : -1
        }
      for (let j = 0; j < K - 1; j++) {
        const a = (i * K + j) * 2
        sIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    const steamGeo = new THREE.BufferGeometry()
    steamGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * K * 2 * 3), 3))
    steamGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 4))
    steamGeo.setAttribute('aTrail', new THREE.BufferAttribute(sTrail, 1))
    steamGeo.setAttribute('aSide', new THREE.BufferAttribute(sSide, 1))
    steamGeo.setIndex(sIdx)
    const steamMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uAspect: { value: W / H }, uWidth: { value: low ? 0.02 : 0.017 }, uOpacity: { value: 0 }, uSpeed: { value: 0.15 }, uRamp: U.uRamp },
      vertexShader: STEAM_VERT,
      fragmentShader: STEAM_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
    const steam = new THREE.Mesh(steamGeo, steamMat)
    steam.frustumCulled = false
    steam.renderOrder = 5
    steam.visible = false
    // segundo passe, fraco e sem teste de profundidade: deixa ler a hélice por dentro dos estágios
    const steamXrayMat = steamMat.clone()
    steamXrayMat.uniforms.uRamp = U.uRamp
    steamXrayMat.depthTest = false
    const steamXray = new THREE.Mesh(steamGeo, steamXrayMat)
    steamXray.frustumCulled = false
    steamXray.renderOrder = 5
    steamXray.visible = false
    group.add(steam, steamXray)

    // ---- pós-processamento: bloom sobre fundo transparente
    let composer: EffectComposer | null = null
    let bloom: UnrealBloomPass | null = null
    if (!low) {
      const rtMain = new THREE.WebGLRenderTarget(W * pr, H * pr, { type: THREE.HalfFloatType, samples: 4 })
      composer = new EffectComposer(renderer, rtMain)
      composer.addPass(new RenderPass(scene, camera))
      bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.34, 0.4, 0.95)
      composer.addPass(bloom)
      composer.addPass(new OutputPass())
    }

    // ---- estado animado
    const st = {
      t: 0, // voo dos pontos (0 → 1)
      front: 99, // frente de reconstrução (x); 99 = sólido inteiro
      ghost: 1, // opacidade da peça "real" no escuro (fase das fotos)
      light: 0.035, // luz do estúdio (0 escuro → 1)
      spin: 0,
      orbit: 0, // amplitude do giro da mesa
      scan: 0,
      field: -3.2, // frente do campo de temperatura
      steam: 0,
      glass: 0, // carcaça superior (0 fora → 1 fechada)
      casing: 1, // opacidade da carcaça inferior
      built: 0, // 1 depois da reconstrução
    }
    const exposure = { v: renderer.toneMappingExposure }
    let orbitT0 = 0
    let introDone = false

    const fireFlash = (i: number) => {
      const c = cards[i]
      const L = flashes[i % 2]
      L.position.copy(c.pos).multiplyScalar(1.15)
      gsap.fromTo(L, { intensity: 26 }, { intensity: 0, duration: 0.5, ease: 'power2.out', overwrite: true })
      const fm = c.flash.material as THREE.SpriteMaterial
      gsap.fromTo(fm, { opacity: 0.85 }, { opacity: 0, duration: 0.4, ease: 'power2.out' })
      gsap.fromTo(c.flash.scale, { x: 0.5, y: 0.5 }, { x: 2.1, y: 2.1, duration: 0.4, ease: 'power2.out' })
    }

    const tl = gsap.timeline({ delay: 0.5 })
    // 1 · fotos: flash, a peça aparece por um instante e a foto fica
    cards.forEach((c, i) => {
      const at = 0.1 + i * 0.14
      tl.call(() => fireFlash(i), [], at)
      tl.set(c.g, { visible: true }, at)
      tl.to(c.st, { o: 1, duration: 0.25, ease: 'power2.out' }, at + 0.04)
      tl.to(c.g.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(2.2)' }, at + 0.04)
      tl.to(c.lineMat, { opacity: 0.4, duration: 0.3 }, at + 0.1)
    })
    // 2 · nuvem de pontos
    const T_CLOUD = 1.9
    tl.call(() => phaseAtLeast(1), [], T_CLOUD)
    tl.set([points, rays], { visible: true }, T_CLOUD)
    tl.to(st, { ghost: 0, duration: 0.8, ease: 'power1.in' }, T_CLOUD - 0.3)
    tl.to(st, { t: 1, duration: 3.3, ease: 'power1.inOut' }, T_CLOUD)
    tl.to(st, { light: 1, duration: 2.2, ease: 'power1.inOut' }, T_CLOUD + 0.9)
    tl.to(cam, { ...CAM_HERO, duration: 5.0, ease: 'power2.inOut' }, T_CLOUD)
    cards.forEach((c) => {
      tl.to(c.lineMat, { opacity: 0, duration: 1.2 }, T_CLOUD + 1.6)
      tl.to(c.st, { o: 0.55, duration: 1.2 }, T_CLOUD + 2.0)
    })
    // 3 · modelo: a frente de reconstrução varre o eixo
    const T_MODEL = T_CLOUD + 3.3
    tl.call(() => phaseAtLeast(2), [], T_MODEL)
    tl.set(st, { front: -3.3, ghost: 1 }, T_MODEL)
    tl.set(scan, { visible: true }, T_MODEL)
    tl.to(st, { scan: 1, duration: 0.3 }, T_MODEL)
    tl.to(st, { front: 3.1, duration: 2.4, ease: 'power1.inOut' }, T_MODEL)
    cards.forEach((c, i) => {
      tl.to(c.st, { o: 0, duration: 0.7 }, T_MODEL + 0.2 + i * 0.05)
      tl.to(c.g.scale, { x: 0.7, y: 0.7, duration: 0.7, ease: 'power2.in' }, T_MODEL + 0.2 + i * 0.05)
      tl.set(c.g, { visible: false }, T_MODEL + 1.0 + i * 0.05)
    })
    tl.to(st, { scan: 0, duration: 0.4 }, T_MODEL + 2.2)
    const T_DONE = T_MODEL + 2.6
    tl.set(st, { front: 99, built: 1 }, T_DONE)
    tl.set([points, rays, scan], { visible: false }, T_DONE)
    tl.call(() => { introDone = true }, [], T_DONE)
    tl.to(st, { spin: 0.45, duration: 2.5, ease: 'power1.in' }, T_DONE - 0.4)
    tl.to(st, { orbit: 1, duration: 3, ease: 'power1.inOut' }, T_DONE)

    // 4 · simulação
    const SIM_KEYS = 'field,steam,glass,casing,spin'
    let labelCall: gsap.core.Tween | null = null
    simRef.current = (on: boolean) => {
      simOn.current = on
      gsap.killTweensOf(st, SIM_KEYS)
      if (on) {
        setPhase(3)
        // se o clique vier antes do fim da animação de entrada, pula para o modelo pronto
        if (!introDone) {
          tl.progress(1)
          gsap.killTweensOf(st, SIM_KEYS)
        }
        upper.visible = true
        steam.visible = steamXray.visible = true
        labelCall?.kill()
        labelCall = gsap.delayedCall(5.4, () => setLabels(true))
        gsap.to(st, { glass: 1, duration: 1.5, ease: 'power3.out' })
        gsap.to(st, { casing: 0.5, duration: 1.0 })
        gsap.to(st, { field: 3.2, duration: 2.6, ease: 'power1.inOut', delay: 0.9 })
        gsap.to(st, { steam: 1, duration: 1.6, delay: 0.8 })
        gsap.to(st, { spin: 1.3, duration: 2.2, ease: 'power2.in' })
        // câmera: mergulha na admissão, acompanha a expansão e abre para o conjunto
        gsap.killTweensOf(cam)
        gsap
          .timeline()
          .to(cam, { x: -2.6, y: 2.3, z: 6.9, tx: -1.1, ty: 0.25, tz: -0.5, duration: 1.5, ease: 'power2.inOut' })
          .to(cam, { x: 1.6, y: 2.0, z: 7.6, tx: 0.5, ty: -0.1, tz: 0.2, duration: 2.6, ease: 'sine.inOut' })
          .to(cam, { ...CAM_SIM, duration: 2.2, ease: 'power2.inOut' })
        if (bloom) gsap.to(bloom, { strength: 0.5, duration: 1.2 })
      } else {
        setPhase((p) => (p === 3 ? 2 : p))
        gsap.to(st, { glass: 0, duration: 0.7, ease: 'power2.in', onComplete: () => { upper.visible = false } })
        gsap.to(st, { casing: 1, duration: 0.6 })
        gsap.to(st, { field: -3.2, duration: 0.7 })
        gsap.to(st, { steam: 0, duration: 0.5, onComplete: () => { steam.visible = steamXray.visible = false } })
        labelCall?.kill()
        setLabels(false)
        if (introDone) {
          gsap.to(st, { spin: 0.45, duration: 1.2 })
          gsap.killTweensOf(cam)
          gsap.to(cam, { ...CAM_HERO, duration: 1.6, ease: 'power2.inOut' })
        }
        if (bloom) gsap.to(bloom, { strength: 0.34, duration: 0.8 })
      }
    }

    // ensaio: acesso à coreografia pelo console (só em `npm run dev`)
    if (import.meta.env.DEV) (window as unknown as { __turb?: unknown }).__turb = { tl, st, cam, fireFlash }

    const offProj = projector.subscribe((on) => gsap.to(exposure, { v: on ? 1.2 : 1.05, duration: 0.8 }))
    const anchorIn = new THREE.Vector3(INLET_X, 1.72, 0)
    const anchorOut = new THREE.Vector3(1.5, BASE_Y + 0.1, 0.95)
    const proj = new THREE.Vector3()
    const place = (el: HTMLDivElement | null, a: THREE.Vector3, lift: number) => {
      if (!el) return
      proj.copy(a)
      if (a === anchorIn) proj.y += lift
      group.localToWorld(proj).project(camera)
      el.style.transform = `translate(${((proj.x + 1) / 2) * W}px, ${((1 - proj.y) / 2) * H}px)`
    }

    let raf = 0
    const timer = new THREE.Timer()
    timer.connect(document)
    const render = (now?: number) => {
      timer.update(now)
      const dt = Math.min(timer.getDelta(), 0.05)
      const t = timer.getElapsed()

      // mesa giratória: parada durante a reconstrução (as fotos ficam fixas no espaço)
      if (st.orbit <= 0) orbitT0 = t
      group.rotation.y = GROUP_RY + Math.sin((t - orbitT0) * 0.22) * 0.2 * st.orbit
      rotorPivot.rotation.x += dt * st.spin

      // luz do estúdio
      const L = st.light
      ambient.intensity = 0.1 * L
      key.intensity = 2.7 * L
      rim.intensity = 3.4 * L
      fill.intensity = 0.7 * L
      scene.environmentIntensity = 0.95 * L
      discMat.emissiveIntensity = 0.5 + 0.6 * L
      renderer.toneMappingExposure = exposure.v

      // sólidos: peça no escuro (fotos) → invisível (nuvem) → revelada pela frente → inteira
      U.uFront.value = st.front
      const showSolid = st.ghost > 0.01
      rotorMat.opacity = st.ghost
      supportMat.opacity = st.ghost
      casingMat.opacity = st.ghost * st.casing
      rotorMat.transparent = supportMat.transparent = st.ghost < 0.999
      const casingT = st.ghost * st.casing < 0.999
      if (casingMat.transparent !== casingT) {
        casingMat.transparent = casingT
        casingMat.needsUpdate = true
      }
      casingMat.depthWrite = st.casing > 0.99
      casing.castShadow = st.casing > 0.99
      solids.forEach((m) => (m.visible = showSolid))

      // fotos sempre de frente para o espectador
      cards.forEach((c) => {
        if (!c.g.visible) return
        c.g.quaternion.copy(camera.quaternion)
        c.g.rotateZ(c.roll)
        c.frameMat.opacity = c.st.o
        c.photoMat.opacity = c.st.o
      })

      // nuvem, raios e anel
      pMat.uniforms.uT.value = st.t
      pMat.uniforms.uTime.value = t
      pMat.uniforms.uFront.value = st.front > 50 ? -99 : st.front
      scan.position.x = Math.min(st.front, 3.1)
      scanMat.opacity = st.scan * 0.9
      scanFill.opacity = st.scan * 0.07
      const sr = casingR(Math.max(-2.3, Math.min(2, st.front))) + 0.45
      scan.scale.setScalar(sr / 2.02)

      // simulação
      U.uFieldFront.value = st.field
      steamMat.uniforms.uTime.value = t
      steamMat.uniforms.uOpacity.value = st.steam
      steamXrayMat.uniforms.uTime.value = t
      steamXrayMat.uniforms.uOpacity.value = st.steam * 0.22
      glassMat.uniforms.uOpacity.value = st.glass
      upper.position.y = (1 - st.glass) * 1.7

      placeCamera(cam, Math.sin(t * 0.17) * 0.12 * st.built, Math.sin(t * 0.23) * 0.06 * st.built)
      camera.updateMatrixWorld()
      if (st.glass > 0.01) {
        place(lblIn.current, anchorIn, upper.position.y)
        place(lblOut.current, anchorOut, 0)
      }
      if (composer) composer.render()
      else renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(raf)
      offProj()
      timer.dispose()
      tl.kill()
      labelCall?.kill()
      gsap.killTweensOf([st, cam, exposure, ...flashes])
      if (bloom) gsap.killTweensOf(bloom)
      cards.forEach((c) => {
        gsap.killTweensOf([c.st, c.g.scale, c.lineMat, c.flash.material, c.flash.scale])
        c.rt.dispose()
      })
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mm = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mm)) mm.forEach((x) => x.dispose())
        else mm?.dispose()
      })
      solidMats.forEach((m) => m.dispose())
      disposables.forEach((d) => d.dispose())
      envTex.dispose()
      composer?.renderTarget1.dispose()
      composer?.renderTarget2.dispose()
      composer?.dispose()
      bloom?.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [W, H])

  useEffect(() => {
    simRef.current(sim)
  }, [sim])

  return (
    <div className={`turb ${bleed ? 'bleed' : ''}`} style={{ width: size, height: height ?? H + 20 }}>
      <div className="turb-canvas" style={{ width: W, height: H, left: offsetX, top: offsetY }}>
        <div ref={ref} style={{ width: W, height: H }} />
        <div ref={lblIn} className="turb-lbl hot" style={{ opacity: labels ? 1 : 0 }}>
          <b>ADMISSÃO</b>
          <span>{T_IN} °C · 8 MPa</span>
        </div>
        <div ref={lblOut} className="turb-lbl cold" style={{ opacity: labels ? 1 : 0 }}>
          <b>ESCAPE</b>
          <span>{String(T_OUT).replace('.', ',')} °C · condensador</span>
        </div>
      </div>
      <div className={`sim-legend ${bleed ? 'turb-legend' : ''}`} style={{ opacity: phase === 3 ? 1 : 0 }}>
        <div className="mono">TEMPERATURA DO VAPOR</div>
        <div className="bar" />
        <div className="ends mono"><span>{T_IN} °C entrada</span><span>{String(T_OUT).replace('.', ',')} °C escape</span></div>
        <div className="note">O vapor expande e esfria a cada estágio: palhetas fixas orientam, as móveis extraem trabalho.</div>
      </div>
      <div className="turb-chips">
        {PHASES.map((p, i) => (
          <span key={p} className={`mono turb-chip ${i === phase ? (i === 3 ? 'on sim' : 'on') : ''}`}>
            {i + 1} · {p}
          </span>
        ))}
      </div>
    </div>
  )
}

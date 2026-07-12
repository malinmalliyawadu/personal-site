// ─────────────────────────────────────────────────────────────────────────────
// malin.nz — the field
// A GPU particle field: positions/velocities live in float textures and are
// integrated entirely on the GPU (ping-pong FBOs, MRT). The DOM only scrolls.
// No libraries. WebGL2 + arithmetic.
// ─────────────────────────────────────────────────────────────────────────────

type Vec3 = [number, number, number];

interface ChapterParams {
  strength: number; // pull toward target shape (0 = free)
  noise: number; // curl-noise amplitude
  drag: number; // velocity drag (per second)
  tint: Vec3;
  hot: Vec3; // color that fast particles shift toward
  exposure: number;
  yawAmp: number; // sway amplitude (rad)
  yawSpeed: number; // sway frequency (rad/s on the phase integrator)
  pitch: number; // base pitch (rad)
  point: number; // base point size
}

const CHAPTERS: ChapterParams[] = [
  // 00 NOISE — free curl field loosely bound to a shell: a breathing nebula
  { strength: 0.18, noise: 2.1, drag: 1.05, tint: [0.42, 0.86, 0.78], hot: [1.0, 0.72, 0.46], exposure: 0.92, yawAmp: 0.4, yawSpeed: 0.24, pitch: 0.07, point: 4.6 },
  // 01 HELLO — "KIA ORA", warm paper white
  { strength: 1.0, noise: 0.1, drag: 5.2, tint: [0.98, 0.93, 0.83], hot: [1.0, 0.62, 0.34], exposure: 0.4, yawAmp: 0.05, yawSpeed: 0.4, pitch: 0.02, point: 3.8 },
  // 02 STRUCTURE — the career lattice, cool structural blue, visibly 3D
  { strength: 1.0, noise: 0.03, drag: 5.6, tint: [0.5, 0.7, 1.0], hot: [0.6, 1.0, 0.85], exposure: 0.55, yawAmp: 0.85, yawSpeed: 0.22, pitch: 0.33, point: 3.6 },
  // 03 NETWORK — a system topology for the shipped projects, violet
  { strength: 1.0, noise: 0.05, drag: 5.6, tint: [0.74, 0.64, 1.0], hot: [0.55, 1.0, 0.85], exposure: 0.6, yawAmp: 0.16, yawSpeed: 0.26, pitch: 0.12, point: 3.8 },
  // 04 CRUX — starlight, gold-hot
  { strength: 1.0, noise: 0.04, drag: 6.0, tint: [0.93, 0.93, 1.0], hot: [1.0, 0.8, 0.5], exposure: 0.6, yawAmp: 0.08, yawSpeed: 0.3, pitch: 0.04, point: 4.0 },
  // 05 SIGNAL — amber ring
  { strength: 1.0, noise: 0.16, drag: 4.6, tint: [1.0, 0.72, 0.4], hot: [1.0, 0.95, 0.8], exposure: 0.45, yawAmp: 0.04, yawSpeed: 0.4, pitch: 0.02, point: 3.8 },
];

const CHAPTER_NAMES = ["NOISE", "HELLO", "STRUCTURE", "NETWORK", "CRUX", "SIGNAL"];
const EYE_Z = 3.1;
const FOV_TAN = Math.tan((40 * Math.PI) / 360); // half-fov of 20°

// ── tiny math helpers ────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const gauss = () => {
  // Box–Muller
  const u = Math.random() || 1e-9;
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// ── shaders ──────────────────────────────────────────────────────────────────

const FULLSCREEN_VS = `#version 300 es
void main() {
  const vec2 v[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
  gl_Position = vec4(v[gl_VertexID], 0.0, 1.0);
}`;

const SIM_FS = `#version 300 es
precision highp float;
uniform highp sampler2D uPos;
uniform highp sampler2D uVel;
uniform highp sampler2D uTgtA;
uniform highp sampler2D uTgtB;
uniform float uMix, uStrength, uNoise, uDrag, uTime, uDt;
uniform vec3 uPointer;
uniform float uPtrForce, uPtrRadius;
uniform vec3 uPulseOrigin;
uniform float uPulse;
layout(location = 0) out vec4 oPos;
layout(location = 1) out vec4 oVel;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}
vec3 curl(vec3 p) {
  const float e = 0.14;
  const vec3 O1 = vec3(0.0), O2 = vec3(31.4, 5.2, 12.9), O3 = vec3(-17.3, 44.1, 8.6);
  float dzy = vnoise(p + vec3(0,e,0) + O3) - vnoise(p - vec3(0,e,0) + O3);
  float dyz = vnoise(p + vec3(0,0,e) + O2) - vnoise(p - vec3(0,0,e) + O2);
  float dxz = vnoise(p + vec3(0,0,e) + O1) - vnoise(p - vec3(0,0,e) + O1);
  float dzx = vnoise(p + vec3(e,0,0) + O3) - vnoise(p - vec3(e,0,0) + O3);
  float dyx = vnoise(p + vec3(e,0,0) + O2) - vnoise(p - vec3(e,0,0) + O2);
  float dxy = vnoise(p + vec3(0,e,0) + O1) - vnoise(p - vec3(0,e,0) + O1);
  return vec3(dzy - dyz, dxz - dzx, dyx - dxy) / (2.0 * e);
}

void main() {
  ivec2 uv = ivec2(gl_FragCoord.xy);
  vec4 p4 = texelFetch(uPos, uv, 0);
  vec3 p = p4.xyz;
  float seed = p4.w;
  vec3 v = texelFetch(uVel, uv, 0).xyz;
  vec3 tgt = mix(texelFetch(uTgtA, uv, 0).xyz, texelFetch(uTgtB, uv, 0).xyz, uMix);

  // wander: two octaves of curl noise, drifting through time
  vec3 q = p * 0.95 + vec3(0.0, 0.0, uTime * 0.11) + seed * 0.7;
  vec3 wander = curl(q) + 0.45 * curl(q * 2.35 + 7.3);
  v += wander * uNoise * uDt;

  // spring toward target, per-particle stiffness for organic settling
  float k = 17.0 * (0.55 + 0.9 * seed);
  v += (tgt - p) * k * uStrength * uDt;

  // pointer field: positive repels, negative attracts
  vec3 dp = p - uPointer;
  float d2 = dot(dp, dp);
  v += (dp / (sqrt(d2) + 1e-4)) * exp(-d2 * uPtrRadius) * uPtrForce * uDt;

  // tap pulse: radial shockwave
  vec3 dq = p - uPulseOrigin;
  float q2 = dot(dq, dq);
  v += (dq / (sqrt(q2) + 1e-4)) * exp(-q2 * 2.6) * uPulse * uDt;

  v *= exp(-uDrag * uDt);
  p += v * uDt;

  oPos = vec4(p, seed);
  oVel = vec4(v, 0.0);
}`;

const RENDER_VS = `#version 300 es
precision highp float;
uniform highp sampler2D uPos;
uniform highp sampler2D uVel;
uniform highp sampler2D uTgtA;
uniform highp sampler2D uTgtB;
uniform float uMix;
uniform int uSimSize;
uniform mat3 uModel;
uniform mat4 uProj;
uniform float uPoint, uDpr;
out float vSpeed;
out float vSeed;
out float vBr;

void main() {
  ivec2 uv = ivec2(gl_VertexID % uSimSize, gl_VertexID / uSimSize);
  vec4 p4 = texelFetch(uPos, uv, 0);
  vec3 vel = texelFetch(uVel, uv, 0).xyz;
  vSpeed = length(vel);
  vSeed = p4.w;
  vBr = mix(texelFetch(uTgtA, uv, 0).w, texelFetch(uTgtB, uv, 0).w, uMix);

  vec3 wp = uModel * p4.xyz;
  vec4 vp = vec4(wp.x, wp.y, wp.z - ${EYE_Z.toFixed(2)}, 1.0);
  gl_Position = uProj * vp;
  float size = uPoint * (0.8 + 0.35 * vBr) * (1.0 + smoothstep(1.2, 5.0, vSpeed))
             * (${EYE_Z.toFixed(2)} / max(0.4, -vp.z));
  gl_PointSize = clamp(size * uDpr, 1.0, 14.0);
}`;

const RENDER_FS = `#version 300 es
precision highp float;
uniform vec3 uTint, uHot;
uniform float uExposure;
in float vSpeed;
in float vSeed;
in float vBr;
out vec4 fragColor;

void main() {
  vec2 q = gl_PointCoord - 0.5;
  float r2 = dot(q, q) * 4.0;
  if (r2 > 1.0) discard;
  float a = exp(-r2 * 3.2) * (1.0 - r2 * r2 * 0.15);
  vec3 col = uTint * (0.7 + 0.5 * vSeed);
  float heat = smoothstep(1.5, 5.0, vSpeed) * 0.85;
  col = mix(col, uHot, heat);
  fragColor = vec4(col * (a * vBr * uExposure), 1.0);
}`;

// ── GL plumbing ──────────────────────────────────────────────────────────────

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("shader alloc failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(`shader: ${gl.getShaderInfoLog(sh)}`);
  }
  return sh;
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram();
  if (!p) throw new Error("program alloc failed");
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(`link: ${gl.getProgramInfoLog(p)}`);
  }
  return p;
}

function floatTexture(gl: WebGL2RenderingContext, size: number, data: Float32Array | null): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error("texture alloc failed");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, size, size, 0, gl.RGBA, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

// ── target shape generation (CPU, cheap, re-run on resize) ──────────────────

interface Viewport {
  halfW: number;
  halfH: number;
}

const isLandscape = (vp: Viewport) => vp.halfW > vp.halfH * 1.15;

function shuffled(n: number): Uint32Array {
  const a = new Uint32Array(n);
  for (let i = 0; i < n; i++) a[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** Uniform ambient dust across the visible plane, with depth. */
function dust(out: Float32Array, o: number, vp: Viewport): void {
  out[o] = (Math.random() - 0.5) * vp.halfW * 2.3;
  out[o + 1] = (Math.random() - 0.5) * vp.halfH * 2.3;
  out[o + 2] = -0.5 + Math.random() * 0.8;
  out[o + 3] = 0.05 + 0.1 * Math.pow(Math.random(), 4);
}

/**
 * Rasterize lines of text and scatter particle targets over the glyphs.
 * A share of particles becomes ambient dust so the glyphs stay grainy and
 * luminous instead of saturating to a solid fill.
 */
function textTargets(count: number, lines: string[], vp: Viewport, opts: { maxWidth: number; yOffset?: number; xOffset?: number; heightFrac?: number; dustFrac?: number }): Float32Array {
  const px = 220;
  const cvs = document.createElement("canvas");
  const ctx = cvs.getContext("2d", { willReadFrequently: true });
  const out = new Float32Array(count * 4);
  if (!ctx) return out;
  const font = `900 ${px}px "Arial Black", "Arial Bold", Arial, sans-serif`;
  ctx.font = font;
  const lineH = px * 1.04;
  let maxW = 0;
  for (const line of lines) maxW = Math.max(maxW, ctx.measureText(line).width);
  const pad = px * 0.18;
  cvs.width = Math.ceil(maxW + pad * 2);
  cvs.height = Math.ceil(lineH * lines.length + pad * 2);
  ctx.font = font;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cvs.width / 2, pad + lineH * (i + 0.53));
  }
  const img = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = 0; y < cvs.height; y += 2) {
    for (let x = 0; x < cvs.width; x += 2) {
      if (img[(y * cvs.width + x) * 4 + 3] > 120) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  if (xs.length === 0) return out;

  const aspect = cvs.width / cvs.height;
  const worldW = Math.min(opts.maxWidth, vp.halfW * 2 * 0.92, vp.halfH * 2 * (opts.heightFrac ?? 0.6) * aspect);
  const worldH = worldW / aspect;
  const yOff = opts.yOffset ?? 0;
  const xOff = opts.xOffset ?? 0;
  const dustFrac = opts.dustFrac ?? 0.42;
  const jitter = worldW * 0.0035;
  const perm = shuffled(xs.length);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    if (Math.random() < dustFrac) {
      dust(out, o, vp);
    } else {
      const s = perm[i % xs.length];
      out[o] = (xs[s] / cvs.width - 0.5) * worldW + xOff + gauss() * jitter;
      out[o + 1] = (0.5 - ys[s] / cvs.height) * worldH + yOff + gauss() * jitter;
      out[o + 2] = gauss() * 0.04;
      out[o + 3] = 1.0;
    }
  }
  return out;
}

/**
 * n×n×n grid of nodes; many particles share each node so the structure stays
 * legible — a sparse constellation of stations rather than a solid volume.
 */
function latticeTargets(count: number, vp: Viewport): Float32Array {
  const n = 18;
  const half = Math.min(0.95, vp.halfW * 0.44, vp.halfH * 0.44);
  // content sits right on landscape, so the cube drifts left
  const xOff = isLandscape(vp) ? -vp.halfW * 0.3 : 0;
  const out = new Float32Array(count * 4);
  const total = n * n * n;
  const perNode = count / total;
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    const node = i % total;
    const x = node % n;
    const y = ((node / n) | 0) % n;
    const z = (node / (n * n)) | 0;
    const ext = (x === 0 || x === n - 1 ? 1 : 0) + (y === 0 || y === n - 1 ? 1 : 0) + (z === 0 || z === n - 1 ? 1 : 0);
    const jitter = 0.005;
    out[o] = (x / (n - 1) - 0.5) * 2 * half + xOff + gauss() * jitter;
    out[o + 1] = (y / (n - 1) - 0.5) * 2 * half + gauss() * jitter;
    out[o + 2] = (z / (n - 1) - 0.5) * 2 * half + gauss() * jitter;
    // per-particle brightness divides the node's glow budget
    out[o + 3] = (ext === 0 ? 0.5 : ext === 1 ? 0.75 : ext === 2 ? 1.05 : 1.3) / Math.max(1, perNode * 0.18);
  }
  return out;
}

/**
 * A system topology: hub-and-spoke nodes joined by faint edges — the shape of
 * the shipped-systems chapter. Node layout is re-rolled on each build.
 */
function networkTargets(count: number, vp: Viewport): Float32Array {
  const out = new Float32Array(count * 4);
  const landscape = isLandscape(vp);
  const xOff = landscape ? vp.halfW * 0.32 : 0;
  const spanX = landscape ? vp.halfW * 0.52 : vp.halfW * 0.78;
  const spanY = vp.halfH * 0.6;

  // scatter nodes with a minimum separation so the graph stays readable
  const NODE_COUNT = 15;
  const nodes: { x: number; y: number; z: number; hub: boolean }[] = [];
  const minDist = Math.min(spanX, spanY) * 0.42;
  for (let i = 0; i < NODE_COUNT; i++) {
    let x = 0, y = 0, z = 0;
    for (let attempt = 0; attempt < 40; attempt++) {
      x = (Math.random() * 2 - 1) * spanX;
      y = (Math.random() * 2 - 1) * spanY;
      z = (Math.random() * 2 - 1) * 0.22;
      let ok = true;
      for (const nd of nodes) {
        if (Math.hypot(nd.x - x, nd.y - y) < minDist) {
          ok = false;
          break;
        }
      }
      if (ok) break;
    }
    nodes.push({ x, y, z, hub: i < 3 });
  }

  // connect each node to its two nearest neighbours (deduplicated)
  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    const near = nodes
      .map((nd, j) => ({ j, d: Math.hypot(nd.x - nodes[i].x, nd.y - nodes[i].y) }))
      .filter((e) => e.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const e of near) {
      const key = i < e.j ? `${i}-${e.j}` : `${e.j}-${i}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push(i < e.j ? [i, e.j] : [e.j, i]);
      }
    }
  }

  // weighted node pick: hubs draw more particles
  const weights = nodes.map((nd) => (nd.hub ? 2.4 : 1));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const nodeShare = 0.58;
  const perWeight = (count * nodeShare) / weightSum;

  for (let i = 0; i < count; i++) {
    const o = i * 4;
    const r = Math.random();
    if (r < nodeShare) {
      let pick = Math.random() * weightSum;
      let ni = 0;
      while (pick > weights[ni] && ni < nodes.length - 1) {
        pick -= weights[ni];
        ni++;
      }
      const nd = nodes[ni];
      const perNode = perWeight * weights[ni];
      const core = Math.random() < 0.4;
      const sg = nd.hub ? (core ? 0.01 : 0.045) : core ? 0.007 : 0.026;
      out[o] = nd.x + xOff + gauss() * sg;
      out[o + 1] = nd.y + gauss() * sg;
      out[o + 2] = nd.z + gauss() * 0.02;
      out[o + 3] = ((nd.hub ? 1.5 : 1.0) * (core ? 1.6 : 0.7)) / Math.max(1, perNode * 0.02);
    } else if (r < nodeShare + 0.18) {
      const [a, b] = edges[(Math.random() * edges.length) | 0];
      const t = Math.random();
      out[o] = lerp(nodes[a].x, nodes[b].x, t) + xOff + gauss() * 0.008;
      out[o + 1] = lerp(nodes[a].y, nodes[b].y, t) + gauss() * 0.008;
      out[o + 2] = lerp(nodes[a].z, nodes[b].z, t) + gauss() * 0.015;
      out[o + 3] = 0.08;
    } else {
      dust(out, o, vp);
    }
  }
  return out;
}

/**
 * Crux (the Southern Cross), positions derived from real RA/Dec:
 * α Acrux, β Mimosa, γ Gacrux, δ Imai, ε Ginan — plus axis hints & starfield.
 */
function cruxTargets(count: number, vp: Viewport): Float32Array {
  const stars = [
    { x: 0.12, y: -1.0, br: 1.0, sigma: 0.062 }, // α Acrux
    { x: -0.72, y: 0.1, br: 0.92, sigma: 0.056 }, // β Mimosa
    { x: -0.05, y: 0.94, br: 0.8, sigma: 0.05 }, // γ Gacrux
    { x: 0.62, y: 0.42, br: 0.66, sigma: 0.044 }, // δ Imai
    { x: 0.34, y: -0.13, br: 0.5, sigma: 0.032 }, // ε Ginan
  ];
  const scale = Math.min(vp.halfH * 0.78, vp.halfW * 1.05);
  // on landscape screens the copy sits left, so the cross drifts right
  const xOff = isLandscape(vp) ? vp.halfW * 0.22 : 0;
  const cum: number[] = [];
  let sum = 0;
  for (const s of stars) {
    sum += s.br * s.br;
    cum.push(sum);
  }
  const out = new Float32Array(count * 4);
  const axes = [
    [stars[2], stars[0]], // γ → α (long axis)
    [stars[1], stars[3]], // β → δ (cross axis)
  ];
  // brightness budgets scale inversely with how many particles pile up
  const starShare = count * 0.1;
  const coreNorm = Math.max(1, (starShare * 0.3) / 5 / 24);
  const haloNorm = Math.max(1, (starShare * 0.7) / 5 / 60);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    const r = Math.random();
    if (r < 0.1) {
      // star: a tiny intense core inside a soft halo
      const pick = Math.random() * sum;
      let si = 0;
      while (cum[si] < pick) si++;
      const s = stars[si];
      const core = Math.random() < 0.3;
      const sg = scale * (core ? 0.008 : s.sigma * 0.85);
      out[o] = s.x * scale + xOff + gauss() * sg;
      out[o + 1] = s.y * scale + gauss() * sg;
      out[o + 2] = gauss() * 0.03;
      out[o + 3] = s.br * (core ? 2.2 / coreNorm : 1.2 / haloNorm) * 8.0;
    } else if (r < 0.14) {
      // faint hints along the two axes of the cross
      const [a, b] = axes[Math.random() < 0.55 ? 0 : 1];
      const t = Math.random();
      out[o] = lerp(a.x, b.x, t) * scale + xOff + gauss() * 0.01 * scale;
      out[o + 1] = lerp(a.y, b.y, t) * scale + gauss() * 0.01 * scale;
      out[o + 2] = gauss() * 0.03;
      out[o + 3] = 0.09;
    } else {
      // background starfield with depth
      out[o] = (Math.random() - 0.5) * vp.halfW * 2.4;
      out[o + 1] = (Math.random() - 0.5) * vp.halfH * 2.4;
      out[o + 2] = -0.55 + Math.random() * 0.9;
      out[o + 3] = 0.05 + 0.2 * Math.pow(Math.random(), 6);
    }
  }
  return out;
}

/** A luminous ring framing the closing call to action — an open channel. */
function ringTargets(count: number, vp: Viewport): Float32Array {
  const R = Math.min(vp.halfW, vp.halfH) * 0.8;
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    if (Math.random() < 0.4) {
      const th = Math.random() * Math.PI * 2;
      const r = R + gauss() * 0.035;
      out[o] = Math.cos(th) * r;
      out[o + 1] = Math.sin(th) * r;
      out[o + 2] = gauss() * 0.05;
      out[o + 3] = 0.4 + 0.8 * Math.pow(Math.random(), 9);
    } else {
      dust(out, o, vp);
      out[o + 3] = 0.04 + 0.1 * Math.pow(Math.random(), 4);
    }
  }
  return out;
}

/** Loose shell of drift-fodder for the free-noise hero chapter. */
function shellTargets(count: number, vp: Viewport): Float32Array {
  const out = new Float32Array(count * 4);
  const scale = Math.min(1, Math.max(0.6, vp.halfW / 1.1));
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    const r = (0.5 + 0.9 * Math.pow(Math.random(), 0.7)) * scale;
    const th = Math.random() * Math.PI * 2;
    const z = Math.random() * 2 - 1;
    const s = Math.sqrt(1 - z * z);
    out[o] = Math.cos(th) * s * r;
    out[o + 1] = Math.sin(th) * s * r;
    out[o + 2] = z * r * 0.6;
    out[o + 3] = 0.7;
  }
  return out;
}

// ── scroll → chapter progress over variable-height sections ─────────────────

let sectionTops: number[] = [];

function measureSections(): void {
  sectionTops = Array.from(document.querySelectorAll<HTMLElement>(".chapter")).map((el) => {
    let top = 0;
    let node: HTMLElement | null = el;
    while (node) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return top;
  });
}

/**
 * Continuous chapter index: holds on i through a section, then ramps toward
 * i+1 across a morph window just before the next section arrives.
 */
function scrollChapter(): number {
  const n = sectionTops.length;
  if (n === 0) return 0;
  const y = window.scrollY;
  let i = n - 1;
  while (i > 0 && y < sectionTops[i]) i--;
  if (i >= n - 1) return n - 1;
  const next = sectionTops[i + 1];
  const win = Math.min(window.innerHeight * 0.9, (next - sectionTops[i]) * 0.5);
  const p = Math.min(1, Math.max(0, 1 - (next - y) / Math.max(1, win)));
  return i + p;
}

// ── engine ───────────────────────────────────────────────────────────────────

interface SimState {
  size: number;
  count: number;
  fboA: WebGLFramebuffer;
  fboB: WebGLFramebuffer;
  posA: WebGLTexture;
  velA: WebGLTexture;
  posB: WebGLTexture;
  velB: WebGLTexture;
  targets: WebGLTexture[]; // one per chapter
}

export function boot(): void {
  const canvas = document.getElementById("field") as HTMLCanvasElement | null;
  if (!canvas) return;
  const body = document.body;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = reduced
    ? null
    : canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
  const ext = gl?.getExtension("EXT_color_buffer_float");

  measureSections();
  window.addEventListener("resize", measureSections);
  window.addEventListener("load", measureSections);
  // content height shifts as fonts swap in; keep section offsets honest
  if ("ResizeObserver" in window) {
    let roTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(roTimer);
      roTimer = window.setTimeout(measureSections, 120);
    });
    ro.observe(document.body);
  }

  if (!gl || !ext) {
    body.classList.add("static");
    const hudEl = document.getElementById("hud");
    if (hudEl) hudEl.textContent = reduced ? "STATIC MODE · MOTION REDUCED" : "STATIC MODE · WEBGL2 UNAVAILABLE";
    wireDom(scrollChapter);
    return;
  }

  // ── DOM references ──
  const hud = document.getElementById("hud");
  const hint = document.getElementById("hint");
  const cursor = document.getElementById("cursor");

  // ── programs ──
  const simProg = program(gl, FULLSCREEN_VS, SIM_FS);
  const drawProg = program(gl, RENDER_VS, RENDER_FS);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const su = (name: string) => gl.getUniformLocation(simProg, name);
  const du = (name: string) => gl.getUniformLocation(drawProg, name);
  const simU = {
    pos: su("uPos"), vel: su("uVel"), tgtA: su("uTgtA"), tgtB: su("uTgtB"),
    mix: su("uMix"), strength: su("uStrength"), noise: su("uNoise"), drag: su("uDrag"),
    time: su("uTime"), dt: su("uDt"), pointer: su("uPointer"), ptrForce: su("uPtrForce"),
    ptrRadius: su("uPtrRadius"), pulseOrigin: su("uPulseOrigin"), pulse: su("uPulse"),
  };
  const drawU = {
    pos: du("uPos"), vel: du("uVel"), tgtA: du("uTgtA"), tgtB: du("uTgtB"), mix: du("uMix"),
    simSize: du("uSimSize"), model: du("uModel"), proj: du("uProj"), point: du("uPoint"),
    dpr: du("uDpr"), tint: du("uTint"), hot: du("uHot"), exposure: du("uExposure"),
  };

  // ── viewport / camera ──
  let dpr = Math.min(window.devicePixelRatio || 1, 1.8);
  let aspect = 1;
  const vp: Viewport = { halfW: 1, halfH: FOV_TAN * EYE_Z };
  const proj = new Float32Array(16);

  function resizeCanvas(): void {
    dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    const w = canvas!.clientWidth;
    const h = canvas!.clientHeight;
    canvas!.width = Math.max(2, Math.round(w * dpr));
    canvas!.height = Math.max(2, Math.round(h * dpr));
    aspect = canvas!.width / canvas!.height;
    vp.halfH = FOV_TAN * EYE_Z;
    vp.halfW = vp.halfH * aspect;
    const f = 1 / FOV_TAN;
    const zn = 0.1, zf = 20;
    proj.fill(0);
    proj[0] = f / aspect;
    proj[5] = f;
    proj[10] = (zf + zn) / (zn - zf);
    proj[11] = -1;
    proj[14] = (2 * zf * zn) / (zn - zf);
  }
  resizeCanvas();

  // ── sim construction (rebuildable for auto-quality) ──
  let sim: SimState;

  function buildTargets(state: SimState): void {
    // copy sits left on landscape, so glyphs stack right-of-center there;
    // on portrait they sit above the copy instead
    const portrait = aspect < 0.85;
    const kia = textTargets(state.count, ["KIA", "ORA"], vp, {
      maxWidth: portrait ? 2.7 : 2.1,
      yOffset: vp.halfH * (portrait ? 0.18 : 0.06),
      xOffset: portrait ? 0 : vp.halfW * 0.4,
      heightFrac: portrait ? 0.5 : 0.62,
    });
    const sets = [
      shellTargets(state.count, vp),
      kia,
      latticeTargets(state.count, vp),
      networkTargets(state.count, vp),
      cruxTargets(state.count, vp),
      ringTargets(state.count, vp),
    ];
    for (let i = 0; i < sets.length; i++) {
      gl!.bindTexture(gl!.TEXTURE_2D, state.targets[i]);
      gl!.texSubImage2D(gl!.TEXTURE_2D, 0, 0, 0, state.size, state.size, gl!.RGBA, gl!.FLOAT, sets[i]);
    }
  }

  function buildSim(size: number): SimState {
    const count = size * size;
    // ignition: dense clump at the origin, velocities burst outward
    const pos = new Float32Array(count * 4);
    const vel = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const o = i * 4;
      pos[o] = gauss() * 0.03;
      pos[o + 1] = gauss() * 0.03;
      pos[o + 2] = gauss() * 0.03;
      pos[o + 3] = Math.random();
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      const sp = 0.4 + Math.random() * 1.3;
      vel[o] = Math.sin(ph) * Math.cos(th) * sp;
      vel[o + 1] = Math.sin(ph) * Math.sin(th) * sp;
      vel[o + 2] = Math.cos(ph) * sp * 0.6;
    }
    const posA = floatTexture(gl!, size, pos);
    const velA = floatTexture(gl!, size, vel);
    const posB = floatTexture(gl!, size, null);
    const velB = floatTexture(gl!, size, null);
    const mkFbo = (p: WebGLTexture, v: WebGLTexture) => {
      const fbo = gl!.createFramebuffer();
      if (!fbo) throw new Error("fbo alloc failed");
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, p, 0);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT1, gl!.TEXTURE_2D, v, 0);
      gl!.drawBuffers([gl!.COLOR_ATTACHMENT0, gl!.COLOR_ATTACHMENT1]);
      if (gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) !== gl!.FRAMEBUFFER_COMPLETE) throw new Error("fbo incomplete");
      return fbo;
    };
    const state: SimState = {
      size,
      count,
      posA, velA, posB, velB,
      fboA: mkFbo(posA, velA),
      fboB: mkFbo(posB, velB),
      targets: CHAPTERS.map(() => floatTexture(gl!, size, null)),
    };
    buildTargets(state);
    for (const el of document.querySelectorAll("[data-count]")) {
      el.textContent = count.toLocaleString("en-NZ");
    }
    return state;
  }

  function destroySim(state: SimState): void {
    gl!.deleteFramebuffer(state.fboA);
    gl!.deleteFramebuffer(state.fboB);
    for (const t of [state.posA, state.velA, state.posB, state.velB, ...state.targets]) gl!.deleteTexture(t);
  }

  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 720;
  try {
    sim = buildSim(smallScreen ? 256 : 512);
  } catch (err) {
    console.error("field: init failed, falling back to static", err);
    body.classList.add("static");
    wireDom(scrollChapter);
    return;
  }

  // ── scroll → chapter blending ──
  let chapterFloat = 0;
  const readScroll = () => {
    chapterFloat = scrollChapter();
  };
  readScroll();

  // ── pointer state ──
  const ptr = { nx: 0, ny: 0, sx: 0, sy: 0, wx: 0, wy: 0, speed: 0, down: false, downAt: 0, present: false };
  let pulse = 0;
  const pulseOrigin: Vec3 = [0, 0, 0];
  let hintDismissed = false;

  function pointerWorld(): [number, number] {
    return [ptr.sx * vp.halfW, ptr.sy * vp.halfH];
  }

  window.addEventListener("pointermove", (e) => {
    ptr.nx = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.ny = -((e.clientY / window.innerHeight) * 2 - 1);
    ptr.present = true;
    body.classList.add("cursor-on");
    if (cursor) cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  }, { passive: true });
  window.addEventListener("pointerdown", (e) => {
    ptr.down = true;
    ptr.downAt = performance.now();
    ptr.nx = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.ny = -((e.clientY / window.innerHeight) * 2 - 1);
    ptr.present = true;
    body.classList.add("holding");
  }, { passive: true });
  window.addEventListener("pointerup", () => {
    const held = performance.now() - ptr.downAt;
    if (held < 180) {
      const [wx, wy] = pointerWorld();
      const inv = invRotate(wx, wy, 0, yaw, pitch);
      pulseOrigin[0] = inv[0];
      pulseOrigin[1] = inv[1];
      pulseOrigin[2] = inv[2];
      pulse = 2.0;
    } else if (!hintDismissed) {
      hintDismissed = true;
      hint?.classList.remove("show");
    }
    ptr.down = false;
    body.classList.remove("holding");
  }, { passive: true });
  window.addEventListener("pointercancel", () => {
    ptr.down = false;
    body.classList.remove("holding");
  }, { passive: true });

  // ── rotation state ──
  let yaw = 0, pitch = 0, yawPhase = Math.random() * Math.PI * 2;

  function invRotate(x: number, y: number, z: number, ry: number, rx: number): Vec3 {
    // inverse of model = rotY(ry)·rotX(rx)  →  rotX(-rx)·rotY(-ry)
    const cy = Math.cos(-ry), sy = Math.sin(-ry);
    const x1 = cy * x + sy * z;
    const z1 = -sy * x + cy * z;
    const cx = Math.cos(-rx), sx = Math.sin(-rx);
    const y2 = cx * y - sx * z1;
    const z2 = sx * y + cx * z1;
    return [x1, y2, z2];
  }

  // ── resize handling ──
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    resizeCanvas();
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => buildTargets(sim), 250);
  });

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    body.classList.add("static");
    if (hud) hud.textContent = "STATIC MODE · CONTEXT LOST — RELOAD TO RESTART";
  });

  // ── main loop ──
  let last = performance.now();
  let time = 0;
  let ignite = 0;
  let fpsEMA = 60;
  let fpsCheckAt = performance.now() + 5000;
  let downgraded = smallScreen;
  let hudAt = 0;

  wireDom(() => chapterFloat);
  window.addEventListener("scroll", readScroll, { passive: true });
  if (hint && window.matchMedia("(pointer: coarse)").matches) {
    hint.textContent = "drag to stir · hold to attract · tap to pulse";
  }
  window.setTimeout(() => {
    if (!hintDismissed && window.scrollY < window.innerHeight * 0.5) hint?.classList.add("show");
  }, 2200);
  window.setTimeout(() => hint?.classList.remove("show"), 11000);

  const model = new Float32Array(9);

  function frame(now: number): void {
    const dt = Math.min(1 / 30, Math.max(0.0005, (now - last) / 1000));
    last = now;
    time = (time + dt) % 3600;
    ignite = Math.min(1, ignite + dt / 1.4);
    fpsEMA = fpsEMA * 0.95 + (1 / dt) * 0.05;

    // one-shot auto quality: if the field can't hold ~40fps, halve the load
    if (!downgraded && now > fpsCheckAt) {
      if (fpsEMA < 40) {
        destroySim(sim);
        sim = buildSim(256);
      }
      downgraded = true;
    }

    // chapter blend
    const base = Math.min(CHAPTERS.length - 2, Math.floor(chapterFloat));
    const t = smoothstep(0.5, 0.92, chapterFloat - base);
    const A = CHAPTERS[base];
    const B = CHAPTERS[base + 1];
    const transit = Math.sin(Math.PI * t); // extra swirl mid-morph
    const strength = lerp(A.strength, B.strength, t);
    const noise = lerp(A.noise, B.noise, t) + transit * 0.9;
    const drag = lerp(A.drag, B.drag, t);
    const tint = lerp3(A.tint, B.tint, t);
    const hot = lerp3(A.hot, B.hot, t);
    // narrow viewports see a denser slice of the world, so tone it down
    const expScale = Math.min(1, Math.max(0.62, Math.sqrt(vp.halfW / 0.95)));
    const exposure = lerp(A.exposure, B.exposure, t) * expScale * (0.25 + 0.75 * ignite);
    const point = lerp(A.point, B.point, t);
    const yawAmp = lerp(A.yawAmp, B.yawAmp, t);
    const yawSpeed = lerp(A.yawSpeed, B.yawSpeed, t);
    const pitchBase = lerp(A.pitch, B.pitch, t);

    // camera sway + pointer parallax
    ptr.sx = lerp(ptr.sx, ptr.nx, Math.min(1, dt * 6));
    ptr.sy = lerp(ptr.sy, ptr.ny, Math.min(1, dt * 6));
    yawPhase += yawSpeed * dt;
    yaw = yawAmp * Math.sin(yawPhase) + ptr.sx * 0.05;
    pitch = pitchBase - ptr.sy * 0.04;

    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cx = Math.cos(pitch), sx = Math.sin(pitch);
    model[0] = cy; model[1] = 0; model[2] = -sy;
    model[3] = sy * sx; model[4] = cx; model[5] = cy * sx;
    model[6] = sy * cx; model[7] = -sx; model[8] = cy * cx;

    // pointer → model space + interaction force
    const [pwx, pwy] = pointerWorld();
    const prevWx = ptr.wx, prevWy = ptr.wy;
    ptr.wx = pwx;
    ptr.wy = pwy;
    const ptrSpeed = Math.hypot(pwx - prevWx, pwy - prevWy) / dt;
    ptr.speed = lerp(ptr.speed, Math.min(ptrSpeed, 6), Math.min(1, dt * 8));
    const holding = ptr.down && performance.now() - ptr.downAt > 140;
    const pm = invRotate(pwx, pwy, 0, yaw, pitch);
    const force = !ptr.present ? 0 : holding ? -5.2 : 0.25 + ptr.speed * 0.55;
    const radius = holding ? 1.1 : 3.2;
    pulse *= Math.exp(-3.4 * dt);

    // ── sim pass ──
    gl!.disable(gl!.BLEND);
    gl!.useProgram(simProg);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, sim.fboB);
    gl!.viewport(0, 0, sim.size, sim.size);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, sim.posA);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE_2D, sim.velA);
    gl!.activeTexture(gl!.TEXTURE2);
    gl!.bindTexture(gl!.TEXTURE_2D, sim.targets[base]);
    gl!.activeTexture(gl!.TEXTURE3);
    gl!.bindTexture(gl!.TEXTURE_2D, sim.targets[base + 1]);
    gl!.uniform1i(simU.pos, 0);
    gl!.uniform1i(simU.vel, 1);
    gl!.uniform1i(simU.tgtA, 2);
    gl!.uniform1i(simU.tgtB, 3);
    gl!.uniform1f(simU.mix, t);
    gl!.uniform1f(simU.strength, strength);
    gl!.uniform1f(simU.noise, noise);
    gl!.uniform1f(simU.drag, drag);
    gl!.uniform1f(simU.time, time);
    gl!.uniform1f(simU.dt, dt);
    gl!.uniform3f(simU.pointer, pm[0], pm[1], pm[2]);
    gl!.uniform1f(simU.ptrForce, force);
    gl!.uniform1f(simU.ptrRadius, radius);
    gl!.uniform3f(simU.pulseOrigin, pulseOrigin[0], pulseOrigin[1], pulseOrigin[2]);
    gl!.uniform1f(simU.pulse, pulse);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    // swap ping-pong
    let tmp: WebGLTexture | WebGLFramebuffer = sim.posA;
    sim.posA = sim.posB; sim.posB = tmp as WebGLTexture;
    tmp = sim.velA;
    sim.velA = sim.velB; sim.velB = tmp as WebGLTexture;
    tmp = sim.fboA;
    sim.fboA = sim.fboB; sim.fboB = tmp as WebGLFramebuffer;

    // ── render pass ──
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, canvas!.width, canvas!.height);
    gl!.clearColor(0.0196, 0.0314, 0.0627, 1); // --void #050810
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE);
    gl!.useProgram(drawProg);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, sim.posA);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE_2D, sim.velA);
    gl!.activeTexture(gl!.TEXTURE2);
    gl!.bindTexture(gl!.TEXTURE_2D, sim.targets[base]);
    gl!.activeTexture(gl!.TEXTURE3);
    gl!.bindTexture(gl!.TEXTURE_2D, sim.targets[base + 1]);
    gl!.uniform1i(drawU.pos, 0);
    gl!.uniform1i(drawU.vel, 1);
    gl!.uniform1i(drawU.tgtA, 2);
    gl!.uniform1i(drawU.tgtB, 3);
    gl!.uniform1f(drawU.mix, t);
    gl!.uniform1i(drawU.simSize, sim.size);
    gl!.uniformMatrix3fv(drawU.model, false, model);
    gl!.uniformMatrix4fv(drawU.proj, false, proj);
    gl!.uniform1f(drawU.point, point);
    gl!.uniform1f(drawU.dpr, dpr);
    gl!.uniform3f(drawU.tint, tint[0], tint[1], tint[2]);
    gl!.uniform3f(drawU.hot, hot[0], hot[1], hot[2]);
    gl!.uniform1f(drawU.exposure, exposure);
    gl!.drawArrays(gl!.POINTS, 0, sim.count);

    // ── HUD ──
    if (hud && now > hudAt) {
      hudAt = now + 500;
      const ch = Math.round(chapterFloat);
      const mode = holding ? " · ATTRACT" : pulse > 0.2 ? " · PULSE" : "";
      hud.textContent = `${sim.count.toLocaleString("en-NZ")} PTS · ${Math.round(fpsEMA)} FPS · CH 0${ch} ${CHAPTER_NAMES[ch]}${mode}`;
    }

    requestAnimationFrame(frame);
  }

  body.classList.add("live-field");
  requestAnimationFrame((n) => {
    last = n;
    frame(n);
  });
}

// ── DOM wiring shared by live + static modes ─────────────────────────────────

function wireDom(getChapter: () => number): void {
  // copy blocks and cards reveal as they cross the viewport
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.target.classList.toggle("live", e.isIntersecting);
    },
    { threshold: 0.25 }
  );
  for (const el of document.querySelectorAll(".copy, .card, .entry")) io.observe(el);

  // progress rail
  const railItems = Array.from(document.querySelectorAll<HTMLElement>(".rail a"));
  const thumb = document.querySelector<HTMLElement>(".rail-thumb");
  let railRaf = 0;
  const updateRail = () => {
    railRaf = 0;
    const f = getChapter();
    const active = Math.round(f);
    railItems.forEach((el, i) => el.classList.toggle("on", i === active));
    if (thumb) thumb.style.setProperty("--p", String(f / (CHAPTERS.length - 1)));
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!railRaf) railRaf = requestAnimationFrame(updateRail);
    },
    { passive: true }
  );
  updateRail();
}

boot();

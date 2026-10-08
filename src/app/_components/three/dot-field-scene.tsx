"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  MathUtils,
  Plane,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3,
  type Points,
} from "three";

/* ------------------------------------------------------------------ */
/* Palette (raw sRGB, passed straight through — no tone mapping).      */
/* ------------------------------------------------------------------ */

function hex(h: string): Vector3 {
  const n = parseInt(h.replace("#", ""), 16);
  return new Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  );
}

const PARCHMENT = "#E9DDC7";
const GOLD = "#B08D57";
const OXBLOOD = "#7A2E2A";
const BLUSH = "#E9CFC0";

/* ------------------------------------------------------------------ */
/* Grid                                                                */
/* ------------------------------------------------------------------ */

const COLS = 132;
const ROWS = 72;
const WIDTH = 16; // world units across (x)
const DEPTH = 11.5; // world units into the distance (z)
const ACCENT_RATIO = 0.04;

/** Deterministic PRNG so the layout is identical between mounts. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGeometry(): BufferGeometry {
  const count = COLS * ROWS;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const tones = new Float32Array(count);
  const accents = new Float32Array(count); // 0 = base, 1 = oxblood, 2 = blush
  const rand = mulberry32(0x5eed);

  let i = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Tiny jitter keeps the grid from moiré-ing at a tilt.
      const jx = (rand() - 0.5) * 0.18;
      const jz = (rand() - 0.5) * 0.18;
      const x = (c / (COLS - 1) - 0.5) * WIDTH + jx * (WIDTH / COLS);
      const z = -(r / (ROWS - 1)) * DEPTH + 3.3 + jz * (DEPTH / ROWS);
      positions[i * 3] = x;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = z;
      seeds[i] = rand();
      tones[i] = rand();
      const a = rand();
      accents[i] = a < ACCENT_RATIO * 0.45 ? 1 : a < ACCENT_RATIO ? 2 : 0;
      i++;
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  geo.setAttribute("aTone", new BufferAttribute(tones, 1));
  geo.setAttribute("aAccent", new BufferAttribute(accents, 1));
  geo.computeBoundingSphere();
  return geo;
}

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform vec3 uPointer;
  uniform float uPointerStrength;
  uniform vec3 uParchment;
  uniform vec3 uGold;
  uniform vec3 uOxblood;
  uniform vec3 uBlush;

  attribute float aSeed;
  attribute float aTone;
  attribute float aAccent;

  varying vec3 vColor;
  varying float vAlpha;

  // Ashima / Stefan Gustavson 3D simplex noise (MIT).
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
      i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
      i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    vec3 p = position;
    float t = uTime;

    // One breath every ~6s: slow inhale/exhale envelope.
    float breath = 0.5 + 0.5 * sin(t * 1.0472);

    // Layered low-frequency undulation — broad swells plus a finer "pore" layer.
    float broad = snoise(vec3(p.x * 0.16, p.z * 0.2, t * 0.045));
    float fine  = snoise(vec3(p.x * 0.42 + 7.3, p.z * 0.5 - 2.1, t * 0.07));
    float swell = sin(p.x * 0.32 + t * 0.5) * 0.5 + sin(p.z * 0.45 - t * 0.38) * 0.5;
    float h = broad * 0.34 + fine * 0.09 + swell * 0.07;
    h *= 0.78 + 0.22 * breath;
    p.y += h + (breath - 0.5) * 0.06;

    // Cursor: a soft lift with a gentle ring rolling outward.
    float d = distance(p.xz, uPointer.xz);
    float lift = exp(-(d * d) / 1.1) * uPointerStrength;
    float ring = sin(d * 3.6 - t * 2.0) * exp(-d * 0.85) * uPointerStrength;
    p.y += lift * 0.32 + ring * 0.035;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = -mv.z;
    float size = uSize * (0.72 + 0.56 * aSeed) * (1.0 + lift * 0.55);
    gl_PointSize = size * uPixelRatio * (8.0 / depth);

    // Colour: parchment ↔ gold, crests lighter, troughs deeper.
    float tone = clamp(aTone * 0.7 + (0.5 - h) * 0.55, 0.0, 1.0);
    vec3 base = mix(uParchment, uGold, tone);
    if (aAccent > 1.5) {
      base = uBlush;
    } else if (aAccent > 0.5) {
      base = uOxblood * 1.35;
    }
    // Warm toward blush-gold near the cursor.
    vec3 warm = mix(uGold, uBlush, 0.55) * 1.08;
    vColor = mix(base, warm, lift * 0.7);

    // Depth fade toward the horizon and a soft fade in the very front.
    float far = smoothstep(12.8, 4.8, depth);
    float near = smoothstep(1.2, 2.6, depth);
    float shade = 0.55 + 0.45 * smoothstep(-0.35, 0.35, h);
    float twinkle = 0.88 + 0.12 * sin(t * (0.4 + aSeed * 0.5) + aSeed * 40.0);
    vAlpha = far * near * shade * twinkle * (0.74 + lift * 0.26);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float a = smoothstep(0.5, 0.18, r);
    if (a * vAlpha < 0.01) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

/* ------------------------------------------------------------------ */
/* Points                                                              */
/* ------------------------------------------------------------------ */

function DotSkin() {
  const pointsRef = useRef<Points>(null);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => buildGeometry(), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uSize: { value: 3.1 },
          uPointer: { value: new Vector3(0, 0, -2) },
          uPointerStrength: { value: 0 },
          uParchment: { value: hex(PARCHMENT) },
          uGold: { value: hex(GOLD) },
          uOxblood: { value: hex(OXBLOOD) },
          uBlush: { value: hex(BLUSH) },
        },
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // Track the pointer on window so the field reacts even when content sits
  // above the canvas (the wrapper is pointer-events: none).
  const pointer = useRef({ ndc: new Vector2(0, 0), inside: false });
  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const state = pointer.current;
      state.inside =
        x >= 0 && x <= 1 && y >= 0 && y <= 1 && e.pointerType !== "touch";
      state.ndc.set(x * 2 - 1, -(y * 2 - 1));
    };
    const onLeave = () => {
      pointer.current.inside = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [gl]);

  const helpersRef = useRef({
    raycaster: new Raycaster(),
    plane: new Plane(new Vector3(0, 1, 0), 0),
    hit: new Vector3(),
    smoothed: new Vector3(0, 0, -2),
    time: 0,
  });

  useFrame((_, rawDelta) => {
    const points = pointsRef.current;
    if (!points) return;
    const helpers = helpersRef.current;
    const mat = points.material as ShaderMaterial;
    const u = mat.uniforms as Record<string, { value: unknown }>;
    // Clamp so resuming after a pause never jumps.
    const delta = Math.min(rawDelta, 1 / 30);
    helpers.time += delta;
    u.uTime!.value = helpers.time;
    u.uPixelRatio!.value = dpr;

    const p = pointer.current;
    let target = 0;
    if (p.inside) {
      helpers.raycaster.setFromCamera(p.ndc, camera);
      if (helpers.raycaster.ray.intersectPlane(helpers.plane, helpers.hit)) {
        target = 1;
        helpers.smoothed.x = MathUtils.damp(
          helpers.smoothed.x,
          helpers.hit.x,
          4,
          delta,
        );
        helpers.smoothed.z = MathUtils.damp(
          helpers.smoothed.z,
          helpers.hit.z,
          4,
          delta,
        );
      }
    }
    (u.uPointer!.value as Vector3).copy(helpers.smoothed);
    u.uPointerStrength!.value = MathUtils.damp(
      u.uPointerStrength!.value as number,
      target,
      2.2,
      delta,
    );
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

export type DotFieldSceneProps = {
  /** When false the render loop is stopped entirely (off-screen). */
  active: boolean;
  /** Called once the WebGL context exists and the first frame is queued. */
  onReady?: () => void;
  /** Called if the context is lost so the wrapper can fall back. */
  onContextLost?: () => void;
};

export default function DotFieldScene({
  active,
  onReady,
  onContextLost,
}: DotFieldSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 2.05, 4.6], fov: 38, near: 0.1, far: 30 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      onCreated={({ gl, camera, scene }) => {
        gl.setClearColor(0x000000, 0);
        camera.lookAt(0, -0.85, -2.2);
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onContextLost?.();
          },
          { once: true },
        );
        gl.render(scene, camera);
        onReady?.();
      }}
    >
      <DotSkin />
    </Canvas>
  );
}

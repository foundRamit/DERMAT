/**
 * Draws the hero "plate": an antique anatomical cross-section of skin,
 * stippled entirely in dots — no photographs, no AI models.
 *
 *   node scripts/make-hero.mjs
 *
 * Layers, top to bottom: stratum corneum, cellular epidermis with rete ridges,
 * dermis (collagen, vessels, follicles, sebaceous and sweat glands), and fat lobules.
 * The plate sits on the right and dissolves into the page on the left.
 */
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")),
  "..",
);

const W = 2880;
const H = 1620;
const U = W / 1440; // design unit: sizes below are tuned at 1440px wide

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const C = {
  parchment: hex("#F6F0E4"),
  linen: hex("#F1E8D8"),
  cream: hex("#E9DFCC"),
  sand: hex("#E2D3B8"),
  line: hex("#CDBFA7"),
  blush: hex("#E9CFC0"),
  rose: hex("#C98F7E"),
  gold: hex("#B08D57"),
  ochre: hex("#9C7B4E"),
  terracotta: hex("#A8492B"),
  oxblood: hex("#7A2E2A"),
  sage: hex("#5E7A6C"),
  umber: hex("#6E5A46"),
  ink: hex("#1E1A16"),
};

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1987);
const pick = (...xs) => xs[Math.floor(rand() * xs.length)];

// ------------------------------------------------------------------ canvas

const px = new Float32Array(W * H * 3);
for (let i = 0; i < W * H; i++) px.set(C.parchment, i * 3);

/** Plate visibility: fully drawn on the right, dissolving to nothing on the left. */
const PLATE_X = 0.5 * W;
const FADE = 0.15 * W;
function presence(x) {
  if (x < PLATE_X) return 0;
  return Math.min(1, (x - PLATE_X) / FADE);
}

let dots = 0;
function dot(x, y, r, rgb, alpha = 0.95) {
  // pointillist dissolve: fewer and smaller dots toward the left edge of the plate
  const p = presence(x);
  if (p <= 0 || rand() > p * 1.15) return;
  r *= 0.6 + 0.4 * p;
  const x0 = Math.max(0, Math.floor(x - r - 1));
  const x1 = Math.min(W - 1, Math.ceil(x + r + 1));
  const y0 = Math.max(0, Math.floor(y - r - 1));
  const y1 = Math.min(H - 1, Math.ceil(y + r + 1));
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
      const cov = Math.min(1, Math.max(0, r - d + 0.5)) * alpha;
      if (cov <= 0) continue;
      const i = (yy * W + xx) * 3;
      for (let k = 0; k < 3; k++) px[i + k] = rgb[k] * cov + px[i + k] * (1 - cov);
    }
  }
  dots++;
}

/** Stipple a line: dots spaced along a polyline-producing function f(t) -> [x, y]. */
function stippleLine(f, steps, r, colors, jitter = 0.6, alpha = 0.95) {
  for (let i = 0; i <= steps; i++) {
    const [x, y] = f(i / steps);
    dot(
      x + (rand() - 0.5) * jitter * U,
      y + (rand() - 0.5) * jitter * U,
      r * (0.8 + rand() * 0.4),
      pick(...colors),
      alpha,
    );
  }
}

// ------------------------------------------------------------------ geometry

const smooth = (x, a) =>
  Math.sin(x * 0.0021 + a) * 18 +
  Math.sin(x * 0.0057 + a * 2.1) * 8 +
  Math.sin(x * 0.013 + a * 0.7) * 3;

/** The skin surface, gently undulating. */
const surface = (x) => 0.3 * H + smooth(x, 0.4) * U;
/** Base of the epidermis: rete ridges dipping into the dermis. */
const reteBase = (x) => {
  const ridge = Math.pow(Math.abs(Math.sin(x / (34 * U))), 3) * 34 * U;
  return surface(x) + 64 * U + ridge + smooth(x, 2.2) * 0.4 * U;
};
const dermisBase = (x) => surface(x) + 0.42 * H + smooth(x, 5.1) * 1.6 * U;

// ------------------------------------------------------------------ layers

// Air above the skin: a light drift of dust.
for (let i = 0; i < 900; i++) {
  const x = PLATE_X + rand() * (W - PLATE_X);
  const y = surface(x) - rand() * 0.22 * H;
  if (rand() < 0.65) continue;
  dot(x, y, (0.7 + rand() * 0.8) * U, pick(C.line, C.sand, C.cream), 0.7);
}

// Stratum corneum: flattened, dense ochre dots in shingled rows.
for (let row = 0; row < 4; row++) {
  for (let x = PLATE_X; x < W; x += 3.2 * U) {
    const y = surface(x) + row * 3.4 * U + (rand() - 0.5) * 1.6 * U;
    dot(x + (rand() - 0.5) * 2 * U, y, (1.25 + rand() * 0.5) * U,
      row === 0 ? pick(C.ochre, C.umber, C.gold) : pick(C.gold, C.sand, C.ochre));
  }
}

// Epidermis: hex-packed cells (a ring of dots with a darker nucleus), rounder toward the base.
{
  const cell = 15 * U;
  for (let gy = 0.3 * H - 40 * U; gy < 0.3 * H + 140 * U; gy += cell * 0.87) {
    const odd = Math.round(gy / (cell * 0.87)) % 2;
    for (let gx = PLATE_X + (odd ? cell / 2 : 0); gx < W; gx += cell) {
      const x = gx + (rand() - 0.5) * 3 * U;
      const y = gy + (rand() - 0.5) * 3 * U;
      if (y < surface(x) + 16 * U || y > reteBase(x) - 4 * U) continue;
      const depth = (y - surface(x)) / (reteBase(x) - surface(x));
      const r = cell * (0.36 + depth * 0.06);
      // cell membrane
      const n = 9;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + rand() * 0.3;
        dot(x + Math.cos(a) * r, y + Math.sin(a) * r * (0.8 + depth * 0.2),
          (0.95 + rand() * 0.35) * U, pick(C.rose, C.blush, C.rose, C.sand), 0.9);
      }
      // nucleus
      dot(x, y, (1.9 + depth * 1.1) * U, depth > 0.75 ? C.umber : pick(C.oxblood, C.terracotta), 0.95);
    }
  }
  // the basal line: a crisp row of dark dots tracing the rete ridges
  stippleLine((t) => {
    const x = PLATE_X + t * (W - PLATE_X);
    return [x, reteBase(x)];
  }, 900, 1.5 * U, [C.umber, C.oxblood, C.ink], 0.8);
}

// Dermis: collagen as long wavy fibres of dots.
for (let f = 0; f < 70; f++) {
  const yRel = 0.08 + rand() * 0.86;
  const phase = rand() * 10;
  const amp = (4 + rand() * 10) * U;
  const x0 = PLATE_X + rand() * (W - PLATE_X) * 0.7;
  const len = (240 + rand() * 520) * U;
  const color = [pick(C.rose, C.blush, C.sand), pick(C.cream, C.sand, C.blush)];
  stippleLine((t) => {
    const x = x0 + t * len;
    const top = reteBase(x) + 10 * U;
    const y = top + yRel * (dermisBase(x) - top) + Math.sin(x / (28 * U) + phase) * amp;
    return [x, y];
  }, Math.round(len / (3.4 * U)), 1.15 * U, color, 1.2, 0.85);
}
// sparse ground stipple so the dermis reads as a tissue, not empty paper
for (let i = 0; i < 26000; i++) {
  const x = PLATE_X + rand() * (W - PLATE_X);
  const top = reteBase(x) + 6 * U;
  const y = top + rand() * (dermisBase(x) - top);
  if (rand() < 0.35) continue;
  dot(x, y, (0.8 + rand() * 0.8) * U, pick(C.cream, C.sand, C.blush, C.line), 0.85);
}

// Blood vessels: two sinuous plexuses with vessels rising into the papillae.
for (const [yRel, w, colorA, colorB] of [
  [0.12, 3.2, C.oxblood, C.terracotta],
  [0.82, 4.6, C.oxblood, C.ink],
]) {
  const phase = rand() * 6;
  const along = (x) => {
    const top = reteBase(x) + 10 * U;
    return top + yRel * (dermisBase(x) - top) + Math.sin(x / (90 * U) + phase) * 10 * U;
  };
  for (const side of [-1, 1]) {
    stippleLine((t) => {
      const x = PLATE_X + t * (W - PLATE_X);
      return [x, along(x) + side * w * U];
    }, 1100, 1.35 * U, [colorA, colorB], 0.5);
  }
  // red cells inside
  for (let i = 0; i < 260; i++) {
    const x = PLATE_X + rand() * (W - PLATE_X);
    dot(x, along(x) + (rand() - 0.5) * w * 1.2 * U, (0.9 + rand() * 0.6) * U, pick(C.terracotta, C.rose), 0.9);
  }
}
// capillary loops into the dermal papillae
for (let x = PLATE_X + 30 * U; x < W; x += (68 + rand() * 30) * U) {
  const top = reteBase(x) - 8 * U;
  const bottom = reteBase(x) + 70 * U;
  stippleLine((t) => {
    const a = t * Math.PI;
    return [x + Math.cos(a) * 6 * U, bottom - Math.sin(a) * (bottom - top)];
  }, 30, 1.05 * U, [C.oxblood, C.terracotta], 0.5);
}

// Hair follicles with sebaceous glands.
const follicles = [0.6, 0.71, 0.83, 0.95].map((fx) => fx * W + (rand() - 0.5) * 40 * U);
for (const [n, fx] of follicles.entries()) {
  const tilt = 0.32 + rand() * 0.12;
  const depth = (0.25 + rand() * 0.07) * H;
  const sx = fx;
  const sy = surface(fx);
  const along = (t) => [sx - Math.sin(tilt) * depth * t, sy + Math.cos(tilt) * depth * t];
  // outer root sheath: two lines of umber dots
  for (const side of [-1, 1]) {
    stippleLine((t) => {
      const [x, y] = along(t);
      const wdt = (10 + 6 * Math.sin(t * Math.PI)) * U;
      return [x + Math.cos(tilt) * wdt * side, y + Math.sin(tilt) * wdt * side];
    }, 120, 1.4 * U, [C.umber, C.ochre, C.gold], 0.6);
  }
  // the hair shaft, continuing above the skin with a gentle curl
  stippleLine((t) => {
    const [x, y] = along(1 - t * 1.0);
    return [x, y];
  }, 150, 1.8 * U, [C.ink, C.umber], 0.3);
  stippleLine((t) => {
    const len = (150 + n * 30) * U;
    return [
      sx + Math.sin(tilt) * len * t + Math.sin(t * 2.4) * 30 * U,
      sy - Math.cos(tilt) * len * t * 0.9 + t * t * 40 * U,
    ];
  }, 160, (1.9 - 0.8) * U, [C.ink, C.umber], 0.3);
  // the bulb: a dense oxblood cluster cupping the papilla
  const [bx, by] = along(1);
  for (let i = 0; i < 260; i++) {
    const a = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * 22 * U;
    const ix = bx + Math.cos(a) * rr;
    const iy = by + Math.sin(a) * rr * 0.85;
    const inner = rr < 9 * U;
    dot(ix, iy, (1.1 + rand() * 0.7) * U, inner ? C.blush : pick(C.oxblood, C.terracotta, C.umber), 0.95);
  }
  // sebaceous gland: a lobed cluster of gold dots beside the upper third
  const [gx0, gy0] = along(0.32);
  for (let lobe = 0; lobe < 3; lobe++) {
    const cx = gx0 + (24 + lobe * 9) * U;
    const cy = gy0 + (lobe - 1) * 16 * U;
    for (let i = 0; i < 90; i++) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * 13 * U;
      dot(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, (1.1 + rand() * 0.8) * U, pick(C.gold, C.ochre, C.sand), 0.95);
    }
  }
}

// Sweat glands: a coil deep in the dermis and a duct spiralling up to a pore.
for (const fx of [0.66, 0.89]) {
  const cx = fx * W;
  const cy = dermisBase(cx) - 0.06 * H;
  stippleLine((t) => {
    const a = t * Math.PI * 14;
    const r = (10 + 14 * Math.abs(Math.sin(t * Math.PI * 3))) * U;
    return [cx + Math.cos(a) * r + t * 18 * U, cy + Math.sin(a) * r * 0.7];
  }, 520, 1.3 * U, [C.sage, C.sage, C.umber], 0.5);
  const sy = surface(cx);
  stippleLine((t) => {
    const y = cy - t * (cy - sy);
    const curl = t > 0.78 ? Math.sin((t - 0.78) * 50) * 6 * U : Math.sin(t * 9) * 4 * U;
    return [cx + curl, y];
  }, 320, 1.15 * U, [C.sage, C.umber], 0.4);
  // the pore
  dot(cx, sy - 1 * U, 3.2 * U, C.ink, 0.9);
}

// Hypodermis: fat lobules — rings of gold dots, pale stipple inside.
{
  const lobules = [];
  for (let tries = 0; tries < 900 && lobules.length < 60; tries++) {
    const r = (34 + rand() * 46) * U;
    const x = PLATE_X + rand() * (W - PLATE_X);
    const y = dermisBase(x) + r * 0.9 + rand() * (H - dermisBase(x));
    if (lobules.some((l) => Math.hypot(l.x - x, l.y - y) < l.r + r + 6 * U)) continue;
    lobules.push({ x, y, r });
  }
  for (const { x, y, r } of lobules) {
    const n = Math.round((r * Math.PI * 2) / (3.6 * U));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const wob = 1 + Math.sin(a * 3 + x) * 0.05;
      dot(x + Math.cos(a) * r * wob, y + Math.sin(a) * r * wob, (1.3 + rand() * 0.4) * U, pick(C.gold, C.ochre, C.gold, C.umber), 0.95);
    }
    for (let i = 0; i < r * r * 0.012 / U; i++) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * r * 0.86;
      dot(x + Math.cos(a) * rr, y + Math.sin(a) * rr, (0.8 + rand() * 0.7) * U, pick(C.cream, C.linen, C.sand, C.blush), 0.8);
    }
  }
  // septa between lobules: faint umber stipple
  for (let i = 0; i < 9000; i++) {
    const x = PLATE_X + rand() * (W - PLATE_X);
    const y = dermisBase(x) + rand() * (H - dermisBase(x));
    if (lobules.some((l) => Math.hypot(l.x - x, l.y - y) < l.r + 2 * U)) continue;
    if (rand() < 0.55) continue;
    dot(x, y, (0.7 + rand() * 0.6) * U, pick(C.line, C.rose, C.sand), 0.8);
  }
}

// The cut edge of the plate: a fine engraved border line at the top of the section.
stippleLine((t) => {
  const x = PLATE_X + t * (W - PLATE_X);
  return [x, surface(x) - 1.5 * U];
}, 1400, 0.95 * U, [C.ink, C.umber], 0.4);

// ------------------------------------------------------------------ write

const out = Buffer.alloc(W * H * 3);
for (let i = 0; i < px.length; i++) out[i] = Math.round(px[i]);
const file = path.join(root, "public", "images", "hero-skin.jpg");
await sharp(out, { raw: { width: W, height: H, channels: 3 } })
  .jpeg({ quality: 84, mozjpeg: true, progressive: true })
  .toFile(file);
console.log(`drew ${path.relative(root, file)} — ${W}×${H}, ${dots.toLocaleString()} dots`);

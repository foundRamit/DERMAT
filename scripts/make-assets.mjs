/**
 * Generates the "Pointillist Ledger" assets in code — no AI image models.
 *
 *   node scripts/make-assets.mjs
 *
 * 1. Re-paints the source photos as Seurat-style dot paintings, using only the
 *    brand palette and optical mixing (neighbouring dots of two palette colours).
 * 2. Builds six stippled "coin" medallions from Phosphor icons, each inside a
 *    beaded gilt frame made of dots.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")),
  "..",
);
const pub = (...p) => path.join(root, "public", ...p);

// ---------------------------------------------------------------- palette

const PALETTE = {
  parchment: "#F6F0E4",
  linen: "#F1E8D8",
  cream: "#E9DFCC",
  bone: "#DCCFBA",
  vellum: "#EEE5D3",
  sand: "#E2D3B8",
  line: "#CDBFA7",
  mist: "#C9BFB0",
  blush: "#E9CFC0",
  rose: "#C98F7E",
  gold: "#B08D57",
  ochre: "#9C7B4E",
  terracotta: "#A8492B",
  oxblood: "#7A2E2A",
  sage: "#5E7A6C",
  slate: "#7D8A8C",
  umber: "#6E5A46",
  body: "#4D463E",
  ink: "#1E1A16",
};

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) =>
  (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
function toLab([r, g, b]) {
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const colors = Object.entries(PALETTE).map(([name, hex]) => {
  const rgb = hexToRgb(hex);
  return { name, rgb, lab: toLab(rgb) };
});
const PARCH = colors.find((c) => c.name === "parchment");

/** Two nearest palette colours and the mix weight for optical blending. */
function nearestTwo(lab) {
  let a = null,
    b = null,
    da = Infinity,
    db = Infinity;
  for (const c of colors) {
    const d = dist(lab, c.lab);
    if (d < da) [b, db, a, da] = [a, da, c, d];
    else if (d < db) [b, db] = [c, d];
  }
  return { a, b, wb: da / (da + db + 1e-6) };
}

// ---------------------------------------------------------------- utilities

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** RGBA canvas with anti-aliased dot drawing. */
function makeCanvas(w, h, bg) {
  const px = new Float32Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    px[i * 4] = bg ? bg[0] : 0;
    px[i * 4 + 1] = bg ? bg[1] : 0;
    px[i * 4 + 2] = bg ? bg[2] : 0;
    px[i * 4 + 3] = bg ? 1 : 0;
  }
  function dot(cx, cy, r, rgb, alpha = 1) {
    const x0 = Math.max(0, Math.floor(cx - r - 1)),
      x1 = Math.min(w - 1, Math.ceil(cx + r + 1));
    const y0 = Math.max(0, Math.floor(cy - r - 1)),
      y1 = Math.min(h - 1, Math.ceil(cy + r + 1));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        // soft edge, slightly irregular like a brush dab
        const cov = Math.min(1, Math.max(0, r - d + 0.5)) * alpha;
        if (cov <= 0) continue;
        const i = (y * w + x) * 4;
        const ia = px[i + 3];
        const oa = cov + ia * (1 - cov);
        for (let k = 0; k < 3; k++) {
          px[i + k] = (rgb[k] * cov + px[i + k] * ia * (1 - cov)) / (oa || 1);
        }
        px[i + 3] = oa;
      }
    }
  }
  function toBuffer() {
    const out = Buffer.alloc(w * h * 4);
    for (let i = 0; i < px.length; i++)
      out[i] = Math.round(
        Math.min(255, Math.max(0, i % 4 === 3 ? px[i] * 255 : px[i])),
      );
    return out;
  }
  return { dot, toBuffer };
}

async function sampler(file, w, h, blur) {
  let img = sharp(file).resize(w, h, { fit: "cover" }).removeAlpha();
  if (blur) img = img.blur(blur);
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  return (x, y) => {
    const xi = Math.min(w - 1, Math.max(0, Math.round(x)));
    const yi = Math.min(h - 1, Math.max(0, Math.round(y)));
    const i = (yi * w + xi) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
}

// ---------------------------------------------------------------- paintings

async function pointillize({ src, out, width, aspect, seed, focusX = 0.5 }) {
  const w = width;
  const h = Math.round(width / aspect);
  const rand = mulberry32(seed);
  const sample = await sampler(src, w, h, 2.2);
  const detail = await sampler(src, w, h, 0.6);
  const canvas = makeCanvas(w, h, PARCH.rgb);
  const unit = w / 1440; // dot sizes are tuned at 1440px wide

  // Three passes, coarse to fine — like laying in tone, then form, then accents.
  const passes = [
    { cell: 12 * unit, r: 5.2 * unit, jitter: 0.8, alpha: 0.85, pick: sample },
    { cell: 7.5 * unit, r: 3.2 * unit, jitter: 0.7, alpha: 0.9, pick: sample },
    {
      cell: 4.8 * unit,
      r: 2.0 * unit,
      jitter: 0.6,
      alpha: 0.95,
      pick: detail,
      edgesOnly: true,
    },
    {
      cell: 3.4 * unit,
      r: 1.45 * unit,
      jitter: 0.5,
      alpha: 1,
      pick: detail,
      edgesOnly: true,
      strongEdges: true,
    },
  ];

  let count = 0;
  for (const pass of passes) {
    for (let gy = pass.cell / 2; gy < h; gy += pass.cell * 0.866) {
      const row = Math.round(gy / pass.cell);
      for (
        let gx = row % 2 ? pass.cell / 2 : 0;
        gx < w + pass.cell;
        gx += pass.cell
      ) {
        const x = gx + (rand() - 0.5) * pass.cell * pass.jitter;
        const y = gy + (rand() - 0.5) * pass.cell * pass.jitter;
        const rgb = pass.pick(x, y);
        const lab = toLab(rgb);
        const fromPaper = dist(lab, PARCH.lab);

        if (pass.edgesOnly) {
          const e = dist(lab, toLab(sample(x, y)));
          if (e < (pass.strongEdges ? 12 : 7) && fromPaper < 30) continue;
          if (pass.strongEdges && e < 9) continue;
        }
        // Keep near-paper areas airy: these become the page's negative space.
        if (fromPaper < 4 && rand() > 0.45) continue;
        if (fromPaper < 9 && rand() > 0.8) continue;

        const { a, b, wb } = nearestTwo(lab);
        // Optical mixing: pick the second colour in proportion to closeness.
        let c = rand() < wb * 0.9 ? b : a;
        // Seurat's trick: an occasional complementary dot in mid-tones.
        if (fromPaper > 22 && rand() < 0.035)
          c = colors.find(
            (k) => k.name === (lab[1] > 6 ? "sage" : "terracotta"),
          );

        const centerBias =
          1 + 0.12 * (1 - Math.min(1, Math.abs(x / w - focusX) * 2));
        const r = pass.r * (0.75 + rand() * 0.5) * centerBias;
        canvas.dot(x, y, r, c.rgb, pass.alpha);
        count++;
      }
    }
  }

  await sharp(canvas.toBuffer(), { raw: { width: w, height: h, channels: 4 } })
    .removeAlpha()
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(out);
  console.log(
    `painted ${path.relative(root, out)} — ${w}×${h}, ${count.toLocaleString()} dots`,
  );
}

// ---------------------------------------------------------------- coins

const COINS = [
  ["intake", "clipboard-text"],
  ["waiting", "armchair"],
  ["consult", "chats-circle"],
  ["treatment", "drop"],
  ["tracking", "stack"],
  ["billing", "receipt"],
];

async function iconMask(name, size) {
  const svgPath = require.resolve(
    `@phosphor-icons/core/assets/fill/${name}-fill.svg`,
  );
  const svg = fs
    .readFileSync(svgPath, "utf8")
    .replace('fill="currentColor"', 'fill="#000"');
  const { data } = await sharp(Buffer.from(svg), { density: 300 })
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return (x, y) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return 0;
    return data[(Math.floor(y) * size + Math.floor(x)) * 4 + 3] / 255;
  };
}

async function coin(key, icon, seed) {
  const S = 480,
    C = S / 2;
  const rand = mulberry32(seed);
  const canvas = makeCanvas(S, S, null);
  const rgb = (n) => PARCH && colors.find((c) => c.name === n).rgb;
  const ICON = 214;
  const mask = await iconMask(icon, ICON);
  const R_FIELD = 196;

  // the miniature's ground: warm stipple, denser toward the lower right (light from upper left)
  canvas.dot(C, C, R_FIELD + 4, rgb("vellum"), 1);
  for (let y = C - R_FIELD; y < C + R_FIELD; y += 6.2) {
    const row = Math.round(y / 6.2);
    for (let x = C - R_FIELD + (row % 2 ? 3.1 : 0); x < C + R_FIELD; x += 6.2) {
      const jx = x + (rand() - 0.5) * 2.6,
        jy = y + (rand() - 0.5) * 2.6;
      const d = Math.hypot(jx - C, jy - C);
      if (d > R_FIELD - 2) continue;
      const ix = jx - (C - ICON / 2),
        iy = jy - (C - ICON / 2);
      const m = mask(ix, iy);
      if (m > 0.5) {
        const c =
          rand() < 0.16 ? "ink" : rand() < 0.12 ? "terracotta" : "oxblood";
        canvas.dot(jx, jy, 2.7 + rand() * 0.6, rgb(c), 0.97);
      } else {
        const shade =
          ((jx - C + (jy - C)) / (2 * R_FIELD)) * 0.5 +
          0.5 +
          (d / R_FIELD) * 0.25;
        if (rand() > 0.35 + shade * 0.55) continue;
        const c =
          shade > 0.78
            ? rand() < 0.5
              ? "gold"
              : "ochre"
            : shade > 0.55
              ? "line"
              : "sand";
        canvas.dot(jx, jy, 1.1 + shade * 1.5 + rand() * 0.4, rgb(c), 0.9);
      }
    }
  }

  // beaded gilt frame: an inner hairline of fine dots, then large beads
  for (let i = 0, n = 150; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    canvas.dot(
      C + Math.cos(a) * 203,
      C + Math.sin(a) * 203,
      1.5,
      rgb("ochre"),
      1,
    );
  }
  for (let i = 0, n = 58; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const lit = (Math.cos(a - Math.PI * 1.25) + 1) / 2; // highlight from upper left
    const bx = C + Math.cos(a) * 222,
      by = C + Math.sin(a) * 222;
    canvas.dot(bx, by, 9.6, rgb("ochre"), 1);
    canvas.dot(bx, by, 8.4, rgb("gold"), 1);
    canvas.dot(
      bx - 2.4,
      by - 2.4,
      2.4 + lit * 1.6,
      rgb(lit > 0.5 ? "parchment" : "sand"),
      0.85,
    );
  }

  const file = pub("images", "coins", `${key}.png`);
  await sharp(canvas.toBuffer(), { raw: { width: S, height: S, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(file);
  console.log(`struck  ${path.relative(root, file)}`);
}

// ---------------------------------------------------------------- run

fs.mkdirSync(pub("images", "coins"), { recursive: true });

await pointillize({
  src: pub("images", "hero.jpg"),
  out: pub("images", "hero-pointillist.jpg"),
  width: 2880,
  aspect: 16 / 9,
  seed: 7,
  focusX: 0.68,
});
await pointillize({
  src: pub("images", "treatment-room.jpg"),
  out: pub("images", "treatment-pointillist.jpg"),
  width: 2400,
  aspect: 4 / 3,
  seed: 11,
  focusX: 0.55,
});
for (const [i, [key, icon]] of COINS.entries()) await coin(key, icon, 100 + i);

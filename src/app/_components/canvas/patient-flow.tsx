"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

/* ------------------------------------------------------------------ */
/* Palette & constants                                                 */
/* ------------------------------------------------------------------ */

const INK = "#1E1A16";
const OXBLOOD = "#7A2E2A";
const GOLD = "#B08D57";
const LINE = "#CDBFA7";
const PAPER = "#F6F0E4";

const STATIONS = [
  "Intake",
  "Waiting room",
  "Consultation",
  "Cosmetic treatment",
  "Procedure tracking",
  "Billing",
] as const;

const LAST = STATIONS.length - 1;
const WAITING = 1;

const RING_R = 14;
const DOT_R = 4.5;
const MAX_DOTS = 14;
const TRAVEL = 1.55; // seconds per segment
const DWELL = [0.7, 0, 0.85, 0.65, 0.55, 0.3]; // per station (waiting room uses the queue)
const RELEASE_GAP = 1.5; // waiting room -> consultation cadence
const QUEUE_SLOTS = 5;
const QUEUE_GAP = 13;
const QUEUE_DIST = 31;
const POP_LIFE = 0.85;
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

type Layout = { w: number; h: number; vertical: boolean };
type Pt = { x: number; y: number };

/**
 * The single source of truth for the route. Stations sit at t = i / 5.
 * A whisper of a 5th harmonic (zero at every station) makes the line feel
 * hand-drawn without moving the stations.
 */
function pathPoint(t: number, L: Layout): Pt {
  const s = Math.sin(TAU * t);
  const wobble = Math.sin(TAU * 5 * t + 0.2) * 0.035 - Math.sin(0.2) * 0.035;
  if (!L.vertical) {
    const padX = Math.max(52, L.w * 0.075);
    const A = L.h * 0.3;
    return {
      x: padX + t * (L.w - padX * 2),
      y: L.h * 0.5 + A * s + A * wobble,
    };
  }
  const padY = Math.max(40, L.h * 0.06);
  const A = L.w * 0.12;
  return {
    x: L.w * 0.22 + A * s + A * wobble,
    y: padY + t * (L.h - padY * 2),
  };
}

const stationPoint = (i: number, L: Layout) => pathPoint(i / LAST, L);

/** Offset (px) of a waiting-room queue slot from the station centre. */
function slotOffset(slot: number, L: Layout): Pt {
  const along = 2 * QUEUE_GAP - QUEUE_GAP * slot; // front of the queue sits downstream
  return L.vertical
    ? { x: -QUEUE_DIST, y: along }
    : { x: along, y: -QUEUE_DIST };
}

type LabelSide = "above" | "below" | "above-left" | "below-right" | "right";
const H_SIDES: LabelSide[] = [
  "above",
  "below",
  "below-right",
  "above-left",
  "above",
  "below",
];

/* ------------------------------------------------------------------ */
/* Simulation (layout independent)                                     */
/* ------------------------------------------------------------------ */

type Phase = "dwell" | "travel" | "queue";
type Dot = {
  id: number;
  color: string;
  stage: number; // station it is at, or has just left
  phase: Phase;
  t0: number;
  dur: number;
  born: number;
  slot: number;
  dSlot: number; // displayed (eased) slot
  fromSlot: number | null; // leaving the queue from this slot
};
type Pop = { t0: number; color: string };
type Sim = {
  t: number;
  dots: Dot[];
  queue: Dot[];
  pops: Pop[];
  nextSpawn: number;
  lastRelease: number;
  nextId: number;
  seed: number;
};

function rand(sim: Sim) {
  // small deterministic LCG so the prewarmed scene is stable between mounts
  sim.seed = (sim.seed * 1664525 + 1013904223) >>> 0;
  return sim.seed / 4294967296;
}

function pickColor(sim: Sim) {
  const r = rand(sim);
  return r < 0.68 ? INK : r < 0.86 ? OXBLOOD : GOLD;
}

function createSim(): Sim {
  const sim: Sim = {
    t: 0,
    dots: [],
    queue: [],
    pops: [],
    nextSpawn: 0,
    lastRelease: -10,
    nextId: 1,
    seed: 20241009,
  };
  // prewarm so the scene is already alive when it first scrolls into view
  for (let i = 0; i < 16 * 30; i++) step(sim, 1 / 30);
  return sim;
}

function step(sim: Sim, dt: number) {
  sim.t += dt;
  const t = sim.t;

  if (t >= sim.nextSpawn) {
    const early = sim.dots.filter(
      (d) => d.stage === 0 || d.phase === "queue",
    ).length;
    if (sim.dots.length < MAX_DOTS && early < QUEUE_SLOTS + 1) {
      sim.dots.push({
        id: sim.nextId++,
        color: pickColor(sim),
        stage: 0,
        phase: "dwell",
        t0: t,
        dur: DWELL[0]!,
        born: t,
        slot: 0,
        dSlot: 0,
        fromSlot: null,
      });
      sim.nextSpawn = t + 1.0 + rand(sim) * 0.6;
    } else {
      sim.nextSpawn = t + 0.3;
    }
  }

  for (let i = sim.dots.length - 1; i >= 0; i--) {
    const d = sim.dots[i]!;
    if (d.phase === "dwell" && t - d.t0 >= d.dur) {
      if (d.stage === LAST) {
        sim.dots.splice(i, 1);
        sim.pops.push({ t0: t, color: d.color });
      } else {
        d.phase = "travel";
        d.t0 = t;
        d.dur = TRAVEL;
        d.fromSlot = null;
      }
    } else if (d.phase === "travel" && t - d.t0 >= d.dur) {
      d.stage += 1;
      d.t0 = t;
      d.fromSlot = null;
      if (d.stage === WAITING) {
        d.phase = "queue";
        d.slot = sim.queue.length;
        d.dSlot = d.slot;
        sim.queue.push(d);
      } else {
        d.phase = "dwell";
        d.dur = DWELL[d.stage]!;
      }
    }
  }

  const front = sim.queue[0];
  if (front && t - sim.lastRelease >= RELEASE_GAP && t - front.t0 >= 0.75) {
    sim.queue.shift();
    front.phase = "travel";
    front.t0 = t;
    front.dur = TRAVEL;
    front.fromSlot = front.dSlot;
    sim.lastRelease = t;
    sim.queue.forEach((d, k) => (d.slot = k));
  }

  const k = 1 - Math.exp(-dt * 5);
  for (const d of sim.queue) d.dSlot += (d.slot - d.dSlot) * k;

  sim.pops = sim.pops.filter((p) => t - p.t0 < POP_LIFE);
}

/** A calm, legible still for prefers-reduced-motion. */
function createStaticSim(): Sim {
  const t = 100;
  const sim: Sim = {
    t,
    dots: [],
    queue: [],
    pops: [],
    nextSpawn: Infinity,
    lastRelease: 0,
    nextId: 1,
    seed: 1,
  };
  const add = (
    color: string,
    stage: number,
    phase: Phase,
    progress = 0,
    slot = 0,
  ) => {
    const d: Dot = {
      id: sim.nextId++,
      color,
      stage,
      phase,
      t0: phase === "travel" ? t - TRAVEL * progress : 0,
      dur: phase === "travel" ? TRAVEL : 999,
      born: 0,
      slot,
      dSlot: slot,
      fromSlot: null,
    };
    sim.dots.push(d);
    if (phase === "queue") sim.queue.push(d);
  };
  add(INK, 0, "dwell");
  add(OXBLOOD, WAITING, "queue", 0, 0);
  add(INK, WAITING, "queue", 0, 1);
  add(GOLD, WAITING, "queue", 0, 2);
  add(INK, 2, "dwell");
  add(INK, 3, "travel", 0.5);
  add(OXBLOOD, 4, "dwell");
  return sim;
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

type Vis = { active: number[]; dwell: number[]; hover: number[] };

const easeInOut = (u: number) =>
  // blend of sine and cubic: leaves a station promptly, settles softly
  0.5 * ((1 - Math.cos(Math.PI * u)) / 2) +
  0.5 * (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

function dotPosition(d: Dot, t: number, L: Layout): Pt {
  if (d.phase === "dwell") return stationPoint(d.stage, L);
  if (d.phase === "queue") {
    const base = stationPoint(WAITING, L);
    const k = easeOut(clamp01((t - d.t0) / 0.6));
    const o = slotOffset(d.dSlot, L);
    return { x: base.x + o.x * k, y: base.y + o.y * k };
  }
  const u = clamp01((t - d.t0) / d.dur);
  const p = pathPoint((d.stage + easeInOut(u)) / LAST, L);
  if (d.fromSlot !== null) {
    const o = slotOffset(d.fromSlot, L);
    const k = 1 - easeInOut(clamp01(u / 0.45));
    p.x += o.x * k;
    p.y += o.y * k;
  }
  return p;
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  p: Pt,
  color: string,
  scale = 1,
  alpha = 1,
) {
  if (scale <= 0.01) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.arc(p.x, p.y, (DOT_R + 1.5) * scale, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, DOT_R * scale, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function render(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  dpr: number,
  sim: Sim,
  vis: Vis,
  breathe: boolean,
) {
  const t = sim.t;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, L.w, L.h);

  // the route
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const p = pathPoint(i / N, L);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();

  // waiting-room bench: a short hairline the queue sits on
  {
    const s = stationPoint(WAITING, L);
    const a = slotOffset(-0.6, L);
    const b = slotOffset(QUEUE_SLOTS - 1 + 0.6, L);
    const lift = QUEUE_DIST - DOT_R - 4.5;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (L.vertical) {
      ctx.moveTo(s.x - lift, s.y + a.y);
      ctx.lineTo(s.x - lift, s.y + b.y);
    } else {
      ctx.moveTo(s.x + a.x, s.y - lift);
      ctx.lineTo(s.x + b.x, s.y - lift);
    }
    ctx.stroke();
  }

  // stations
  for (let i = 0; i <= LAST; i++) {
    const p = stationPoint(i, L);
    const act = vis.active[i]!;
    const dwell = vis.dwell[i]!;
    const hov = vis.hover[i]!;
    const pulse = breathe ? 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.3) : 0.5;
    const r = RING_R + 2.5 * act + 1.4 * dwell * pulse + 1 * hov * (1 - act);

    if (act > 0.01) {
      ctx.strokeStyle = OXBLOOD;
      ctx.globalAlpha = 0.55 * act;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 6, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TAU);
    ctx.fill();

    const tint = ((0.28 + 0.22 * pulse) * dwell + 0.4 * hov) * (1 - act);
    if (tint > 0.002) {
      ctx.fillStyle = LINE;
      ctx.globalAlpha = tint;
      ctx.fill();
    }
    if (act > 0.01) {
      ctx.fillStyle = INK;
      ctx.globalAlpha = act;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = INK;
    ctx.lineWidth = 1 + 0.5 * hov;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TAU);
    ctx.stroke();

    // centre tick when idle
    const tick = (1 - dwell) * (1 - act);
    if (tick > 0.02) {
      ctx.fillStyle = INK;
      ctx.globalAlpha = 0.55 * tick;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // patients
  for (const d of sim.dots) {
    const p = dotPosition(d, t, L);
    const born = clamp01((t - d.born) / 0.4);
    drawDot(ctx, p, d.color, easeOut(born), born);
  }

  // billing pops
  const end = stationPoint(LAST, L);
  for (const pop of sim.pops) {
    const u = clamp01((t - pop.t0) / POP_LIFE);
    const ring = easeOut(u);
    ctx.strokeStyle = pop.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.85 * (1 - u) * (1 - u);
    ctx.beginPath();
    ctx.arc(end.x, end.y, DOT_R + 2 + 20 * ring, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
    const s = u < 0.1 ? 1 + 3 * u : 1.3 * (1 - (u - 0.1) / 0.16);
    if (s > 0) drawDot(ctx, end, pop.color, s, 1);
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export type PatientFlowProps = {
  /** 0–5: the station to highlight (driven by the page's step list). */
  activeIndex?: number;
  onStationHover?: (i: number | null) => void;
  className?: string;
};

export function PatientFlow({
  activeIndex,
  onStationHover,
  className,
}: PatientFlowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion() ?? false;
  const inView = useInView(rootRef, { margin: "80px 0px" });

  const [layout, setLayout] = useState<Layout | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const simRef = useRef<Sim | null>(null);
  const staticSimRef = useRef<Sim | null>(null);
  const visRef = useRef<Vis>({
    active: Array<number>(6).fill(0),
    dwell: Array<number>(6).fill(0),
    hover: Array<number>(6).fill(0),
  });
  const targetsRef = useRef<{ active: number | null; hover: number | null }>({
    active: null,
    hover: null,
  });
  const loopingRef = useRef(false);
  const drawRef = useRef<(() => void) | null>(null);

  const active =
    typeof activeIndex === "number" && activeIndex >= 0 && activeIndex <= LAST
      ? Math.round(activeIndex)
      : null;

  // measure
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.round(entry.contentRect.width);
      if (w <= 0) return;
      const vertical = w < 480;
      const h = Math.round(vertical ? (w * 5) / 3 : (w * 7) / 16);
      setLayout((prev) =>
        prev?.w === w && prev.h === h && prev.vertical === vertical
          ? prev
          : { w, h, vertical },
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // canvas + loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!layout || !canvas || !root) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.round(layout.w * dpr);
    const ch = Math.round(layout.h * dpr);
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;

    const vis = visRef.current;
    const settle = (sim: Sim) => {
      const { active: a, hover: hv } = targetsRef.current;
      for (let i = 0; i <= LAST; i++) {
        vis.active[i] = a === i ? 1 : 0;
        vis.hover[i] = hv === i ? 1 : 0;
        vis.dwell[i] = occupied(sim, i) ? 1 : 0;
      }
    };

    if (reduced) {
      const sim = (staticSimRef.current ??= createStaticSim());
      drawRef.current = () => {
        settle(sim);
        render(ctx, layout, dpr, sim, vis, false);
      };
      drawRef.current();
      loopingRef.current = false;
      root.dataset.animating = "false";
      return;
    }

    const sim = (simRef.current ??= createSim());
    drawRef.current = () => render(ctx, layout, dpr, sim, vis, true);

    if (!inView) {
      settle(sim);
      drawRef.current();
      loopingRef.current = false;
      root.dataset.animating = "false";
      return;
    }

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      step(sim, dt);
      const k = 1 - Math.exp(-dt * 9);
      const kd = 1 - Math.exp(-dt * 6);
      const { active: a, hover: hv } = targetsRef.current;
      for (let i = 0; i <= LAST; i++) {
        vis.active[i]! += ((a === i ? 1 : 0) - vis.active[i]!) * k;
        vis.hover[i]! += ((hv === i ? 1 : 0) - vis.hover[i]!) * k;
        vis.dwell[i]! += ((occupied(sim, i) ? 1 : 0) - vis.dwell[i]!) * kd;
      }
      render(ctx, layout, dpr, sim, vis, true);
      raf = requestAnimationFrame(frame);
    };
    loopingRef.current = true;
    root.dataset.animating = "true";
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      loopingRef.current = false;
      root.dataset.animating = "false";
    };
  }, [layout, reduced, inView]);

  // keep highlight targets in sync; redraw the still frame when not looping
  useEffect(() => {
    targetsRef.current = { active, hover: hovered };
    if (!loopingRef.current && drawRef.current) {
      const vis = visRef.current;
      for (let i = 0; i <= LAST; i++) {
        vis.active[i] = active === i ? 1 : 0;
        vis.hover[i] = hovered === i ? 1 : 0;
      }
      drawRef.current();
    }
  }, [active, hovered, layout]);

  const points = useMemo(
    () => (layout ? STATIONS.map((_, i) => stationPoint(i, layout)) : null),
    [layout],
  );

  const enter = (i: number) => {
    setHovered(i);
    onStationHover?.(i);
  };
  const leave = () => {
    setHovered(null);
    onStationHover?.(null);
  };

  return (
    <div
      ref={rootRef}
      data-testid="patient-flow"
      data-animating="false"
      role="group"
      aria-label="How a patient moves through the clinic day"
      className={`relative w-full font-sans select-none ${
        layout ? "" : "aspect-[16/7] max-sm:aspect-[3/5]"
      } ${className ?? ""}`}
      style={layout ? { height: layout.h } : undefined}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block h-full w-full"
      />
      {points && layout
        ? STATIONS.map((name, i) => {
            const p = points[i]!;
            const side: LabelSide = layout.vertical ? "right" : H_SIDES[i]!;
            const isActive = active === i;
            const isHover = hovered === i;
            return (
              <button
                key={name}
                type="button"
                aria-label={`Step ${i + 1}: ${name}`}
                aria-current={isActive ? "step" : undefined}
                onMouseEnter={() => enter(i)}
                onMouseLeave={leave}
                onFocus={() => enter(i)}
                onBlur={leave}
                className="absolute size-10 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-full outline-none focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#7A2E2A]"
                style={{ left: p.x, top: p.y }}
              >
                <StationLabel
                  index={i}
                  name={name}
                  side={side}
                  active={isActive}
                  hover={isHover}
                />
              </button>
            );
          })
        : null}
    </div>
  );
}

function occupied(sim: Sim, i: number) {
  if (i === WAITING && sim.queue.length > 0) return true;
  return sim.dots.some((d) => d.phase === "dwell" && d.stage === i);
}

const SIDE_CLASS: Record<LabelSide, string> = {
  // positions are relative to the 40px hit box centred on the station
  above:
    "left-1/2 bottom-[calc(100%+6px)] -translate-x-1/2 flex-col items-center text-center",
  below:
    "left-1/2 top-[calc(100%+6px)] -translate-x-1/2 flex-col items-center text-center",
  "above-left":
    "right-[calc(50%+16px)] bottom-[calc(100%+6px)] flex-col items-end text-right",
  "below-right":
    "left-[calc(50%+16px)] top-[calc(100%+6px)] flex-col items-start text-left",
  right:
    "left-[calc(100%+10px)] top-1/2 -translate-y-1/2 flex-row items-baseline gap-2 text-left",
};

function StationLabel({
  index,
  name,
  side,
  active,
  hover,
}: {
  index: number;
  name: string;
  side: LabelSide;
  active: boolean;
  hover: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-auto absolute flex gap-0.5 whitespace-nowrap ${SIDE_CLASS[side]}`}
    >
      <span
        className={`text-[11px] leading-none tracking-[0.16em] tabular-nums transition-colors duration-300 ${
          active ? "text-[#7A2E2A]" : "text-[#86652F]"
        }`}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span
        className={`text-[13px] leading-tight transition-colors duration-300 ${
          active
            ? "font-medium text-[#7A2E2A]"
            : hover
              ? "text-[#1E1A16] underline decoration-[#CDBFA7] underline-offset-4"
              : "text-[#1E1A16]"
        }`}
      >
        {name}
      </span>
    </span>
  );
}

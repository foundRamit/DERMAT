"use client";

import {
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { images } from "./content";

const points = [
  {
    title: "Courses of treatment",
    text: "Plan treatments that run across several sessions and visits.",
  },
  {
    title: "Procedure tracking",
    text: "A careful record of each procedure as it is performed.",
  },
  {
    title: "Staff coordination",
    text: "Doctors, therapists and the front desk working from the same picture of the day.",
  },
];

const SESSIONS = 6;

export function Treatments() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section
      ref={ref}
      id="treatments"
      aria-labelledby="treatments-title"
      className="bg-vellum relative overflow-hidden"
    >
      <div className="mx-auto grid max-w-[1400px] items-center gap-[clamp(72px,6vw,96px)] px-5 py-[clamp(80px,10vw,150px)] md:px-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <figure className="relative mb-10 lg:mb-0">
          <m.div
            style={reduce ? undefined : { y: imageY }}
            className="relative overflow-hidden rounded-[28px]"
          >
            <m.div
              initial={{ clipPath: "inset(12% 12% 12% 12% round 28px)" }}
              whileInView={{ clipPath: "inset(0% 0% 0% 0% round 28px)" }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <Image
                src={images.treatment.src}
                alt={images.treatment.alt}
                width={2400}
                height={1800}
                sizes="(min-width: 1024px) 56vw, 100vw"
                className="aspect-[4/3] w-full object-cover"
              />
            </m.div>
          </m.div>
          <SessionCard />
        </figure>

        <div>
          <p className="text-terracotta mb-6 font-mono text-[11px] tracking-[0.18em] uppercase">
            02 — Treatments
          </p>
          <h2
            id="treatments-title"
            className="font-serif text-[clamp(44px,5.6vw,84px)] leading-[0.98] font-normal tracking-[-0.01em] text-balance"
          >
            Organised treatment,{" "}
            <em className="text-oxblood">session after session.</em>
          </h2>
          <p className="text-body mt-6">
            Cosmetic and procedural care rarely ends in a single visit. Dermat
            keeps courses of treatment, the procedures within them, and the
            people delivering them in step.
          </p>
          <m.ul
            className="border-line-strong mt-10 border-t"
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 0.4 }}
            variants={{ shown: { transition: { staggerChildren: 0.1 } } }}
          >
            {points.map(({ title, text }, i) => (
              <m.li
                key={title}
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  shown: { opacity: 1, y: 0 },
                }}
                className="border-line-strong flex items-baseline gap-4 border-b py-5"
              >
                <span className="text-oxblood w-6 shrink-0 font-mono text-[11px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-serif text-[26px] leading-tight">
                    {title}
                  </span>
                  <span className="text-body mt-1 block text-[15px]">
                    {text}
                  </span>
                </span>
              </m.li>
            ))}
          </m.ul>
        </div>
      </div>
    </section>
  );
}

/** A course card whose sessions fill one by one, then gently loop. */
function SessionCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const reduce = useReducedMotion();
  const [done, setDone] = useState(reduce ? 4 : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const t = setTimeout(
      () => setDone((d) => (d >= SESSIONS ? 1 : d + 1)),
      done >= SESSIONS ? 2200 : 700,
    );
    return () => clearTimeout(t);
  }, [inView, reduce, done]);

  return (
    <m.div
      ref={ref}
      data-testid="session-card"
      data-done={done}
      initial={{ opacity: 0, y: 30, rotate: -4 }}
      whileInView={{ opacity: 1, y: 0, rotate: -2.5 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.9, delay: 0.3 }}
      className="bg-parchment border-line-strong absolute -bottom-8 left-4 w-[248px] rounded-2xl border p-5 shadow-[0_18px_40px_-24px_rgba(30,26,22,0.35)] md:-bottom-10 md:left-[-28px]"
    >
      <p className="text-muted font-mono text-[10px] tracking-[0.16em] uppercase">
        Course of treatment
      </p>
      <p className="mt-1.5 font-serif text-[26px] leading-none">
        Session{" "}
        <m.span
          key={done}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-oxblood inline-block tabular-nums"
        >
          {Math.max(done, 1)}
        </m.span>{" "}
        of {SESSIONS}
      </p>
      <div className="mt-4 flex gap-2" aria-hidden>
        {Array.from({ length: SESSIONS }, (_, i) => (
          <m.span
            key={i}
            className="border-ink relative size-6 rounded-full border"
            animate={{ scale: i === done - 1 ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 0.4 }}
          >
            <m.span
              className="bg-oxblood absolute inset-[3px] rounded-full"
              initial={false}
              animate={{ scale: i < done ? 1 : 0 }}
              transition={{ type: "spring", bounce: 0.55, duration: 0.45 }}
            />
          </m.span>
        ))}
      </div>
    </m.div>
  );
}

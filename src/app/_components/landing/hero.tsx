"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useId, useRef } from "react";

import { images, steps } from "./content";

const arcWords = Array.from({ length: 3 }, () =>
  steps.map((s) => s.title.toUpperCase()).join("  ·  "),
).join("  ·  ");

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.12]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -90]);

  return (
    <section
      ref={ref}
      id="top"
      aria-labelledby="hero-title"
      className="relative flex flex-col overflow-hidden md:h-[min(920px,100svh)] md:min-h-[700px]"
    >
      {/* Painting */}
      <m.div
        style={reduce ? undefined : { y: imageY, scale: imageScale }}
        className="relative order-2 h-[56svh] min-h-[380px] origin-top md:absolute md:inset-0 md:order-none md:h-auto"
      >
        <Image
          src={images.hero.src}
          alt={images.hero.alt}
          fill
          preload
          sizes="100vw"
          className="object-cover object-[88%_30%] md:object-[100%_40%]"
        />
      </m.div>

      {/* Copy */}
      <m.div
        style={reduce ? undefined : { y: copyY }}
        className="relative z-10 mx-auto w-full max-w-[1400px] px-5 pt-28 pb-12 md:px-12 md:pt-[clamp(132px,17vh,180px)] md:pb-0"
      >
        <p className="text-terracotta mb-6 font-mono text-[11px] tracking-[0.18em] uppercase md:mb-8">
          Clinic management for dermatology
        </p>

        <h1
          id="hero-title"
          className="font-serif text-[clamp(76px,10.4vw,164px)] leading-[0.86] font-normal tracking-[-0.015em]"
        >
          <span className="flex flex-wrap items-center gap-x-[0.12em]">
            Well
            <ParenAside />
          </span>
          <span className="block">
            kept<span className="text-oxblood">.</span>
          </span>
        </h1>

        <p className="text-body mt-6 max-w-[340px] font-serif text-[22px] leading-snug italic xl:hidden">
          Intake to invoice — the whole clinic day, in one calm system.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-6 md:mt-12">
          <a
            href="#demo"
            className="group bg-ink text-parchment hover:bg-oxblood inline-flex h-[52px] items-center gap-3 rounded-full pr-5 pl-6 font-medium transition-colors duration-300"
          >
            Book a demo
            <ArrowUpRight
              size={16}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
          <a
            href="#day"
            className="link-underline hover:text-oxblood font-medium transition-colors"
          >
            Watch the day move
          </a>
        </div>
      </m.div>

      <HeroArc progress={scrollYProgress} />
      <MagneticBadge />
    </section>
  );
}

/** ( small aside ) set between giant serif parentheses, which spring open on load. */
function ParenAside() {
  const paren = {
    hidden: { scaleY: 0.4, opacity: 0 },
    shown: {
      scaleY: 1,
      opacity: 1,
      transition: { type: "spring" as const, bounce: 0.5, duration: 0.8 },
    },
  };

  return (
    <m.span
      className="hidden items-center xl:inline-flex"
      initial="hidden"
      animate="shown"
      transition={{ delayChildren: 0.25, staggerChildren: 0.12 }}
    >
      <m.span
        variants={paren}
        className="text-muted inline-block origin-center font-light"
      >
        (
      </m.span>
      <m.span
        variants={{
          hidden: { opacity: 0, y: 8 },
          shown: { opacity: 1, y: 0, transition: { duration: 0.6 } },
        }}
        className="text-body mx-[0.18em] inline-block max-w-[230px] font-sans text-[15px] leading-[1.45] font-medium tracking-normal"
      >
        Intake to invoice — the whole dermatology clinic day, in one calm
        system.
      </m.span>
      <m.span
        variants={paren}
        className="text-muted inline-block origin-center font-light"
      >
        )
      </m.span>
    </m.span>
  );
}

/** Parchment arc that closes the hero, with the six moments of the visit sliding along it. */
function HeroArc({
  progress,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const id = useId().replace(/:/g, "");
  const textRef = useRef<SVGTextPathElement>(null);
  const reduce = useReducedMotion();
  const offset = useSpring(useTransform(progress, [0, 1], [-40, -900]), {
    stiffness: 120,
    damping: 30,
  });

  useMotionValueEvent(offset, "change", (v) => {
    if (!reduce) textRef.current?.setAttribute("startOffset", String(v));
  });

  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 200"
      className="pointer-events-none absolute inset-x-0 -bottom-px z-10 hidden h-auto w-full md:block"
    >
      <defs>
        <path id={`arc-${id}`} d="M -300 196 C 380 84, 1060 84, 1740 196" />
      </defs>
      <path
        d="M 0 200 L 0 160 C 420 60, 1020 60, 1440 160 L 1440 200 Z"
        className="fill-parchment"
      />
      <text
        className="fill-ink font-mono"
        style={{ fontSize: 13, letterSpacing: 4 }}
        data-testid="hero-arc-text"
      >
        <textPath ref={textRef} href={`#arc-${id}`} startOffset={-40}>
          {arcWords}
        </textPath>
      </text>
    </svg>
  );
}

/** Round "Book a demo" seal with a slowly turning ring of text and a magnetic pull. */
function MagneticBadge() {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 220, damping: 18 });
  const y = useSpring(0, { stiffness: 220, damping: 18 });

  return (
    <m.a
      href="#demo"
      aria-label="Book a demo"
      data-testid="hero-badge"
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width - 0.5) * 22);
        y.set(((e.clientY - r.top) / r.height - 0.5) * 22);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", bounce: 0.45, duration: 0.9, delay: 0.6 }}
      className="bg-parchment text-ink absolute right-[5%] bottom-[170px] z-20 hidden size-[132px] items-center justify-center rounded-full shadow-[0_1px_0_rgba(30,26,22,0.06)] md:flex"
    >
      <svg
        viewBox="0 0 132 132"
        aria-hidden
        className="animate-spin-slow absolute inset-0 size-full"
      >
        <defs>
          <path
            id={`ring-${id}`}
            d="M 66 66 m -50 0 a 50 50 0 1 1 100 0 a 50 50 0 1 1 -100 0"
          />
        </defs>
        <text
          className="fill-ink font-mono"
          style={{ fontSize: 10.5, letterSpacing: 3.2 }}
        >
          <textPath href={`#ring-${id}`}>
            BOOK A DEMO · SEE THE CLINIC DAY · BOOK A DEMO · SEE THE CLINIC DAY
            ·
          </textPath>
        </text>
      </svg>
      <span className="bg-ink text-parchment relative inline-flex size-12 items-center justify-center rounded-full">
        <ArrowUpRight size={20} aria-hidden />
      </span>
    </m.a>
  );
}

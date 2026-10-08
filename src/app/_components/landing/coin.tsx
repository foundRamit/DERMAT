"use client";

import { useInView } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useRef, useState } from "react";

import { steps, type Step } from "./content";

/** A round, stippled medallion — generated image when available, icon otherwise. */
export function Coin({
  step,
  className = "size-12",
}: {
  step: Pick<Step, "coin" | "Icon" | "title">;
  className?: string;
}) {
  const { coin, Icon } = step;

  if (coin) {
    return (
      <span className={`relative inline-block shrink-0 ${className}`}>
        <Image
          src={coin}
          alt=""
          fill
          sizes="96px"
          className="rounded-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`bg-vellum text-oxblood ring-gold/70 ring-offset-parchment relative inline-flex shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgba(176,141,87,0.35)] ring-[1.5px] ring-offset-[3px] ${className}`}
    >
      <Icon weight="light" className="size-[48%]" aria-hidden />
    </span>
  );
}

/** Overlapping stack of coins that pops in, then fans out like a hand of cards on hover. */
export function CoinStack({ items = steps }: { items?: Step[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [fanned, setFanned] = useState(false);
  const mid = (items.length - 1) / 2;

  return (
    <m.span
      ref={ref}
      data-testid="coin-stack"
      data-fanned={fanned}
      className="relative inline-flex cursor-default align-middle"
      onHoverStart={() => setFanned(true)}
      onHoverEnd={() => setFanned(false)}
      onFocus={() => setFanned(true)}
      onBlur={() => setFanned(false)}
      tabIndex={0}
      aria-label={items.map((s) => s.title).join(", ")}
      initial="hidden"
      animate={fanned && inView ? "fanned" : inView ? "shown" : "hidden"}
      variants={{ shown: { transition: { staggerChildren: 0.07 } } }}
    >
      {items.map((step, i) => {
        const o = i - mid;
        return (
          <m.span
            key={step.key}
            className={i === 0 ? "" : "-ml-[0.38em]"}
            style={{ zIndex: items.length - i }}
            variants={{
              hidden: { opacity: 0, x: 0, y: 10, scale: 0.6, rotate: 0 },
              shown: {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                rotate: step.tilt,
                transition: { type: "spring", bounce: 0.45, duration: 0.55 },
              },
              fanned: {
                opacity: 1,
                x: o * 16,
                y: Math.abs(o) * 5 - 8,
                scale: 1.04,
                rotate: o * 9,
                transition: { type: "spring", bounce: 0.35, duration: 0.5 },
              },
            }}
          >
            <Coin step={step} className="size-[1.1em]" />
          </m.span>
        );
      })}
    </m.span>
  );
}

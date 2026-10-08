"use client";

import { Check } from "@phosphor-icons/react";
import * as m from "motion/react-m";

const lines = ["Consultation", "Cosmetic procedure", "Treatment session"];

export function Billing() {
  return (
    <section
      id="billing"
      aria-labelledby="billing-title"
      className="relative overflow-x-clip"
    >
      <div className="mx-auto grid max-w-[1400px] items-start gap-16 px-5 py-[clamp(80px,10vw,150px)] md:px-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="text-terracotta mb-6 font-mono text-[11px] tracking-[0.18em] uppercase">
            03 — Billing
          </p>
          <h2
            id="billing-title"
            className="font-serif text-[clamp(44px,5.6vw,84px)] leading-[0.98] font-normal tracking-[-0.015em] text-balance"
          >
            From the front desk to the final invoice
            <span className="text-oxblood">.</span>
          </h2>
          <p className="text-body mt-8 max-w-[520px] text-lg">
            Billing closes the visit in the same system that opened it —
            consultations and cosmetic procedures alike, without a second place
            to reconcile.
          </p>
        </div>

        <div className="lg:pt-16">
          <Receipt />
        </div>
      </div>
    </section>
  );
}

/** A slip that prints out of a slot, line by line, then gets sealed. */
function Receipt() {
  return (
    <m.div
      className="relative mx-auto w-full max-w-[360px]"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.5 }}
      data-testid="receipt"
    >
      {/* the slot */}
      <div className="bg-ink relative z-10 h-3 rounded-full" aria-hidden />
      <div className="-mt-1.5 overflow-hidden px-4 pb-10">
        <m.div
          variants={{
            hidden: { y: "-100%" },
            shown: {
              y: "0%",
              transition: {
                duration: 1.3,
                ease: [0.3, 0.7, 0.2, 1],
                delayChildren: 0.5,
                staggerChildren: 0.18,
              },
            },
          }}
          className="bg-parchment border-line-strong relative border-x border-b px-6 pt-7 pb-8 shadow-[0_24px_40px_-30px_rgba(30,26,22,0.45)]"
          style={{
            maskImage:
              "radial-gradient(circle at 8px 100%, transparent 7px, #000 7.5px)",
            maskSize: "16px 100%",
            maskRepeat: "repeat-x",
          }}
        >
          <p className="text-muted font-mono text-[10px] tracking-[0.18em] uppercase">
            Visit summary
          </p>
          <div className="border-line mt-4 border-t border-dashed" />
          {lines.map((line) => (
            <m.div
              key={line}
              variants={{
                hidden: { opacity: 0, x: -8 },
                shown: { opacity: 1, x: 0 },
              }}
              className="flex items-baseline gap-2 py-3 text-[15px]"
            >
              <span>{line}</span>
              <span className="border-line-strong mb-1 flex-1 border-b border-dotted" />
              <Check size={13} aria-hidden className="text-oxblood" />
            </m.div>
          ))}
          <div className="border-ink mt-2 border-t" />
          <m.div
            variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
            className="flex items-baseline justify-between pt-3"
          >
            <span className="font-serif text-[26px]">Invoice</span>
            <span className="text-muted font-mono text-[11px] tracking-[0.12em] uppercase">
              Ready
            </span>
          </m.div>
        </m.div>
      </div>
      {/* wax seal */}
      <m.span
        aria-hidden
        data-testid="receipt-seal"
        style={{ right: -12, bottom: -4 }}
        variants={{
          hidden: { scale: 1.8, opacity: 0, rotate: -40 },
          shown: {
            scale: 1,
            opacity: 1,
            rotate: -12,
            transition: {
              type: "spring",
              bounce: 0.5,
              duration: 0.6,
              delay: 1.9,
            },
          },
        }}
        className="bg-oxblood text-parchment absolute z-20 inline-flex size-[76px] items-center justify-center rounded-full shadow-[inset_0_0_0_5px_rgba(0,0,0,0.12),0_10px_18px_-10px_rgba(122,46,42,0.8)]"
      >
        <Check size={30} weight="bold" />
      </m.span>
    </m.div>
  );
}

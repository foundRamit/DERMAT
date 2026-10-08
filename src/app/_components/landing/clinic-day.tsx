"use client";

import { AnimatePresence, useInView, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";

import { PatientFlow } from "@/app/_components/canvas/patient-flow";

import { Coin, CoinStack } from "./coin";
import { steps } from "./content";

const STEP_MS = 4800;

export function ClinicDay() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const running = inView && !paused && !reduce;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(
      () => setActive((i) => (i + 1) % steps.length),
      STEP_MS,
    );
    return () => clearTimeout(t);
  }, [running, active]);

  return (
    <section
      ref={ref}
      id="day"
      aria-labelledby="day-title"
      className="relative"
    >
      <div className="mx-auto max-w-[1400px] px-5 pt-[clamp(72px,9vw,128px)] pb-[clamp(80px,10vw,150px)] md:px-12">
        <p className="text-terracotta mb-6 font-mono text-[11px] tracking-[0.18em] uppercase">
          01 — The clinic day
        </p>
        <h2
          id="day-title"
          className="max-w-[1100px] font-serif text-[clamp(44px,5.6vw,84px)] leading-[0.98] font-normal tracking-[-0.01em] text-balance"
        >
          Six moments of every visit{" "}
          <span className="hidden whitespace-nowrap sm:inline">
            <span className="text-muted font-light">(</span>
            <CoinStack />
            <span className="text-muted font-light">)</span>
          </span>{" "}
          held in one calm system.
        </h2>

        <div
          className="mt-[clamp(48px,6vw,88px)] grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <ol className="border-ink border-t" data-testid="day-steps">
            {steps.map((step, i) => {
              const isActive = i === active;
              return (
                <li key={step.key} className="border-line border-b">
                  <button
                    type="button"
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => setActive(i)}
                    className="group relative flex w-full cursor-pointer items-start gap-5 py-5 text-left"
                  >
                    <span className="bg-line absolute top-0 left-0 h-px w-full overflow-hidden">
                      {isActive && (
                        <m.span
                          key={`${active}-${running}`}
                          data-testid="step-progress"
                          className="bg-oxblood absolute inset-0 origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: running ? 1 : 0 }}
                          transition={{
                            duration: running ? STEP_MS / 1000 : 0.2,
                            ease: "linear",
                          }}
                        />
                      )}
                    </span>
                    <m.span
                      animate={{
                        scale: isActive ? 1 : 0.82,
                        rotate: isActive ? step.tilt : 0,
                        opacity: isActive ? 1 : 0.55,
                      }}
                      transition={{
                        type: "spring",
                        bounce: 0.5,
                        duration: 0.5,
                      }}
                    >
                      <Coin step={step} className="size-11" />
                    </m.span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-3">
                        <span className="text-oxblood font-mono text-[11px]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`font-serif text-[30px] leading-none transition-colors duration-300 ${isActive ? "text-ink" : "text-muted group-hover:text-ink"}`}
                        >
                          {step.title}
                        </span>
                      </span>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <m.span
                            key="text"
                            className="text-body block overflow-hidden pt-2 text-[15px]"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{
                              type: "spring",
                              bounce: 0,
                              duration: 0.45,
                            }}
                          >
                            {step.text}
                          </m.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="lg:pt-6">
            <PatientFlow
              activeIndex={active}
              onStationHover={(i) => {
                if (i !== null) setActive(i);
                setPaused(i !== null);
              }}
            />
            <p className="text-muted mt-5 font-mono text-[11px] tracking-[0.08em]">
              Each dot is a patient moving through the day.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

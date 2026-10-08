"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        reducedMotion="user"
        transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

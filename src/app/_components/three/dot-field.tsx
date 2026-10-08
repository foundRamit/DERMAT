"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

// `ssr: false` is only allowed from a Client Component (this file).
const DotFieldScene = dynamic(() => import("./dot-field-scene"), {
  ssr: false,
  loading: () => null,
});

/* ------------------------------------------------------------------ */
/* Environment checks                                                  */
/* ------------------------------------------------------------------ */

function subscribeMedia(query: string) {
  return (cb: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", cb);
    return () => mql.removeEventListener("change", cb);
  };
}

const REDUCED = "(prefers-reduced-motion: reduce)";
const WIDE = "(min-width: 640px)";
const subscribeReduced = subscribeMedia(REDUCED);
const subscribeWide = subscribeMedia(WIDE);
const noopSubscribe = () => () => undefined;

let webglCache: boolean | undefined;
function hasWebGL(): boolean {
  if (webglCache !== undefined) return webglCache;
  try {
    const c = document.createElement("canvas");
    webglCache = !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/** True only on the client when the WebGL branch is allowed at all. */
function useCanAnimate(): boolean {
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => true,
  );
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
  const webgl = useSyncExternalStore(noopSubscribe, hasWebGL, () => false);
  return !reduced && wide && webgl;
}

/* ------------------------------------------------------------------ */
/* Error boundary — any WebGL/three failure drops to the static field.  */
/* ------------------------------------------------------------------ */

class SceneBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* Static fallback: a quiet dot pattern fading toward the horizon.      */
/* ------------------------------------------------------------------ */

const fallbackStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "radial-gradient(circle at center, rgba(233,221,199,0.42) 0 1.1px, transparent 1.8px), radial-gradient(circle at center, rgba(176,141,87,0.36) 0 1.1px, transparent 1.8px)",
  backgroundSize: "18px 18px, 18px 18px",
  backgroundPosition: "0 0, 9px 9px",
  maskImage:
    "linear-gradient(to bottom, transparent 0%, #000 45%, #000 85%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent 0%, #000 45%, #000 85%, transparent 100%)",
  transition: "opacity 900ms ease",
};

/* ------------------------------------------------------------------ */
/* DotField                                                            */
/* ------------------------------------------------------------------ */

export type DotFieldProps = {
  className?: string;
};

export function DotField({ className }: DotFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const canAnimate = useCanAnimate();
  const [near, setNear] = useState(false); // has ever been near the viewport
  const [visible, setVisible] = useState(false); // currently on-screen
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate) return;
    const nearObs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: "300px 0px" },
    );
    const visObs = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (last) setVisible(last.isIntersecting);
      },
      { rootMargin: "0px" },
    );
    nearObs.observe(el);
    visObs.observe(el);
    return () => {
      nearObs.disconnect();
      visObs.disconnect();
    };
  }, [canAnimate]);

  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => setFailed(true), []);

  const mountScene = canAnimate && near && !failed;
  const showWebGL = mountScene && ready;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="dot-field"
      data-state={showWebGL ? "webgl" : "fallback"}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      style={{ pointerEvents: "none" }}
    >
      <div style={{ ...fallbackStyle, opacity: showWebGL ? 0 : 1 }} />
      {mountScene ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: showWebGL ? 1 : 0,
            transition: "opacity 1200ms ease",
          }}
        >
          <SceneBoundary onError={onFail}>
            <DotFieldScene
              active={visible}
              onReady={onReady}
              onContextLost={onFail}
            />
          </SceneBoundary>
        </div>
      ) : null}
    </div>
  );
}

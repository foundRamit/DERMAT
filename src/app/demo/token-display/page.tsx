"use client";

import { useEffect, useState } from "react";

import {
  byId,
  clinicName,
  doctors,
  fullName,
  useDemo,
  useHydrated,
} from "../_lib/store";

/** The TV in the waiting room: shows which token is being seen right now. */
export default function TokenDisplayPage() {
  const state = useDemo();
  const hydrated = useHydrated();
  const patients = byId(state.patients);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = state.appointments.filter(
    (a) => a.day === 0 && a.status === "IN_PROGRESS",
  );
  const panels = [
    ...doctors.map((d) => ({
      key: d.id,
      label: "OPD",
      sub: d.name,
      tokens: today.filter((a) => a.service === "OPD" && a.doctorId === d.id),
    })),
    {
      key: "proc",
      label: "Procedure",
      sub: `${today.filter((a) => a.service === "PROCEDURE").length} in progress`,
      tokens: today.filter((a) => a.service === "PROCEDURE"),
    },
  ].filter((p) => p.tokens.length > 0);

  return (
    <div className="text-parchment relative flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_left,#7a2e2a_0%,#1e1a16_55%,#120f0c_100%)]">
      <header className="flex flex-wrap items-center justify-between gap-4 px-8 py-6">
        <span className="font-serif text-[30px] leading-none">
          {clinicName}
        </span>
        <span className="text-mist font-mono text-[15px]">
          {hydrated &&
            `${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · ${now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}`}
        </span>
      </header>

      {panels.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <p className="font-serif text-[clamp(56px,9vw,140px)] leading-[0.9]">
            Welcome
          </p>
          <p className="text-mist mt-6 text-[20px]">
            Skin care · Laser · PRP · Chemical peels
          </p>
          <p className="text-gold mt-10 font-mono text-[13px] tracking-[0.18em] uppercase">
            Please wait, your token will be called here
          </p>
        </div>
      ) : (
        <div
          className="grid flex-1 gap-6 px-8 pb-10"
          style={{
            gridTemplateColumns: `repeat(${Math.min(panels.length, 3)}, minmax(0, 1fr))`,
          }}
        >
          {panels.map((p) => (
            <section
              key={p.key}
              className="flex flex-col items-center justify-center rounded-[32px] border border-white/15 bg-white/[0.06] p-8 text-center backdrop-blur"
            >
              <p className="text-gold font-mono text-[14px] tracking-[0.2em] uppercase">
                Now seeing
              </p>
              <p className="mt-2 text-[22px]">
                {p.label} <span className="text-mist">· {p.sub}</span>
              </p>
              <div className="mt-6 grid gap-4">
                {p.tokens.map((a) => (
                  <div key={a.id}>
                    <p
                      className="font-mono leading-none font-semibold"
                      style={{
                        fontSize:
                          p.tokens.length > 1
                            ? "clamp(56px,7vw,110px)"
                            : "clamp(90px,13vw,200px)",
                      }}
                    >
                      {a.tokenCode}
                    </p>
                    <p className="text-mist mt-2 text-[18px]">
                      {fullName(patients.get(a.patientId)).split(" ")[0]}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <p className="text-mist/70 pb-4 text-center text-[12px]">
        Demo screen. Click Call Next on the Tokens page in the other tab to see
        it change.
      </p>
    </div>
  );
}

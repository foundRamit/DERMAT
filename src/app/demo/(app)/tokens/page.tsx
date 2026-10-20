"use client";

import { MagnifyingGlass, Monitor, PhoneCall } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import {
  Button,
  Card,
  PageTitle,
  Token,
  cx,
  inputClass,
} from "../../_components/ui";
import {
  type Appointment,
  byId,
  dispatch,
  doctors,
  fullName,
  genderShort,
  procedureName,
  useDemo,
  userName,
} from "../../_lib/store";

export default function TokensPage() {
  const state = useDemo();
  const patients = byId(state.patients);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const today = state.appointments.filter((a) => {
    if (a.day !== 0) return false;
    if (!q) return true;
    const p = patients.get(a.patientId);
    return `${a.tokenCode} ${fullName(p)} ${p?.uhid}`.toLowerCase().includes(q);
  });
  const byQueue = (a: Appointment, b: Appointment) => a.queue - b.queue;
  const proc = today.filter((a) => a.service === "PROCEDURE");
  const nobodyWaiting = !today.some(
    (a) => a.status === "CHECKED_IN" || a.status === "IN_PROGRESS",
  );

  return (
    <>
      <PageTitle
        title="Queue Tokens"
        subtitle="Live OPD and procedure queues for today."
        action={
          <Link
            href="/demo/token-display"
            target="_blank"
            className="border-line-strong hover:border-ink inline-flex h-11 items-center gap-2 rounded-xl border bg-white/70 px-5 font-medium"
          >
            <Monitor size={17} aria-hidden /> Token Display
          </Link>
        }
      />

      <label className="relative mb-4 block max-w-[420px]">
        <span className="sr-only">Search</span>
        <MagnifyingGlass
          size={15}
          aria-hidden
          className="text-muted absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search token, name, UHID…"
          className={cx(inputClass, "pl-9")}
        />
      </label>

      {nobodyWaiting && (
        <p className="bg-vellum/70 mb-4 rounded-xl px-4 py-3 text-[14px]">
          Queue is empty. No one is checked in. Check a patient in from the{" "}
          <Link
            href="/demo/opd"
            className="text-oxblood font-medium hover:underline"
          >
            OPD schedule
          </Link>
          .
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        {doctors.map((d) => {
          const mine = today.filter(
            (a) => a.service === "OPD" && a.doctorId === d.id,
          );
          const now = mine.find((a) => a.status === "IN_PROGRESS");
          const waiting = mine
            .filter((a) => a.status === "CHECKED_IN")
            .sort(byQueue);
          const nowPatient = now ? patients.get(now.patientId) : undefined;
          return (
            <Card
              key={d.id}
              title={`OPD Queue · ${d.name}`}
              subtitle={`${waiting.length} waiting · ${now ? 1 : 0} in consult`}
              action={
                <Button
                  variant="primary"
                  disabled={!now && waiting.length === 0}
                  onClick={() =>
                    dispatch({ type: "call-next", doctorId: d.id })
                  }
                >
                  <PhoneCall size={15} aria-hidden /> Call Next
                </Button>
              }
            >
              <div className="p-4">
                <div className="from-ink to-oxblood text-parchment rounded-2xl bg-gradient-to-br p-5">
                  <p className="text-gold font-mono text-[11px] tracking-[0.16em] uppercase">
                    Now calling
                  </p>
                  {now ? (
                    <>
                      <p className="mt-1 font-mono text-[52px] leading-none font-semibold">
                        {now.tokenCode}
                      </p>
                      <p className="mt-2 text-[16px] font-medium">
                        {fullName(nowPatient)}
                      </p>
                      <p className="text-mist text-[12px]">
                        {nowPatient?.uhid} · {nowPatient?.age} ·{" "}
                        {nowPatient ? genderShort(nowPatient.gender) : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-mist mt-3">No patient in consultation</p>
                  )}
                </div>
                <p className="text-muted mt-4 mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Waiting
                </p>
                <ol className="grid gap-1">
                  {waiting.map((a, i) => (
                    <li
                      key={a.id}
                      className="border-line flex items-center gap-3 rounded-xl border bg-white/70 px-3 py-2"
                    >
                      <span className="text-muted w-4 text-[12px]">
                        {i + 1}
                      </span>
                      <Token code={a.tokenCode} className="w-12" />
                      <span className="min-w-0 flex-1 truncate">
                        {fullName(patients.get(a.patientId))}
                      </span>
                      <span className="text-muted font-mono text-[11px]">
                        {patients.get(a.patientId)?.uhid}
                      </span>
                    </li>
                  ))}
                  {waiting.length === 0 && (
                    <li className="text-muted px-1 text-[13px]">Queue empty</li>
                  )}
                </ol>
              </div>
            </Card>
          );
        })}

        <Card
          title="Procedure Queue"
          subtitle="Several procedures can run at the same time."
        >
          <div className="grid gap-4 p-4">
            {(["IN_PROGRESS", "CHECKED_IN"] as const).map((status) => {
              const list = proc
                .filter((a) => a.status === status)
                .sort(byQueue);
              return (
                <div key={status}>
                  <p className="text-muted mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                    {status === "IN_PROGRESS" ? "In procedure" : "Waiting"}
                  </p>
                  <ul className="grid gap-1">
                    {list.map((a) => (
                      <li
                        key={a.id}
                        className="border-line flex items-center gap-3 rounded-xl border bg-white/70 px-3 py-2"
                      >
                        <Token code={a.tokenCode} className="w-12" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">
                            {fullName(patients.get(a.patientId))}
                          </span>
                          <span className="text-muted block truncate text-[12px]">
                            {procedureName(a.procedureId)} ·{" "}
                            {a.staff[0] ?? userName(a.doctorId)}
                          </span>
                        </span>
                        {status === "IN_PROGRESS" ? (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              dispatch({ type: "complete", id: a.id })
                            }
                          >
                            Done
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                              dispatch({ type: "start", id: a.id })
                            }
                          >
                            Start
                          </Button>
                        )}
                      </li>
                    ))}
                    {list.length === 0 && (
                      <li className="text-muted px-1 text-[13px]">None</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

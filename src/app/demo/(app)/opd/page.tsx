"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BookButton, RxButton } from "../../_components/dialogs";
import {
  Button,
  Card,
  Empty,
  Modal,
  PageTitle,
  StatusBadge,
  Token,
  TypeChip,
  cx,
  inputBase,
  inputClass,
} from "../../_components/ui";
import { BookingForm } from "../../_components/booking-form";
import {
  type Appointment,
  balanceOf,
  byId,
  dispatch,
  doctors,
  fullName,
  genderShort,
  money,
  paidOf,
  toHHMM,
  toMinutes,
  useDemo,
} from "../../_lib/store";

type Filter =
  | "ALL"
  | "FIRST"
  | "FOLLOW_UP"
  | "FREE"
  | "WALK_IN"
  | "SCHEDULED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NO_SHOW";

const matches = (a: Appointment, f: Filter) => {
  if (f === "ALL") return true;
  if (f === "FIRST" || f === "FOLLOW_UP" || f === "FREE")
    return a.visitCategory === f;
  if (f === "WALK_IN") return a.walkIn;
  return a.status === f;
};

export default function OpdPage() {
  const state = useDemo();
  const router = useRouter();
  const patients = byId(state.patients);
  const invoices = byId(state.invoices);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [doctor, setDoctor] = useState("all");
  const [query, setQuery] = useState("");
  const [latestFirst, setLatestFirst] = useState(false);
  const [noShow, setNoShow] = useState<Appointment | null>(null);
  const [rebook, setRebook] = useState<string | null>(null);

  const day = state.appointments.filter(
    (a) =>
      a.day === 0 &&
      a.service === "OPD" &&
      a.status !== "CANCELLED" &&
      (doctor === "all" || a.doctorId === doctor),
  );
  const q = query.trim().toLowerCase();
  const rows = day
    .filter((a) => matches(a, filter))
    .filter((a) => {
      if (!q) return true;
      const p = patients.get(a.patientId);
      return `${fullName(p)} ${p?.uhid} ${a.tokenCode} ${p?.phone}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => (latestFirst ? -1 : 1) * a.start.localeCompare(b.start));

  const count = (f: Filter) => day.filter((a) => matches(a, f)).length;
  const cards: { f: Filter; label: string; note?: string }[][] = [
    [
      { f: "ALL", label: "Total Visits" },
      { f: "FIRST", label: "First consultation" },
      { f: "FOLLOW_UP", label: "Follow-up" },
      { f: "FREE", label: "Free" },
    ],
    [
      { f: "WALK_IN", label: "Walk-ins", note: "of total" },
      { f: "SCHEDULED", label: "Scheduled" },
      { f: "CHECKED_IN", label: "Checked In" },
      { f: "IN_PROGRESS", label: "In Progress" },
      { f: "COMPLETED", label: "Completed" },
      { f: "NO_SHOW", label: "No Show" },
    ],
  ];

  function consult(a: Appointment) {
    if (a.status !== "IN_PROGRESS") dispatch({ type: "start", id: a.id });
    router.push(`/demo/consultations/new/${a.id}`);
  }

  const noShowInvoice = noShow ? invoices.get(noShow.invoiceId) : undefined;
  const noShowPatient = noShow ? patients.get(noShow.patientId) : undefined;
  const noShowPaid = noShowInvoice ? paidOf(noShowInvoice) : 0;

  return (
    <>
      <PageTitle
        title="OPD · Out-Patient Department"
        subtitle="Today's appointments and the waiting line."
        extra={
          <Link
            href="/demo/procedures"
            className="border-line-strong hover:border-ink rounded-full border px-3 py-1 text-[13px]"
          >
            Procedures →
          </Link>
        }
        action={<BookButton />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Search</span>
          <MagnifyingGlass
            size={15}
            aria-hidden
            className="text-muted absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient, UHID, token…"
            className={cx(inputClass, "pl-9")}
          />
        </label>
        <select
          aria-label="Doctor"
          value={doctor}
          onChange={(e) => setDoctor(e.target.value)}
          className={cx(inputBase, "w-auto")}
        >
          <option value="all">All doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <Button onClick={() => setLatestFirst((v) => !v)}>
          {latestFirst ? "Latest first" : "Earliest first"}
        </Button>
      </div>

      {cards.map((row, i) => (
        <div
          key={i}
          className={cx(
            "mb-3 grid gap-3",
            i === 0
              ? "grid-cols-2 md:grid-cols-4"
              : "grid-cols-3 md:grid-cols-6",
          )}
        >
          {row.map((c) => {
            const active = filter === c.f && c.f !== "ALL";
            return (
              <button
                key={c.f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(active ? "ALL" : c.f)}
                className={cx(
                  "cursor-pointer rounded-2xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-ink bg-white"
                    : "border-line hover:border-line-strong bg-white/60",
                )}
              >
                <span className="text-muted flex items-center justify-between text-[12px] font-medium">
                  {c.label}
                  {active && (
                    <span className="bg-ink text-parchment rounded-full px-1.5 text-[10px]">
                      Clear
                    </span>
                  )}
                </span>
                <span className="mt-1 block font-serif text-[30px] leading-none">
                  {count(c.f)}
                  {c.note && (
                    <span className="text-muted ml-1 font-sans text-[12px]">
                      {c.note}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ))}

      <Card
        title="Day's schedule"
        subtitle="All OPD appointments for today."
        className="mt-4"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="text-muted border-line border-b text-[12px]">
              <tr>
                {[
                  "Token",
                  "Time",
                  "Patient",
                  "Age / Gender",
                  "Type",
                  "Status",
                  "",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium first:pl-5">
                    {h || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const p = patients.get(a.patientId);
                const inv = invoices.get(a.invoiceId);
                const due = inv ? balanceOf(inv) : 0;
                return (
                  <tr
                    key={a.id}
                    className={cx(
                      "border-line border-b last:border-0",
                      a.status === "IN_PROGRESS" && "bg-[#f6eef7]",
                    )}
                  >
                    <td className="py-3 pr-4 pl-5">
                      <Token code={a.tokenCode} className="text-[15px]" />
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap">
                      {a.start}-{toHHMM(toMinutes(a.start) + a.duration)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/demo/patients/${a.patientId}`}
                        className="font-medium hover:underline"
                      >
                        {fullName(p)}
                      </Link>
                      <span className="text-muted block font-mono text-[12px]">
                        {p?.uhid}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {p?.age} / {p ? genderShort(p.gender) : ""}
                    </td>
                    <td className="px-4 py-3">
                      <TypeChip type={a.type} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                      {due > 0 && a.status !== "NO_SHOW" && (
                        <span className="mt-1 block text-[12px] text-[#a0570b]">
                          {money(due)} due
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {a.status === "SCHEDULED" && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                              dispatch({ type: "check-in", id: a.id })
                            }
                          >
                            Check In
                          </Button>
                        )}
                        {(a.status === "CHECKED_IN" ||
                          a.status === "IN_PROGRESS") &&
                          !a.consultationId && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => consult(a)}
                            >
                              Consult
                            </Button>
                          )}
                        {a.status === "COMPLETED" &&
                          (a.consultationId ? (
                            <RxButton consultationId={a.consultationId} />
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(`/demo/consultations/new/${a.id}`)
                              }
                            >
                              Note pending
                            </Button>
                          ))}
                        {a.status === "NO_SHOW" ? (
                          <Button
                            size="sm"
                            onClick={() => setRebook(a.patientId)}
                          >
                            Rebook
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(`/demo/billing/${a.invoiceId}`)
                            }
                          >
                            Bill
                          </Button>
                        )}
                        {(a.status === "SCHEDULED" ||
                          a.status === "CHECKED_IN") &&
                          !a.consultationId && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setNoShow(a)}
                            >
                              No Show
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <Empty>
            {day.length === 0
              ? "No appointments today yet. Click Book Appointment, or Start over at the top for a full sample day."
              : "No appointments match."}
          </Empty>
        )}
        <p className="border-line text-muted border-t px-5 py-2.5 text-[12px]">
          Showing {rows.length} appointments
          {rows.length !== day.length && ` (filtered from ${day.length})`}
        </p>
      </Card>

      <Modal
        open={noShow !== null}
        onClose={() => setNoShow(null)}
        title="Mark no-show?"
      >
        <p className="text-body">
          {fullName(noShowPatient)} did not come. Their bill for this visit will
          be cancelled.
        </p>
        <div className="bg-vellum/60 mt-4 grid gap-1 rounded-xl p-3 text-[14px]">
          {noShowPaid > 0 ? (
            <>
              <p>
                Paid {money(noShowPaid)} → kept as advance for the next visit
              </p>
              <p className="text-muted">
                Advance {money(noShowPatient?.wallet ?? 0)} →{" "}
                {money((noShowPatient?.wallet ?? 0) + noShowPaid)}
              </p>
            </>
          ) : (
            <p>Nothing was paid, so nothing is owed.</p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setNoShow(null)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (noShow) dispatch({ type: "no-show", id: noShow.id });
              setNoShow(null);
            }}
          >
            Confirm no-show
          </Button>
        </div>
      </Modal>

      <Modal
        open={rebook !== null}
        onClose={() => setRebook(null)}
        title="Rebook"
        wide
      >
        {rebook && (
          <BookingForm
            initialPatientId={rebook}
            onClose={() => setRebook(null)}
          />
        )}
      </Modal>
    </>
  );
}

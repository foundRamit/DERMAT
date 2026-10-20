"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BookButton } from "../../_components/dialogs";
import {
  Button,
  Card,
  Empty,
  PageTitle,
  Pills,
  StatusBadge,
  Token,
  cx,
  inputClass,
} from "../../_components/ui";
import {
  balanceOf,
  byId,
  dayLabel,
  dispatch,
  fullName,
  genderShort,
  money,
  procedureName,
  sittingsDone,
  useDemo,
  useHydrated,
} from "../../_lib/store";

export default function ProceduresPage() {
  const state = useDemo();
  const hydrated = useHydrated();
  const router = useRouter();
  const patients = byId(state.patients);
  const invoices = byId(state.invoices);
  const [tab, setTab] = useState<"schedule" | "courses">("schedule");
  const [query, setQuery] = useState("");

  const schedule = state.appointments
    .filter(
      (a) =>
        a.day === 0 && a.service === "PROCEDURE" && a.status !== "CANCELLED",
    )
    .sort((a, b) => a.start.localeCompare(b.start));
  const active = state.courses.filter((c) => c.status === "ACTIVE");
  const q = query.trim().toLowerCase();
  const courses = active.filter((c) => {
    const p = patients.get(c.patientId);
    return (
      !q ||
      `${fullName(p)} ${p?.uhid} ${procedureName(c.procedureId)}`
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <>
      <PageTitle
        title="Procedures"
        subtitle="Procedure schedule. Several procedures can run at the same time."
        extra={
          <>
            <Link
              href="/demo/opd"
              className="border-line-strong hover:border-ink rounded-full border px-3 py-1 text-[13px]"
            >
              ← OPD
            </Link>
            <span className="bg-vellum rounded-full px-3 py-1 text-[13px]">
              {active.length} active courses
            </span>
          </>
        }
        action={<BookButton service="PROCEDURE" />}
      />

      <div className="mb-4">
        <Pills
          label="View"
          value={tab}
          onChange={setTab}
          options={[
            { value: "schedule", label: "Schedule" },
            { value: "courses", label: "Active Courses" },
          ]}
        />
      </div>

      {tab === "schedule" ? (
        <Card title="Today's procedures" subtitle={`${schedule.length} booked`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="text-muted border-line border-b text-[12px]">
                <tr>
                  {[
                    "Token",
                    "Time",
                    "Patient",
                    "Age / Gender",
                    "Procedure",
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
                {schedule.map((a) => {
                  const p = patients.get(a.patientId);
                  const course = state.courses.find((c) => c.id === a.courseId);
                  const inv = invoices.get(a.invoiceId);
                  const due = inv ? balanceOf(inv) : 0;
                  return (
                    <tr
                      key={a.id}
                      className="border-line border-b last:border-0"
                    >
                      <td className="py-3 pr-4 pl-5">
                        <Token code={a.tokenCode} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px]">
                        {a.start}{" "}
                        <span className="text-muted">({a.duration}m)</span>
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
                        <span className="rounded-md bg-[#efe1f0] px-2 py-1 text-[12px] font-medium text-[#6b2f73]">
                          {procedureName(a.procedureId)}
                        </span>
                        <span className="text-muted mt-1 block text-[12px]">
                          {course &&
                            `Sitting ${a.sitting}/${course.totalSittings} · `}
                          {[...a.staff, ...a.machines].join(", ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                        {due > 0 && (
                          <span className="mt-1 block text-[12px] text-[#a0570b]">
                            {money(due)} due
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
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
                          {a.status === "CHECKED_IN" && (
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
                          {a.status === "IN_PROGRESS" && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() =>
                                dispatch({ type: "complete", id: a.id })
                              }
                            >
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(`/demo/billing/${a.invoiceId}`)
                            }
                          >
                            Bill
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {schedule.length === 0 && <Empty>No procedures booked today.</Empty>}
        </Card>
      ) : (
        <Card
          title="Active Courses"
          subtitle="Treatments that take several sittings"
          action={
            <label className="relative w-full sm:w-72">
              <span className="sr-only">Search courses</span>
              <MagnifyingGlass
                size={15}
                aria-hidden
                className="text-muted absolute top-1/2 left-3 -translate-y-1/2"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient / UHID / procedure…"
                className={cx(inputClass, "pl-9")}
              />
            </label>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="text-muted border-line border-b text-[12px]">
                <tr>
                  {[
                    "Patient",
                    "Procedure",
                    "Progress",
                    "Previous sitting",
                    "Next due",
                    "",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium first:pl-5">
                      {h || <span className="sr-only">Action</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const p = patients.get(c.patientId);
                  const done = sittingsDone(state, c.id);
                  const past = state.appointments
                    .filter(
                      (a) => a.courseId === c.id && a.status === "COMPLETED",
                    )
                    .map((a) => a.day);
                  const last = past.length ? Math.max(...past) : null;
                  const upcoming = state.appointments.some(
                    (a) =>
                      a.courseId === c.id &&
                      a.day === 0 &&
                      a.status !== "COMPLETED" &&
                      a.status !== "CANCELLED" &&
                      a.status !== "NO_SHOW",
                  );
                  const nextDue = last === null ? 0 : last + c.intervalDays;
                  return (
                    <tr
                      key={c.id}
                      className="border-line border-b last:border-0"
                    >
                      <td className="py-3 pr-4 pl-5">
                        <Link
                          href={`/demo/patients/${c.patientId}`}
                          className="font-medium hover:underline"
                        >
                          {fullName(p)}
                        </Link>
                        <span className="text-muted block font-mono text-[12px]">
                          {p?.uhid}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {procedureName(c.procedureId)}
                        <span className="text-muted block text-[12px]">
                          {money(c.pricePerSitting)} per sitting
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-1"
                          aria-label={`${done} of ${c.totalSittings} sittings done`}
                        >
                          {Array.from({ length: c.totalSittings }, (_, i) => (
                            <span
                              key={i}
                              className={cx(
                                "size-2.5 rounded-full",
                                i < done ? "bg-oxblood" : "bg-line-strong",
                              )}
                            />
                          ))}
                          <span className="text-muted ml-2 font-mono text-[12px]">
                            {done}/{c.totalSittings}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {last === null
                          ? "First sitting"
                          : dayLabel(last, hydrated)}
                      </td>
                      <td
                        className={cx(
                          "px-4 py-3 text-[13px]",
                          nextDue <= 0 &&
                            !upcoming &&
                            "text-oxblood font-medium",
                        )}
                      >
                        {upcoming
                          ? "Booked today"
                          : nextDue <= 0
                            ? "Due now"
                            : dayLabel(nextDue, hydrated)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!upcoming && done < c.totalSittings && (
                          <BookButton
                            service="PROCEDURE"
                            patientId={c.patientId}
                            label="Book next sitting"
                            variant="secondary"
                            size="sm"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {courses.length === 0 && <Empty>No active courses.</Empty>}
        </Card>
      )}
    </>
  );
}

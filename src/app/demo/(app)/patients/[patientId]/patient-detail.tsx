"use client";

import { ArrowLeft, Wallet } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import { BookButton, RxButton } from "../../../_components/dialogs";
import {
  Button,
  Card,
  Empty,
  Field,
  Modal,
  PayBadge,
  Pills,
  StatusBadge,
  Token,
  cx,
  inputClass,
} from "../../../_components/ui";
import {
  type Method,
  balanceOf,
  dayLabel,
  dispatch,
  fullName,
  invoiceTotal,
  methodLabel,
  money,
  newId,
  payStatus,
  procedureName,
  sittingsDone,
  useDemo,
  useHydrated,
  userName,
} from "../../../_lib/store";

type Tab = "overview" | "consultations" | "procedures" | "billing";

export function PatientDetail({ id }: { id: string }) {
  const state = useDemo();
  const hydrated = useHydrated();
  const [tab, setTab] = useState<Tab>("overview");
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const patient = state.patients.find((p) => p.id === id);

  if (!patient) {
    return hydrated ? (
      <Empty>
        This patient is not in the sample clinic.{" "}
        <Link href="/demo/patients" className="text-oxblood hover:underline">
          Back to patients
        </Link>
      </Empty>
    ) : null;
  }

  const visits = state.appointments
    .filter((a) => a.patientId === id)
    .sort((a, b) => b.day - a.day || b.start.localeCompare(a.start));
  const consultations = state.consultations
    .filter((c) => c.patientId === id)
    .sort((a, b) => b.day - a.day);
  const courses = state.courses.filter((c) => c.patientId === id);
  const invoices = state.invoices
    .filter((i) => i.patientId === id)
    .sort((a, b) => b.number.localeCompare(a.number));
  const open = invoices.filter((i) => balanceOf(i) > 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <Link
          href="/demo/patients"
          aria-label="Back to patients"
          className="border-line-strong hover:border-ink inline-flex size-10 items-center justify-center rounded-xl border bg-white/70"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-[36px] leading-none">
              {patient.title} {fullName(patient)}
            </h1>
            <span className="bg-vellum rounded-full px-2.5 py-0.5 font-mono text-[12px]">
              {patient.uhid}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#dfe9d6] px-2.5 py-0.5 text-[12px] text-[#3e5a2c]">
              <Wallet size={13} aria-hidden /> Advance {money(patient.wallet)}
            </span>
          </div>
          <p className="text-muted mt-2 text-[14px]">
            {patient.age}{" "}
            {patient.gender === "MALE"
              ? "Male"
              : patient.gender === "FEMALE"
                ? "Female"
                : "Other"}{" "}
            · {patient.phone}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={() => setAdvanceOpen(true)}>
            Take Advance
          </Button>
          <BookButton patientId={id} variant="secondary" />
          <BookButton patientId={id} service="PROCEDURE" />
        </div>
      </div>

      {patient.allergies !== "None" && (
        <p className="bg-blush/70 text-oxblood mb-4 rounded-xl px-4 py-2.5 text-[14px] font-medium">
          Allergies: {patient.allergies}
        </p>
      )}

      <div className="mb-4">
        <Pills
          label="Patient sections"
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            {
              value: "consultations",
              label: `Consultations (${consultations.length})`,
            },
            { value: "procedures", label: "Procedures" },
            { value: "billing", label: "Billing" },
          ]}
        />
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Personal Details">
            <dl className="grid grid-cols-[130px_1fr] gap-y-2 px-5 py-4 text-[14px]">
              <dt className="text-muted">Phone</dt>
              <dd>{patient.phone}</dd>
              <dt className="text-muted">Address</dt>
              <dd>
                {patient.address}, {patient.city}
              </dd>
              <dt className="text-muted">Skin type</dt>
              <dd>{patient.skinType}</dd>
              <dt className="text-muted">Allergies</dt>
              <dd
                className={cx(
                  patient.allergies !== "None" && "text-oxblood font-medium",
                )}
              >
                {patient.allergies}
              </dd>
            </dl>
          </Card>
          <Card title="Visits">
            <ul>
              {visits.slice(0, 8).map((a) => (
                <li
                  key={a.id}
                  className="border-line flex items-center gap-3 border-b px-5 py-2.5 last:border-0"
                >
                  <span className="text-muted w-20 text-[12px]">
                    {dayLabel(a.day, hydrated)}
                  </span>
                  <Token code={a.tokenCode} className="w-10 text-[12px]" />
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    {a.service === "OPD"
                      ? a.chiefComplaint
                      : procedureName(a.procedureId)}
                  </span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
            {visits.length === 0 && <Empty>No visits yet.</Empty>}
          </Card>
          {courses.length > 0 && (
            <Card title="Procedures" className="lg:col-span-2">
              <CourseList patientId={id} />
            </Card>
          )}
        </div>
      )}

      {tab === "consultations" && (
        <Card>
          <ul>
            {consultations.map((c) => (
              <li
                key={c.id}
                className="border-line flex flex-wrap items-center gap-3 border-b px-5 py-3 last:border-0"
              >
                <span className="text-muted w-24 text-[13px]">
                  {dayLabel(c.day, hydrated)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    {c.diagnoses.join(", ") || c.chiefComplaint}
                  </span>
                  <span className="text-muted block text-[12px]">
                    {c.number} · {userName(c.doctorId)} · {c.rx.length}{" "}
                    medicines
                  </span>
                </span>
                <RxButton consultationId={c.id} />
              </li>
            ))}
          </ul>
          {consultations.length === 0 && <Empty>No consultations yet.</Empty>}
        </Card>
      )}

      {tab === "procedures" && (
        <Card title="Procedure Courses">
          <CourseList patientId={id} />
          {courses.length === 0 && <Empty>No procedure courses.</Empty>}
        </Card>
      )}

      {tab === "billing" && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Advance", money(patient.wallet)],
              ["Bills", String(invoices.length)],
              [
                "Total billed",
                money(
                  invoices
                    .filter((i) => i.kind !== "ADV" && !i.voided)
                    .reduce((s, i) => s + invoiceTotal(i), 0),
                ),
              ],
              ["Open bills", String(open.length)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-line rounded-2xl border bg-white/60 px-4 py-3"
              >
                <p className="text-muted text-[12px]">{label}</p>
                <p className="mt-1 font-serif text-[26px] leading-none">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <Card title="Invoices">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="text-muted border-line border-b text-[12px]">
                  <tr>
                    {["Invoice No.", "Date", "For", "Amount", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 font-medium first:pl-5"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr
                      key={i.id}
                      className="border-line hover:bg-vellum/40 border-b last:border-0"
                    >
                      <td className="py-3 pr-4 pl-5">
                        <Link
                          href={`/demo/billing/${i.id}`}
                          className="text-oxblood font-mono text-[13px] hover:underline"
                        >
                          {i.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {dayLabel(i.day, hydrated)}
                      </td>
                      <td className="text-body px-4 py-3 text-[13px]">
                        {i.lines.map((l) => l.description).join(", ")}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px]">
                        {money(invoiceTotal(i))}
                      </td>
                      <td className="px-4 py-3">
                        <PayBadge status={payStatus(i)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal
        open={advanceOpen}
        onClose={() => setAdvanceOpen(false)}
        title="Take Advance"
      >
        <AdvanceForm patientId={id} onDone={() => setAdvanceOpen(false)} />
      </Modal>
    </>
  );
}

function CourseList({ patientId }: { patientId: string }) {
  const state = useDemo();
  const courses = state.courses.filter((c) => c.patientId === patientId);
  return (
    <ul>
      {courses.map((c) => {
        const done = sittingsDone(state, c.id);
        return (
          <li
            key={c.id}
            className="border-line flex flex-wrap items-center gap-4 border-b px-5 py-3 last:border-0"
          >
            <span className="min-w-[180px] flex-1">
              <span className="block font-medium">
                {procedureName(c.procedureId)}
              </span>
              <span className="text-muted block text-[12px]">
                {money(c.pricePerSitting)} per sitting · every {c.intervalDays}{" "}
                days
              </span>
            </span>
            <span className="flex items-center gap-1">
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
                {done} / {c.totalSittings}
              </span>
            </span>
            <span
              className={cx(
                "text-[12px] font-medium",
                c.status === "ACTIVE" ? "text-[#3e6b2f]" : "text-muted",
              )}
            >
              {c.status === "ACTIVE"
                ? "Active"
                : c.status === "COMPLETED"
                  ? "Completed"
                  : "Cancelled"}
            </span>
            {c.status === "ACTIVE" && done < c.totalSittings && (
              <BookButton
                service="PROCEDURE"
                patientId={patientId}
                label="Book next sitting"
                variant="secondary"
                size="sm"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function AdvanceForm({
  patientId,
  onDone,
}: {
  patientId: string;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("UPI");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!Number(amount)) return;
        dispatch({
          type: "advance",
          patientId,
          amount: Number(amount),
          method,
          invoiceId: newId("i"),
        });
        onDone();
      }}
      className="grid gap-4"
    >
      <p className="text-body text-[14px]">
        Money paid in advance, for example for a full course. It is used up
        automatically on the patient&apos;s next bills.
      </p>
      <Field label="Amount (₹)" required>
        <input
          autoFocus
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          className={cx(inputClass, "font-mono")}
        />
      </Field>
      <Field label="Method">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as Method)}
          className={inputClass}
        >
          {(["CASH", "UPI", "CARD", "BANK_TRANSFER"] as const).map((m) => (
            <option key={m} value={m}>
              {methodLabel[m]}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary" size="lg">
          Take {amount ? money(Number(amount)) : "advance"}
        </Button>
      </div>
    </form>
  );
}

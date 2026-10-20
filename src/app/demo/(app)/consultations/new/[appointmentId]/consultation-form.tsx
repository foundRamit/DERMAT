"use client";

import { ArrowLeft, Plus, Trash, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RxSheet } from "../../../../_components/dialogs";
import {
  Button,
  Empty,
  Field,
  Modal,
  cx,
  inputBase,
  inputClass,
} from "../../../../_components/ui";
import {
  type Consultation,
  type RxItem,
  dayLabel,
  diagnosesList,
  dispatch,
  followUpOptions,
  frequencies,
  fullName,
  genderShort,
  medicines,
  newId,
  opdCharges,
  procedureName,
  procedures,
  remarks,
  units,
  useDemo,
  useHydrated,
  userName,
} from "../../../../_lib/store";
import { templates } from "../../../../_lib/templates";

const emptyRow = (): RxItem => ({
  medicine: "",
  dosage: "",
  unit: "Tab",
  frequency: "1-0-1",
  duration: "",
  remark: "After food",
});

/** Waits for the browser's copy of the clinic, so visits booked in this session are found. */
export function ConsultationForm({ appointmentId }: { appointmentId: string }) {
  const hydrated = useHydrated();
  return hydrated ? <ConsultationEditor appointmentId={appointmentId} /> : null;
}

function ConsultationEditor({ appointmentId }: { appointmentId: string }) {
  const state = useDemo();
  const router = useRouter();
  const appt = state.appointments.find((a) => a.id === appointmentId);
  const existing = state.consultations.find(
    (c) => c.appointmentId === appointmentId,
  );
  const patient = state.patients.find((p) => p.id === appt?.patientId);

  const [complaint, setComplaint] = useState(
    existing?.chiefComplaint ?? appt?.chiefComplaint ?? "",
  );
  const [history, setHistory] = useState(existing?.history ?? "");
  const [diagnoses, setDiagnoses] = useState<string[]>(
    existing?.diagnoses ?? [],
  );
  const [rx, setRx] = useState<RxItem[]>(existing?.rx ?? [emptyRow()]);
  const [advised, setAdvised] = useState(existing?.advised ?? []);
  const [instructions, setInstructions] = useState(
    existing?.instructions ?? "",
  );
  const [followUp, setFollowUp] = useState<number | null>(
    existing?.followUpWeeks ?? 2,
  );
  const [preview, setPreview] = useState<Consultation | null>(null);
  const [saved, setSaved] = useState(false);

  if (!appt || !patient) {
    return (
      <Empty>
        This visit is not in the sample clinic.{" "}
        <Link href="/demo/opd" className="text-oxblood hover:underline">
          Back to OPD
        </Link>
      </Empty>
    );
  }

  const past = state.consultations
    .filter(
      (c) => c.patientId === patient.id && c.appointmentId !== appointmentId,
    )
    .sort((a, b) => b.day - a.day);

  function build(): Consultation {
    const n = state.consultations.length + 1;
    return {
      id: existing?.id ?? newId("k"),
      number: existing?.number ?? `CON-${1000 + n}`,
      appointmentId,
      patientId: patient!.id,
      doctorId: appt!.doctorId,
      day: 0,
      chiefComplaint: complaint,
      history,
      diagnoses,
      rx: rx.filter((r) => r.medicine),
      advised,
      instructions,
      followUpWeeks: followUp,
    };
  }

  function applyTemplate(name: string) {
    const t = templates.find((x) => x.name === name);
    if (!t) return;
    const hasContent = diagnoses.length > 0 || rx.some((r) => r.medicine);
    if (
      hasContent &&
      !window.confirm(
        "Some of this is already filled in. Replace it with the template?",
      )
    )
      return;
    setDiagnoses(t.diagnoses);
    setRx(t.rx);
    setAdvised(t.advised);
    setInstructions(t.instructions);
    setFollowUp(t.followUpWeeks);
  }

  function save(andPrint: boolean) {
    const c = build();
    dispatch({ type: "save-consultation", consultation: c });
    setSaved(true);
    if (andPrint) setPreview(c);
    else router.push("/demo/opd");
  }

  const updateRow = (i: number, patch: Partial<RxItem>) =>
    setRx(rx.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          href="/demo/opd"
          aria-label="Back to OPD"
          className="border-line-strong hover:border-ink inline-flex size-10 items-center justify-center rounded-xl border bg-white/70"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-[34px] leading-none">
            {existing ? "Edit Consultation" : "New Consultation"}
          </h1>
          <p className="text-muted mt-1">{fullName(patient)}</p>
        </div>
        <Button size="lg" onClick={() => setPreview(build())}>
          Preview
        </Button>
        <Button size="lg" onClick={() => save(true)}>
          Save & Print
        </Button>
        <Button size="lg" variant="primary" onClick={() => save(false)}>
          Save
        </Button>
      </div>

      {state.role === "reception" && (
        <p className="mb-4 rounded-xl bg-[#e3ecf3] px-4 py-2.5 text-[13px] text-[#2f5571]">
          In the clinic this screen is used by the doctor. Switch “Viewing as”
          to Doctor at the top to see it the way they would.
        </p>
      )}

      <div className="border-line mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-2xl border bg-white/60 px-5 py-3 text-[13px] md:grid-cols-6">
        {[
          ["Patient", fullName(patient)],
          ["Age / Sex", `${patient.age} / ${genderShort(patient.gender)}`],
          ["UHID", patient.uhid],
          ["Phone", patient.phone],
          ["Consultant", userName(appt.doctorId)],
          [
            "Visit",
            appt.visitCategory
              ? opdCharges[appt.visitCategory].name.replace("OPD ", "")
              : "OPD",
          ],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-muted text-[11px]">{k}</p>
            <p className="font-medium">{v}</p>
          </div>
        ))}
      </div>

      {patient.allergies !== "None" && (
        <p className="bg-blush/70 text-oxblood mb-4 rounded-xl px-4 py-2.5 font-medium">
          Allergies: {patient.allergies}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-line h-fit rounded-2xl border bg-white/60 p-4">
          <p className="font-semibold">History</p>
          <p className="text-muted text-[12px]">
            {past.length} previous visits
          </p>
          <ul className="mt-3 grid gap-2">
            {past.map((c) => (
              <li
                key={c.id}
                className="border-line rounded-xl border bg-white/70 p-3 text-[13px]"
              >
                <p className="text-muted text-[12px]">
                  {dayLabel(c.day, true)} · {userName(c.doctorId)}
                </p>
                <p className="font-medium">
                  {c.diagnoses.join(", ") || c.chiefComplaint}
                </p>
                <ul className="text-body mt-1 text-[12px]">
                  {c.rx.map((r, i) => (
                    <li key={i}>
                      {r.medicine} · {r.frequency} · {r.duration}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setRx(c.rx.length ? c.rx : [emptyRow()]);
                    setDiagnoses(c.diagnoses);
                  }}
                  className="text-oxblood mt-2 cursor-pointer text-[12px] font-medium hover:underline"
                >
                  Repeat Rx from this visit
                </button>
              </li>
            ))}
            {past.length === 0 && (
              <li className="text-muted text-[13px]">
                No previous consultations.
              </li>
            )}
          </ul>
        </aside>

        <div className="grid gap-4">
          <Section
            title="Quick-start"
            hint="Pick a condition. It fills in the diagnosis, medicines and advice."
          >
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => applyTemplate(t.name)}
                  className="border-line-strong hover:border-ink cursor-pointer rounded-full border bg-white/70 px-3 py-1.5 text-[13px] hover:bg-white"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Chief complaint & history">
            <div className="grid gap-3">
              <Field label="Chief complaint">
                <input
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="History of present illness">
                <textarea
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  rows={2}
                  className={cx(inputClass, "h-auto py-2")}
                />
              </Field>
            </div>
          </Section>

          <Section title="Provisional Diagnosis">
            <div className="flex flex-wrap items-center gap-1.5">
              {diagnoses.map((d) => (
                <span
                  key={d}
                  className="bg-ink text-parchment inline-flex items-center gap-1 rounded-full py-1 pr-1.5 pl-3 text-[13px]"
                >
                  {d}
                  <button
                    type="button"
                    aria-label={`Remove ${d}`}
                    onClick={() =>
                      setDiagnoses(diagnoses.filter((x) => x !== d))
                    }
                    className="hover:bg-oxblood inline-flex size-5 cursor-pointer items-center justify-center rounded-full"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <select
                aria-label="Add diagnosis"
                value=""
                onChange={(e) =>
                  e.target.value && setDiagnoses([...diagnoses, e.target.value])
                }
                className={cx(inputBase, "w-56")}
              >
                <option value="">+ Add diagnosis</option>
                {diagnosesList
                  .filter((d) => !diagnoses.includes(d))
                  .map((d) => (
                    <option key={d}>{d}</option>
                  ))}
              </select>
            </div>
          </Section>

          <Section title="Prescription (Rx)">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-[13px]">
                <thead className="text-muted text-[12px]">
                  <tr>
                    {[
                      "Medicine",
                      "Dosage",
                      "Unit",
                      "Frequency",
                      "Duration",
                      "Remark",
                      "",
                    ].map((h) => (
                      <th key={h} className="pr-2 pb-2 font-medium">
                        {h || <span className="sr-only">Remove</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rx.map((r, i) => (
                    <tr key={i}>
                      <td className="pr-2 pb-2">
                        <select
                          aria-label="Medicine"
                          value={r.medicine}
                          onChange={(e) =>
                            updateRow(i, { medicine: e.target.value })
                          }
                          className={inputClass}
                        >
                          <option value="">Pick medicine</option>
                          {!medicines.includes(r.medicine) && r.medicine && (
                            <option>{r.medicine}</option>
                          )}
                          {medicines.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </td>
                      <td className="w-24 pr-2 pb-2">
                        <input
                          aria-label="Dosage"
                          placeholder="e.g. 500mg"
                          value={r.dosage}
                          onChange={(e) =>
                            updateRow(i, { dosage: e.target.value })
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="w-28 pr-2 pb-2">
                        <select
                          aria-label="Unit"
                          value={r.unit}
                          onChange={(e) =>
                            updateRow(i, { unit: e.target.value })
                          }
                          className={inputClass}
                        >
                          {units.map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td className="w-40 pr-2 pb-2">
                        <select
                          aria-label="Frequency"
                          value={r.frequency}
                          onChange={(e) =>
                            updateRow(i, { frequency: e.target.value })
                          }
                          className={inputClass}
                        >
                          {frequencies.map((f) => (
                            <option key={f.code} value={f.code}>
                              {f.code} · {f.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="w-28 pr-2 pb-2">
                        <input
                          aria-label="Duration"
                          placeholder="e.g. 7 days"
                          value={r.duration}
                          onChange={(e) =>
                            updateRow(i, { duration: e.target.value })
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="w-44 pr-2 pb-2">
                        <select
                          aria-label="Remark"
                          value={r.remark}
                          onChange={(e) =>
                            updateRow(i, { remark: e.target.value })
                          }
                          className={inputClass}
                        >
                          {!remarks.includes(r.remark) && (
                            <option>{r.remark}</option>
                          )}
                          {remarks.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </td>
                      <td className="pb-2">
                        <button
                          type="button"
                          aria-label="Remove medicine"
                          onClick={() =>
                            setRx(
                              rx.length > 1
                                ? rx.filter((_, j) => j !== i)
                                : [emptyRow()],
                            )
                          }
                          className="text-muted hover:text-oxblood inline-flex size-10 cursor-pointer items-center justify-center rounded-xl"
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRx([...rx, emptyRow()])}
            >
              <Plus size={13} aria-hidden /> Add row
            </Button>
          </Section>

          <Section
            title="Advised Procedures"
            hint="Reception sees these when booking the patient's procedure."
          >
            <div className="grid gap-2">
              {advised.map((a, i) => (
                <div
                  key={i}
                  className="border-line flex flex-wrap items-center gap-3 rounded-xl border bg-white/70 px-3 py-2"
                >
                  <span className="flex-1 font-medium">
                    {procedureName(a.procedureId)}
                  </span>
                  <label className="flex items-center gap-2 text-[13px]">
                    Sittings
                    <input
                      inputMode="numeric"
                      value={a.sittings}
                      onChange={(e) =>
                        setAdvised(
                          advised.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  sittings:
                                    Number(e.target.value.replace(/\D/g, "")) ||
                                    1,
                                }
                              : x,
                          ),
                        )
                      }
                      className={cx(inputBase, "h-8 w-14")}
                    />
                  </label>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() =>
                      setAdvised(advised.filter((_, j) => j !== i))
                    }
                    className="text-muted hover:text-oxblood cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <select
                aria-label="Advise a procedure"
                value=""
                onChange={(e) => {
                  const p = procedures.find((x) => x.id === e.target.value);
                  if (p)
                    setAdvised([
                      ...advised,
                      { procedureId: p.id, sittings: p.sittings },
                    ]);
                }}
                className={cx(inputClass, "max-w-[320px]")}
              >
                <option value="">+ Advise a procedure</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <Section title="Instructions">
            <textarea
              aria-label="Instructions to patient"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Instructions to patient"
              className={cx(inputClass, "h-auto py-2")}
            />
          </Section>

          <Section title="Follow-up">
            <div className="flex flex-wrap gap-1.5">
              {[...followUpOptions, null].map((w) => (
                <button
                  key={String(w)}
                  type="button"
                  aria-pressed={followUp === w}
                  onClick={() => setFollowUp(w)}
                  className={cx(
                    "h-9 cursor-pointer rounded-lg border px-3 text-[13px] font-medium",
                    followUp === w
                      ? "bg-ink text-parchment border-ink"
                      : "border-line-strong hover:border-ink bg-white/70",
                  )}
                >
                  {w === null ? "None" : `${w}W`}
                </button>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <Modal
        open={preview !== null}
        onClose={() => {
          setPreview(null);
          if (saved) router.push("/demo/opd");
        }}
        title={saved ? "Saved. Prescription ready" : "Preview"}
        wide
      >
        {preview && <RxSheet consultation={preview} />}
      </Modal>
    </>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-line rounded-2xl border bg-white/60 p-5">
      <h2 className="text-oxblood font-serif text-[24px] leading-none">
        {title}
      </h2>
      {hint && <p className="text-muted mt-1 text-[13px]">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

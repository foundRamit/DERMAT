"use client";

import { Plus, Printer } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  type Consultation,
  clinicName,
  dayLabel,
  frequencies,
  fullName,
  genderShort,
  procedureName,
  useDemo,
  useHydrated,
  userName,
} from "../_lib/store";
import { BookingForm } from "./booking-form";
import { PatientForm } from "./patient-form";
import { Button, Modal } from "./ui";

export function BookButton({
  service = "OPD",
  patientId,
  label,
  variant = "primary",
  size = "lg",
}: {
  service?: "OPD" | "PROCEDURE";
  patientId?: string;
  label?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const text =
    label ?? (service === "OPD" ? "Book Appointment" : "Book Procedure");
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Plus size={15} aria-hidden /> {text}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={text} wide>
        <BookingForm
          initialService={service}
          lockService={service === "PROCEDURE"}
          initialPatientId={patientId}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

export function RegisterButton({
  label = "Register New Patient",
  size = "lg" as const,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bookFor, setBookFor] = useState<string | null>(null);
  return (
    <>
      <Button variant="primary" size={size} onClick={() => setOpen(true)}>
        <Plus size={15} aria-hidden /> {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Register New Patient"
        wide
      >
        <PatientForm
          onCancel={() => setOpen(false)}
          onRegistered={(id, thenBook) => {
            setOpen(false);
            if (thenBook) setBookFor(id);
            else router.push(`/demo/patients/${id}`);
          }}
        />
      </Modal>
      <Modal
        open={bookFor !== null}
        onClose={() => setBookFor(null)}
        title="Book Appointment"
        wide
      >
        {bookFor && (
          <BookingForm
            initialPatientId={bookFor}
            onClose={() => setBookFor(null)}
          />
        )}
      </Modal>
    </>
  );
}

/** The prescription as it would be printed for the patient. */
export function RxSheet({ consultation }: { consultation: Consultation }) {
  const state = useDemo();
  const hydrated = useHydrated();
  const patient = state.patients.find((p) => p.id === consultation.patientId);
  const freq = (code: string) =>
    frequencies.find((f) => f.code === code)?.label ?? code;

  return (
    <div>
      <div className="rounded-2xl border border-[#d8cdb9] bg-white p-6 text-[14px] shadow-sm print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4d9c6] pb-4">
          <div>
            <p className="font-serif text-[24px] leading-none">{clinicName}</p>
            <p className="text-muted mt-1 text-[12px]">
              {userName(consultation.doctorId)} · Dermatologist
            </p>
          </div>
          <div className="text-right text-[12px]">
            <p className="font-mono">{consultation.number}</p>
            <p className="text-muted">{dayLabel(consultation.day, hydrated)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-[#e4d9c6] py-3 text-[13px] sm:grid-cols-4">
          <p>
            <span className="text-muted">Patient </span>
            {fullName(patient)}
          </p>
          <p>
            <span className="text-muted">Age / Sex </span>
            {patient?.age} / {patient ? genderShort(patient.gender) : ""}
          </p>
          <p>
            <span className="text-muted">UHID </span>
            <span className="font-mono">{patient?.uhid}</span>
          </p>
          <p>
            <span className="text-muted">Phone </span>
            {patient?.phone}
          </p>
        </div>

        <div className="grid gap-3 py-4">
          <p>
            <span className="text-muted">Complaint: </span>
            {consultation.chiefComplaint}
          </p>
          {consultation.diagnoses.length > 0 && (
            <p>
              <span className="text-muted">Diagnosis: </span>
              <span className="font-medium">
                {consultation.diagnoses.join(", ")}
              </span>
            </p>
          )}
        </div>

        <p className="text-oxblood font-serif text-[26px] leading-none">Rx</p>
        <table className="mt-2 w-full text-left text-[13px]">
          <thead className="text-muted border-b border-[#e4d9c6] text-[11px] uppercase">
            <tr>
              <th className="py-2 pr-2 font-medium">#</th>
              <th className="py-2 pr-2 font-medium">Medicine</th>
              <th className="py-2 pr-2 font-medium">When</th>
              <th className="py-2 pr-2 font-medium">For</th>
              <th className="py-2 font-medium">Remark</th>
            </tr>
          </thead>
          <tbody>
            {consultation.rx.map((r, i) => (
              <tr key={i} className="border-b border-[#efe7d8] align-top">
                <td className="py-2 pr-2">{i + 1}</td>
                <td className="py-2 pr-2 font-medium">
                  {r.medicine}
                  <span className="text-muted block text-[12px] font-normal">
                    {[r.dosage, r.unit].filter(Boolean).join(" ")}
                  </span>
                </td>
                <td className="py-2 pr-2">
                  <span className="font-mono">{r.frequency}</span>
                  <span className="text-muted block text-[12px]">
                    {freq(r.frequency)}
                  </span>
                </td>
                <td className="py-2 pr-2">{r.duration}</td>
                <td className="py-2">{r.remark}</td>
              </tr>
            ))}
            {consultation.rx.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted py-3">
                  No medicines.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {consultation.advised.length > 0 && (
          <p className="mt-4">
            <span className="text-muted">Advised procedures: </span>
            {consultation.advised
              .map(
                (a) =>
                  `${procedureName(a.procedureId)} (${a.sittings} sittings)`,
              )
              .join(", ")}
          </p>
        )}
        {consultation.instructions && (
          <p className="mt-2">
            <span className="text-muted">Instructions: </span>
            {consultation.instructions}
          </p>
        )}
        <p className="mt-2">
          <span className="text-muted">Follow-up: </span>
          {consultation.followUpWeeks
            ? `After ${consultation.followUpWeeks} week${consultation.followUpWeeks > 1 ? "s" : ""}`
            : "Not needed"}
        </p>
        <p className="mt-8 text-right text-[13px]">
          {userName(consultation.doctorId)}
        </p>
      </div>
      <div className="mt-4 flex justify-end print:hidden">
        <Button variant="primary" onClick={() => window.print()}>
          <Printer size={15} aria-hidden /> Print
        </Button>
      </div>
    </div>
  );
}

export function RxButton({
  consultationId,
  label = "View Rx",
}: {
  consultationId: string;
  label?: string;
}) {
  const state = useDemo();
  const [open, setOpen] = useState(false);
  const consultation = state.consultations.find((c) => c.id === consultationId);
  if (!consultation) return null;
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Prescription"
        wide
      >
        <RxSheet consultation={consultation} />
      </Modal>
    </>
  );
}

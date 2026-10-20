"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BookButton } from "../../_components/dialogs";
import {
  Button,
  Card,
  Empty,
  Modal,
  PageTitle,
  Pills,
  StatusBadge,
  TypeChip,
  cx,
  inputBase,
} from "../../_components/ui";
import {
  type Appointment,
  byId,
  dispatch,
  doctors,
  fullName,
  toHHMM,
  toMinutes,
  useDemo,
} from "../../_lib/store";

type Tab = "all" | "pending" | "checked" | "done";

const inTab = (a: Appointment, t: Tab) =>
  t === "all" ||
  (t === "pending" && a.status === "SCHEDULED") ||
  (t === "checked" &&
    (a.status === "CHECKED_IN" || a.status === "IN_PROGRESS")) ||
  (t === "done" && a.status === "COMPLETED");

export default function AppointmentsPage() {
  const state = useDemo();
  const router = useRouter();
  const patients = byId(state.patients);
  const [doctor, setDoctor] = useState("all");
  const [tab, setTab] = useState<Tab>("all");
  const [cancelling, setCancelling] = useState<Appointment | null>(null);

  const day = state.appointments.filter(
    (a) => a.day === 0 && (doctor === "all" || a.doctorId === doctor),
  );
  const rows = day
    .filter((a) => inTab(a, tab))
    .sort((a, b) => a.start.localeCompare(b.start));
  const n = (t: Tab) => day.filter((a) => inTab(a, t)).length;

  return (
    <>
      <PageTitle
        title="Appointments"
        subtitle="Manage daily appointments and schedule"
        action={
          <>
            <select
              aria-label="Doctor"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className={cx(inputBase, "h-11 w-auto")}
            >
              <option value="all">All doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <BookButton />
          </>
        }
      />

      <div className="border-line mb-4 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-2xl border bg-white/60 px-5 py-4">
        <div>
          <p className="text-oxblood font-mono text-[11px] tracking-[0.16em] uppercase">
            Today
          </p>
          <p className="font-serif text-[30px] leading-none">
            {day.length} appointments
          </p>
        </div>
        <p className="text-body text-[14px]">
          {n("pending")} Pending · {n("checked")} Checked In · {n("done")}{" "}
          Completed
        </p>
      </div>

      <div className="mb-3">
        <Pills
          label="Status"
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "checked", label: "Checked In" },
            { value: "done", label: "Completed" },
          ]}
        />
      </div>

      <Card title="Schedule" subtitle={`${rows.length} results`}>
        <ul>
          {rows.map((a) => {
            const p = patients.get(a.patientId);
            return (
              <li
                key={a.id}
                className="border-line flex flex-wrap items-center gap-4 border-b px-5 py-3.5 last:border-0"
              >
                <div className="w-16 shrink-0">
                  <p className="text-oxblood font-mono text-[17px] font-semibold">
                    {a.start}
                  </p>
                  <p className="text-muted font-mono text-[12px]">
                    {toHHMM(toMinutes(a.start) + a.duration)}
                  </p>
                </div>
                <div className="min-w-[200px] flex-1">
                  <Link
                    href={`/demo/patients/${a.patientId}`}
                    className="font-medium hover:underline"
                  >
                    {fullName(p)}
                  </Link>
                  <p className="text-muted text-[12px]">
                    {p?.phone} ({p?.uhid})
                  </p>
                  <p className="text-body text-[13px]">{a.chiefComplaint}</p>
                </div>
                <TypeChip type={a.type} />
                <StatusBadge status={a.status} />
                <div className="flex gap-1.5">
                  {a.status === "SCHEDULED" && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => dispatch({ type: "check-in", id: a.id })}
                    >
                      Check In
                    </Button>
                  )}
                  {a.service === "OPD" &&
                    (a.status === "CHECKED_IN" || a.status === "IN_PROGRESS") &&
                    !a.consultationId && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          if (a.status !== "IN_PROGRESS")
                            dispatch({ type: "start", id: a.id });
                          router.push(`/demo/consultations/new/${a.id}`);
                        }}
                      >
                        Consult
                      </Button>
                    )}
                  <Button
                    size="sm"
                    onClick={() => router.push(`/demo/patients/${a.patientId}`)}
                  >
                    View
                  </Button>
                  {a.status === "SCHEDULED" && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setCancelling(a)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {rows.length === 0 && <Empty>No appointments scheduled</Empty>}
      </Card>

      <Modal
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title="Cancel this appointment?"
      >
        <p className="text-body">
          {fullName(patients.get(cancelling?.patientId ?? ""))} at{" "}
          {cancelling?.start}. The unpaid bill will be cancelled too.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setCancelling(null)}>Keep appointment</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (cancelling) dispatch({ type: "cancel", id: cancelling.id });
              setCancelling(null);
            }}
          >
            Cancel appointment
          </Button>
        </div>
      </Modal>
    </>
  );
}

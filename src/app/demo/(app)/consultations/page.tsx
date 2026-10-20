"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import { RxButton } from "../../_components/dialogs";
import {
  Card,
  Empty,
  PageTitle,
  cx,
  inputBase,
  inputClass,
} from "../../_components/ui";
import {
  byId,
  dayLabel,
  doctors,
  fullName,
  useDemo,
  useHydrated,
  userName,
} from "../../_lib/store";

export default function ConsultationsPage() {
  const state = useDemo();
  const hydrated = useHydrated();
  const patients = byId(state.patients);
  const [query, setQuery] = useState("");
  const [doctor, setDoctor] = useState("all");
  const q = query.trim().toLowerCase();

  const rows = [...state.consultations]
    .filter((c) => doctor === "all" || c.doctorId === doctor)
    .filter((c) => {
      const p = patients.get(c.patientId);
      return (
        !q ||
        `${fullName(p)} ${p?.phone} ${c.diagnoses.join(" ")} ${c.number}`
          .toLowerCase()
          .includes(q)
      );
    })
    .sort((a, b) => b.day - a.day || b.number.localeCompare(a.number));

  return (
    <>
      <PageTitle
        title="Consultations"
        extra={
          <span className="bg-vellum rounded-full px-3 py-1 text-[13px]">
            {state.consultations.length}
          </span>
        }
        subtitle="Every visit the doctor wrote up, with its prescription. New ones start from Consult on the OPD page."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-[260px] flex-1">
          <span className="sr-only">Search</span>
          <MagnifyingGlass
            size={15}
            aria-hidden
            className="text-muted absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient, diagnosis, phone, or consultation #…"
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
      </div>
      <Card
        title={q || doctor !== "all" ? "Filtered results" : "All consultations"}
        subtitle={`Showing ${rows.length}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="text-muted border-line border-b text-[12px]">
              <tr>
                {["Consultation", "Patient", "Diagnosis", "Date", ""].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-medium first:pl-5">
                      {h || <span className="sr-only">Actions</span>}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-line border-b last:border-0">
                  <td className="py-3 pr-4 pl-5">
                    <span className="font-mono text-[13px]">{c.number}</span>
                    <span className="text-muted block text-[12px]">
                      {userName(c.doctorId)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/demo/patients/${c.patientId}`}
                      className="font-medium hover:underline"
                    >
                      {fullName(patients.get(c.patientId))}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[13px]">
                    {c.diagnoses.join(", ") || c.chiefComplaint}
                  </td>
                  <td className="px-4 py-3 text-[13px]">
                    {dayLabel(c.day, hydrated)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RxButton consultationId={c.id} label="View" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <Empty>No consultations match.</Empty>}
      </Card>
    </>
  );
}

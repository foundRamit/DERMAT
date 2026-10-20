"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import { BookButton, RegisterButton } from "../../_components/dialogs";
import { Card, Empty, PageTitle, cx, inputClass } from "../../_components/ui";
import {
  dayLabel,
  fullName,
  genderShort,
  useDemo,
  useHydrated,
} from "../../_lib/store";

export default function PatientsPage() {
  const state = useDemo();
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase().replace(/\s/g, "");

  const lastVisit = (id: string) => {
    const days = state.appointments
      .filter(
        (a) =>
          a.patientId === id &&
          a.status !== "CANCELLED" &&
          a.status !== "NO_SHOW",
      )
      .map((a) => a.day);
    return days.length ? Math.max(...days) : null;
  };
  const rows = state.patients.filter(
    (p) =>
      !q ||
      `${fullName(p)}${p.phone}${p.uhid}`
        .toLowerCase()
        .replace(/\s/g, "")
        .includes(q),
  );

  return (
    <>
      <PageTitle
        title="Patients"
        extra={
          <span className="bg-vellum rounded-full px-3 py-1 text-[13px]">
            {state.patients.length}
          </span>
        }
        subtitle="Registered patients. Search by name, phone, or registration number."
        action={<RegisterButton />}
      />
      <label className="relative mb-4 block max-w-[460px]">
        <span className="sr-only">Search patients</span>
        <MagnifyingGlass
          size={15}
          aria-hidden
          className="text-muted absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, or reg. no.…"
          className={cx(inputClass, "pl-9")}
        />
      </label>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="text-muted border-line border-b text-[12px]">
              <tr>
                {[
                  "Reg. No.",
                  "Patient",
                  "Phone",
                  "Age / Sex",
                  "Last visit",
                  "",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium first:pl-5">
                    {h || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const last = lastVisit(p.id);
                return (
                  <tr
                    key={p.id}
                    className="border-line hover:bg-vellum/40 border-b last:border-0"
                  >
                    <td className="py-3 pr-4 pl-5 font-mono text-[13px]">
                      {p.uhid}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/demo/patients/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.title} {fullName(p)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px]">{p.phone}</td>
                    <td className="px-4 py-3 text-[13px]">
                      {p.age} / {genderShort(p.gender)}
                    </td>
                    <td className="text-body px-4 py-3 text-[13px]">
                      {last === null
                        ? "No visits yet"
                        : dayLabel(last, hydrated)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <BookButton
                          patientId={p.id}
                          label="Book"
                          variant="secondary"
                          size="sm"
                        />
                        <Link
                          href={`/demo/patients/${p.id}`}
                          className="border-line-strong hover:border-ink inline-flex h-8 items-center rounded-xl border bg-white/70 px-3 text-[13px] font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <Empty>No patients match your search</Empty>}
      </Card>
    </>
  );
}

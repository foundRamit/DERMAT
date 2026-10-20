"use client";

import {
  CalendarBlank,
  CalendarCheck,
  Percent,
  Receipt,
  Scissors,
  Stethoscope,
  Ticket,
  Users,
  type Icon,
} from "@phosphor-icons/react";
import Link from "next/link";

import { BookButton, RegisterButton } from "../_components/dialogs";
import { cx } from "../_components/ui";
import { currentUserName, money, useDemo, useHydrated } from "../_lib/store";

const tiles: { href: string; label: string; note: string; icon: Icon }[] = [
  {
    href: "/demo/opd",
    label: "OPD",
    note: "Today's appointments and check-in",
    icon: CalendarBlank,
  },
  {
    href: "/demo/tokens",
    label: "Tokens",
    note: "Waiting line and Call Next",
    icon: Ticket,
  },
  {
    href: "/demo/appointments",
    label: "Appointments",
    note: "Day schedule by time",
    icon: CalendarCheck,
  },
  {
    href: "/demo/patients",
    label: "Patients",
    note: "Records, visits and bills",
    icon: Users,
  },
  {
    href: "/demo/consultations",
    label: "Consultations",
    note: "Diagnosis and prescriptions",
    icon: Stethoscope,
  },
  {
    href: "/demo/procedures",
    label: "Procedures",
    note: "Sittings and treatment courses",
    icon: Scissors,
  },
  {
    href: "/demo/billing",
    label: "Billing",
    note: "Bills, payments and dues",
    icon: Receipt,
  },
  {
    href: "/demo/discount-approvals",
    label: "Discount Approvals",
    note: "Doctor approves discounts",
    icon: Percent,
  },
];

const tour = [
  [
    "Book a walk-in",
    "Click New Appointment, pick a patient and book. A token like WO4 is given.",
  ],
  [
    "Check them in",
    "On the OPD page, click Check In when the patient arrives.",
  ],
  [
    "Call them in",
    "On Tokens, click Call Next. The token shows on the waiting room screen.",
  ],
  [
    "Write the prescription",
    "Switch to Doctor at the top, then click Consult on the OPD page.",
  ],
  [
    "Take the payment",
    "Open Billing, pick the bill and record cash, UPI or card.",
  ],
];

export default function HomePage() {
  const state = useDemo();
  const hydrated = useHydrated();
  const today = state.appointments.filter(
    (a) => a.day === 0 && a.status !== "CANCELLED",
  );
  const opd = today.filter((a) => a.service === "OPD").length;
  const procedureCount = today.filter((a) => a.service === "PROCEDURE").length;
  const collected = state.invoices
    .flatMap((i) => i.payments)
    .filter((p) => p.day === 0 && p.method !== "WALLET")
    .reduce((s, p) => s + p.amount, 0);
  const hour = hydrated ? new Date().getHours() : 10;
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = currentUserName(state).replace("Dr. ", "").split(" ")[0];

  return (
    <>
      <h1 className="font-serif text-[44px] leading-none tracking-[-0.01em]">
        {greeting}, {name}
      </h1>
      <p className="text-body mt-3 flex flex-wrap gap-2 text-[14px]">
        <span className="text-muted">Today</span>
        <Link
          href="/demo/opd"
          className="border-line hover:border-ink rounded-full border bg-white/60 px-3"
        >
          {opd} OPD
        </Link>
        <Link
          href="/demo/procedures"
          className="border-line hover:border-ink rounded-full border bg-white/60 px-3"
        >
          {procedureCount} procedures
        </Link>
        <Link
          href="/demo/billing"
          className="border-line hover:border-ink rounded-full border bg-white/60 px-3"
        >
          {money(collected)} collected
        </Link>
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <RegisterButton label="New Patient" />
        <BookButton label="New Appointment" variant="secondary" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group border-line hover:border-ink flex items-start justify-between gap-3 rounded-2xl border bg-white/60 p-4 transition-colors"
          >
            <span>
              <span className="block text-[16px] font-semibold">{t.label}</span>
              <span className="text-muted mt-1 block text-[13px]">
                {t.note}
              </span>
            </span>
            <t.icon size={22} className="text-oxblood shrink-0" aria-hidden />
          </Link>
        ))}
      </div>

      <section className="border-line mt-8 rounded-2xl border bg-white/60 p-5">
        <h2 className="font-serif text-[26px] leading-none">
          New here? Try one patient&apos;s visit
        </h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-5">
          {tour.map(([title, text], i) => (
            <li
              key={title}
              className={cx(
                "border-line rounded-xl border p-3",
                i === 0 && "bg-blush/40",
              )}
            >
              <span className="text-oxblood font-mono text-[12px]">
                Step {i + 1}
              </span>
              <p className="mt-1 font-semibold">{title}</p>
              <p className="text-body mt-1 text-[13px]">{text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[13px]">
          <Link
            href="/demo/token-display"
            target="_blank"
            className="text-oxblood font-medium hover:underline"
          >
            Open the waiting room screen
          </Link>
          <span className="text-muted">
            {" "}
            in a new tab to watch tokens being called.
          </span>
        </p>
      </section>
    </>
  );
}

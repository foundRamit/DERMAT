"use client";

import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Button,
  Card,
  Empty,
  Modal,
  PageTitle,
  PayBadge,
  Pills,
  cx,
  inputBase,
  inputClass,
} from "../../_components/ui";
import {
  type PayStatus,
  balanceOf,
  byId,
  dayLabel,
  fullName,
  invoiceTotal,
  methodLabel,
  money,
  paidOf,
  payStatus,
  useDemo,
  useHydrated,
} from "../../_lib/store";
import { NewInvoiceForm } from "./new-invoice-form";

export default function BillingPage() {
  const state = useDemo();
  const hydrated = useHydrated();
  const router = useRouter();
  const patients = byId(state.patients);
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [status, setStatus] = useState<PayStatus | "ALL">("ALL");
  const [range, setRange] = useState<"today" | "week" | "all">("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const pending = state.invoices
    .filter((i) => balanceOf(i) > 0)
    .sort((a, b) => a.day - b.day);
  const q = query.trim().toLowerCase();
  const all = [...state.invoices]
    .filter((i) => status === "ALL" || payStatus(i) === status)
    .filter(
      (i) => range === "all" || (range === "today" ? i.day === 0 : i.day >= -6),
    )
    .filter(
      (i) =>
        !q ||
        `${fullName(patients.get(i.patientId))} ${i.number}`
          .toLowerCase()
          .includes(q),
    )
    .sort((a, b) => b.day - a.day || b.number.localeCompare(a.number));

  const todayPayments = state.invoices.flatMap((i) =>
    i.payments
      .filter((p) => p.day === 0 && p.method !== "WALLET")
      .map((p) => ({ ...p, kind: i.kind })),
  );
  const todayTotal = todayPayments.reduce((s, p) => s + p.amount, 0);
  const byMethod = (["CASH", "UPI", "CARD", "BANK_TRANSFER"] as const)
    .map(
      (m) =>
        [
          m,
          todayPayments
            .filter((p) => p.method === m)
            .reduce((s, p) => s + p.amount, 0),
        ] as const,
    )
    .filter(([, v]) => v > 0);
  const byKind = (kind: string) =>
    todayPayments
      .filter((p) => p.kind === kind)
      .reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageTitle
        title="Billing"
        subtitle="Manage invoices and payments"
        action={
          <Button variant="primary" size="lg" onClick={() => setCreating(true)}>
            <Plus size={15} aria-hidden /> New Invoice
          </Button>
        }
      />

      <div className="border-line mb-4 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border bg-white/60 px-5 py-4">
        <div>
          <p className="text-oxblood font-mono text-[11px] tracking-[0.16em] uppercase">
            Today
          </p>
          <p className="font-serif text-[32px] leading-none">
            {money(todayTotal)}
          </p>
          <p className="text-muted text-[12px]">
            {todayPayments.length} payments
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[13px]">
          {byMethod.map(([m, v]) => (
            <span key={m} className="bg-vellum rounded-full px-3 py-1">
              {methodLabel[m]} {money(v)}
            </span>
          ))}
        </div>
        <p className="text-body text-[13px]">
          OPD {money(byKind("OB"))} · Procedure {money(byKind("PRB"))} · Advance{" "}
          {money(byKind("ADV"))}
        </p>
      </div>

      <div className="mb-3">
        <Pills
          label="Invoices"
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "All Invoices" },
            { value: "pending", label: `Pending (${pending.length})` },
          ]}
        />
      </div>

      {tab === "pending" ? (
        <Card
          title={`Pending Charges (${pending.length})`}
          subtitle="Bills that still have money due"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="text-muted border-line border-b text-[12px]">
                <tr>
                  {[
                    "Invoice",
                    "Patient",
                    "Date",
                    "Total",
                    "Paid",
                    "Balance",
                    "Days Old",
                    "",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium first:pl-5">
                      {h || <span className="sr-only">Action</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((i) => (
                  <tr key={i.id} className="border-line border-b last:border-0">
                    <td className="py-3 pr-4 pl-5 font-mono text-[13px]">
                      {i.number}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {fullName(patients.get(i.patientId))}
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {dayLabel(i.day, hydrated)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px]">
                      {money(invoiceTotal(i))}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px]">
                      {money(paidOf(i))}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-[#a0570b]">
                      {money(balanceOf(i))}
                    </td>
                    <td
                      className={cx(
                        "px-4 py-3 text-[13px]",
                        -i.day > 30
                          ? "text-[#a12a1f]"
                          : -i.day > 7
                            ? "text-[#a0570b]"
                            : "",
                      )}
                    >
                      {-i.day}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => router.push(`/demo/billing/${i.id}`)}
                      >
                        Pay
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pending.length === 0 && (
            <Empty>Nothing pending. Every bill is paid.</Empty>
          )}
        </Card>
      ) : (
        <Card>
          <div className="border-line flex flex-wrap gap-2 border-b p-3">
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
                placeholder="Search by patient or invoice number…"
                className={cx(inputClass, "pl-9")}
              />
            </label>
            <select
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as PayStatus | "ALL")}
              className={cx(inputBase, "w-auto")}
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partial</option>
              <option value="VOID">Void</option>
            </select>
            <select
              aria-label="Date"
              value={range}
              onChange={(e) => setRange(e.target.value as typeof range)}
              className={cx(inputBase, "w-auto")}
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="text-muted border-line border-b text-[12px]">
                <tr>
                  {["Invoice", "Patient", "Date", "Amount", "Status", ""].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 font-medium first:pl-5">
                        {h || <span className="sr-only">Actions</span>}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {all.map((i) => (
                  <tr
                    key={i.id}
                    className="border-line hover:bg-vellum/40 border-b last:border-0"
                  >
                    <td className="py-3 pr-4 pl-5">
                      <span className="font-mono text-[13px]">{i.number}</span>
                      <span className="text-muted block truncate text-[12px]">
                        {i.lines.map((l) => l.description).join(", ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/demo/patients/${i.patientId}`}
                        className="font-medium hover:underline"
                      >
                        {fullName(patients.get(i.patientId))}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {dayLabel(i.day, hydrated)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px]">
                      {money(invoiceTotal(i))}
                    </td>
                    <td className="px-4 py-3">
                      <PayBadge status={payStatus(i)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/demo/billing/${i.id}`}
                        className="border-line-strong hover:border-ink inline-flex h-8 items-center rounded-xl border bg-white/70 px-3 text-[13px] font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {all.length === 0 && <Empty>No invoices match.</Empty>}
        </Card>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create Invoice"
        wide
      >
        <NewInvoiceForm
          onDone={(id) => {
            setCreating(false);
            if (id) router.push(`/demo/billing/${id}`);
          }}
        />
      </Modal>
    </>
  );
}

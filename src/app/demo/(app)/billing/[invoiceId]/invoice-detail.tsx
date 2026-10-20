"use client";

import { ArrowLeft, Printer } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import {
  Button,
  Card,
  Empty,
  Field,
  PayBadge,
  PaymentRows,
  SumRow,
  cx,
  inputClass,
} from "../../../_components/ui";
import {
  type PaymentInput,
  balanceOf,
  dayLabel,
  dispatch,
  fullName,
  invoiceTotal,
  methodLabel,
  money,
  paidOf,
  payStatus,
  subtotal,
  useDemo,
  useHydrated,
} from "../../../_lib/store";

export function InvoiceDetail({ id }: { id: string }) {
  const state = useDemo();
  const hydrated = useHydrated();
  const [payments, setPayments] = useState<PaymentInput[]>([
    { amount: 0, method: "CASH" },
  ]);
  const [useWallet, setUseWallet] = useState(true);
  const [discount, setDiscount] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");

  const invoice = state.invoices.find((i) => i.id === id);
  if (!invoice) {
    return hydrated ? (
      <Empty>
        This bill is not in the sample clinic.{" "}
        <Link href="/demo/billing" className="text-oxblood hover:underline">
          Back to billing
        </Link>
      </Empty>
    ) : null;
  }
  const patient = state.patients.find((p) => p.id === invoice.patientId);
  const balance = balanceOf(invoice);
  const doctor = state.role === "doctor";
  const pendingApproval = state.approvals.find(
    (a) => a.invoiceId === id && a.status === "PENDING",
  );
  const fromWallet =
    useWallet && patient ? Math.min(patient.wallet, balance) : 0;
  const collecting = payments.reduce((s, p) => s + p.amount, 0);
  const isAdvance = invoice.kind === "ADV";

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/demo/billing"
          aria-label="Back to billing"
          className="border-line-strong hover:border-ink inline-flex size-10 items-center justify-center rounded-xl border bg-white/70"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="font-mono text-[28px] leading-none font-semibold">
            {invoice.number}
          </h1>
          <p className="text-muted mt-1">{dayLabel(invoice.day, hydrated)}</p>
        </div>
        <PayBadge status={payStatus(invoice)} />
        <Button size="lg" onClick={() => window.print()}>
          <Printer size={16} aria-hidden /> Print
        </Button>
      </div>

      <div className="border-line mb-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-white/60 px-5 py-3">
        <span className="bg-oxblood text-parchment inline-flex size-10 items-center justify-center rounded-full font-semibold">
          {patient?.firstName[0]}
          {patient?.lastName[0]}
        </span>
        <div>
          <Link
            href={`/demo/patients/${invoice.patientId}`}
            className="font-medium hover:underline"
          >
            {fullName(patient)}
          </Link>
          <p className="text-muted text-[12px]">
            {patient?.phone} · {patient?.uhid}
          </p>
        </div>
        <span className="text-muted ml-auto text-[13px]">
          Advance with clinic: {money(patient?.wallet ?? 0)}
        </span>
      </div>

      {notice && (
        <p className="mb-4 rounded-xl bg-[#dfe9d6] px-4 py-2.5 text-[14px] text-[#2f4a20]">
          {notice}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-4">
          <Card title="Invoice Items">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead className="text-muted border-line border-b text-[12px]">
                  <tr>
                    {["#", "Description", "Qty", "Unit Price", "Amount"].map(
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
                  {invoice.lines.map((l, i) => (
                    <tr key={i} className="border-line border-b last:border-0">
                      <td className="py-3 pr-4 pl-5 text-[13px]">{i + 1}</td>
                      <td className="px-4 py-3">{l.description}</td>
                      <td className="px-4 py-3 text-[13px]">{l.qty}</td>
                      <td className="px-4 py-3 font-mono text-[13px]">
                        {money(l.unitPrice)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px]">
                        {money(l.qty * l.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Payment History">
            <ul>
              {invoice.payments.map((p, i) => (
                <li
                  key={i}
                  className="border-line flex items-center gap-3 border-b px-5 py-3 last:border-0"
                >
                  <span className="text-muted w-24 text-[13px]">
                    {dayLabel(p.day, hydrated)}
                  </span>
                  <span className="flex-1">
                    {methodLabel[p.method]}
                    <span className="text-muted block text-[12px]">
                      Received by {p.receivedBy}
                    </span>
                  </span>
                  <span className="font-mono">{money(p.amount)}</span>
                </li>
              ))}
            </ul>
            {invoice.payments.length === 0 && <Empty>No payments yet.</Empty>}
          </Card>
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <div className="grid gap-2 px-5 py-4">
              {!isAdvance && (
                <SumRow label="Subtotal" value={subtotal(invoice)} />
              )}
              {invoice.discount > 0 && (
                <SumRow
                  label={`Discount (${invoice.discountReason ?? ""})`}
                  value={invoice.discount}
                  tone="minus"
                />
              )}
              <SumRow label="Total" value={invoiceTotal(invoice)} strong />
              <SumRow label="Amount Paid" value={paidOf(invoice)} />
              {invoice.voided ? (
                <p className="text-muted text-[13px]">
                  This bill was cancelled. Any money paid went to the
                  patient&apos;s advance.
                </p>
              ) : (
                <SumRow
                  label="Balance Due"
                  value={balance}
                  strong
                  tone={balance === 0 ? "good" : "warn"}
                />
              )}
            </div>
          </Card>

          {!invoice.voided && !isAdvance && balance > 0 && (
            <Card title="Discount">
              <div className="grid gap-3 px-5 py-4">
                {pendingApproval ? (
                  <p className="rounded-xl bg-[#f6e3c6] px-3 py-2 text-[13px] text-[#82520f]">
                    {money(pendingApproval.amount)} discount is waiting for a
                    doctor&apos;s approval.{" "}
                    <Link
                      href="/demo/discount-approvals"
                      className="font-medium underline"
                    >
                      Discount Approvals
                    </Link>
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <Field label="Amount (₹)">
                        <input
                          inputMode="numeric"
                          value={discount}
                          onChange={(e) =>
                            setDiscount(e.target.value.replace(/\D/g, ""))
                          }
                          className={cx(inputClass, "font-mono")}
                        />
                      </Field>
                      <Field label="Reason" required>
                        <input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. Family"
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    <p className="text-muted text-[12px]">
                      Max {money(balance)} (balance due).
                    </p>
                    <Button
                      variant="primary"
                      disabled={!Number(discount) || !reason.trim()}
                      onClick={() => {
                        dispatch({
                          type: "discount",
                          invoiceId: id,
                          amount: Number(discount),
                          reason: reason.trim(),
                        });
                        setNotice(
                          doctor
                            ? `Discount of ${money(Math.min(Number(discount), balance))} applied.`
                            : "Discount request sent to the doctor. It shows on Discount Approvals.",
                        );
                        setDiscount("");
                        setReason("");
                      }}
                    >
                      {doctor ? "Apply Discount" : "Request Discount"}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}

          {!invoice.voided && balance > 0 && (
            <Card title="Record Payment">
              <div className="grid gap-3 px-5 py-4">
                {patient && patient.wallet > 0 && (
                  <label className="bg-vellum/60 flex items-start gap-2 rounded-xl p-3 text-[13px]">
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      className="accent-oxblood mt-0.5 size-4"
                    />
                    <span>
                      Patient has {money(patient.wallet)} in advance. Pay{" "}
                      {money(Math.min(patient.wallet, balance))} from advance.
                    </span>
                  </label>
                )}
                <PaymentRows rows={payments} onChange={setPayments} />
                <button
                  type="button"
                  onClick={() =>
                    setPayments([
                      {
                        amount: Math.max(0, balance - fromWallet),
                        method: payments[0]?.method ?? "CASH",
                      },
                    ])
                  }
                  className="text-muted hover:text-ink w-fit cursor-pointer text-[12px] underline underline-offset-2"
                >
                  Fill the full balance (
                  {money(Math.max(0, balance - fromWallet))})
                </button>
                {collecting > balance - fromWallet && (
                  <p className="text-muted text-[12px]">
                    Extra {money(collecting - (balance - fromWallet))} will be
                    added to the patient&apos;s advance.
                  </p>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  disabled={collecting === 0 && fromWallet === 0}
                  onClick={() => {
                    dispatch({
                      type: "pay",
                      invoiceId: id,
                      payments,
                      useWallet,
                    });
                    setNotice(
                      `Payment of ${money(collecting + fromWallet)} recorded.`,
                    );
                    setPayments([{ amount: 0, method: "CASH" }]);
                  }}
                >
                  Record {money(collecting + fromWallet)}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

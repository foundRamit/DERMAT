"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";

import {
  Button,
  Field,
  PaymentRows,
  SumRow,
  cx,
  inputBase,
  inputClass,
} from "../../_components/ui";
import {
  type LineItem,
  type PaymentInput,
  dispatch,
  fullName,
  medicines,
  newId,
  opdCharges,
  procedures,
  useDemo,
} from "../../_lib/store";

const rateList = [
  ...Object.values(opdCharges)
    .filter((c) => c.amount > 0)
    .map((c) => ({
      description: c.name,
      unitPrice: c.amount,
      category: "CONSULTATION" as const,
    })),
  ...procedures.map((p) => ({
    description: p.name,
    unitPrice: p.price,
    category: "PROCEDURE" as const,
  })),
  ...medicines.slice(8, 14).map((m) => ({
    description: m,
    unitPrice: 350,
    category: "MEDICINE" as const,
  })),
];

export function NewInvoiceForm({ onDone }: { onDone: (id?: string) => void }) {
  const state = useDemo();
  const [patientId, setPatientId] = useState(state.patients[0]?.id ?? "");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<PaymentInput[]>([
    { amount: 0, method: "CASH" },
  ]);
  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (lines.length === 0) return;
        const id = newId("i");
        dispatch({
          type: "create-invoice",
          invoiceId: id,
          patientId,
          lines,
          payments,
        });
        onDone(id);
      }}
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"
    >
      <div className="grid content-start gap-4">
        <Field label="Patient" required>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className={inputClass}
          >
            {[...state.patients]
              .sort((a, b) => fullName(a).localeCompare(fullName(b)))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {fullName(p)} · {p.uhid}
                </option>
              ))}
          </select>
        </Field>
        <div>
          <p className="text-body mb-1.5 text-[13px] font-medium">Line Items</p>
          <select
            aria-label="Quick-fill from rate list"
            value=""
            onChange={(e) => {
              const item = rateList.find(
                (r) => r.description === e.target.value,
              );
              if (item) setLines([...lines, { ...item, qty: 1 }]);
            }}
            className={inputClass}
          >
            <option value="">Quick-fill from rate list</option>
            {rateList.map((r) => (
              <option key={r.description} value={r.description}>
                {r.description} · ₹{r.unitPrice}
              </option>
            ))}
          </select>
          <div className="mt-2 grid gap-2">
            {lines.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input
                  aria-label="Description"
                  value={l.description}
                  onChange={(e) =>
                    setLines(
                      lines.map((x, j) =>
                        j === i ? { ...x, description: e.target.value } : x,
                      ),
                    )
                  }
                  className={inputClass}
                />
                <input
                  aria-label="Quantity"
                  inputMode="numeric"
                  value={l.qty}
                  onChange={(e) =>
                    setLines(
                      lines.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              qty:
                                Number(e.target.value.replace(/\D/g, "")) || 1,
                            }
                          : x,
                      ),
                    )
                  }
                  className={cx(inputBase, "w-16 shrink-0")}
                />
                <input
                  aria-label="Unit price"
                  inputMode="numeric"
                  value={l.unitPrice}
                  onChange={(e) =>
                    setLines(
                      lines.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              unitPrice: Number(
                                e.target.value.replace(/\D/g, ""),
                              ),
                            }
                          : x,
                      ),
                    )
                  }
                  className={cx(inputBase, "w-28 shrink-0 font-mono")}
                />
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => setLines(lines.filter((_, j) => j !== i))}
                  className="text-muted hover:text-oxblood inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() =>
              setLines([
                ...lines,
                {
                  description: "Other charge",
                  category: "OTHER",
                  qty: 1,
                  unitPrice: 0,
                },
              ])
            }
          >
            <Plus size={13} aria-hidden /> Add item
          </Button>
        </div>
      </div>

      <aside className="border-line h-fit rounded-2xl border bg-white/70 p-4">
        <p className="font-serif text-[22px] leading-none">Summary</p>
        <div className="mt-3 grid gap-1.5">
          <SumRow label="Total" value={total} strong />
        </div>
        <p className="text-body mt-4 mb-1.5 text-[13px] font-medium">
          Collect now (optional)
        </p>
        <PaymentRows rows={payments} onChange={setPayments} />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-4 w-full"
          disabled={lines.length === 0}
        >
          Create Invoice
        </Button>
      </aside>
    </form>
  );
}

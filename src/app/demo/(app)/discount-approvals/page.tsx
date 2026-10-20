"use client";

import Link from "next/link";
import { useState } from "react";

import {
  Button,
  Card,
  Empty,
  Modal,
  PageTitle,
  Pills,
  cx,
  inputClass,
} from "../../_components/ui";
import {
  type Approval,
  byId,
  dayLabel,
  dispatch,
  fullName,
  money,
  useDemo,
  useHydrated,
} from "../../_lib/store";

export default function DiscountApprovalsPage() {
  const state = useDemo();
  const hydrated = useHydrated();
  const patients = byId(state.patients);
  const invoices = byId(state.invoices);
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [rejecting, setRejecting] = useState<Approval | null>(null);
  const [note, setNote] = useState("");

  const pending = state.approvals.filter((a) => a.status === "PENDING");
  const history = state.approvals.filter((a) => a.status !== "PENDING");
  const doctor = state.role === "doctor";

  return (
    <>
      <PageTitle
        title="Discount Approvals"
        subtitle={
          pending.length
            ? `${pending.length} request${pending.length > 1 ? "s" : ""} waiting on a doctor's decision before the bill can be finalised.`
            : "All discount requests are resolved."
        }
      />

      {!doctor && pending.length > 0 && (
        <p className="mb-4 rounded-xl bg-[#e3ecf3] px-4 py-2.5 text-[13px] text-[#2f5571]">
          Only a doctor can approve discounts. Switch “Viewing as” to Doctor at
          the top to approve or reject.
        </p>
      )}

      <div className="mb-3">
        <Pills
          label="Approvals"
          value={tab}
          onChange={setTab}
          options={[
            { value: "pending", label: `Pending (${pending.length})` },
            { value: "history", label: "History" },
          ]}
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="text-muted border-line border-b text-[12px]">
              <tr>
                {(tab === "pending"
                  ? [
                      "Patient",
                      "Invoice",
                      "Discount",
                      "Requested By",
                      "Reason",
                      "Requested At",
                      "",
                    ]
                  : [
                      "Patient",
                      "Invoice",
                      "Discount",
                      "Requested By",
                      "Status",
                      "Decided By",
                      "Note",
                    ]
                ).map((h) => (
                  <th key={h} className="px-4 py-3 font-medium first:pl-5">
                    {h || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tab === "pending" ? pending : history).map((a) => {
                const inv = invoices.get(a.invoiceId);
                return (
                  <tr key={a.id} className="border-line border-b last:border-0">
                    <td className="py-3 pr-4 pl-5 font-medium">
                      {fullName(patients.get(a.patientId))}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/demo/billing/${a.invoiceId}`}
                        className="text-oxblood font-mono text-[13px] hover:underline"
                      >
                        {inv?.number}
                      </Link>
                      <span className="text-muted block text-[12px]">
                        {inv?.lines[0]?.description}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{money(a.amount)}</td>
                    <td className="px-4 py-3 text-[13px]">{a.requestedBy}</td>
                    {tab === "pending" ? (
                      <>
                        <td className="px-4 py-3 text-[13px]">{a.reason}</td>
                        <td className="px-4 py-3 text-[13px]">
                          {dayLabel(a.day, hydrated)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="success"
                              disabled={!doctor}
                              onClick={() =>
                                dispatch({
                                  type: "decide",
                                  approvalId: a.id,
                                  approve: true,
                                })
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={!doctor}
                              onClick={() => setRejecting(a)}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <span
                            className={cx(
                              "rounded-full px-2.5 py-1 text-[12px] font-medium",
                              a.status === "APPROVED"
                                ? "bg-[#dfe9d6] text-[#3e5a2c]"
                                : "bg-[#f6dcd7] text-[#a12a1f]",
                            )}
                          >
                            {a.status === "APPROVED" ? "Approved" : "Rejected"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px]">{a.decidedBy}</td>
                        <td className="text-body px-4 py-3 text-[13px]">
                          {a.note ?? a.reason}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {tab === "pending" && pending.length === 0 && (
          <Empty>
            No pending approvals.{" "}
            <button
              type="button"
              onClick={() => setTab("history")}
              className="text-oxblood cursor-pointer hover:underline"
            >
              See recent decisions
            </button>
          </Empty>
        )}
        {tab === "history" && history.length === 0 && (
          <Empty>No decisions yet.</Empty>
        )}
      </Card>

      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title="Reject discount?"
      >
        <label className="block">
          <span className="text-body mb-1.5 block text-[13px] font-medium">
            Explain why this request is being rejected
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className={cx(inputClass, "h-auto py-2")}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setRejecting(null)}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!note.trim()}
            onClick={() => {
              if (rejecting)
                dispatch({
                  type: "decide",
                  approvalId: rejecting.id,
                  approve: false,
                  note: note.trim(),
                });
              setRejecting(null);
              setNote("");
            }}
          >
            Reject
          </Button>
        </div>
      </Modal>
    </>
  );
}

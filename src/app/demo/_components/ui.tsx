"use client";

import { Plus, Trash, X } from "@phosphor-icons/react";
import { useEffect, useId, useRef } from "react";

import {
  type ApptType,
  type Method,
  type PayStatus,
  type PaymentInput,
  type Status,
  money,
} from "../_lib/store";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "success" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl font-medium whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-10 px-4 text-[14px]",
        size === "lg" && "h-11 px-5 text-[15px]",
        variant === "primary" && "bg-ink text-parchment hover:bg-oxblood",
        variant === "secondary" &&
          "border-line-strong hover:border-ink border bg-white/70",
        variant === "ghost" && "text-body hover:bg-vellum hover:text-ink",
        variant === "success" && "bg-[#3e6b2f] text-white hover:bg-[#2f5524]",
        variant === "danger" && "text-[#a12a1f] hover:bg-[#f7e1dc]",
        className,
      )}
    />
  );
}

const statusStyle: Record<Status, [string, string]> = {
  SCHEDULED: ["Scheduled", "bg-[#e3ecf3] text-[#2f5571]"],
  CHECKED_IN: ["Checked in", "bg-blush text-oxblood"],
  IN_PROGRESS: ["In progress", "bg-[#efe1f0] text-[#6b2f73]"],
  COMPLETED: ["Completed", "bg-[#dfe9d6] text-[#3e5a2c]"],
  NO_SHOW: ["No show", "bg-[#f6dcd7] text-[#a12a1f]"],
  CANCELLED: ["Cancelled", "bg-line text-muted"],
};

export function StatusBadge({ status }: { status: Status }) {
  const [label, style] = statusStyle[status];
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium whitespace-nowrap",
        style,
      )}
    >
      {label}
    </span>
  );
}

const payStyle: Record<PayStatus, [string, string]> = {
  PAID: ["Paid", "bg-[#dfe9d6] text-[#3e5a2c]"],
  PENDING: ["Pending", "bg-blush text-oxblood"],
  PARTIALLY_PAID: ["Partial", "bg-[#f6e3c6] text-[#82520f]"],
  VOID: ["Void", "bg-line text-muted"],
};

export function PayBadge({ status }: { status: PayStatus }) {
  const [label, style] = payStyle[status];
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium",
        style,
      )}
    >
      {label}
    </span>
  );
}

const typeLabel: Record<ApptType, string> = {
  REGULAR: "Regular",
  FOLLOW_UP: "Follow up",
  WALK_IN: "Walk in",
  PROCEDURE: "Procedure",
};

export function TypeChip({ type }: { type: ApptType }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-medium tracking-wide whitespace-nowrap uppercase",
        type === "PROCEDURE"
          ? "border-[#d9c2dc] text-[#6b2f73]"
          : "border-line-strong text-body",
      )}
    >
      {typeLabel[type]}
    </span>
  );
}

export function Token({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <span className={cx("text-oxblood font-mono font-semibold", className)}>
      {code}
    </span>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "border-line relative rounded-2xl border bg-white/60",
        className,
      )}
    >
      {title && (
        <header className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold">{title}</h2>
            {subtitle && <p className="text-muted text-[12px]">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
  extra,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-[38px] leading-none tracking-[-0.01em]">
            {title}
          </h1>
          {extra}
        </div>
        {subtitle && <p className="text-muted mt-2 text-[14px]">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted px-5 py-12 text-center text-[14px]">{children}</p>
  );
}

export function Pills<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-vellum inline-flex gap-1 rounded-xl p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "h-8 cursor-pointer rounded-lg px-3 text-[13px] font-medium transition-colors",
            value === o.value
              ? "bg-ink text-parchment"
              : "text-body hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A native <dialog>, so focus trapping and Escape come from the browser. */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cx(
        "bg-parchment text-ink m-auto max-h-[calc(100dvh-32px)] rounded-3xl p-0 shadow-2xl backdrop:bg-[#1e1a16]/45",
        wide
          ? "w-[min(1040px,calc(100vw-24px))]"
          : "w-[min(520px,calc(100vw-24px))]",
      )}
    >
      <div className="bg-parchment sticky top-0 z-10 flex items-center justify-between px-6 pt-5 pb-3">
        <h2 id={titleId} className="font-serif text-[30px] leading-tight">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="hover:bg-vellum inline-flex size-9 cursor-pointer items-center justify-center rounded-full"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-6 pb-6">{open && children}</div>
    </dialog>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="text-body mb-1.5 block text-[13px] font-medium">
        {label}
        {required && <span className="text-oxblood"> *</span>}
      </span>
      {children}
      {hint && (
        <span className="text-muted mt-1 block text-[12px]">{hint}</span>
      )}
    </label>
  );
}

/** Input style without a width, for fields that set their own. */
export const inputBase =
  "border-line-strong focus:border-ink h-10 rounded-xl border bg-white/80 px-3 text-[14px] outline-none transition-colors disabled:opacity-60";
export const inputClass = `${inputBase} w-full`;

const methods: { value: Method; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
];

/** Split payment rows: each method can be used once, like the clinic's counter. */
export function PaymentRows({
  rows,
  onChange,
}: {
  rows: PaymentInput[];
  onChange: (rows: PaymentInput[]) => void;
}) {
  const used = new Set(rows.map((r) => r.method));
  const free = methods.find((m) => !used.has(m.value));
  return (
    <div className="grid gap-2">
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2">
          <input
            aria-label="Amount collected"
            inputMode="numeric"
            placeholder="₹ 0"
            value={row.amount || ""}
            onChange={(e) =>
              onChange(
                rows.map((r, i) =>
                  i === index
                    ? {
                        ...r,
                        amount: Number(e.target.value.replace(/\D/g, "")),
                      }
                    : r,
                ),
              )
            }
            className={cx(inputBase, "w-0 min-w-0 flex-1 font-mono")}
          />
          <select
            aria-label="Payment method"
            value={row.method}
            onChange={(e) =>
              onChange(
                rows.map((r, i) =>
                  i === index ? { ...r, method: e.target.value as Method } : r,
                ),
              )
            }
            className={cx(inputBase, "w-32 shrink-0")}
          >
            {methods
              .filter((m) => m.value === row.method || !used.has(m.value))
              .map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
          </select>
          {rows.length > 1 && (
            <button
              type="button"
              aria-label="Remove payment"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="text-muted hover:text-oxblood inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      ))}
      {free && (
        <button
          type="button"
          onClick={() => onChange([...rows, { amount: 0, method: free.value }])}
          className="text-oxblood inline-flex w-fit cursor-pointer items-center gap-1 text-[13px] font-medium hover:underline"
        >
          <Plus size={13} aria-hidden /> Add payment
        </button>
      )}
    </div>
  );
}

export function SumRow({
  label,
  value,
  strong,
  tone,
}: {
  label: React.ReactNode;
  value: number;
  strong?: boolean;
  tone?: "good" | "warn" | "minus";
}) {
  return (
    <div
      className={cx(
        "flex items-baseline justify-between gap-3",
        strong ? "text-[16px] font-semibold" : "text-[14px]",
      )}
    >
      <span className={strong ? "" : "text-body"}>{label}</span>
      <span
        className={cx(
          "font-mono",
          tone === "good" && "text-[#3e6b2f]",
          tone === "warn" && "text-[#a0570b]",
          tone === "minus" && "text-oxblood",
        )}
      >
        {tone === "minus" && value > 0 ? "− " : ""}
        {money(value)}
      </span>
    </div>
  );
}

export function Toast({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div
      role="status"
      className="bg-ink text-parchment fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-3 text-[14px] shadow-2xl"
    >
      {message}
    </div>
  );
}

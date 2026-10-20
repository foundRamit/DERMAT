"use client";

import { useSyncExternalStore } from "react";

import {
  type Appointment,
  type Consultation,
  type Course,
  type DemoState,
  type Invoice,
  type LineItem,
  type Method,
  type Patient,
  type Status,
  type VisitCategory,
  procedures,
  seed,
  todayKey,
  users,
} from "./data";

export * from "./data";

/* ------------------------------------------------------------------ */
/* Money and invoice maths                                             */
/* ------------------------------------------------------------------ */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
export const money = (amount: number) => inr.format(amount);

export const subtotal = (i: Pick<Invoice, "lines">) =>
  i.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
export const invoiceTotal = (i: Invoice) =>
  i.kind === "ADV" ? paidOf(i) : Math.max(0, subtotal(i) - i.discount);
export const paidOf = (i: Invoice) =>
  i.payments.reduce((s, p) => s + p.amount, 0);
export const balanceOf = (i: Invoice) =>
  i.voided ? 0 : Math.max(0, invoiceTotal(i) - paidOf(i));

export type PayStatus = "PAID" | "PENDING" | "PARTIALLY_PAID" | "VOID";
export function payStatus(i: Invoice): PayStatus {
  if (i.voided) return "VOID";
  const paid = paidOf(i);
  if (paid >= invoiceTotal(i)) return "PAID";
  return paid > 0 ? "PARTIALLY_PAID" : "PENDING";
}

export const methodLabel: Record<Method | "WALLET", string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  WALLET: "From advance",
};

/* ------------------------------------------------------------------ */
/* Clinic rules                                                        */
/* ------------------------------------------------------------------ */

/** Last finished OPD visit for a patient, in days from today. */
export function lastOpdVisit(state: DemoState, patientId: string) {
  const days = state.appointments
    .filter(
      (a) =>
        a.patientId === patientId &&
        a.service === "OPD" &&
        a.status === "COMPLETED",
    )
    .map((a) => a.day);
  return days.length ? Math.max(...days) : null;
}

/** The clinic's visit-window rule: same day or within 7 days is free, within 14 is a follow-up. */
export function visitRule(
  state: DemoState,
  patientId: string,
): { category: VisitCategory; why: string } {
  const last = lastOpdVisit(state, patientId);
  if (last === null)
    return { category: "FIRST", why: "First visit to the clinic" };
  const gap = -last;
  if (gap === 0)
    return {
      category: "FREE",
      why: "Already seen today, so this visit is free",
    };
  if (gap <= 7)
    return {
      category: "FREE",
      why: `Last seen ${gap} day${gap === 1 ? "" : "s"} ago (within 7 days)`,
    };
  if (gap <= 14)
    return {
      category: "FOLLOW_UP",
      why: `Last seen ${gap} days ago (within 14 days)`,
    };
  return {
    category: "FIRST",
    why: `Last seen ${gap} days ago (more than 14 days)`,
  };
}

export function sittingsDone(state: DemoState, courseId: string) {
  return state.appointments.filter(
    (a) => a.courseId === courseId && a.status === "COMPLETED",
  ).length;
}
export function sittingsBooked(state: DemoState, courseId: string) {
  return state.appointments.filter(
    (a) =>
      a.courseId === courseId &&
      a.status !== "CANCELLED" &&
      a.status !== "NO_SHOW",
  ).length;
}

export function nextTokenCode(
  state: DemoState,
  walkIn: boolean,
  service: "OPD" | "PROCEDURE",
) {
  const prefix = `${walkIn ? "W" : "P"}${service === "OPD" ? "O" : "P"}`;
  const count = state.appointments.filter(
    (a) => a.day === 0 && a.tokenCode.startsWith(prefix),
  ).length;
  return { code: `${prefix}${count + 1}`, queue: count + 1 };
}

export const toMinutes = (t: string) => {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
};
export const toHHMM = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/** First gap of at least 10 minutes in the doctor's day, from now (or opening time) onwards. */
export function nextFreeSlot(state: DemoState, doctorId: string) {
  const booked = state.appointments
    .filter(
      (a) =>
        a.day === 0 &&
        a.service === "OPD" &&
        a.doctorId === doctorId &&
        a.status !== "CANCELLED" &&
        a.status !== "NO_SHOW",
    )
    .map((a) => [toMinutes(a.start), toMinutes(a.start) + a.duration] as const)
    .sort((a, b) => a[0] - b[0]);
  const now = new Date();
  let t = Math.max(
    9 * 60 + 30,
    Math.ceil((now.getHours() * 60 + now.getMinutes()) / 5) * 5,
  );
  for (const [start, end] of booked) {
    if (start >= t + 10) break;
    t = Math.max(t, end);
  }
  return toHHMM(Math.min(t, 20 * 60));
}

export const fullName = (p?: Pick<Patient, "firstName" | "lastName">) =>
  p ? `${p.firstName} ${p.lastName}` : "";
export const userName = (id: string) =>
  users.find((u) => u.id === id)?.name ?? id;
export const procedureName = (id?: string) =>
  procedures.find((p) => p.id === id)?.name ?? "";
export const genderShort = (g: Patient["gender"]) =>
  g === "MALE" ? "M" : g === "FEMALE" ? "F" : "O";

export function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type PaymentInput = { amount: number; method: Method };

export type CourseChoice =
  | { mode: "none" }
  | { mode: "existing"; courseId: string }
  | {
      mode: "new";
      courseId: string;
      totalSittings: number;
      pricePerSitting: number;
      intervalDays: number;
    };

export type BookingInput = {
  appointmentId: string;
  invoiceId: string;
  patientId: string;
  doctorId: string;
  service: "OPD" | "PROCEDURE";
  walkIn: boolean;
  start: string;
  duration: number;
  chiefComplaint: string;
  visitCategory?: VisitCategory;
  chargeName: string;
  chargeAmount: number;
  procedureId?: string;
  course: CourseChoice;
  staff: string[];
  machines: string[];
  discount?: { amount: number; reason: string };
  payments: PaymentInput[];
  useWallet: boolean;
};

export type Action =
  | { type: "set-role"; role: DemoState["role"] }
  | { type: "register"; patient: Patient }
  | { type: "book"; booking: BookingInput }
  | { type: "check-in"; id: string }
  | { type: "call-next"; doctorId?: string }
  | { type: "start"; id: string }
  | { type: "complete"; id: string }
  | { type: "no-show"; id: string }
  | { type: "cancel"; id: string }
  | { type: "save-consultation"; consultation: Consultation }
  | {
      type: "pay";
      invoiceId: string;
      payments: PaymentInput[];
      useWallet: boolean;
    }
  | { type: "discount"; invoiceId: string; amount: number; reason: string }
  | { type: "decide"; approvalId: string; approve: boolean; note?: string }
  | {
      type: "advance";
      patientId: string;
      amount: number;
      method: Method;
      invoiceId: string;
    }
  | {
      type: "create-invoice";
      invoiceId: string;
      patientId: string;
      lines: LineItem[];
      payments: PaymentInput[];
    }
  | { type: "reset" };

export const currentUserName = (s: Pick<DemoState, "role">) =>
  s.role === "doctor" ? "Dr. Meera Iyer" : "Pooja Sharma";

function nextInvoiceNumber(s: DemoState, kind: Invoice["kind"]) {
  const max = Math.max(
    6900,
    ...s.invoices.map((i) => Number(i.number.split("-").pop()) || 0),
  );
  return `${kind}26-27-${max + 1}`;
}

/** Applies money to an invoice; anything above the balance goes to the patient's advance. */
function settle(
  s: DemoState,
  invoiceId: string,
  payments: PaymentInput[],
  useWallet: boolean,
): DemoState {
  let invoice = s.invoices.find((i) => i.id === invoiceId);
  if (!invoice) return s;
  const patient = s.patients.find((p) => p.id === invoice!.patientId);
  if (!patient) return s;
  const by = currentUserName(s);
  let wallet = patient.wallet;

  if (useWallet) {
    const take = Math.min(wallet, balanceOf(invoice));
    if (take > 0) {
      invoice = {
        ...invoice,
        payments: [
          ...invoice.payments,
          { amount: take, method: "WALLET", day: 0, receivedBy: by },
        ],
      };
      wallet -= take;
    }
  }
  for (const pay of payments.filter((p) => p.amount > 0)) {
    const applied = Math.min(balanceOf(invoice), pay.amount);
    if (applied > 0) {
      invoice = {
        ...invoice,
        payments: [
          ...invoice.payments,
          { amount: applied, method: pay.method, day: 0, receivedBy: by },
        ],
      };
    }
    wallet += pay.amount - applied;
  }
  const done = invoice;
  return {
    ...s,
    invoices: s.invoices.map((i) => (i.id === invoiceId ? done : i)),
    patients: s.patients.map((p) =>
      p.id === patient.id ? { ...p, wallet } : p,
    ),
  };
}

/** A doctor's discount applies at once; reception's waits for a doctor to approve it. */
function applyDiscount(
  s: DemoState,
  invoiceId: string,
  amount: number,
  reason: string,
): DemoState {
  const invoice = s.invoices.find((i) => i.id === invoiceId);
  if (!invoice || amount <= 0) return s;
  const capped = Math.min(amount, balanceOf(invoice));
  if (s.role === "doctor") {
    return {
      ...s,
      invoices: s.invoices.map((i) =>
        i.id === invoiceId
          ? { ...i, discount: i.discount + capped, discountReason: reason }
          : i,
      ),
    };
  }
  return {
    ...s,
    seq: s.seq + 1,
    approvals: [
      {
        id: `ap${s.seq + 1}`,
        invoiceId,
        patientId: invoice.patientId,
        amount: capped,
        reason,
        requestedBy: currentUserName(s),
        day: 0,
        status: "PENDING",
      },
      ...s.approvals,
    ],
  };
}

function setStatus(s: DemoState, id: string, status: Status): DemoState {
  return {
    ...s,
    appointments: s.appointments.map((a) =>
      a.id === id ? { ...a, status } : a,
    ),
  };
}

function reduce(s: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "set-role":
      return { ...s, role: action.role };

    case "register":
      return { ...s, patients: [action.patient, ...s.patients] };

    case "book": {
      const b = action.booking;
      const { code, queue } = nextTokenCode(s, b.walkIn, b.service);
      let courses: Course[] = s.courses;
      let courseId: string | undefined;
      let sitting: number | undefined;
      let price = b.chargeAmount;
      let description = b.chargeName;

      if (b.service === "PROCEDURE" && b.course.mode !== "none") {
        if (b.course.mode === "new") {
          courses = [
            {
              id: b.course.courseId,
              patientId: b.patientId,
              procedureId: b.procedureId ?? "",
              totalSittings: b.course.totalSittings,
              pricePerSitting: b.course.pricePerSitting,
              intervalDays: b.course.intervalDays,
              status: "ACTIVE",
            },
            ...courses,
          ];
        }
        courseId = b.course.courseId;
        const course = courses.find((c) => c.id === courseId);
        if (course) {
          sitting = sittingsBooked(s, course.id) + 1;
          price = course.pricePerSitting;
          description = `${procedureName(course.procedureId)} · sitting ${sitting}/${course.totalSittings}`;
        }
      }

      const appointment: Appointment = {
        id: b.appointmentId,
        patientId: b.patientId,
        doctorId: b.doctorId,
        day: 0,
        start: b.start,
        duration: b.duration,
        service: b.service,
        walkIn: b.walkIn,
        type:
          b.service === "PROCEDURE"
            ? "PROCEDURE"
            : b.walkIn
              ? "WALK_IN"
              : b.visitCategory === "FIRST"
                ? "REGULAR"
                : "FOLLOW_UP",
        visitCategory: b.visitCategory,
        status: "SCHEDULED",
        tokenCode: code,
        queue,
        chargeName:
          b.service === "OPD" ? b.chargeName : procedureName(b.procedureId),
        procedureId: b.procedureId,
        courseId,
        sitting,
        staff: b.staff,
        machines: b.machines,
        chiefComplaint: b.chiefComplaint,
        bookedBy: currentUserName(s),
        invoiceId: b.invoiceId,
      };
      const invoice: Invoice = {
        id: b.invoiceId,
        number: nextInvoiceNumber(s, b.service === "OPD" ? "OB" : "PRB"),
        kind: b.service === "OPD" ? "OB" : "PRB",
        patientId: b.patientId,
        appointmentId: b.appointmentId,
        day: 0,
        lines: [
          {
            description,
            category: b.service === "OPD" ? "CONSULTATION" : "PROCEDURE",
            qty: 1,
            unitPrice: price,
          },
        ],
        discount: 0,
        payments: [],
      };
      let next: DemoState = {
        ...s,
        courses,
        appointments: [...s.appointments, appointment],
        invoices: [...s.invoices, invoice],
      };
      if (b.discount)
        next = applyDiscount(
          next,
          b.invoiceId,
          b.discount.amount,
          b.discount.reason,
        );
      return settle(next, b.invoiceId, b.payments, b.useWallet);
    }

    case "check-in": {
      const waiting = s.appointments
        .filter((a) => a.day === 0 && a.status === "CHECKED_IN")
        .map((a) => a.queue);
      const queue = Math.max(0, ...waiting) + 1;
      return {
        ...s,
        appointments: s.appointments.map((a) =>
          a.id === action.id ? { ...a, status: "CHECKED_IN", queue } : a,
        ),
      };
    }

    case "call-next": {
      // Finish whoever is with the doctor, then call in the first person waiting.
      const opd = s.appointments.filter(
        (a) =>
          a.day === 0 &&
          a.service === "OPD" &&
          (!action.doctorId || a.doctorId === action.doctorId),
      );
      const next = opd
        .filter((a) => a.status === "CHECKED_IN")
        .sort((a, b) => a.queue - b.queue)[0];
      const doctorId = action.doctorId ?? next?.doctorId;
      return {
        ...s,
        appointments: s.appointments.map((a) => {
          if (
            opd.includes(a) &&
            a.status === "IN_PROGRESS" &&
            a.doctorId === doctorId
          ) {
            return { ...a, status: "COMPLETED" };
          }
          if (a.id === next?.id) return { ...a, status: "IN_PROGRESS" };
          return a;
        }),
      };
    }

    case "start":
      return setStatus(s, action.id, "IN_PROGRESS");

    case "complete": {
      // Finishing the last sitting closes the course.
      const next = setStatus(s, action.id, "COMPLETED");
      const courseId = s.appointments.find((a) => a.id === action.id)?.courseId;
      const course = next.courses.find((c) => c.id === courseId);
      if (!course || sittingsDone(next, course.id) < course.totalSittings)
        return next;
      return {
        ...next,
        courses: next.courses.map((c) =>
          c.id === course.id ? { ...c, status: "COMPLETED" } : c,
        ),
      };
    }

    case "cancel": {
      const appt = s.appointments.find((a) => a.id === action.id);
      const voided = setStatus(s, action.id, "CANCELLED");
      return {
        ...voided,
        invoices: voided.invoices.map((i) =>
          i.id === appt?.invoiceId && paidOf(i) === 0
            ? { ...i, voided: true }
            : i,
        ),
      };
    }

    case "no-show": {
      // The bill is voided; anything already paid goes back to the patient's advance.
      const appt = s.appointments.find((a) => a.id === action.id);
      if (!appt) return s;
      const invoice = s.invoices.find((i) => i.id === appt.invoiceId);
      const refund = invoice ? paidOf(invoice) : 0;
      const next = setStatus(s, action.id, "NO_SHOW");
      return {
        ...next,
        invoices: next.invoices.map((i) =>
          i.id === appt.invoiceId ? { ...i, voided: true } : i,
        ),
        patients: next.patients.map((p) =>
          p.id === appt.patientId ? { ...p, wallet: p.wallet + refund } : p,
        ),
      };
    }

    case "save-consultation": {
      const c = action.consultation;
      const exists = s.consultations.some((x) => x.id === c.id);
      return {
        ...s,
        consultations: exists
          ? s.consultations.map((x) => (x.id === c.id ? c : x))
          : [...s.consultations, c],
        appointments: s.appointments.map((a) =>
          a.id === c.appointmentId
            ? { ...a, consultationId: c.id, status: "COMPLETED" }
            : a,
        ),
      };
    }

    case "pay":
      return settle(s, action.invoiceId, action.payments, action.useWallet);

    case "discount":
      return applyDiscount(s, action.invoiceId, action.amount, action.reason);

    case "decide": {
      const approval = s.approvals.find((a) => a.id === action.approvalId);
      if (approval?.status !== "PENDING") return s;
      let next: DemoState = {
        ...s,
        approvals: s.approvals.map((a) =>
          a.id === approval.id
            ? {
                ...a,
                status: action.approve ? "APPROVED" : "REJECTED",
                decidedBy: currentUserName(s),
                note: action.note,
              }
            : a,
        ),
      };
      if (action.approve) {
        next = {
          ...next,
          invoices: next.invoices.map((i) =>
            i.id === approval.invoiceId
              ? {
                  ...i,
                  discount:
                    i.discount + Math.min(approval.amount, balanceOf(i)),
                  discountReason: approval.reason,
                }
              : i,
          ),
        };
      }
      return next;
    }

    case "advance": {
      const invoice: Invoice = {
        id: action.invoiceId,
        number: nextInvoiceNumber(s, "ADV"),
        kind: "ADV",
        patientId: action.patientId,
        day: 0,
        lines: [
          {
            description: "Advance deposit",
            category: "OTHER",
            qty: 1,
            unitPrice: action.amount,
          },
        ],
        discount: 0,
        payments: [
          {
            amount: action.amount,
            method: action.method,
            day: 0,
            receivedBy: currentUserName(s),
          },
        ],
      };
      return {
        ...s,
        invoices: [...s.invoices, invoice],
        patients: s.patients.map((p) =>
          p.id === action.patientId
            ? { ...p, wallet: p.wallet + action.amount }
            : p,
        ),
      };
    }

    case "create-invoice": {
      const invoice: Invoice = {
        id: action.invoiceId,
        number: nextInvoiceNumber(s, "INV"),
        kind: "INV",
        patientId: action.patientId,
        day: 0,
        lines: action.lines,
        discount: 0,
        payments: [],
      };
      return settle(
        { ...s, invoices: [...s.invoices, invoice] },
        invoice.id,
        action.payments,
        false,
      );
    }

    case "reset":
      return { ...seed(), role: s.role };
  }
}

/* ------------------------------------------------------------------ */
/* Store, kept in the browser so every visitor gets their own clinic   */
/* ------------------------------------------------------------------ */

const KEY = "dermat-demo-v2";
const SERVER_STATE = seed();
const listeners = new Set<() => void>();
let current: DemoState | null = null;

const keyToTime = (key: string) => {
  const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
};

/**
 * A visitor's changes are kept until they press "Start over". Dates are stored
 * as days from today, so on a later visit everything moves back in time:
 * yesterday's visits show as yesterday, and today's schedule starts empty.
 */
function catchUp(saved: DemoState): DemoState {
  const today = todayKey();
  if (saved.seededOn === today) return saved;
  const gap = Math.round(
    (keyToTime(today) - keyToTime(saved.seededOn)) / 86_400_000,
  );
  if (!Number.isFinite(gap) || gap <= 0) return { ...saved, seededOn: today };
  const back = <T extends { day: number }>(x: T): T => ({
    ...x,
    day: x.day - gap,
  });
  return {
    ...saved,
    seededOn: today,
    appointments: saved.appointments.map((a) =>
      a.day === 0 &&
      (a.status === "SCHEDULED" ||
        a.status === "CHECKED_IN" ||
        a.status === "IN_PROGRESS")
        ? {
            ...back(a),
            status: a.status === "SCHEDULED" ? "NO_SHOW" : "COMPLETED",
          }
        : back(a),
    ),
    consultations: saved.consultations.map(back),
    approvals: saved.approvals.map(back),
    invoices: saved.invoices.map((i) => ({
      ...back(i),
      payments: i.payments.map(back),
    })),
  };
}

function read(): DemoState {
  if (current) return current;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DemoState) : null;
    current = parsed ? catchUp(parsed) : seed();
  } catch {
    current = seed();
  }
  return current;
}

export function dispatch(action: Action) {
  current = reduce(read(), action);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Private mode or storage full: the demo still works in this tab.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep tabs in step, e.g. the token display screen open in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    current = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDemo() {
  return useSyncExternalStore(subscribe, read, () => SERVER_STATE);
}

const noop = () => () => undefined;

/** False during server render and hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export function dayLabel(offset: number, hydrated: boolean) {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (!hydrated)
    return offset < 0 ? `${-offset} days ago` : `In ${offset} days`;
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function byId<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

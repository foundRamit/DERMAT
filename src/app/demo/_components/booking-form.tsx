"use client";

import {
  CheckCircle,
  MagnifyingGlass,
  Plus,
  Warning,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import {
  type CourseChoice,
  type PaymentInput,
  type VisitCategory,
  dispatch,
  doctors,
  fullName,
  machines,
  money,
  newId,
  nextFreeSlot,
  nextTokenCode,
  opdCharges,
  procedureName,
  procedures,
  sittingsBooked,
  sittingsDone,
  staffNames,
  useDemo,
  visitRule,
} from "../_lib/store";
import { PatientForm } from "./patient-form";
import {
  Button,
  Field,
  Modal,
  PaymentRows,
  Pills,
  SumRow,
  cx,
  inputClass,
} from "./ui";

type Service = "OPD" | "PROCEDURE";

export function BookingForm({
  initialService = "OPD",
  initialPatientId,
  lockService,
  onClose,
}: {
  initialService?: Service;
  initialPatientId?: string;
  lockService?: boolean;
  onClose: () => void;
}) {
  const state = useDemo();
  const [service, setService] = useState<Service>(initialService);
  const [walkIn, setWalkIn] = useState(true);
  const [patientId, setPatientId] = useState(initialPatientId ?? "");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [start, setStart] = useState(() =>
    nextFreeSlot(state, doctors[0]?.id ?? ""),
  );
  const [duration, setDuration] = useState(initialService === "OPD" ? 10 : 30);
  const [complaint, setComplaint] = useState("");
  const [category, setCategory] = useState<VisitCategory | null>(null);
  const [procedureId, setProcedureId] = useState("");
  const [courseMode, setCourseMode] = useState<string>("none");
  const [newSittings, setNewSittings] = useState("6");
  const [newGap, setNewGap] = useState("30");
  const [newPrice, setNewPrice] = useState("");
  const [staff, setStaff] = useState<string[]>([]);
  const [usedMachines, setUsedMachines] = useState<string[]>([]);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discount, setDiscount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [payments, setPayments] = useState<PaymentInput[]>([
    { amount: 0, method: "CASH" },
  ]);
  const [useWallet, setUseWallet] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<{
    token: string;
    time: string;
    name: string;
  } | null>(null);

  const patient = state.patients.find((p) => p.id === patientId);
  const rule = patient ? visitRule(state, patient.id) : null;
  const chosenCategory = category ?? rule?.category ?? "FIRST";
  const courses = state.courses.filter(
    (c) => c.patientId === patientId && c.status === "ACTIVE",
  );
  const existingCourse = courses.find((c) => c.id === courseMode);
  const activeProcedureId = existingCourse?.procedureId ?? procedureId;
  const proc = procedures.find((p) => p.id === activeProcedureId);

  const advised = useMemo(() => {
    if (!patientId) return [];
    const booked = new Set(
      state.courses
        .filter((c) => c.patientId === patientId)
        .map((c) => c.procedureId),
    );
    return state.consultations
      .filter((c) => c.patientId === patientId)
      .flatMap((c) => c.advised)
      .filter((a) => !booked.has(a.procedureId));
  }, [state.consultations, state.courses, patientId]);

  // What this booking costs
  let lineLabel = "";
  let price = 0;
  if (service === "OPD") {
    lineLabel = opdCharges[chosenCategory].name;
    price = opdCharges[chosenCategory].amount;
  } else if (proc) {
    if (existingCourse) {
      const n = sittingsBooked(state, existingCourse.id) + 1;
      lineLabel = `${proc.name} · sitting ${n}/${existingCourse.totalSittings}`;
      price = existingCourse.pricePerSitting;
    } else if (courseMode === "new") {
      lineLabel = `${proc.name} · sitting 1/${Number(newSittings) || 1}`;
      price = Number(newPrice) || proc.price;
    } else {
      lineLabel = proc.name;
      price = proc.price;
    }
  }
  const discountAmount = Math.min(Number(discount) || 0, price);
  const doctorView = state.role === "doctor";
  const discountNow = doctorView ? discountAmount : 0;
  const payable = price - discountNow;
  const fromWallet =
    useWallet && patient ? Math.min(patient.wallet, payable) : 0;
  const collected = payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, payable - fromWallet - collected);
  const excess = Math.max(0, collected - (payable - fromWallet));
  const overMax =
    proc &&
    price > 0 &&
    discountAmount > 0 &&
    (discountAmount / price) * 100 > proc.maxDiscountPct;

  const verb = service === "OPD" ? "Book Appointment" : "Book Procedure";
  const submitLabel = !patient
    ? verb
    : collected > 0
      ? `${verb} · Collect ${money(collected)}`
      : balance === 0
        ? `${verb} · Settled`
        : `${verb} without payment`;

  function switchService(next: Service) {
    setService(next);
    setDuration(next === "OPD" ? 10 : 30);
    setError("");
  }

  function submit() {
    if (!patient)
      return setError("Pick a patient first, or register a new one.");
    if (service === "PROCEDURE" && !proc)
      return setError("Pick the procedure.");
    if (service === "PROCEDURE" && staff.length === 0)
      return setError("Pick who is doing the procedure.");
    if (discountAmount > 0 && !discountReason.trim())
      return setError("Give a reason for the discount.");

    const course: CourseChoice =
      service === "PROCEDURE" && courseMode === "new"
        ? {
            mode: "new",
            courseId: newId("c"),
            totalSittings: Math.max(1, Number(newSittings) || 1),
            pricePerSitting: Number(newPrice) || (proc?.price ?? 0),
            intervalDays: Number(newGap) || 30,
          }
        : service === "PROCEDURE" && existingCourse
          ? { mode: "existing", courseId: existingCourse.id }
          : { mode: "none" };

    const token = nextTokenCode(state, walkIn, service).code;
    dispatch({
      type: "book",
      booking: {
        appointmentId: newId("a"),
        invoiceId: newId("i"),
        patientId: patient.id,
        doctorId,
        service,
        walkIn,
        start,
        duration,
        chiefComplaint:
          complaint.trim() ||
          (service === "OPD" ? "Consultation" : (proc?.name ?? "")),
        visitCategory: service === "OPD" ? chosenCategory : undefined,
        chargeName: service === "OPD" ? lineLabel : (proc?.name ?? ""),
        chargeAmount: price,
        procedureId: service === "PROCEDURE" ? activeProcedureId : undefined,
        course,
        staff,
        machines: usedMachines,
        discount:
          discountAmount > 0
            ? { amount: discountAmount, reason: discountReason.trim() }
            : undefined,
        payments,
        useWallet,
      },
    });
    setBooked({ token, time: start, name: fullName(patient) });
  }

  function reset() {
    setBooked(null);
    setPatientId("");
    setComplaint("");
    setCategory(null);
    setProcedureId("");
    setCourseMode("none");
    setStaff([]);
    setUsedMachines([]);
    setDiscount("");
    setDiscountReason("");
    setDiscountOpen(false);
    setPayments([{ amount: 0, method: "CASH" }]);
    setStart(nextFreeSlot(state, doctorId));
  }

  if (booked) {
    return (
      <div className="py-6 text-center">
        <CheckCircle
          size={44}
          weight="fill"
          className="mx-auto text-[#3e6b2f]"
          aria-hidden
        />
        <p className="mt-3 font-serif text-[30px]">Appointment booked</p>
        <p className="mt-2 rounded-xl bg-[#dfe9d6] px-4 py-3 text-[15px] text-[#2f4a20]">
          Booked ·{" "}
          <span className="font-mono font-semibold">{booked.token}</span> ·{" "}
          {booked.time} · {booked.name}
        </p>
        <p className="text-muted mx-auto mt-3 max-w-[420px] text-[13px]">
          The bill was made automatically. Check the patient in when they arrive
          and they will join the waiting line with token {booked.token}.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>Book another</Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Left: patient and schedule */}
      <div className="grid content-start gap-5">
        <div className="flex flex-wrap gap-3">
          {!lockService && (
            <Pills
              label="Service type"
              value={service}
              onChange={switchService}
              options={[
                { value: "OPD", label: "OPD" },
                { value: "PROCEDURE", label: "Procedure" },
              ]}
            />
          )}
          <Pills
            label="Booking mode"
            value={walkIn ? "walk" : "pre"}
            onChange={(v) => setWalkIn(v === "walk")}
            options={[
              { value: "walk", label: "Walk-in" },
              { value: "pre", label: "Pre-booked" },
            ]}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-body text-[13px] font-medium">
              Patient <span className="text-oxblood">*</span>
            </span>
            <button
              type="button"
              onClick={() => setRegistering(true)}
              className="text-oxblood inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium hover:underline"
            >
              <Plus size={13} aria-hidden /> New Patient
            </button>
          </div>
          {patient ? (
            <div className="border-line-strong flex items-center gap-3 rounded-xl border bg-white/80 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {patient.title} {fullName(patient)}
                </p>
                <p className="text-muted font-mono text-[12px]">
                  {patient.uhid} · {patient.phone}
                </p>
              </div>
              {patient.allergies !== "None" && (
                <span className="text-oxblood text-[12px] font-medium">
                  Allergy: {patient.allergies}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setPatientId("");
                  setCategory(null);
                  setCourseMode("none");
                }}
                className="text-oxblood cursor-pointer text-[13px] hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <PatientPicker onPick={setPatientId} />
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={service === "OPD" ? "Doctor" : "Doctor / Supervisor"}
            required
          >
            <select
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setStart(nextFreeSlot(state, e.target.value));
              }}
              className={inputClass}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Start time"
            required
            hint={`Next free slot · ${nextFreeSlot(state, doctorId)}`}
          >
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Duration (minutes)" required>
          <div className="flex flex-wrap gap-1.5">
            {[5, 10, 20, 30, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={duration === m}
                onClick={() => setDuration(m)}
                className={cx(
                  "h-9 cursor-pointer rounded-lg border px-3 text-[13px] font-medium",
                  duration === m
                    ? "bg-ink text-parchment border-ink"
                    : "border-line-strong hover:border-ink bg-white/70",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </Field>

        {service === "OPD" ? (
          <Field label="Charge type" required>
            <select
              value={chosenCategory}
              onChange={(e) => setCategory(e.target.value as VisitCategory)}
              className={inputClass}
            >
              {(Object.keys(opdCharges) as VisitCategory[]).map((k) => (
                <option key={k} value={k}>
                  {opdCharges[k].name} · {money(opdCharges[k].amount)}
                </option>
              ))}
            </select>
            {rule && (
              <span
                className={cx(
                  "mt-1.5 flex items-start gap-1.5 text-[12px]",
                  rule.category === chosenCategory
                    ? "text-muted"
                    : "text-[#a0570b]",
                )}
              >
                {rule.category === chosenCategory ? (
                  <>Picked by the clinic rule: {rule.why}.</>
                ) : (
                  <>
                    <Warning size={14} className="mt-px shrink-0" aria-hidden />
                    The rule says {opdCharges[rule.category].name} ({rule.why}).
                    You picked a different charge.
                  </>
                )}
              </span>
            )}
          </Field>
        ) : (
          <ProcedureFields
            patientSelected={Boolean(patient)}
            advised={advised}
            courses={courses.map((c) => {
              const done = sittingsDone(state, c.id);
              const bookedCount = sittingsBooked(state, c.id);
              return {
                ...c,
                done,
                full: bookedCount >= c.totalSittings,
                next: bookedCount + 1,
              };
            })}
            courseMode={courseMode}
            setCourseMode={setCourseMode}
            procedureId={activeProcedureId}
            setProcedureId={(id) => {
              setProcedureId(id);
              const p = procedures.find((x) => x.id === id);
              if (p) {
                setNewSittings(String(p.sittings));
                setNewGap(String(p.gapDays || 30));
                setNewPrice(String(p.price));
              }
            }}
            newSittings={newSittings}
            setNewSittings={setNewSittings}
            newGap={newGap}
            setNewGap={setNewGap}
            newPrice={newPrice}
            setNewPrice={setNewPrice}
            staff={staff}
            setStaff={setStaff}
            usedMachines={usedMachines}
            setUsedMachines={setUsedMachines}
          />
        )}

        <Field label="Chief complaint / note">
          <input
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="e.g. Pimples on face for 3 months"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Right: billing rail */}
      <aside className="border-line h-fit rounded-2xl border bg-white/70 p-5 lg:sticky lg:top-20">
        <h3 className="font-serif text-[24px] leading-none">Billing</h3>
        <div className="border-line mt-4 grid gap-2 border-b pb-3">
          {lineLabel ? (
            <SumRow label={lineLabel} value={price} />
          ) : (
            <p className="text-muted text-[13px]">
              Pick a patient and service to see the charge.
            </p>
          )}
          {discountAmount > 0 &&
            (doctorView ? (
              <SumRow
                label={`Discount (${discountReason || "no reason yet"})`}
                value={discountAmount}
                tone="minus"
              />
            ) : (
              <p className="text-[12px] text-[#a0570b]">
                Discount of {money(discountAmount)} will be sent to the doctor
                for approval.
              </p>
            ))}
          <SumRow label="Total payable" value={payable} strong />
        </div>

        {!discountOpen ? (
          <button
            type="button"
            onClick={() => setDiscountOpen(true)}
            disabled={!price}
            className="text-oxblood mt-3 inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium hover:underline disabled:opacity-40"
          >
            <Plus size={13} aria-hidden /> Add discount
          </button>
        ) : (
          <div className="bg-vellum/60 mt-3 grid gap-2 rounded-xl p-3">
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <input
                aria-label="Discount amount"
                inputMode="numeric"
                placeholder="₹ 0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ""))}
                className={cx(inputClass, "font-mono")}
              />
              <input
                aria-label="Discount reason"
                placeholder="Reason, e.g. Family"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className={inputClass}
              />
            </div>
            {overMax && (
              <p className="text-[12px] text-[#a0570b]">
                This is more than the {proc?.maxDiscountPct}% limit for{" "}
                {proc?.name}. The doctor can still approve it.
              </p>
            )}
            <p className="text-muted text-[12px]">
              {doctorView
                ? "As a doctor, your discount is applied straight away."
                : "Reception discounts need a doctor's approval."}
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="text-body mb-1.5 text-[13px] font-medium">
            Amount collected (optional)
          </p>
          <PaymentRows rows={payments} onChange={setPayments} />
          {payable > 0 && (
            <button
              type="button"
              onClick={() =>
                setPayments([
                  {
                    amount: Math.max(0, payable - fromWallet),
                    method: payments[0]?.method ?? "CASH",
                  },
                ])
              }
              className="text-muted hover:text-ink mt-2 cursor-pointer text-[12px] underline underline-offset-2"
            >
              Collect full amount now (
              {money(Math.max(0, payable - fromWallet))})
            </button>
          )}
        </div>

        {patient && patient.wallet > 0 && (
          <label className="bg-vellum/60 mt-4 flex items-start gap-2 rounded-xl p-3 text-[13px]">
            <input
              type="checkbox"
              checked={useWallet}
              onChange={(e) => setUseWallet(e.target.checked)}
              className="accent-oxblood mt-0.5 size-4"
            />
            <span>
              Use advance: up to {money(Math.min(patient.wallet, payable))}
              <span className="text-muted block text-[12px]">
                {money(patient.wallet)} available
              </span>
            </span>
          </label>
        )}

        <div className="border-line mt-4 grid gap-1.5 border-t pt-3">
          <SumRow label="Collected" value={collected} />
          {fromWallet > 0 && <SumRow label="From advance" value={fromWallet} />}
          <SumRow
            label="Balance due"
            value={balance}
            strong
            tone={balance === 0 ? "good" : "warn"}
          />
          {excess > 0 && (
            <p className="text-muted text-[12px]">
              Extra {money(excess)} goes to the patient&apos;s advance.
            </p>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="text-oxblood bg-blush/60 mt-4 rounded-xl px-3 py-2 text-[13px]"
          >
            {error}
          </p>
        )}
        <Button
          variant="primary"
          size="lg"
          className="mt-4 w-full"
          onClick={submit}
        >
          {submitLabel}
        </Button>
      </aside>

      <Modal
        open={registering}
        onClose={() => setRegistering(false)}
        title="Register New Patient"
        wide
      >
        <PatientForm
          inBooking
          onCancel={() => setRegistering(false)}
          onRegistered={(id) => {
            setPatientId(id);
            setCategory(null);
            setRegistering(false);
          }}
        />
      </Modal>
    </div>
  );
}

function PatientPicker({ onPick }: { onPick: (id: string) => void }) {
  const state = useDemo();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = state.patients.filter((p) => {
    if (!q) return true;
    const haystack =
      `${fullName(p)} ${p.phone.replace(/\s/g, "")} ${p.uhid}`.toLowerCase();
    return haystack.includes(q) || haystack.includes(q.replace(/\s/g, ""));
  });

  return (
    <div className="border-line-strong rounded-xl border bg-white/80">
      <label className="relative block">
        <span className="sr-only">Search patient</span>
        <MagnifyingGlass
          size={15}
          aria-hidden
          className="text-muted absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone or UHID"
          className="h-10 w-full rounded-xl bg-transparent pr-3 pl-9 text-[14px] outline-none"
        />
      </label>
      <ul className="border-line max-h-[188px] overflow-y-auto border-t">
        {matches.slice(0, 30).map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p.id)}
              className="hover:bg-vellum flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left"
            >
              <span className="font-medium">{fullName(p)}</span>
              <span className="text-muted font-mono text-[12px]">
                {p.uhid} · {p.phone}
              </span>
            </button>
          </li>
        ))}
        {matches.length === 0 && (
          <li className="text-muted px-3 py-3 text-[13px]">
            No patient found. Use “New Patient”.
          </li>
        )}
      </ul>
    </div>
  );
}

type CourseRow = {
  id: string;
  procedureId: string;
  totalSittings: number;
  done: number;
  full: boolean;
  next: number;
};

function ProcedureFields(props: {
  patientSelected: boolean;
  advised: { procedureId: string; sittings: number }[];
  courses: CourseRow[];
  courseMode: string;
  setCourseMode: (v: string) => void;
  procedureId: string;
  setProcedureId: (id: string) => void;
  newSittings: string;
  setNewSittings: (v: string) => void;
  newGap: string;
  setNewGap: (v: string) => void;
  newPrice: string;
  setNewPrice: (v: string) => void;
  staff: string[];
  setStaff: (v: string[]) => void;
  usedMachines: string[];
  setUsedMachines: (v: string[]) => void;
}) {
  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  const inCourse = props.courses.some((c) => c.id === props.courseMode);

  return (
    <div className="grid gap-4">
      {props.advised.length > 0 && (
        <div className="bg-blush/40 rounded-xl p-3">
          <p className="text-oxblood text-[12px] font-semibold">
            Advised by the doctor, not booked yet
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {props.advised.map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  props.setCourseMode(a.sittings > 1 ? "new" : "none");
                  props.setProcedureId(a.procedureId);
                  props.setNewSittings(String(a.sittings));
                }}
                className="border-oxblood/30 hover:bg-blush cursor-pointer rounded-full border bg-white/70 px-3 py-1 text-[12px]"
              >
                {procedureName(a.procedureId)} · {a.sittings} sittings
              </button>
            ))}
          </div>
        </div>
      )}

      {props.patientSelected && (
        <Field label="Procedure course">
          <div className="grid gap-1.5">
            {props.courses.map((c) => (
              <label
                key={c.id}
                className={cx(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px]",
                  props.courseMode === c.id
                    ? "border-ink bg-white"
                    : "border-line-strong bg-white/60",
                  c.full && "opacity-50",
                )}
              >
                <input
                  type="radio"
                  name="course"
                  disabled={c.full}
                  checked={props.courseMode === c.id}
                  onChange={() => props.setCourseMode(c.id)}
                  className="accent-oxblood"
                />
                <span className="flex-1">{procedureName(c.procedureId)}</span>
                <span className="text-muted">
                  {c.full
                    ? "Course full"
                    : `Sitting ${c.next}/${c.totalSittings}`}
                </span>
              </label>
            ))}
            {(["none", "new"] as const).map((mode) => (
              <label
                key={mode}
                className={cx(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px]",
                  props.courseMode === mode
                    ? "border-ink bg-white"
                    : "border-line-strong bg-white/60",
                )}
              >
                <input
                  type="radio"
                  name="course"
                  checked={props.courseMode === mode}
                  onChange={() => props.setCourseMode(mode)}
                  className="accent-oxblood"
                />
                {mode === "none"
                  ? "No course, one-off procedure"
                  : "Start new course"}
              </label>
            ))}
          </div>
        </Field>
      )}

      <Field label="Procedure" required>
        <select
          value={props.procedureId}
          disabled={inCourse}
          onChange={(e) => props.setProcedureId(e.target.value)}
          className={inputClass}
        >
          <option value="">Pick a procedure</option>
          {procedures.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {money(p.price)}
            </option>
          ))}
        </select>
      </Field>

      {props.courseMode === "new" && (
        <div className="bg-vellum/60 grid grid-cols-3 gap-2 rounded-xl p-3">
          <Field label="Total sittings" required>
            <input
              inputMode="numeric"
              value={props.newSittings}
              onChange={(e) =>
                props.setNewSittings(e.target.value.replace(/\D/g, ""))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Every (days)">
            <input
              inputMode="numeric"
              value={props.newGap}
              onChange={(e) =>
                props.setNewGap(e.target.value.replace(/\D/g, ""))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Price / sitting (₹)">
            <input
              inputMode="numeric"
              value={props.newPrice}
              onChange={(e) =>
                props.setNewPrice(e.target.value.replace(/\D/g, ""))
              }
              className={cx(inputClass, "font-mono")}
            />
          </Field>
          <p className="text-muted col-span-3 text-[12px]">
            Course total: {Number(props.newSittings) || 0} ×{" "}
            {money(Number(props.newPrice) || 0)} ={" "}
            {money(
              (Number(props.newSittings) || 0) * (Number(props.newPrice) || 0),
            )}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Procedure staff" required>
          <div className="grid gap-1">
            {staffNames.map((s) => (
              <label key={s} className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={props.staff.includes(s)}
                  onChange={() => props.setStaff(toggle(props.staff, s))}
                  className="accent-oxblood size-4"
                />
                {s}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Machines">
          <div className="grid gap-1">
            {machines.map((m) => (
              <label key={m} className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={props.usedMachines.includes(m)}
                  onChange={() =>
                    props.setUsedMachines(toggle(props.usedMachines, m))
                  }
                  className="accent-oxblood size-4"
                />
                {m}
              </label>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

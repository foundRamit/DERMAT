/* Types, price lists and the sample clinic the demo starts with. */

export type Gender = "MALE" | "FEMALE" | "OTHER";
export type Status =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";
export type ApptType = "REGULAR" | "FOLLOW_UP" | "WALK_IN" | "PROCEDURE";
export type VisitCategory = "FIRST" | "FOLLOW_UP" | "FREE";
export type Method = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
export type Role = "doctor" | "reception";

export type Patient = {
  id: string;
  uhid: string;
  title: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  phone: string;
  address: string;
  city: string;
  allergies: string;
  skinType: string;
  /** Advance money the patient has with the clinic. */
  wallet: number;
};

export type User = { id: string; name: string; role: Role };

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  /** Days from today: 0 is today, -7 is a week ago. */
  day: number;
  start: string;
  duration: number;
  service: "OPD" | "PROCEDURE";
  walkIn: boolean;
  type: ApptType;
  visitCategory?: VisitCategory;
  status: Status;
  tokenCode: string;
  queue: number;
  chargeName: string;
  procedureId?: string;
  courseId?: string;
  sitting?: number;
  staff: string[];
  machines: string[];
  chiefComplaint: string;
  bookedBy: string;
  invoiceId: string;
  consultationId?: string;
};

export type Course = {
  id: string;
  patientId: string;
  procedureId: string;
  totalSittings: number;
  pricePerSitting: number;
  intervalDays: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
};

export type RxItem = {
  medicine: string;
  dosage: string;
  unit: string;
  frequency: string;
  duration: string;
  remark: string;
};

export type Consultation = {
  id: string;
  number: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  day: number;
  chiefComplaint: string;
  history: string;
  diagnoses: string[];
  rx: RxItem[];
  advised: { procedureId: string; sittings: number }[];
  instructions: string;
  followUpWeeks: number | null;
};

export type LineItem = {
  description: string;
  category: "CONSULTATION" | "PROCEDURE" | "MEDICINE" | "OTHER";
  qty: number;
  unitPrice: number;
};

export type Payment = {
  amount: number;
  method: Method | "WALLET";
  day: number;
  receivedBy: string;
};

export type Invoice = {
  id: string;
  number: string;
  kind: "OB" | "PRB" | "ADV" | "INV";
  patientId: string;
  appointmentId?: string;
  day: number;
  lines: LineItem[];
  discount: number;
  discountReason?: string;
  payments: Payment[];
  voided?: boolean;
};

export type Approval = {
  id: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  reason: string;
  requestedBy: string;
  day: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decidedBy?: string;
  note?: string;
};

export type DemoState = {
  seededOn: string;
  seq: number;
  role: Role;
  patients: Patient[];
  appointments: Appointment[];
  courses: Course[];
  consultations: Consultation[];
  invoices: Invoice[];
  approvals: Approval[];
};

/* ------------------------------------------------------------------ */
/* Clinic set-up                                                       */
/* ------------------------------------------------------------------ */

export const clinicName = "Sample Skin & Hair Clinic";

export const users: User[] = [
  { id: "d1", name: "Dr. Meera Iyer", role: "doctor" },
  { id: "d2", name: "Dr. Arjun Rao", role: "doctor" },
  { id: "u1", name: "Pooja Sharma", role: "reception" },
];
export const doctors = users.filter((u) => u.role === "doctor");
export const staffNames = [
  "Kavita (therapist)",
  "Rahul (laser tech)",
  "Sunita (nurse)",
];
export const machines = [
  "Diode laser",
  "CO2 fractional laser",
  "Q-switched laser",
  "RF device",
  "Cryo unit",
];

export const opdCharges: Record<
  VisitCategory,
  { name: string; amount: number }
> = {
  FIRST: { name: "OPD First Consultation", amount: 500 },
  FOLLOW_UP: { name: "OPD Follow-up", amount: 300 },
  FREE: { name: "OPD Free (review)", amount: 0 },
};

export const procedures = [
  {
    id: "pr1",
    name: "PRP Therapy",
    price: 5000,
    maxDiscountPct: 15,
    sittings: 6,
    gapDays: 30,
  },
  {
    id: "pr2",
    name: "CO2 Fractional, Full Face",
    price: 3500,
    maxDiscountPct: 10,
    sittings: 4,
    gapDays: 30,
  },
  {
    id: "pr3",
    name: "Laser Hair Reduction, Full Face",
    price: 4500,
    maxDiscountPct: 15,
    sittings: 8,
    gapDays: 30,
  },
  {
    id: "pr4",
    name: "Laser Hair Reduction, Under Arms",
    price: 2000,
    maxDiscountPct: 15,
    sittings: 8,
    gapDays: 30,
  },
  {
    id: "pr5",
    name: "Chemical Peel",
    price: 1500,
    maxDiscountPct: 10,
    sittings: 4,
    gapDays: 21,
  },
  {
    id: "pr6",
    name: "Laser Toning",
    price: 4000,
    maxDiscountPct: 10,
    sittings: 6,
    gapDays: 21,
  },
  {
    id: "pr7",
    name: "Botox, Full Face",
    price: 18000,
    maxDiscountPct: 5,
    sittings: 1,
    gapDays: 0,
  },
  {
    id: "pr8",
    name: "Skin Tag Removal",
    price: 1000,
    maxDiscountPct: 10,
    sittings: 1,
    gapDays: 0,
  },
  {
    id: "pr9",
    name: "Mole Removal",
    price: 2000,
    maxDiscountPct: 10,
    sittings: 1,
    gapDays: 0,
  },
  {
    id: "pr10",
    name: "Cryotherapy",
    price: 800,
    maxDiscountPct: 10,
    sittings: 3,
    gapDays: 14,
  },
  {
    id: "pr11",
    name: "Biopsy",
    price: 2000,
    maxDiscountPct: 0,
    sittings: 1,
    gapDays: 0,
  },
  {
    id: "pr12",
    name: "Subcision",
    price: 5000,
    maxDiscountPct: 10,
    sittings: 3,
    gapDays: 30,
  },
];

export const medicines = [
  "Azithromycin 500mg",
  "Doxycycline 100mg",
  "Cephalexin 500mg",
  "Terbinafine 250mg",
  "Itraconazole 100mg",
  "Fluconazole 150mg",
  "Levocetirizine 5mg",
  "Fexofenadine 180mg",
  "Mupirocin Ointment 2%",
  "Fusidic Acid Cream 2%",
  "Clindamycin Gel 1%",
  "Adapalene Gel 0.1%",
  "Luliconazole Cream 1%",
  "Ketoconazole Shampoo 2%",
  "Permethrin Cream 5%",
  "Tacrolimus Ointment 0.1%",
  "Sunscreen SPF 50",
  "Moisturising Lotion",
];
export const units = [
  "Tab",
  "Cap",
  "tube",
  "bottle",
  "ml",
  "g",
  "Pea sized amt",
  "drop",
];
export const frequencies = [
  { code: "1-0-1", label: "Morning and night" },
  { code: "1-1-1", label: "Three times a day" },
  { code: "1-0-0", label: "Morning" },
  { code: "0-1-0", label: "Afternoon" },
  { code: "0-0-1", label: "Night" },
];
export const remarks = [
  "After food",
  "Before food",
  "Apply at night",
  "Apply on affected area",
  "Apply all over face and neck",
];
export const diagnosesList = [
  "Acne Vulgaris",
  "Tinea Corporis",
  "Scabies",
  "Psoriasis",
  "Vitiligo",
  "Melasma",
  "Urticaria",
  "Alopecia Areata",
  "Androgenetic Alopecia",
  "Seborrheic Dermatitis",
  "Atopic Dermatitis",
  "Post-acne scarring",
  "Viral warts",
];
export const followUpOptions = [1, 2, 3, 4, 6, 8, 12];

/* ------------------------------------------------------------------ */
/* Sample clinic                                                       */
/* ------------------------------------------------------------------ */

const p = (
  id: string,
  title: string,
  firstName: string,
  lastName: string,
  age: number,
  gender: Gender,
  phone: string,
  extra: Partial<Patient> = {},
): Patient => ({
  id,
  uhid: `DM2609${String(id.slice(1)).padStart(5, "0")}`,
  title,
  firstName,
  lastName,
  age,
  gender,
  phone,
  address: "Near City Hospital",
  city: "Raipur",
  allergies: "None",
  skinType: "Type IV",
  wallet: 0,
  ...extra,
});

const seedPatients: Patient[] = [
  p("p1", "Ms", "Ananya", "Sharma", 27, "FEMALE", "98201 44310"),
  p("p2", "Mr", "Rohan", "Mehta", 34, "MALE", "99300 18276", {
    allergies: "Sulfa drugs",
    wallet: 15000,
  }),
  p("p3", "Mrs", "Priya", "Nair", 41, "FEMALE", "98450 77102", {
    skinType: "Type III",
  }),
  p("p4", "Mr", "Kabir", "Singh", 19, "MALE", "90040 62195"),
  p("p5", "Mrs", "Fatima", "Khan", 52, "FEMALE", "98111 50438", {
    allergies: "Latex",
    skinType: "Type V",
  }),
  p("p6", "Mr", "Vikram", "Joshi", 46, "MALE", "97690 33871"),
  p("p7", "Ms", "Sneha", "Kulkarni", 31, "FEMALE", "98922 04516", {
    allergies: "Penicillin",
    skinType: "Type III",
  }),
  p("p8", "Mr", "Arjun", "Verma", 29, "MALE", "99870 21934"),
  p("p9", "Mrs", "Isha", "Gupta", 38, "FEMALE", "98330 98012", {
    wallet: 2000,
  }),
  p("p10", "Mr", "Manoj", "Pillai", 58, "MALE", "94440 76220", {
    skinType: "Type V",
  }),
  p("p11", "Ms", "Divya", "Reddy", 24, "FEMALE", "90000 41187"),
  p("p12", "Mr", "Sameer", "Bhatt", 43, "MALE", "98670 53309", {
    allergies: "Iodine",
  }),
];

const seedCourses: Course[] = [
  {
    id: "c1",
    patientId: "p1",
    procedureId: "pr2",
    totalSittings: 4,
    pricePerSitting: 3500,
    intervalDays: 30,
    status: "ACTIVE",
  },
  {
    id: "c2",
    patientId: "p2",
    procedureId: "pr1",
    totalSittings: 6,
    pricePerSitting: 4500,
    intervalDays: 30,
    status: "ACTIVE",
  },
  {
    id: "c3",
    patientId: "p7",
    procedureId: "pr3",
    totalSittings: 8,
    pricePerSitting: 4000,
    intervalDays: 30,
    status: "ACTIVE",
  },
  {
    id: "c4",
    patientId: "p3",
    procedureId: "pr5",
    totalSittings: 4,
    pricePerSitting: 1500,
    intervalDays: 21,
    status: "ACTIVE",
  },
  {
    id: "c5",
    patientId: "p9",
    procedureId: "pr5",
    totalSittings: 4,
    pricePerSitting: 1500,
    intervalDays: 21,
    status: "COMPLETED",
  },
];

type Seeded = Pick<
  DemoState,
  "appointments" | "invoices" | "consultations" | "approvals"
>;

/** Builds today's schedule plus enough history for follow-ups and courses to make sense. */
function buildHistory(): Seeded {
  const appointments: Appointment[] = [];
  const invoices: Invoice[] = [];
  const consultations: Consultation[] = [];
  let n = 0;
  let inv = 6900;
  let con = 0;
  const tokens: Record<string, number> = {};

  function book(a: {
    patientId: string;
    doctorId: string;
    day: number;
    start: string;
    service: "OPD" | "PROCEDURE";
    walkIn?: boolean;
    category?: VisitCategory;
    status: Status;
    complaint: string;
    procedureId?: string;
    courseId?: string;
    sitting?: number;
    paid?: number | "full";
    method?: Method;
    staff?: string[];
    machines?: string[];
  }) {
    const id = `a${++n}`;
    const proc = procedures.find((x) => x.id === a.procedureId);
    const course = seedCourses.find((c) => c.id === a.courseId);
    const prefix = `${a.walkIn ? "W" : "P"}${a.service === "OPD" ? "O" : "P"}`;
    const key = `${a.day}:${prefix}`;
    tokens[key] = (tokens[key] ?? 0) + 1;
    const charge =
      a.service === "OPD" ? opdCharges[a.category ?? "FIRST"] : null;
    const price = course?.pricePerSitting ?? proc?.price ?? charge?.amount ?? 0;
    const invoiceId = `i${++inv}`;
    const total = price;
    const paid = a.paid === "full" ? total : (a.paid ?? 0);
    invoices.push({
      id: invoiceId,
      number: `${a.service === "OPD" ? "OB" : "PRB"}26-27-${inv}`,
      kind: a.service === "OPD" ? "OB" : "PRB",
      patientId: a.patientId,
      appointmentId: id,
      day: a.day,
      lines: [
        {
          description:
            a.service === "OPD"
              ? (charge?.name ?? "")
              : `${proc?.name}${course ? ` · sitting ${a.sitting}/${course.totalSittings}` : ""}`,
          category: a.service === "OPD" ? "CONSULTATION" : "PROCEDURE",
          qty: 1,
          unitPrice: price,
        },
      ],
      discount: 0,
      payments:
        paid > 0
          ? [
              {
                amount: paid,
                method: a.method ?? "UPI",
                day: a.day,
                receivedBy: "Pooja Sharma",
              },
            ]
          : [],
    });
    appointments.push({
      id,
      patientId: a.patientId,
      doctorId: a.doctorId,
      day: a.day,
      start: a.start,
      duration: a.service === "OPD" ? 10 : 30,
      service: a.service,
      walkIn: Boolean(a.walkIn),
      type:
        a.service === "PROCEDURE"
          ? "PROCEDURE"
          : a.walkIn
            ? "WALK_IN"
            : a.category === "FIRST"
              ? "REGULAR"
              : "FOLLOW_UP",
      visitCategory: a.service === "OPD" ? (a.category ?? "FIRST") : undefined,
      status: a.status,
      tokenCode: `${prefix}${tokens[key]}`,
      queue: tokens[key] ?? 0,
      chargeName:
        a.service === "OPD" ? (charge?.name ?? "") : (proc?.name ?? ""),
      procedureId: a.procedureId,
      courseId: a.courseId,
      sitting: a.sitting,
      staff: a.staff ?? [],
      machines: a.machines ?? [],
      chiefComplaint: a.complaint,
      bookedBy: "Pooja Sharma",
      invoiceId,
    });
    return id;
  }

  function consult(
    apptId: string,
    c: Omit<
      Consultation,
      "id" | "number" | "appointmentId" | "patientId" | "doctorId" | "day"
    >,
  ) {
    const appt = appointments.find((a) => a.id === apptId)!;
    const id = `k${++con}`;
    consultations.push({
      id,
      number: `CON-${String(1000 + con)}`,
      appointmentId: apptId,
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      day: appt.day,
      ...c,
    });
    appt.consultationId = id;
  }

  // History: past consultations that lead to today's follow-ups and courses
  consult(
    book({
      patientId: "p1",
      doctorId: "d1",
      day: -95,
      start: "11:00",
      service: "OPD",
      status: "COMPLETED",
      complaint: "Acne scars on cheeks",
      paid: "full",
    }),
    {
      chiefComplaint: "Acne scars on cheeks",
      history: "Old acne, now settled. Wants scars treated.",
      diagnoses: ["Post-acne scarring"],
      rx: [
        {
          medicine: "Sunscreen SPF 50",
          dosage: "",
          unit: "tube",
          frequency: "1-0-0",
          duration: "3 months",
          remark: "Apply all over face and neck",
        },
        {
          medicine: "Adapalene Gel 0.1%",
          dosage: "",
          unit: "Pea sized amt",
          frequency: "0-0-1",
          duration: "2 months",
          remark: "Apply at night",
        },
      ],
      advised: [{ procedureId: "pr2", sittings: 4 }],
      instructions: "Avoid sun. Do not pick at skin.",
      followUpWeeks: 4,
    },
  );
  consult(
    book({
      patientId: "p3",
      doctorId: "d1",
      day: -12,
      start: "10:30",
      service: "OPD",
      status: "COMPLETED",
      complaint: "Dark patches on face",
      paid: "full",
    }),
    {
      chiefComplaint: "Dark patches on face",
      history: "Patches for 2 years, worse in summer.",
      diagnoses: ["Melasma"],
      rx: [
        {
          medicine: "Sunscreen SPF 50",
          dosage: "",
          unit: "tube",
          frequency: "1-1-1",
          duration: "3 months",
          remark: "Apply all over face and neck",
        },
      ],
      advised: [{ procedureId: "pr5", sittings: 4 }],
      instructions: "Reapply sunscreen every 3 hours when outdoors.",
      followUpWeeks: 2,
    },
  );
  consult(
    book({
      patientId: "p6",
      doctorId: "d2",
      day: -10,
      start: "12:00",
      service: "OPD",
      status: "COMPLETED",
      complaint: "Scaly patches on elbows",
      paid: "full",
      method: "CASH",
    }),
    {
      chiefComplaint: "Scaly patches on elbows",
      history: "Known psoriasis, 5 years.",
      diagnoses: ["Psoriasis"],
      rx: [
        {
          medicine: "Moisturising Lotion",
          dosage: "",
          unit: "bottle",
          frequency: "1-0-1",
          duration: "1 month",
          remark: "Apply on affected area",
        },
      ],
      advised: [],
      instructions: "Keep skin moisturised.",
      followUpWeeks: 2,
    },
  );
  consult(
    book({
      patientId: "p12",
      doctorId: "d2",
      day: -4,
      start: "17:00",
      service: "OPD",
      status: "COMPLETED",
      complaint: "Itchy rashes",
      paid: "full",
    }),
    {
      chiefComplaint: "Itchy rashes",
      history: "Hives on and off for 3 months.",
      diagnoses: ["Urticaria"],
      rx: [
        {
          medicine: "Fexofenadine 180mg",
          dosage: "180mg",
          unit: "Tab",
          frequency: "0-0-1",
          duration: "14 days",
          remark: "After food",
        },
      ],
      advised: [],
      instructions: "Note down foods that trigger the rash.",
      followUpWeeks: 1,
    },
  );
  book({
    patientId: "p8",
    doctorId: "d2",
    day: -40,
    start: "16:00",
    service: "OPD",
    status: "COMPLETED",
    complaint: "Warts on hands",
    paid: "full",
  });
  book({
    patientId: "p11",
    doctorId: "d1",
    day: -60,
    start: "15:00",
    service: "OPD",
    status: "COMPLETED",
    complaint: "Dry itchy skin",
    paid: "full",
  });
  book({
    patientId: "p9",
    doctorId: "d1",
    day: -120,
    start: "11:30",
    service: "OPD",
    status: "COMPLETED",
    complaint: "Dull skin",
    paid: "full",
  });

  // Past course sittings
  const sittings: [string, string, string, number, number][] = [
    ["p1", "c1", "pr2", -60, 1],
    ["p1", "c1", "pr2", -30, 2],
    ["p2", "c2", "pr1", -90, 1],
    ["p2", "c2", "pr1", -60, 2],
    ["p2", "c2", "pr1", -30, 3],
    ["p7", "c3", "pr3", -120, 1],
    ["p7", "c3", "pr3", -90, 2],
    ["p7", "c3", "pr3", -60, 3],
    ["p7", "c3", "pr3", -30, 4],
    ["p9", "c5", "pr5", -84, 1],
    ["p9", "c5", "pr5", -63, 2],
    ["p9", "c5", "pr5", -42, 3],
    ["p9", "c5", "pr5", -21, 4],
  ];
  for (const [patientId, courseId, procedureId, day, sitting] of sittings) {
    book({
      patientId,
      doctorId: "d1",
      day,
      start: "13:00",
      service: "PROCEDURE",
      status: "COMPLETED",
      complaint: "Course sitting",
      procedureId,
      courseId,
      sitting,
      paid: patientId === "p2" ? 0 : "full",
      method: "CARD",
      staff: ["Kavita (therapist)"],
      machines: [
        procedureId === "pr3" ? "Diode laser" : "CO2 fractional laser",
      ],
    });
  }
  // Rohan paid for his PRP course in advance; those sittings were settled from his advance
  for (const i of invoices.filter(
    (x) => x.patientId === "p2" && x.kind === "PRB",
  )) {
    i.payments = [
      {
        amount: 4500,
        method: "WALLET",
        day: i.day,
        receivedBy: "Pooja Sharma",
      },
    ];
  }

  // Today
  consult(
    book({
      patientId: "p3",
      doctorId: "d1",
      day: 0,
      start: "09:30",
      service: "OPD",
      category: "FREE",
      status: "COMPLETED",
      complaint: "Melasma review",
    }),
    {
      chiefComplaint: "Melasma review",
      history: "Patches lighter. Using sunscreen daily.",
      diagnoses: ["Melasma"],
      rx: [
        {
          medicine: "Sunscreen SPF 50",
          dosage: "",
          unit: "tube",
          frequency: "1-1-1",
          duration: "3 months",
          remark: "Apply all over face and neck",
        },
      ],
      advised: [{ procedureId: "pr5", sittings: 4 }],
      instructions: "Start chemical peel course.",
      followUpWeeks: 3,
    },
  );
  book({
    patientId: "p8",
    doctorId: "d2",
    day: 0,
    start: "09:45",
    service: "PROCEDURE",
    walkIn: true,
    status: "COMPLETED",
    complaint: "Warts on hands",
    procedureId: "pr10",
    paid: "full",
    method: "CASH",
    staff: ["Sunita (nurse)"],
    machines: ["Cryo unit"],
  });
  book({
    patientId: "p6",
    doctorId: "d2",
    day: 0,
    start: "10:20",
    service: "OPD",
    category: "FOLLOW_UP",
    status: "IN_PROGRESS",
    complaint: "Psoriasis review",
    paid: "full",
    method: "CASH",
  });
  book({
    patientId: "p1",
    doctorId: "d1",
    day: 0,
    start: "10:30",
    service: "PROCEDURE",
    status: "IN_PROGRESS",
    complaint: "Scar treatment",
    procedureId: "pr2",
    courseId: "c1",
    sitting: 3,
    paid: "full",
    method: "CARD",
    staff: ["Rahul (laser tech)"],
    machines: ["CO2 fractional laser"],
  });
  book({
    patientId: "p12",
    doctorId: "d2",
    day: 0,
    start: "10:40",
    service: "OPD",
    category: "FREE",
    status: "CHECKED_IN",
    complaint: "Rash came back",
  });
  book({
    patientId: "p4",
    doctorId: "d1",
    day: 0,
    start: "10:50",
    service: "OPD",
    walkIn: true,
    category: "FIRST",
    status: "CHECKED_IN",
    complaint: "Pimples on face and back",
    paid: "full",
  });
  book({
    patientId: "p5",
    doctorId: "d2",
    day: 0,
    start: "11:00",
    service: "OPD",
    walkIn: true,
    category: "FIRST",
    status: "CHECKED_IN",
    complaint: "Brown raised spots on neck",
  });
  book({
    patientId: "p2",
    doctorId: "d1",
    day: 0,
    start: "11:30",
    service: "PROCEDURE",
    status: "CHECKED_IN",
    complaint: "Hair fall treatment",
    procedureId: "pr1",
    courseId: "c2",
    sitting: 4,
    staff: ["Kavita (therapist)"],
    machines: [],
  });
  book({
    patientId: "p7",
    doctorId: "d1",
    day: 0,
    start: "12:00",
    service: "PROCEDURE",
    status: "SCHEDULED",
    complaint: "Laser hair reduction",
    procedureId: "pr3",
    courseId: "c3",
    sitting: 5,
    staff: ["Rahul (laser tech)"],
    machines: ["Diode laser"],
  });
  book({
    patientId: "p10",
    doctorId: "d2",
    day: 0,
    start: "12:30",
    service: "OPD",
    category: "FIRST",
    status: "SCHEDULED",
    complaint: "Dark mole on back, growing",
  });
  book({
    patientId: "p11",
    doctorId: "d1",
    day: 0,
    start: "14:00",
    service: "OPD",
    category: "FIRST",
    status: "SCHEDULED",
    complaint: "Itchy patches in elbow folds",
  });
  book({
    patientId: "p9",
    doctorId: "d1",
    day: 0,
    start: "15:00",
    service: "OPD",
    category: "FIRST",
    status: "SCHEDULED",
    complaint: "Fine lines, wants treatment advice",
  });

  return { appointments, invoices, consultations, approvals: [] };
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function seed(): DemoState {
  const history = buildHistory();
  // One discount request from reception waiting for the doctor
  const pending = history.invoices.find(
    (i) => i.patientId === "p2" && i.day === 0,
  );
  return {
    seededOn: todayKey(),
    seq: 1,
    role: "reception",
    patients: seedPatients,
    courses: seedCourses,
    ...history,
    approvals: pending
      ? [
          {
            id: "ap1",
            invoiceId: pending.id,
            patientId: "p2",
            amount: 500,
            reason: "Loyal patient, 4th sitting",
            requestedBy: "Pooja Sharma",
            day: 0,
            status: "PENDING",
          },
        ]
      : [],
  };
}

import type { RxItem } from "./data";

/** Condition templates: one pick fills diagnosis, medicines, advice and follow-up. */
export const templates: {
  name: string;
  diagnoses: string[];
  rx: RxItem[];
  advised: { procedureId: string; sittings: number }[];
  instructions: string;
  followUpWeeks: number;
}[] = [
  {
    name: "Acne Vulgaris",
    diagnoses: ["Acne Vulgaris"],
    rx: [
      {
        medicine: "Doxycycline 100mg",
        dosage: "100mg",
        unit: "Cap",
        frequency: "0-0-1",
        duration: "6 weeks",
        remark: "After food",
      },
      {
        medicine: "Adapalene Gel 0.1%",
        dosage: "",
        unit: "Pea sized amt",
        frequency: "0-0-1",
        duration: "3 months",
        remark: "Apply at night",
      },
      {
        medicine: "Clindamycin Gel 1%",
        dosage: "",
        unit: "tube",
        frequency: "1-0-0",
        duration: "6 weeks",
        remark: "Apply on affected area",
      },
      {
        medicine: "Sunscreen SPF 50",
        dosage: "",
        unit: "tube",
        frequency: "1-1-0",
        duration: "3 months",
        remark: "Apply all over face and neck",
      },
    ],
    advised: [{ procedureId: "pr5", sittings: 4 }],
    instructions:
      "Wash face twice a day with a mild face wash. Do not squeeze pimples. Avoid oily food.",
    followUpWeeks: 4,
  },
  {
    name: "Tinea Corporis",
    diagnoses: ["Tinea Corporis"],
    rx: [
      {
        medicine: "Itraconazole 100mg",
        dosage: "200mg",
        unit: "Cap",
        frequency: "1-0-0",
        duration: "3 weeks",
        remark: "After food",
      },
      {
        medicine: "Luliconazole Cream 1%",
        dosage: "",
        unit: "tube",
        frequency: "1-0-1",
        duration: "4 weeks",
        remark: "Apply on affected area",
      },
      {
        medicine: "Levocetirizine 5mg",
        dosage: "5mg",
        unit: "Tab",
        frequency: "0-0-1",
        duration: "14 days",
        remark: "After food",
      },
    ],
    advised: [],
    instructions:
      "Keep the area dry. Wear loose cotton clothes. Wash clothes and towels in hot water. All family members with itching should be treated.",
    followUpWeeks: 3,
  },
  {
    name: "Melasma",
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
      {
        medicine: "Moisturising Lotion",
        dosage: "",
        unit: "bottle",
        frequency: "1-0-1",
        duration: "3 months",
        remark: "Apply all over face and neck",
      },
    ],
    advised: [{ procedureId: "pr5", sittings: 4 }],
    instructions:
      "Reapply sunscreen every 3 hours when outdoors. Avoid steroid creams.",
    followUpWeeks: 4,
  },
  {
    name: "Urticaria",
    diagnoses: ["Urticaria"],
    rx: [
      {
        medicine: "Fexofenadine 180mg",
        dosage: "180mg",
        unit: "Tab",
        frequency: "1-0-1",
        duration: "14 days",
        remark: "After food",
      },
    ],
    advised: [],
    instructions: "Note down any food or medicine that brings on the rash.",
    followUpWeeks: 2,
  },
  {
    name: "Androgenetic Alopecia",
    diagnoses: ["Androgenetic Alopecia"],
    rx: [
      {
        medicine: "Ketoconazole Shampoo 2%",
        dosage: "",
        unit: "bottle",
        frequency: "1-0-0",
        duration: "2 months",
        remark: "Twice a week",
      },
    ],
    advised: [{ procedureId: "pr1", sittings: 6 }],
    instructions:
      "Hair fall takes 3 to 4 months to settle. Eat a protein-rich diet.",
    followUpWeeks: 6,
  },
  {
    name: "Scabies",
    diagnoses: ["Scabies"],
    rx: [
      {
        medicine: "Permethrin Cream 5%",
        dosage: "",
        unit: "tube",
        frequency: "0-0-1",
        duration: "Once, repeat after 7 days",
        remark: "Apply all over body, neck down",
      },
      {
        medicine: "Levocetirizine 5mg",
        dosage: "5mg",
        unit: "Tab",
        frequency: "0-0-1",
        duration: "10 days",
        remark: "After food",
      },
    ],
    advised: [],
    instructions:
      "All family members should be treated on the same night. Wash all clothes and bedding in hot water.",
    followUpWeeks: 2,
  },
];

import type { Icon } from "@phosphor-icons/react";
import {
  Armchair,
  ChatsCircle,
  ClipboardText,
  Drop,
  Receipt,
  Stack,
} from "@phosphor-icons/react/dist/ssr";

export type Step = {
  key: string;
  title: string;
  text: string;
  Icon: Icon;
  /** Stippled medallion from scripts/make-assets.mjs. Falls back to the icon. */
  coin?: string;
  tilt: number;
};

export const steps: Step[] = [
  {
    key: "intake",
    coin: "/images/coins/intake.png",
    title: "Intake",
    text: "Register patients as they arrive and have their details ready before the visit begins.",
    Icon: ClipboardText,
    tilt: -6,
  },
  {
    key: "waiting",
    coin: "/images/coins/waiting.png",
    title: "Waiting room",
    text: "Know who has arrived, who is waiting, and who is next.",
    Icon: Armchair,
    tilt: 4,
  },
  {
    key: "consult",
    coin: "/images/coins/consult.png",
    title: "Consultation",
    text: "Give the dermatologist the context of each visit, and a place to record it.",
    Icon: ChatsCircle,
    tilt: -3,
  },
  {
    key: "treatment",
    coin: "/images/coins/treatment.png",
    title: "Cosmetic treatment",
    text: "Run cosmetic procedures alongside medical care, within the same day.",
    Icon: Drop,
    tilt: 7,
  },
  {
    key: "tracking",
    coin: "/images/coins/tracking.png",
    title: "Procedure tracking",
    text: "Follow each procedure, and each course of sessions, from the first to the last.",
    Icon: Stack,
    tilt: -5,
  },
  {
    key: "billing",
    coin: "/images/coins/billing.png",
    title: "Billing",
    text: "Close the visit by billing consultations and treatments in the same place.",
    Icon: Receipt,
    tilt: 3,
  },
];

export const images = {
  hero: {
    src: "/images/hero-skin.jpg",
    alt: "A stippled anatomical plate of skin in cross-section: the epidermis, follicles and hairs, blood vessels, sweat glands and fat lobules.",
  },
  treatment: {
    src: "/images/treatment-pointillist.jpg",
    alt: "A pointillist painting of a treatment room prepared before a procedure: a treatment chair, a trolley of non-invasive devices and folded linen, and a clipboard with a session checklist.",
  },
};

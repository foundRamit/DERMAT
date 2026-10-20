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
    title: "Registration",
    text: "Add a new patient in under a minute. Their details are ready the next time they visit.",
    Icon: ClipboardText,
    tilt: -6,
  },
  {
    key: "waiting",
    coin: "/images/coins/waiting.png",
    title: "Waiting line",
    text: "Every patient gets a token number. See who has arrived, who is waiting and who goes in next.",
    Icon: Armchair,
    tilt: 4,
  },
  {
    key: "consult",
    coin: "/images/coins/consult.png",
    title: "Consultation",
    text: "The doctor sees past visits, writes the diagnosis and prints the prescription.",
    Icon: ChatsCircle,
    tilt: -3,
  },
  {
    key: "treatment",
    coin: "/images/coins/treatment.png",
    title: "Skin treatments",
    text: "Book laser, peels, PRP and other treatments on the same day as the consultation.",
    Icon: Drop,
    tilt: 7,
  },
  {
    key: "tracking",
    coin: "/images/coins/tracking.png",
    title: "Treatment sessions",
    text: "See how many sessions a patient has done, how many are left and when the next one is due.",
    Icon: Stack,
    tilt: -5,
  },
  {
    key: "billing",
    coin: "/images/coins/billing.png",
    title: "Billing",
    text: "Put the consultation fee and treatment charges on one bill. Take cash, UPI or card.",
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

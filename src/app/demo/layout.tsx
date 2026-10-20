import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo | Dermat",
  description:
    "Try Dermat on a sample skin clinic: book patients, run the waiting line, write prescriptions, track treatment sessions and make bills.",
  robots: { index: false },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

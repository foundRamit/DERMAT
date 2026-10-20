import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist_Mono, Hanken_Grotesk, Instrument_Serif } from "next/font/google";

export const metadata: Metadata = {
  title: "Dermat | Software for skin and hair clinics",
  description:
    "Book appointments, manage the waiting line, write prescriptions, track treatment sessions and collect payments. Everything your skin clinic does in a day, in one place.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${instrumentSerif.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

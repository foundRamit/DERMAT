import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { DotField } from "@/app/_components/three/dot-field";
import { Billing } from "@/app/_components/landing/billing";
import { ClinicDay } from "@/app/_components/landing/clinic-day";
import { Hero } from "@/app/_components/landing/hero";
import { MotionRoot } from "@/app/_components/landing/motion-root";
import { Treatments } from "@/app/_components/landing/treatments";
import { SiteHeader } from "@/app/_components/site-header";

export default function Home() {
  return (
    <MotionRoot>
      <SiteHeader />

      <main className="paper-grain">
        <Hero />
        <ClinicDay />
        <Treatments />
        <Billing />

        {/* Closing call to action, over the breathing dot field */}
        <section
          id="demo"
          aria-labelledby="demo-title"
          className="bg-ink text-parchment relative isolate overflow-hidden"
        >
          <DotField className="absolute inset-0 -z-10" />
          <div className="mx-auto flex min-h-[620px] max-w-[1400px] flex-col justify-end px-5 py-[clamp(88px,11vw,160px)] md:px-12">
            <p className="text-gold mb-6 font-mono text-[11px] tracking-[0.18em] uppercase">
              Try the demo
            </p>
            <h2
              id="demo-title"
              className="max-w-[1000px] font-serif text-[clamp(48px,7vw,112px)] leading-[0.94] font-normal tracking-[-0.015em] text-balance"
            >
              Try it on a sample clinic{" "}
              <em className="text-blush">before you decide.</em>
            </h2>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <Link
                href="/demo"
                className="group bg-parchment text-ink hover:bg-blush inline-flex h-14 items-center gap-3 rounded-full pr-5 pl-7 font-medium transition-colors duration-300"
              >
                Try the demo
                <ArrowUpRight
                  size={17}
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
              <p className="text-mist max-w-[380px] text-[15px] text-pretty">
                Book patients, call them in and make bills, just like on a busy
                day at your clinic. No sign-up needed.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-mist border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-baseline justify-between gap-4 px-5 py-8 text-sm md:px-12">
          <span>
            <span className="text-parchment font-serif text-2xl">Dermat</span>
            <span className="ml-3">Software for skin and hair clinics</span>
          </span>
          <span>© {new Date().getFullYear()} Dermat</span>
        </div>
      </footer>
    </MotionRoot>
  );
}

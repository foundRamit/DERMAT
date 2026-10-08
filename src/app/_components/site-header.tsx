"use client";

import { ArrowUpRight, List, X } from "@phosphor-icons/react";
import { AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import * as m from "motion/react-m";
import { useState } from "react";

const links = [
  { href: "#day", label: "The day" },
  { href: "#treatments", label: "Treatments" },
  { href: "#billing", label: "Billing" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center px-3 pt-3 md:px-6 md:pt-4">
      <m.nav
        aria-label="Main"
        data-testid="site-nav"
        data-scrolled={scrolled}
        animate={{
          maxWidth: scrolled ? 880 : 1400,
          backgroundColor: scrolled
            ? "rgba(246, 240, 228, 0.94)"
            : "rgba(246, 240, 228, 0)",
          borderColor: scrolled
            ? "rgba(205, 191, 167, 1)"
            : "rgba(205, 191, 167, 0)",
          paddingLeft: scrolled ? 20 : 12,
          paddingRight: scrolled ? 8 : 12,
        }}
        transition={{ type: "spring", bounce: 0.12, duration: 0.7 }}
        initial={false}
        className="pointer-events-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-6 rounded-full border border-transparent"
      >
        <a
          href="#top"
          className="font-serif text-[28px] leading-none tracking-[-0.01em]"
        >
          Dermat
        </a>

        <div className="hidden items-center gap-9 text-[15px] md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="link-underline hover:text-oxblood transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#demo"
            className="group bg-ink text-parchment hover:bg-oxblood inline-flex h-10 items-center gap-2 rounded-full pr-3 pl-4 text-[14px] font-medium transition-colors duration-300"
          >
            Book a demo
            <ArrowUpRight
              size={15}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
          className="bg-parchment/90 border-line-strong inline-flex size-11 cursor-pointer items-center justify-center rounded-full border md:hidden"
        >
          {open ? <X size={20} /> : <List size={20} />}
        </button>
      </m.nav>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="bg-parchment border-line-strong pointer-events-auto absolute inset-x-3 top-[72px] flex flex-col rounded-3xl border px-6 py-3 text-xl md:hidden"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-line border-b py-3.5 font-serif text-[28px] leading-tight"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#demo"
              onClick={() => setOpen(false)}
              className="text-oxblood py-3.5 font-serif text-[28px] leading-tight"
            >
              Book a demo
            </a>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}

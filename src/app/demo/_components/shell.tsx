"use client";

import {
  ArrowCounterClockwise,
  ArrowLeft,
  CalendarBlank,
  CalendarCheck,
  House,
  List,
  Percent,
  Receipt,
  Scissors,
  Stethoscope,
  Ticket,
  Users,
  X,
  type Icon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  clinicName,
  currentUserName,
  dispatch,
  useDemo,
  useHydrated,
} from "../_lib/store";
import { Pills, cx } from "./ui";

type NavItem = { href: string; label: string; icon: Icon };

const groups: { label?: string; items: NavItem[] }[] = [
  { items: [{ href: "/demo", label: "Home", icon: House }] },
  {
    label: "Care",
    items: [
      { href: "/demo/opd", label: "OPD", icon: CalendarBlank },
      {
        href: "/demo/appointments",
        label: "Appointments",
        icon: CalendarCheck,
      },
      { href: "/demo/procedures", label: "Procedures", icon: Scissors },
      { href: "/demo/tokens", label: "Tokens", icon: Ticket },
      { href: "/demo/patients", label: "Patients", icon: Users },
      {
        href: "/demo/consultations",
        label: "Consultations",
        icon: Stethoscope,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/demo/billing", label: "Billing", icon: Receipt },
      {
        href: "/demo/discount-approvals",
        label: "Discount Approvals",
        icon: Percent,
      },
    ],
  },
];

export function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const state = useDemo();
  const [menuOpen, setMenuOpen] = useState(false);
  const pending = state.approvals.filter((a) => a.status === "PENDING").length;

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  const isActive = (href: string) =>
    href === "/demo" ? pathname === "/demo" : pathname.startsWith(href);

  return (
    <div className="flex h-dvh flex-col text-[14px] leading-normal">
      <div className="bg-ink text-mist flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-center text-[12px]">
        <span>
          <span className="text-gold font-mono tracking-[0.14em] uppercase">
            Demo
          </span>
          <span className="mx-2">·</span>A sample clinic with made-up patients.
          Your changes are kept in this browser until you start over.
        </span>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Start over with the fresh sample clinic? Everything you changed will be cleared.",
              )
            )
              dispatch({ type: "reset" });
          }}
          className="text-parchment hover:text-blush inline-flex cursor-pointer items-center gap-1 underline-offset-2 hover:underline"
        >
          <ArrowCounterClockwise size={12} aria-hidden />
          Start over
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          aria-label="Main menu"
          className={cx(
            "border-line bg-parchment flex w-60 shrink-0 flex-col border-r",
            "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:shadow-2xl max-lg:transition-[translate,visibility] max-lg:duration-300",
            menuOpen
              ? "max-lg:translate-x-0"
              : "max-lg:invisible max-lg:-translate-x-full",
          )}
        >
          <div className="border-line flex h-16 items-center justify-between gap-2 border-b px-4">
            <div className="min-w-0">
              <p className="truncate font-serif text-[22px] leading-none">
                Dermat
              </p>
              <p className="text-terracotta mt-1 truncate text-[11px] font-medium">
                {clinicName}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-vellum inline-flex size-9 cursor-pointer items-center justify-center rounded-full lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {groups.map((group, gi) => (
              <div key={gi} className={cx(gi > 0 && "mt-4")}>
                {group.label && (
                  <p className="text-muted mb-1 px-3 text-[10px] font-semibold tracking-[0.16em] uppercase">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors",
                        active
                          ? "bg-ink text-parchment font-medium"
                          : "text-body hover:bg-vellum hover:text-ink",
                      )}
                    >
                      <item.icon
                        size={18}
                        weight={active ? "fill" : "regular"}
                        aria-hidden
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.href.endsWith("discount-approvals") &&
                        pending > 0 && (
                          <span className="bg-oxblood text-parchment rounded-full px-1.5 text-[11px] font-semibold">
                            {pending}
                          </span>
                        )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <Link
            href="/"
            className="border-line text-muted hover:text-ink flex items-center gap-2 border-t px-5 py-3.5 text-[13px]"
          >
            <ArrowLeft size={14} aria-hidden /> Back to the Dermat website
          </Link>
        </aside>
        {menuOpen && (
          <div
            aria-hidden
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30 bg-[#1e1a16]/40 lg:hidden"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-line bg-parchment flex h-16 shrink-0 items-center gap-3 border-b px-4 lg:px-8">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="border-line-strong inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border lg:hidden"
            >
              <List size={18} />
            </button>
            <Clock />
            <div className="ml-auto flex items-center gap-3">
              <span className="text-muted hidden text-[12px] md:inline">
                Viewing as
              </span>
              <Pills
                label="Viewing as"
                value={state.role}
                onChange={(role) => dispatch({ type: "set-role", role })}
                options={[
                  { value: "reception", label: "Reception" },
                  { value: "doctor", label: "Doctor" },
                ]}
              />
              <span className="hidden items-center gap-2 sm:flex">
                <span className="bg-oxblood text-parchment inline-flex size-9 items-center justify-center rounded-full text-[13px] font-semibold">
                  {currentUserName(state).replace("Dr. ", "")[0]}
                </span>
                <span className="hidden text-[13px] xl:inline">
                  Hi, {currentUserName(state).replace("Dr. ", "").split(" ")[0]}
                </span>
              </span>
            </div>
          </header>

          <main className="paper-grain min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1280px] px-4 py-7 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Clock() {
  const hydrated = useHydrated();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!hydrated) return <span className="h-8" />;
  return (
    <span className="border-line text-body hidden h-8 items-center rounded-full border bg-white/60 px-3 text-[13px] md:inline-flex">
      {now.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      })}{" "}
      ·{" "}
      {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

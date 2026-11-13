"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import FedooLogo from "@/components/FedooLogo";

interface NavbarProps {
  onOpenSignIn: () => void;
}

const NAV_LINKS = [
  { href: "#restaurants", label: "Restaurants" },
  { href: "#cities", label: "Cities" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#partners", label: "Partner With Us" },
] as const;

export default function Navbar({ onOpenSignIn }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 lg:px-8">
        <a
          href="#"
          aria-label="Fedoo home"
          className="inline-flex items-center shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B01833]"
        >
          <FedooLogo size="md" />
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 py-1 hover:text-zinc-950 hover:underline hover:underline-offset-4 transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B01833]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenSignIn}
            className="min-h-10 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#B01833] rounded-lg hover:bg-[#911329] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B01833] cursor-pointer"
          >
            Sign In
          </button>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B01833] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-zinc-200 bg-white px-4 py-3"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-11 flex items-center px-3 text-base font-medium text-zinc-700 rounded-lg hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B01833]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

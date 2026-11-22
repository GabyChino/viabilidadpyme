"use client";

import Link from "next/link";
import { BarChart3, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function NavbarLanding() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "#como-funciona", label: "Cómo funciona" },
    { href: "#modulos",  label: "Qué ofrecemos"   },
    { href: "#para-quien", label: "Para quién"    },
    { href: "#fuentes",  label: "Fuentes"         },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-content leading-none block">PYME Digital</span>
            <span className="text-[10px] text-brand-strong leading-none block mt-0.5">Tijuana, Baja California</span>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-content-2 hover:text-content transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-content-3">
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse inline-block" />
            Tijuana, B.C.
          </span>
          <ThemeToggle />
          <Link
            href="/analizar"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            Empezar gratis
          </Link>
        </div>

        {/* Hamburger mobile */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
          className="p-1.5 text-content-2 hover:text-content"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-surface border-t border-border px-4 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setTimeout(() => setMenuOpen(false), 50)}
              className="text-sm text-content-2 font-medium"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/analizar"
            onClick={() => setMenuOpen(false)}
            className="mt-1 w-full text-center px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg"
          >
            Empezar gratis
          </Link>
        </div>
      )}
    </header>
  );
}

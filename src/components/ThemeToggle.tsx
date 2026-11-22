"use client";

import { useState, useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

// La paleta base es light — "dark" se activa con data-theme="dark" en <html>.
// Se lee el atributo como store externo para no sincronizar estado en un efecto.
function subscribeTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getThemeSnapshot = () => document.documentElement.getAttribute("data-theme") === "dark";
const getServerThemeSnapshot = () => false;

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const [animating, setAnimating] = useState(false);

  const toggle = () => {
    // Inicia animación del ícono
    setAnimating(true);
    setTimeout(() => setAnimating(false), 350);

    const next = !dark;
    const root = document.documentElement;
    root.classList.add("theme-transition");
    setTimeout(() => root.classList.remove("theme-transition"), 400);
    if (next) {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content overflow-hidden"
      style={{ transition: "background-color 0.35s ease, border-color 0.35s ease" }}
    >
      <span
        style={{
          display: "inline-flex",
          transform: animating ? "rotate(180deg) scale(0)" : "rotate(0deg) scale(1)",
          opacity: animating ? 0 : 1,
          transition: "transform 0.3s cubic-bezier(.22,.68,0,1.2), opacity 0.2s ease",
        }}
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </span>
    </button>
  );
}

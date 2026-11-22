"use client";

import { useEffect, useRef } from "react";

/**
 * Observa un elemento y añade la clase `anim-visible` cuando entra
 * en el viewport. Usa IntersectionObserver (nativo, sin deps externas).
 *
 * Uso:
 *   const ref = useInView<HTMLDivElement>();
 *   <div ref={ref} className="anim-hidden">…</div>
 */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("anim-visible");
          observer.unobserve(el); // solo una vez
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

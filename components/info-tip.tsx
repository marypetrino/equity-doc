"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TOOLTIP_WIDTH = 288;
const MARGIN = 8;

/** Portal-rendered so the tooltip escapes overflow:auto containers (e.g. the sidebar). */
export function InfoTip({ content, label = "More information" }: { content: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const updatePos = () => {
      const el = btnRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      if (left < MARGIN) left = MARGIN;
      if (left + TOOLTIP_WIDTH > window.innerWidth - MARGIN) {
        left = window.innerWidth - TOOLTIP_WIDTH - MARGIN;
      }
      setPos({ top: rect.bottom + 4, left });
    };

    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  return (
    <span className="ml-0.5 inline-flex shrink-0 align-middle">
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[0.6rem] font-bold leading-none text-[var(--accent-light)] hover:border-[var(--accent-light)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        i
      </button>
      {open && typeof window !== "undefined"
        ? createPortal(
            <span
              role="tooltip"
              className="pointer-events-none fixed z-50 w-72 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-left font-sans text-[0.72rem] font-normal normal-case leading-snug tracking-normal text-[var(--text)] shadow-lg"
              style={{ top: pos.top, left: pos.left }}
            >
              {content}
            </span>,
            document.body
          )
        : null}
    </span>
  );
}

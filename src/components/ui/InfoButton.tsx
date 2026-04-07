"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SectionInfo } from "@/lib/sectionInfo";

export function InfoButton({ info }: { info: SectionInfo }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: "80vh" });

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 420;
    const margin = 12;

    let left = rect.right + margin;
    // Flip left if it would go off screen
    if (left + popoverWidth > window.innerWidth - margin) {
      left = rect.left - popoverWidth - margin;
    }

    const top = rect.top;
    // maxHeight = space from button to bottom of viewport minus a margin
    const maxHeight = `${window.innerHeight - rect.top - margin}px`;

    setPos({ top, left, maxHeight });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  const popover = open ? (
    <div
      ref={popoverRef}
      className="fixed z-50 w-[420px] rounded-xl border border-[#1C2333] bg-[#0D1117] p-5 shadow-2xl animate-fade-in-up flex flex-col"
      style={{ top: pos.top, left: pos.left, maxHeight: pos.maxHeight }}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#6366F1]">
            About this section
          </p>
          <h3 className="text-base font-bold text-[#E8EDF2]">{info.title}</h3>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="shrink-0 text-[#374151] hover:text-[#8B949E] transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="mt-1 flex-1 space-y-3 overflow-y-auto pr-1">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6E7681]">
            What it shows
          </p>
          <p className="text-xs leading-relaxed text-[#8B949E]">{info.description}</p>
        </div>

        <div className="h-px bg-[#1C2333]" />

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6E7681]">
            How it's built
          </p>
          <p className="text-xs leading-relaxed text-[#8B949E]">{info.methodology}</p>
        </div>

        {info.scoring && (
          <>
            <div className="h-px bg-[#1C2333]" />
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6E7681]">
                How scores work
              </p>
              <p className="text-xs leading-relaxed text-[#8B949E]">{info.scoring}</p>
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border border-[#1C2333] text-[10px] font-bold text-[#6E7681] transition-colors hover:border-[#6366F1]/50 hover:text-[#6366F1]"
        title="How this works"
      >
        i
      </button>
      {typeof document !== "undefined" && popover
        ? createPortal(popover, document.body)
        : null}
    </>
  );
}

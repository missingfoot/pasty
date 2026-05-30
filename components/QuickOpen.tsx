"use client";

import { useEffect, useRef, useState } from "react";

export type QuickItem = { id: string; title: string; subtitle: string };

/** Sublime-style "Goto Anything" file switcher. */
export default function QuickOpen({
  items,
  onOpen,
  onClose,
}: {
  items: QuickItem[];
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          it.subtitle.toLowerCase().includes(q),
      )
    : items;

  const clampedActive = Math.min(active, Math.max(0, filtered.length - 1));

  const choose = (idx: number) => {
    const item = filtered[idx];
    if (item) onOpen(item.id);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center bg-black/40 pt-[12vh]"
      onMouseDown={onClose}
    >
      <div
        className="h-fit w-[560px] max-w-[90vw] overflow-hidden rounded-md border border-st-border bg-st-bg-dark shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(clampedActive);
            } else if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
          placeholder="Go to file…"
          className="w-full border-b border-st-border bg-st-bg px-4 py-3 text-[14px] text-st-fg outline-none placeholder:text-st-fg-faint"
        />
        <div className="max-h-[50vh] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-[13px] text-st-fg-faint">
              No matching files
            </div>
          )}
          {filtered.map((it, idx) => (
            <button
              key={it.id}
              onMouseEnter={() => setActive(idx)}
              onClick={() => choose(idx)}
              className={`flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left ${
                idx === clampedActive
                  ? "bg-st-accent text-[#1c1f24]"
                  : "text-st-fg/90"
              }`}
            >
              <span className="text-[13px]">{it.title}</span>
              <span
                className={`text-[11px] ${
                  idx === clampedActive ? "text-[#1c1f24]/70" : "text-st-fg-faint"
                }`}
              >
                {it.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

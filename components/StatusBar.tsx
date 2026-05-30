"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "@/lib/languages";

export default function StatusBar({
  line,
  col,
  languageId,
  languageLabel,
  onSelectLanguage,
  saving,
  hasFile,
}: {
  line: number;
  col: number;
  languageId: string;
  languageLabel: string;
  onSelectLanguage: (id: string) => void;
  saving: boolean;
  hasFile: boolean;
}) {
  return (
    <div className="flex h-[24px] flex-shrink-0 items-center justify-between border-t border-st-border bg-st-bg-darker px-3 text-[11px] text-st-fg-dim">
      <div className="flex items-center gap-4">
        {saving ? (
          <span className="text-st-accent">Saving…</span>
        ) : hasFile ? (
          <span className="text-st-green">Saved</span>
        ) : (
          ""
        )}
      </div>
      {hasFile && (
        <div className="flex items-center gap-4">
          <span>
            Ln {line}, Col {col}
          </span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <SyntaxPicker
            currentId={languageId}
            currentLabel={languageLabel}
            onSelect={onSelectLanguage}
          />
        </div>
      )}
    </div>
  );
}

function SyntaxPicker({
  currentId,
  currentLabel,
  onSelect,
}: {
  currentId: string;
  currentLabel: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const q = filter.trim().toLowerCase();
  const items = q
    ? LANGUAGES.filter((l) => l.label.toLowerCase().includes(q))
    : LANGUAGES;

  return (
    <div ref={ref} className="relative">
      <button
        title="Set syntax"
        onMouseDown={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
          setFilter("");
        }}
        className={`-mx-1 rounded px-1.5 py-0.5 text-st-fg hover:bg-st-hover ${
          open ? "bg-st-hover" : ""
        }`}
      >
        {currentLabel}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-1 w-[220px] overflow-hidden rounded border border-st-border bg-st-bg-dark shadow-2xl">
          <input
            autoFocus
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Set syntax…"
            className="w-full border-b border-st-border bg-st-bg px-2 py-1.5 text-[12px] text-st-fg outline-none placeholder:text-st-fg-faint"
          />
          <div className="max-h-[280px] overflow-y-auto py-1">
            {items.length === 0 && (
              <div className="px-3 py-2 text-[12px] text-st-fg-faint">
                No match
              </div>
            )}
            {items.map((lang) => (
              <button
                key={lang.id}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  onSelect(lang.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-[5px] text-left text-[12px] hover:bg-st-accent hover:text-[#1c1f24] ${
                  lang.id === currentId ? "text-st-accent" : "text-st-fg/90"
                }`}
              >
                <span
                  className="inline-block h-2 w-2 flex-shrink-0 rounded-[2px]"
                  style={{ backgroundColor: lang.glyph }}
                />
                <span className="flex-1">{lang.label}</span>
                {lang.id === currentId && <span>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

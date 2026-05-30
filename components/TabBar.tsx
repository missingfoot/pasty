"use client";

import { useEffect, useRef, useState } from "react";

export type TabItem = {
  id: string;
  /** What to display (filename, or first line, or "untitled"). */
  title: string;
  /** Raw filename for editing (empty for untitled). */
  name: string;
  dirty?: boolean;
};

export default function TabBar({
  tabs,
  activeFileId,
  onSelect,
  onClose,
  onRename,
  onNew,
}: {
  tabs: TabItem[];
  activeFileId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onNew: () => void;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);

  return (
    <div className="flex h-[35px] flex-shrink-0 items-end overflow-x-auto bg-st-bg-darker">
      {tabs.map((tab) => {
        const active = tab.id === activeFileId;
        return (
          <div
            key={tab.id}
            onMouseDown={(e) => {
              if (renaming === tab.id) return;
              if (e.button === 1) {
                e.preventDefault();
                onClose(tab.id);
              } else {
                onSelect(tab.id);
              }
            }}
            onDoubleClick={() => setRenaming(tab.id)}
            title={tab.title}
            className={`group flex h-full min-w-[120px] max-w-[240px] cursor-pointer items-center gap-2 border-r border-st-border px-3 text-[12px] ${
              active
                ? "bg-st-bg text-st-fg"
                : "bg-st-bg-tab-inactive text-st-fg-dim hover:text-st-fg"
            }`}
          >
            {renaming === tab.id ? (
              <RenameInput
                initial={tab.name}
                onCommit={(name) => {
                  setRenaming(null);
                  if (name !== tab.name) onRename(tab.id, name);
                }}
                onCancel={() => setRenaming(null)}
              />
            ) : (
              <>
                <span className="flex-1 truncate">{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.id);
                  }}
                  className={`flex h-4 w-4 items-center justify-center rounded text-st-fg-faint hover:bg-st-hover hover:text-st-fg ${
                    tab.dirty ? "group-hover:flex" : "hidden group-hover:flex"
                  }`}
                >
                  ×
                </button>
                {tab.dirty && (
                  <span className="h-2 w-2 rounded-full bg-st-fg-dim group-hover:hidden" />
                )}
              </>
            )}
          </div>
        );
      })}
      <button
        onClick={onNew}
        title="New File (Ctrl+N)"
        className="flex h-full w-9 items-center justify-center text-st-fg-faint hover:bg-st-hover hover:text-st-fg"
      >
        +
      </button>
      <div className="h-full flex-1 bg-st-bg-darker" />
    </div>
  );
}

function RenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      defaultValue={initial}
      placeholder="filename"
      onMouseDown={(e) => e.stopPropagation()}
      onBlur={(e) => onCommit(e.target.value.trim())}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit((e.target as HTMLInputElement).value.trim());
        if (e.key === "Escape") onCancel();
      }}
      className="w-full rounded-sm border border-st-accent bg-st-bg px-1 py-0 text-[12px] text-st-fg outline-none"
    />
  );
}

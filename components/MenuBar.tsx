"use client";

import { useEffect, useRef, useState } from "react";

export type MenuAction = {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
};

export type MenuDef = {
  label: string;
  items: MenuAction[];
};

export default function MenuBar({
  menus,
  userEmail,
}: {
  menus: MenuDef[];
  userEmail?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div
      ref={ref}
      className="flex h-[30px] flex-shrink-0 select-none items-center border-b border-st-border bg-st-bg-darker pl-2 pr-3 text-[12px] text-st-fg-dim"
    >
      <span className="mr-3 flex items-center gap-1.5 font-semibold tracking-tight text-st-fg">
        <span className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-st-accent text-[11px] leading-none text-[#1c1f24]">
          <span className="-rotate-12">≣</span>
        </span>
        pasty
      </span>
      {menus.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              setOpen((cur) => (cur === menu.label ? null : menu.label));
            }}
            onMouseEnter={() => open && setOpen(menu.label)}
            className={`rounded-sm px-2 py-[3px] ${
              open === menu.label
                ? "bg-st-selection text-st-fg"
                : "hover:bg-st-hover hover:text-st-fg"
            }`}
          >
            {menu.label}
          </button>
          {open === menu.label && (
            <div className="absolute left-0 top-full z-50 mt-px min-w-[210px] rounded-b border border-st-border bg-st-bg-dark py-1 shadow-2xl">
              {menu.items.map((item, i) =>
                item.separator ? (
                  <div
                    key={i}
                    className="my-1 border-t border-st-border/70"
                  />
                ) : (
                  <button
                    key={i}
                    disabled={item.disabled}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      item.onClick?.();
                      setOpen(null);
                    }}
                    className="flex w-full items-center justify-between gap-6 px-3 py-[5px] text-left text-st-fg/90 hover:bg-st-accent hover:text-[#1c1f24] disabled:cursor-default disabled:text-st-fg-faint disabled:hover:bg-transparent disabled:hover:text-st-fg-faint"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[11px] text-st-fg-faint">
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      ))}
      <div className="ml-auto truncate pl-4 text-[11px] text-st-fg-faint">
        {userEmail}
      </div>
    </div>
  );
}

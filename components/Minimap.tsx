"use client";

/**
 * Decorative Sublime-style minimap: renders the document as tiny text.
 * (Not scroll-synced yet — purely the recognizable Sublime silhouette.)
 */
export default function Minimap({ content }: { content: string }) {
  const lines = content.split("\n").slice(0, 600);
  return (
    <div className="hidden h-full w-[110px] flex-shrink-0 overflow-hidden border-l border-st-border bg-st-bg px-1 py-1.5 md:block">
      <div
        className="select-none font-mono leading-[3px] text-st-fg-faint/70"
        style={{ fontSize: "2px", letterSpacing: "0.2px" }}
      >
        {lines.map((ln, i) => (
          <div key={i} className="whitespace-pre">
            {ln || " "}
          </div>
        ))}
      </div>
    </div>
  );
}

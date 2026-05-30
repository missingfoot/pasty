// Helpers for deriving what to show for a file.

const MAX_TITLE = 42;

export function firstLine(content: string): string {
  const nl = content.indexOf("\n");
  return (nl === -1 ? content : content.slice(0, nl)).trim();
}

export function isUntitled(name?: string | null): boolean {
  return !name?.trim();
}

/**
 * Sublime-style title: the explicit filename once saved, otherwise the first
 * line of content, falling back to "untitled" for an empty buffer.
 */
export function displayTitle(name: string | undefined | null, content: string): string {
  const n = name?.trim();
  if (n) return n;
  const fl = firstLine(content);
  if (!fl) return "untitled";
  return fl.length > MAX_TITLE ? fl.slice(0, MAX_TITLE) + "…" : fl;
}

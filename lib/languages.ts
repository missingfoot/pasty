import type { Extension } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";
import { sql } from "@codemirror/lang-sql";
import { rust } from "@codemirror/lang-rust";
import { cpp } from "@codemirror/lang-cpp";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import { go } from "@codemirror/legacy-modes/mode/go";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { xml } from "@codemirror/legacy-modes/mode/xml";
import { perl } from "@codemirror/legacy-modes/mode/perl";
import { r } from "@codemirror/legacy-modes/mode/r";
import { swift } from "@codemirror/legacy-modes/mode/swift";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import { properties } from "@codemirror/legacy-modes/mode/properties";
import { diff } from "@codemirror/legacy-modes/mode/diff";
import { java, csharp, kotlin, scala, dart } from "@codemirror/legacy-modes/mode/clike";

export type LangDef = {
  /** Stable id, persisted in `files.language` when chosen manually. */
  id: string;
  /** Human label shown in the status bar + syntax picker. */
  label: string;
  /** File extensions (lowercase, no dot) and/or exact lowercased filenames. */
  exts: string[];
  /** Sidebar dot color. */
  glyph: string;
  /** CodeMirror language extension, or null for plain text. */
  make: () => Extension | null;
};

// Wrap a CodeMirror 5 legacy mode as a CodeMirror 6 language.
const legacy = (mode: Parameters<typeof StreamLanguage.define>[0]) => () =>
  StreamLanguage.define(mode);

// Ordered for the picker. Keep "Plain Text" first.
export const LANGUAGES: LangDef[] = [
  { id: "plaintext", label: "Plain Text", exts: ["txt", "text"], glyph: "#8a93a2", make: () => null },
  { id: "ts", label: "TypeScript", exts: ["ts", "mts", "cts"], glyph: "#6699cc", make: () => javascript({ typescript: true }) },
  { id: "tsx", label: "TypeScript (TSX)", exts: ["tsx"], glyph: "#6699cc", make: () => javascript({ typescript: true, jsx: true }) },
  { id: "js", label: "JavaScript", exts: ["js", "mjs", "cjs"], glyph: "#fac863", make: () => javascript() },
  { id: "jsx", label: "JavaScript (JSX)", exts: ["jsx"], glyph: "#fac863", make: () => javascript({ jsx: true }) },
  { id: "json", label: "JSON", exts: ["json", "jsonc"], glyph: "#f99157", make: () => json() },
  { id: "html", label: "HTML", exts: ["html", "htm"], glyph: "#ec5f67", make: () => html() },
  { id: "css", label: "CSS", exts: ["css", "scss", "sass", "less"], glyph: "#c594c5", make: () => css() },
  { id: "markdown", label: "Markdown", exts: ["md", "markdown", "mdx"], glyph: "#a7adba", make: () => markdown() },
  { id: "python", label: "Python", exts: ["py", "pyw"], glyph: "#99c794", make: () => python() },
  { id: "sql", label: "SQL", exts: ["sql"], glyph: "#5fb3b3", make: () => sql() },
  { id: "rust", label: "Rust", exts: ["rs"], glyph: "#ab7967", make: () => rust() },
  { id: "cpp", label: "C++", exts: ["cpp", "cc", "cxx", "hpp", "hh", "h"], glyph: "#6699cc", make: () => cpp() },
  { id: "c", label: "C", exts: ["c"], glyph: "#6699cc", make: () => cpp() },
  { id: "bash", label: "Shell Script", exts: ["sh", "bash", "zsh", "fish", "bashrc", "zshrc"], glyph: "#99c794", make: legacy(shell) },
  { id: "yaml", label: "YAML", exts: ["yml", "yaml"], glyph: "#f99157", make: legacy(yaml) },
  { id: "toml", label: "TOML", exts: ["toml"], glyph: "#f99157", make: legacy(toml) },
  { id: "ini", label: "INI / Properties", exts: ["ini", "properties", "env", "conf"], glyph: "#8a93a2", make: legacy(properties) },
  { id: "dockerfile", label: "Dockerfile", exts: ["dockerfile"], glyph: "#6699cc", make: legacy(dockerFile) },
  { id: "go", label: "Go", exts: ["go"], glyph: "#5fb3b3", make: legacy(go) },
  { id: "ruby", label: "Ruby", exts: ["rb", "gemfile", "rake"], glyph: "#ec5f67", make: legacy(ruby) },
  { id: "java", label: "Java", exts: ["java"], glyph: "#f99157", make: legacy(java) },
  { id: "csharp", label: "C#", exts: ["cs"], glyph: "#99c794", make: legacy(csharp) },
  { id: "kotlin", label: "Kotlin", exts: ["kt", "kts"], glyph: "#c594c5", make: legacy(kotlin) },
  { id: "scala", label: "Scala", exts: ["scala", "sc"], glyph: "#ec5f67", make: legacy(scala) },
  { id: "dart", label: "Dart", exts: ["dart"], glyph: "#5fb3b3", make: legacy(dart) },
  { id: "swift", label: "Swift", exts: ["swift"], glyph: "#f99157", make: legacy(swift) },
  { id: "lua", label: "Lua", exts: ["lua"], glyph: "#6699cc", make: legacy(lua) },
  { id: "perl", label: "Perl", exts: ["pl", "pm"], glyph: "#6699cc", make: legacy(perl) },
  { id: "r", label: "R", exts: ["r"], glyph: "#6699cc", make: legacy(r) },
  { id: "powershell", label: "PowerShell", exts: ["ps1", "psm1"], glyph: "#6699cc", make: legacy(powerShell) },
  { id: "xml", label: "XML", exts: ["xml", "svg", "xsl", "plist"], glyph: "#ec5f67", make: legacy(xml) },
  { id: "diff", label: "Diff / Patch", exts: ["diff", "patch"], glyph: "#99c794", make: legacy(diff) },
];

const BY_ID = new Map(LANGUAGES.map((l) => [l.id, l]));
const BY_EXT = new Map<string, LangDef>();
for (const lang of LANGUAGES) {
  for (const e of lang.exts) if (!BY_EXT.has(e)) BY_EXT.set(e, lang);
}
const PLAINTEXT = BY_ID.get("plaintext")!;

export function getExtension(filename: string): string {
  const base = filename.toLowerCase();
  const dot = base.lastIndexOf(".");
  // Extensionless special filenames (e.g. "Dockerfile", "Gemfile").
  if (dot <= 0) return base;
  return base.slice(dot + 1);
}

export function langById(id?: string | null): LangDef | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Primary file extension for a language id (used when naming downloads). */
export function extensionForLang(id?: string | null): string {
  return langById(id)?.exts[0] ?? "txt";
}

export function langByExtension(filename: string): LangDef {
  return BY_EXT.get(getExtension(filename)) ?? PLAINTEXT;
}

/** True when a name carries a recognized, non-plaintext extension (e.g. "app.py"). */
export function hasCodeExtension(name?: string | null): boolean {
  if (!name?.trim()) return false;
  return langByExtension(name).id !== "plaintext";
}

/**
 * Resolve a file to its language.
 * Precedence: manual lock → recognized extension → stored/auto-detected → plain.
 */
export function resolveLang(
  name: string | undefined | null,
  language?: string | null,
  syntaxLocked?: boolean,
): LangDef {
  if (syntaxLocked && language) return langById(language) ?? PLAINTEXT;
  if (hasCodeExtension(name)) return langByExtension(name!);
  return langById(language) ?? PLAINTEXT;
}

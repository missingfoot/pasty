// CodeMirror 6 theme approximating Sublime Text 4's default "Mariana"
// color scheme (Oceanic-Next family palette).
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Mariana palette
const c = {
  bg: "#2d3138",
  bgDim: "#272b31",
  fg: "#d3d8e0",
  caret: "#f9c859",
  selection: "#3e4754",
  selectionMatch: "#4e5a65",
  lineHighlight: "#33373f",
  gutterFg: "#5b657a",
  comment: "#65737e",
  red: "#ec5f67",
  orange: "#f99157",
  yellow: "#fac863",
  green: "#99c794",
  cyan: "#5fb3b3",
  blue: "#6699cc",
  purple: "#c594c5",
  brown: "#ab7967",
};

export const sublimeTheme = EditorView.theme(
  {
    "&": {
      color: c.fg,
      backgroundColor: c.bg,
      height: "100%",
      fontSize: "13px",
    },
    ".cm-content": {
      caretColor: c.caret,
      fontFamily:
        'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, Consolas, monospace',
      padding: "6px 0",
      // Sublime renders operators literally — no ligatures (so !== never looks like ==).
      fontVariantLigatures: "none",
      fontFeatureSettings: '"liga" 0, "calt" 0',
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: c.caret },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: c.selection },
    ".cm-selectionMatch": { backgroundColor: c.selectionMatch },
    ".cm-activeLine": { backgroundColor: c.lineHighlight },
    ".cm-activeLineGutter": { backgroundColor: c.lineHighlight, color: c.fg },
    ".cm-gutters": {
      backgroundColor: c.bg,
      color: c.gutterFg,
      border: "none",
      paddingRight: "8px",
    },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 12px" },
    ".cm-foldGutter .cm-gutterElement": { color: c.gutterFg },
    ".cm-matchingBracket, &.cm-focused .cm-matchingBracket": {
      backgroundColor: "rgba(95,179,179,0.25)",
      color: c.cyan,
      outline: "1px solid rgba(95,179,179,0.4)",
    },
    ".cm-scroller": {
      fontFamily:
        'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, Consolas, monospace',
      lineHeight: "1.5",
    },
    ".cm-panels": { backgroundColor: c.bgDim, color: c.fg },
    ".cm-searchMatch": {
      backgroundColor: "rgba(250,200,99,0.25)",
      outline: "1px solid rgba(250,200,99,0.5)",
    },
    ".cm-tooltip": {
      backgroundColor: c.bgDim,
      border: "1px solid #1c1f24",
      color: c.fg,
    },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: c.selection,
      color: c.fg,
    },
  },
  { dark: true },
);

const sublimeHighlight = HighlightStyle.define([
  { tag: t.comment, color: c.comment, fontStyle: "italic" },
  { tag: [t.keyword, t.modifier, t.operatorKeyword], color: c.purple },
  { tag: [t.controlKeyword, t.moduleKeyword], color: c.purple },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: c.fg },
  { tag: [t.variableName], color: c.fg },
  { tag: [t.propertyName], color: c.blue },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: c.blue },
  { tag: [t.labelName], color: c.blue },
  { tag: [t.string, t.special(t.string), t.inserted], color: c.green },
  { tag: [t.number, t.bool, t.null, t.atom], color: c.orange },
  { tag: [t.definitionKeyword, t.typeName], color: c.yellow },
  { tag: [t.className], color: c.yellow },
  { tag: [t.tagName], color: c.red },
  { tag: [t.attributeName], color: c.yellow },
  { tag: [t.angleBracket, t.bracket, t.punctuation, t.separator], color: c.fg },
  { tag: [t.operator], color: c.cyan },
  { tag: [t.regexp], color: c.cyan },
  { tag: [t.escape], color: c.cyan },
  { tag: [t.url, t.link], color: c.cyan, textDecoration: "underline" },
  { tag: [t.meta], color: c.brown },
  { tag: t.heading, color: c.red, fontWeight: "bold" },
  { tag: [t.emphasis], fontStyle: "italic" },
  { tag: [t.strong], fontWeight: "bold" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: [t.invalid], color: c.red },
]);

export const sublime = [sublimeTheme, syntaxHighlighting(sublimeHighlight)];

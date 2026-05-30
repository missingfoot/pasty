"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { ViewUpdate } from "@codemirror/view";
import { EditorView } from "@codemirror/view";
import { sublime } from "@/lib/sublimeTheme";
import { langById } from "@/lib/languages";

export type CursorPos = { line: number; col: number; lines: number };

type Props = {
  fileId: string;
  /** Resolved language id (override or detected). Drives syntax highlighting. */
  languageId: string;
  value: string;
  onChange: (value: string) => void;
  onCursor: (pos: CursorPos) => void;
};

export default function Editor({
  fileId,
  languageId,
  value,
  onChange,
  onCursor,
}: Props) {
  const langExtension = useMemo(
    () => langById(languageId)?.make() ?? null,
    [languageId],
  );

  const extensions = useMemo(() => {
    const base = [EditorView.lineWrapping];
    return langExtension ? [langExtension, ...base] : base;
  }, [langExtension]);

  const handleUpdate = (vu: ViewUpdate) => {
    if (!vu.selectionSet && !vu.docChanged && !vu.focusChanged) return;
    const sel = vu.state.selection.main;
    const line = vu.state.doc.lineAt(sel.head);
    onCursor({
      line: line.number,
      col: sel.head - line.from + 1,
      lines: vu.state.doc.lines,
    });
  };

  return (
    <CodeMirror
      // Remount when switching files so the document + history reset cleanly.
      key={fileId}
      value={value}
      onChange={onChange}
      onUpdate={handleUpdate}
      theme={sublime}
      extensions={extensions}
      height="100%"
      style={{ height: "100%", fontSize: "13px" }}
      indentWithTab
      basicSetup={{
        foldGutter: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        highlightSelectionMatches: true,
        lineNumbers: true,
      }}
    />
  );
}

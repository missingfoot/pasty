"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { resolveLang, langByExtension, extensionForLang } from "@/lib/languages";
import { displayTitle } from "@/lib/files";
import { detectLanguage } from "@/lib/detect";
import AuthGate from "./AuthGate";
import MenuBar, { type MenuDef } from "./MenuBar";
import TabBar from "./TabBar";
import StatusBar from "./StatusBar";
import Minimap from "./Minimap";
import QuickOpen from "./QuickOpen";
import type { CursorPos } from "./Editor";

// CodeMirror touches the DOM; load it on the client only.
const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-st-bg" />,
});

const SAVE_DEBOUNCE_MS = 700;
const DETECT_DEBOUNCE_MS = 500;

type FileRow = {
  id: string;
  name?: string;
  content: string;
  language?: string;
  syntaxLocked?: boolean;
  isPublic?: boolean;
};

type SessionRow = {
  id: string;
  openTabIds?: string[];
  activeFileId?: string;
};

export default function Workspace({
  activeFileId,
}: {
  activeFileId: string | null;
}) {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-st-bg text-st-fg-dim">
        Loading…
      </div>
    );
  }
  if (authError) {
    return (
      <div className="flex h-full items-center justify-center bg-st-bg text-[#ec5f67]">
        Auth error: {authError.message}
      </div>
    );
  }
  if (!user) {
    return <AuthGate />;
  }
  return (
    <Editor_Workspace
      userId={user.id}
      userEmail={user.email ?? ""}
      activeFileId={activeFileId}
    />
  );
}

function Editor_Workspace({
  userId,
  userEmail,
  activeFileId,
}: {
  userId: string;
  userEmail: string;
  activeFileId: string | null;
}) {
  const router = useRouter();

  const { isLoading, error, data } = db.useQuery({
    files: {
      $: {
        where: { "owner.id": userId },
        order: { createdAt: "asc" },
      },
    },
  });

  // Separate query so a not-yet-pushed `sessions` namespace can't break `files`.
  const { data: sessionData } = db.useQuery({
    sessions: { $: { where: { "owner.id": userId } } },
  });

  const files = useMemo<FileRow[]>(
    () => (data?.files as FileRow[] | undefined) ?? [],
    [data],
  );

  // The user's workspace session (one row, synced across devices). We use the
  // user's id as the session row id so writes are a simple upsert.
  const session = (sessionData?.sessions as SessionRow[] | undefined)?.[0];
  const openIds = useMemo<string[]>(
    () => (session?.openTabIds as string[] | undefined) ?? [],
    [session],
  );

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<CursorPos>({ line: 1, col: 1, lines: 1 });
  const [showMinimap, setShowMinimap] = useState(true);
  const [quickOpen, setQuickOpen] = useState(false);

  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const detectTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Latest files, for use inside debounced timers without stale closures.
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // The active file (from the URL) is always shown as a tab, even on a direct
  // visit/reload where it isn't yet in `openIds`.
  const effectiveOpenIds = useMemo(() => {
    if (activeFileId && !openIds.includes(activeFileId)) {
      return [...openIds, activeFileId];
    }
    return openIds;
  }, [openIds, activeFileId]);

  // Upsert the workspace session (open tabs + active file) to the DB. Keyed by
  // userId so it's a single row per user, synced to every device in real time.
  const writeSession = useCallback(
    (openTabIds: string[], activeId: string | null) => {
      db.transact(
        db.tx.sessions[userId]
          .update({
            openTabIds,
            activeFileId: activeId ?? undefined,
            updatedAt: Date.now(),
          })
          .link({ owner: userId }),
      );
    },
    [userId],
  );

  const saveNow = useCallback((fileId: string, content: string) => {
    db.transact(
      db.tx.files[fileId].update({ content, updatedAt: Date.now() }),
    ).finally(() => {
      setPending((cur) => {
        const next = new Set(cur);
        next.delete(fileId);
        return next;
      });
    });
  }, []);

  // Auto-detect syntax from content for untitled / unlocked buffers.
  const scheduleDetect = useCallback((fileId: string, content: string) => {
    const prev = detectTimers.current.get(fileId);
    if (prev) clearTimeout(prev);
    detectTimers.current.set(
      fileId,
      setTimeout(() => {
        detectTimers.current.delete(fileId);
        const file = filesRef.current.find((f) => f.id === fileId);
        if (!file || file.syntaxLocked) return;
        // A file explicitly named with a code extension drives its own syntax.
        if (file.name && langByExtension(file.name).id !== "plaintext") return;
        const detected = detectLanguage(content);
        const current = file.language ?? "plaintext";
        if (detected !== current) {
          db.transact(db.tx.files[fileId].update({ language: detected }));
        }
      }, DETECT_DEBOUNCE_MS),
    );
  }, []);

  const handleChange = useCallback(
    (fileId: string, content: string) => {
      setDrafts((cur) => ({ ...cur, [fileId]: content }));
      setPending((cur) => new Set(cur).add(fileId));
      const existing = saveTimers.current.get(fileId);
      if (existing) clearTimeout(existing);
      saveTimers.current.set(
        fileId,
        setTimeout(() => {
          saveTimers.current.delete(fileId);
          saveNow(fileId, content);
        }, SAVE_DEBOUNCE_MS),
      );
      scheduleDetect(fileId, content);
    },
    [saveNow, scheduleDetect],
  );

  const flush = useCallback(
    (fileId: string) => {
      const t = saveTimers.current.get(fileId);
      if (t) {
        clearTimeout(t);
        saveTimers.current.delete(fileId);
        const content = drafts[fileId];
        if (content !== undefined) saveNow(fileId, content);
      }
    },
    [drafts, saveNow],
  );

  const openFile = useCallback(
    (fileId: string) => {
      const base = effectiveOpenIds;
      const next = base.includes(fileId) ? base : [...base, fileId];
      writeSession(next, fileId);
      router.push(`/f/${fileId}`);
    },
    [effectiveOpenIds, writeSession, router],
  );

  const closeTab = useCallback(
    (fileId: string) => {
      flush(fileId);
      const base = effectiveOpenIds;
      const idx = base.indexOf(fileId);
      const next = base.filter((x) => x !== fileId);
      const closingActive = fileId === activeFileId;
      const neighbor = closingActive
        ? (next[idx] ?? next[idx - 1] ?? null)
        : activeFileId;
      writeSession(next, neighbor);
      if (closingActive) {
        router.push(neighbor ? `/f/${neighbor}` : "/");
      }
    },
    [effectiveOpenIds, activeFileId, flush, writeSession, router],
  );

  const createFile = useCallback(() => {
    const newId = id();
    const now = Date.now();
    db.transact(
      db.tx.files[newId]
        .update({
          name: "",
          content: "",
          language: "plaintext",
          syntaxLocked: false,
          createdAt: now,
          updatedAt: now,
          isPublic: false,
        })
        .link({ owner: userId }),
    );
    openFile(newId);
  }, [userId, openFile]);

  const renameFile = useCallback((fileId: string, rawName: string) => {
    const name = rawName.trim();
    const update: Record<string, unknown> = {
      name,
      syntaxLocked: false,
      updatedAt: Date.now(),
    };
    // A recognized extension re-detects syntax (Sublime does the same).
    const byExt = langByExtension(name);
    if (name && byExt.id !== "plaintext") update.language = byExt.id;
    db.transact(db.tx.files[fileId].update(update));
  }, []);

  // Manual syntax override from the status-bar picker; locks auto-detection.
  const setLanguage = useCallback((fileId: string, langId: string) => {
    db.transact(
      db.tx.files[fileId].update({ language: langId, syntaxLocked: true }),
    );
  }, []);

  const deleteFile = useCallback(
    (fileId: string) => {
      db.transact(db.tx.files[fileId].delete());
      closeTab(fileId);
    },
    [closeTab],
  );

  // Download a file to disk. Uses its name if set; otherwise "untitled" with an
  // extension derived from the (detected or chosen) syntax.
  const downloadFile = useCallback(
    (file: FileRow) => {
      const content =
        drafts[file.id] !== undefined ? drafts[file.id] : file.content;
      const name = file.name?.trim();
      const lang = resolveLang(file.name, file.language, file.syntaxLocked);
      const filename = name || `untitled.${extensionForLang(lang.id)}`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    [drafts],
  );

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) ?? null,
    [files, activeFileId],
  );

  const activeValue =
    activeFile && drafts[activeFile.id] !== undefined
      ? drafts[activeFile.id]
      : (activeFile?.content ?? "");

  // Restore the workspace on a bare visit ("/"): jump to the last active file
  // (or the first still-open tab) recorded in the synced session.
  useEffect(() => {
    if (isLoading || activeFileId) return;
    const exists = (fid?: string | null) =>
      Boolean(fid && files.some((f) => f.id === fid));
    const target =
      (exists(session?.activeFileId) && session?.activeFileId) ||
      openIds.find(exists);
    if (target) router.replace(`/f/${target}`);
  }, [isLoading, activeFileId, session, openIds, files, router]);

  // Persist a directly-visited file (deep link / reload) into the session so it
  // becomes an open tab on every device.
  useEffect(() => {
    if (isLoading || !activeFileId) return;
    const ids = (session?.openTabIds as string[] | undefined) ?? [];
    if (!ids.includes(activeFileId) || session?.activeFileId !== activeFileId) {
      const next = ids.includes(activeFileId) ? ids : [...ids, activeFileId];
      writeSession(next, activeFileId);
    }
  }, [isLoading, activeFileId, session, writeSession]);

  const contentOf = useCallback(
    (f: FileRow) => (drafts[f.id] !== undefined ? drafts[f.id] : f.content),
    [drafts],
  );

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "n") {
        e.preventDefault();
        createFile();
      } else if (k === "s") {
        e.preventDefault();
        if (e.shiftKey) {
          if (activeFile) downloadFile(activeFile);
        } else if (activeFileId) {
          flush(activeFileId);
        }
      } else if (k === "w") {
        e.preventDefault();
        if (activeFileId) closeTab(activeFileId);
      } else if (k === "p") {
        e.preventDefault();
        setQuickOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeFileId, activeFile, createFile, flush, closeTab, downloadFile]);

  const tabs = useMemo(
    () =>
      effectiveOpenIds
        .map((tid) => files.find((f) => f.id === tid))
        .filter((f): f is FileRow => Boolean(f))
        .map((f) => ({
          id: f.id,
          title: displayTitle(f.name, contentOf(f)),
          name: f.name ?? "",
          dirty: pending.has(f.id),
        })),
    [effectiveOpenIds, files, pending, contentOf],
  );

  const quickItems = useMemo(
    () =>
      files.map((f) => ({
        id: f.id,
        title: displayTitle(f.name, contentOf(f)),
        subtitle: resolveLang(f.name, f.language, f.syntaxLocked).label,
      })),
    [files, contentOf],
  );

  const menus: MenuDef[] = useMemo(
    () => [
      {
        label: "File",
        items: [
          { label: "New File", shortcut: "Ctrl+N", onClick: createFile },
          {
            label: "Goto Anything…",
            shortcut: "Ctrl+P",
            onClick: () => setQuickOpen(true),
          },
          {
            label: "Save",
            shortcut: "Ctrl+S",
            onClick: () => activeFileId && flush(activeFileId),
            disabled: !activeFileId,
          },
          {
            label: "Download",
            shortcut: "Ctrl+Shift+S",
            onClick: () => activeFile && downloadFile(activeFile),
            disabled: !activeFile,
          },
          { separator: true, label: "" },
          {
            label: "Close File",
            shortcut: "Ctrl+W",
            onClick: () => activeFileId && closeTab(activeFileId),
            disabled: !activeFileId,
          },
          {
            label: "Delete File…",
            onClick: () => {
              if (
                activeFile &&
                confirm(
                  `Delete "${displayTitle(activeFile.name, activeValue)}"? This cannot be undone.`,
                )
              )
                deleteFile(activeFile.id);
            },
            disabled: !activeFile,
          },
          { separator: true, label: "" },
          { label: "Sign Out", onClick: () => db.auth.signOut() },
        ],
      },
      {
        label: "Edit",
        items: [
          { label: "Undo", shortcut: "Ctrl+Z", disabled: false },
          { label: "Redo", shortcut: "Ctrl+Y", disabled: false },
          { separator: true, label: "" },
          { label: "Find", shortcut: "Ctrl+F", disabled: false },
        ],
      },
      {
        label: "View",
        items: [
          {
            label: showMinimap ? "Hide Minimap" : "Show Minimap",
            onClick: () => setShowMinimap((v) => !v),
          },
        ],
      },
    ],
    [
      createFile,
      flush,
      closeTab,
      deleteFile,
      downloadFile,
      activeFileId,
      activeFile,
      activeValue,
      showMinimap,
    ],
  );

  const activeLang = activeFile
    ? resolveLang(activeFile.name, activeFile.language, activeFile.syntaxLocked)
    : null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-st-bg">
      <MenuBar menus={menus} userEmail={userEmail} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TabBar
          tabs={tabs}
          activeFileId={activeFileId}
          onSelect={openFile}
          onClose={closeTab}
          onRename={renameFile}
          onNew={createFile}
        />
        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {activeFile ? (
              <Editor
                fileId={activeFile.id}
                languageId={activeLang?.id ?? "plaintext"}
                value={activeValue}
                onChange={(v) => handleChange(activeFile.id, v)}
                onCursor={setCursor}
              />
            ) : (
              <EmptyState
                loading={isLoading}
                error={error?.message}
                onCreate={createFile}
                onQuickOpen={() => setQuickOpen(true)}
                hasFiles={files.length > 0}
              />
            )}
          </div>
          {showMinimap && activeFile && <Minimap content={activeValue} />}
        </div>
      </div>
      <StatusBar
        line={cursor.line}
        col={cursor.col}
        languageId={activeLang?.id ?? "plaintext"}
        languageLabel={activeLang?.label ?? "Plain Text"}
        onSelectLanguage={(langId) =>
          activeFile && setLanguage(activeFile.id, langId)
        }
        saving={pending.size > 0}
        hasFile={Boolean(activeFile)}
      />
      {quickOpen && (
        <QuickOpen
          items={quickItems}
          onOpen={(fid) => {
            setQuickOpen(false);
            openFile(fid);
          }}
          onClose={() => setQuickOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyState({
  loading,
  error,
  onCreate,
  onQuickOpen,
  hasFiles,
}: {
  loading: boolean;
  error?: string;
  onCreate: () => void;
  onQuickOpen: () => void;
  hasFiles: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-st-bg text-st-fg-faint">
      {error ? (
        <p className="text-[#ec5f67]">Error loading files: {error}</p>
      ) : loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <p className="text-[14px]">No file open</p>
          <div className="flex gap-2">
            <button
              onClick={onCreate}
              className="rounded border border-st-border bg-st-bg-dark px-4 py-2 text-[13px] text-st-fg hover:border-st-accent"
            >
              New File <span className="text-st-fg-faint">Ctrl+N</span>
            </button>
            {hasFiles && (
              <button
                onClick={onQuickOpen}
                className="rounded border border-st-border bg-st-bg-dark px-4 py-2 text-[13px] text-st-fg hover:border-st-accent"
              >
                Goto Anything <span className="text-st-fg-faint">Ctrl+P</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

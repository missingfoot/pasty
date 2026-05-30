# pasty

An online, web version of **Sublime Text 4**. Each file becomes a tab with its
own unique URL (`/f/<id>`). Auth and storage are handled by
[InstantDB](https://www.instantdb.com); sign in with a magic code (no password).

> Status: **UI-first scaffold.** The editor chrome, tabs, routing, auth, and
> live save-to-InstantDB all work. Sharing / public links are scaffolded in the
> schema but not yet built (see Roadmap).

## Getting started

```bash
npm run dev
```

Open http://localhost:3000. Enter your email, get a one-time code, and you're in.

### What works today

- **Sublime "Mariana" look** — menu bar, tab strip, status bar (Ln/Col, syntax,
  encoding), minimap, and a CodeMirror 6 editor themed to match. No folders/file
  tree — a web pasteboard is tab-driven, not folder-driven.
- **Magic-code auth** — `db.auth.sendMagicCode` / `signInWithMagicCode`. The app
  is gated; you only see your own files.
- **Files as tabs with URLs** — every file lives at `/f/<id>`. The active tab is
  driven by the URL; open tabs persist across reloads (localStorage).
- **Untitled, extensionless buffers** — new files start as `untitled` like
  Sublime. The tab shows the **first line** of content until you give the file a
  name (double-click the tab to rename).
- **Automatic syntax** — syntax is **auto-detected from content** as you paste or
  type (signature heuristics across ~20 languages), so a buffer isn't stuck on
  Plain Text. Override any time via the status-bar syntax picker (which then
  locks detection); naming a file with an extension also pins the syntax.
- **Goto Anything (`Ctrl+P`)** — fuzzy file switcher over all your files (the
  tab-driven replacement for a sidebar).
- **Live editing** — changes auto-save to InstantDB (debounced).
- **Keys** — `Ctrl+N` new, `Ctrl+P` goto anything, `Ctrl+S` save, `Ctrl+W` close.

## Architecture

| Path | Purpose |
| --- | --- |
| `instant.schema.ts` | Data model: `files` linked to `$users` (owner). |
| `instant.perms.ts` | Access rules (owner-only + public read) — roadmap-ready. |
| `lib/db.ts` | InstantDB client (`init` with schema). |
| `lib/languages.ts` | Language registry: extension/id → CodeMirror language. |
| `lib/detect.ts` | Content-based syntax detection (signature heuristics). |
| `lib/files.ts` | Title helpers (first-line / filename / "untitled"). |
| `lib/sublimeTheme.ts` | CodeMirror 6 "Mariana" theme + syntax highlighting. |
| `app/page.tsx` | Root — workspace with no active file. |
| `app/f/[fileId]/page.tsx` | Workspace with a file open in the active tab. |
| `components/Workspace.tsx` | Orchestrator: auth gate, query, tabs, saving, detect. |
| `components/{MenuBar,TabBar,StatusBar,Minimap,Editor,QuickOpen,AuthGate}.tsx` | UI. |

## InstantDB

Credentials live in `.env.local` (gitignored). Copy `.env.example` and fill in:

```
NEXT_PUBLIC_INSTANT_APP_ID=…
INSTANT_ADMIN_TOKEN=…   # admin/server only; not used by the client yet
```

The schema/permissions are defined in code. To push them to the InstantDB
backend (needed before sharing/permissions enforcement matters):

```bash
npx instant-cli@latest login
npx instant-cli@latest push schema
npx instant-cli@latest push perms
```

## Deploying

`.env.local` is **not** committed, so set the same vars on your host. Crucially,
`NEXT_PUBLIC_INSTANT_APP_ID` is inlined at **build time** — it must exist when
the host runs `next build`, or the build fails prerendering `/` with
"Missing NEXT_PUBLIC_INSTANT_APP_ID".

**Netlify** (auto-detected; uses `@netlify/plugin-nextjs`):

1. Site configuration → Environment variables → add `NEXT_PUBLIC_INSTANT_APP_ID`
   (and optionally `INSTANT_ADMIN_TOKEN`).
2. Deploys → Trigger deploy → **Clear cache and deploy site**.

## Roadmap

- **Sharing & public links** — `files.isPublic` + per-user shares; the perms in
  `instant.perms.ts` already allow `view: isOwner || data.isPublic` so a public
  file's `/f/<id>` URL opens without login once enforcement is pushed.
- Scroll-synced minimap, command palette (`Ctrl+P`), find & replace UI,
  folders/projects, and multi-cursor niceties.

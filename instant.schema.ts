// Pasty data model.
// Docs: https://www.instantdb.com/docs/modeling-data
//
// IMPORTANT: any field used in a `where`/`order` must be `.indexed()`.
import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    // Built-in auth namespace; declared so links typecheck.
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    // Each file is rendered as a tab with its own URL (/f/<id>).
    files: i.entity({
      // Explicit filename once "saved". Empty/absent = untitled (tab shows the
      // first line of content instead).
      name: i.string().optional(),
      content: i.string(),
      // Resolved syntax id (e.g. "python"), from auto-detection or a manual pick.
      language: i.string().optional(),
      // True once the user manually chose a syntax — stops content auto-detection.
      syntaxLocked: i.boolean().optional(),
      createdAt: i.date().indexed(),
      updatedAt: i.date().indexed(),
      // Roadmap: sharing & public links. Default private.
      isPublic: i.boolean().indexed(),
    }),
  },
  links: {
    // file.owner -> $users ; user.files -> files
    fileOwner: {
      forward: { on: "files", has: "one", label: "owner", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "files" },
    },
  },
});

// Boilerplate to enrich types (per InstantDB docs).
type _AppSchema = typeof _schema;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- InstantDB's documented schema-typing pattern
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;

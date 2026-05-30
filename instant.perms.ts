// Pasty permissions (roadmap-ready).
// Security model: a file is visible to its owner, or to anyone if it has been
// made public. Only the owner can mutate. Sharing with specific users will be
// layered on later. Push with: npx instant-cli@latest push perms
//
// Docs: https://www.instantdb.com/docs/permissions
import type { InstantRules } from "@instantdb/react";

const rules = {
  files: {
    allow: {
      view: "isOwner || data.isPublic",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: ["isOwner", "auth.id != null && auth.id in data.ref('owner.id')"],
  },
  sessions: {
    allow: {
      view: "isOwner",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: ["isOwner", "auth.id != null && auth.id in data.ref('owner.id')"],
  },
} satisfies InstantRules;

export default rules;

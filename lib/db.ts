import { init } from "@instantdb/react";
import schema from "@/instant.schema";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

if (!APP_ID) {
  throw new Error(
    "Missing NEXT_PUBLIC_INSTANT_APP_ID. Add it to .env.local (see README).",
  );
}

export const db = init({ appId: APP_ID, schema });

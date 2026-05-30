"use client";

import { useState } from "react";
import { db } from "@/lib/db";

/**
 * Magic-code login. Two steps: request a code by email, then verify it.
 * Docs: https://www.instantdb.com/docs/auth/magic-codes
 */
export default function AuthGate() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full items-center justify-center bg-st-bg">
      <div className="w-[340px] rounded-md border border-st-border bg-st-bg-dark p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-2.5">
          <Logo />
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-st-fg">
              pasty
            </div>
            <div className="text-[11px] text-st-fg-dim">
              Sublime Text, in your browser
            </div>
          </div>
        </div>
        {sentTo ? (
          <VerifyStep email={sentTo} onBack={() => setSentTo(null)} />
        ) : (
          <RequestStep
            email={email}
            setEmail={setEmail}
            onSent={() => setSentTo(email)}
          />
        )}
      </div>
    </div>
  );
}

function RequestStep({
  email,
  setEmail,
  onSent,
}: {
  email: string;
  setEmail: (v: string) => void;
  onSent: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await db.auth.sendMagicCode({ email });
      onSent();
    } catch (err: unknown) {
      setError(readError(err) ?? "Couldn't send a code. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-[11px] uppercase tracking-wide text-st-fg-dim">
        Sign in with email
      </label>
      <input
        type="email"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="rounded border border-st-border bg-st-bg px-3 py-2 text-[13px] text-st-fg outline-none focus:border-st-accent"
      />
      {error && <p className="text-[12px] text-[#ec5f67]">{error}</p>}
      <button
        type="submit"
        disabled={pending || !email}
        className="rounded bg-st-accent px-3 py-2 text-[13px] font-medium text-[#1c1f24] transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send magic code"}
      </button>
      <p className="text-[11px] leading-relaxed text-st-fg-faint">
        We&apos;ll email you a one-time code. No password needed.
      </p>
    </form>
  );
}

function VerifyStep({ email, onBack }: { email: string; onBack: () => void }) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await db.auth.signInWithMagicCode({ email, code });
      // On success db.useAuth() flips and the workspace renders.
    } catch (err: unknown) {
      setError(readError(err) ?? "Invalid code. Try again.");
      setCode("");
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-[11px] uppercase tracking-wide text-st-fg-dim">
        Enter the code sent to
      </label>
      <div className="-mt-1 truncate text-[13px] text-st-fg">{email}</div>
      <input
        type="text"
        inputMode="numeric"
        required
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="123456"
        className="rounded border border-st-border bg-st-bg px-3 py-2 text-center text-[16px] tracking-[0.4em] text-st-fg outline-none focus:border-st-accent"
      />
      {error && <p className="text-[12px] text-[#ec5f67]">{error}</p>}
      <button
        type="submit"
        disabled={pending || !code}
        className="rounded bg-st-accent px-3 py-2 text-[13px] font-medium text-[#1c1f24] transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Verify & open"}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="text-[12px] text-st-fg-dim hover:text-st-fg"
      >
        ← Use a different email
      </button>
    </form>
  );
}

function readError(err: unknown): string | null {
  if (typeof err === "object" && err !== null) {
    const body = (err as { body?: { message?: string } }).body;
    if (body?.message) return body.message;
    const message = (err as { message?: string }).message;
    if (message) return message;
  }
  return null;
}

function Logo() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded bg-st-accent text-[18px] font-bold text-[#1c1f24]">
      {/* Sublime-ish sideways stack mark */}
      <span className="-rotate-12">≣</span>
    </div>
  );
}

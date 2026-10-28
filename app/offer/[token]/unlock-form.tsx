"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { unlockOffer, type UnlockState } from "./actions";

export function UnlockForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<UnlockState, FormData>(
    unlockOffer.bind(null, token),
    { status: "idle" }
  );

  useEffect(() => {
    if (state.status === "ok" || state.status === "expired") router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <input
        type="text"
        name="password"
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="characters"
        placeholder="XXXXX-XXXXX"
        aria-label="Password"
        autoFocus
        required
        className="!py-2.5 text-center !text-base tracking-widest"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Checking…" : "View my offer"}
      </button>
      {state.status === "invalid" && (
        <p className="text-sm text-[var(--red)]">That password didn&apos;t work. Check it and try again.</p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-[var(--red)]">Something went wrong on our side. Please try again in a moment.</p>
      )}
      {state.status === "locked" && (
        <p className="text-sm text-[var(--red)]">
          Too many attempts. Try again in {state.minutes} minute{state.minutes === 1 ? "" : "s"}.
        </p>
      )}
    </form>
  );
}

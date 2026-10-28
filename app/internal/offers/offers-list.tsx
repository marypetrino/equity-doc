"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXPIRY_OPTIONS } from "@/lib/offer-types";
import type { OfferStatus } from "@/lib/offer-store";

export interface OfferRow {
  token: string;
  candidateName: string;
  roleTitle: string;
  createdAt: number;
  expiresAt: number;
  firstOpenedAt: number | null;
  status: OfferStatus;
}

const date = (ms: number) =>
  new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const STATUS_STYLE: Record<OfferStatus, string> = {
  active: "text-[var(--green)] border-[var(--green)]/40",
  expired: "text-[var(--orange)] border-[var(--orange)]/40",
  revoked: "text-[var(--red)] border-[var(--red)]/40",
};

export function OffersList({ rows }: { rows: OfferRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [reset, setReset] = useState<{ name: string; url: string; password: string } | null>(null);

  const linkFor = (token: string) => `${window.location.origin}/offer/${token}`;

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(linkFor(token));
    setCopied(token);
    setTimeout(() => setCopied((c) => (c === token ? null : c)), 1500);
  };

  const newPassword = async (r: OfferRow) => {
    if (!confirm(`Create a new password for ${r.candidateName}'s link? The current password will stop working.`)) return;
    setBusy(r.token);
    setError(null);
    const res = await fetch(`/api/offers/${r.token}/password`, { method: "POST" }).catch(() => null);
    const body = await res?.json().catch(() => ({}));
    setBusy(null);
    if (!res?.ok) {
      setError(body?.error ?? "Couldn't create a new password. Try again.");
      return;
    }
    setReset({ name: r.candidateName, url: linkFor(r.token), password: body.password });
  };

  const call = async (token: string, action: "revoke" | "extend", days?: number) => {
    setBusy(token);
    setError(null);
    const res = await fetch(`/api/offers/${token}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(days ? { days } : {}),
    }).catch(() => null);
    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}));
      setError(body?.error ?? "Something went wrong. Try again.");
    }
    setBusy(null);
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight">My offers</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Candidate links you&apos;ve created.</p>
      {error && <p className="mt-4 text-sm text-[var(--red)]">{error}</p>}

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
          No offers yet. Create one from <a href="/internal" className="text-[var(--accent)] underline">New offer</a>.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-[0.8rem]">
            <thead>
              <tr className="text-left text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                {["Candidate", "Role", "Created", "Expires", "Status", "Opened", ""].map((h) => (
                  <th key={h} className="border-b border-[var(--border)] px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.token} className="border-b border-[var(--border)]/50 last:border-0">
                  <td className="px-4 py-3 font-semibold">{r.candidateName}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{r.roleTitle}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">{date(r.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">{date(r.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold capitalize ${STATUS_STYLE[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">
                    {r.firstOpenedAt ? <span className="text-[var(--text)]">Opened {date(r.firstOpenedAt)}</span> : "Not yet"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {r.status !== "revoked" && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => copyLink(r.token)}
                          className="rounded-md border border-[var(--border)] px-2 py-1 text-[0.72rem] font-semibold hover:border-[var(--accent)]"
                        >
                          {copied === r.token ? "Copied" : "Copy link"}
                        </button>
                        <button
                          type="button"
                          disabled={busy === r.token}
                          onClick={() => newPassword(r)}
                          className="rounded-md border border-[var(--border)] px-2 py-1 text-[0.72rem] font-semibold hover:border-[var(--accent)] disabled:opacity-50"
                        >
                          New password
                        </button>
                        <select
                          aria-label={`Extend ${r.candidateName}'s link`}
                          disabled={busy === r.token}
                          value=""
                          onChange={(e) => e.target.value && call(r.token, "extend", Number(e.target.value))}
                          className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[0.72rem]"
                        >
                          <option value="">Extend…</option>
                          {EXPIRY_OPTIONS.map((n) => (
                            <option key={n} value={n}>{n} days from now</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={busy === r.token}
                          onClick={() => {
                            if (confirm(`Revoke ${r.candidateName}'s link? They won't be able to open it again.`)) call(r.token, "revoke");
                          }}
                          className="rounded-md border border-[var(--red)]/50 px-2 py-1 text-[0.72rem] font-semibold text-[var(--red)] hover:bg-[var(--red)]/10 disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {reset && <PasswordDialog {...reset} onClose={() => setReset(null)} />}
    </main>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      <div className="flex gap-2">
        <input type="text" readOnly value={value} onFocus={(e) => e.target.select()} />
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="shrink-0 rounded-md border border-[var(--border)] px-3 text-[0.75rem] font-semibold hover:border-[var(--accent)]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function PasswordDialog({ name, url, password, onClose }: { name: string; url: string; password: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-bold">New password for {name}</h2>
        <p className="mt-1 text-[0.8rem] text-[var(--text-muted)]">
          The link hasn&apos;t changed. The old password no longer works. Send the new one separately from the link.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <CopyField label="Candidate link" value={url} />
          <CopyField label="New password" value={password} />
        </div>
        <p className="mt-4 rounded-md border border-[var(--orange)]/50 bg-[var(--orange-muted)] px-3 py-2 text-[0.75rem] text-[var(--orange)]">
          This password is shown only once. If it&apos;s lost, use New password again.
        </p>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-full bg-[var(--accent)] px-4 py-2 text-[0.8rem] font-semibold text-white">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

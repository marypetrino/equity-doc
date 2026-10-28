"use client";

export function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
      <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </div>
      <div className="font-mono text-xl font-bold" style={{ color: color || "var(--text)" }}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[0.72rem] text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
}

"use client";

export function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
      <div className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
        {label}
      </div>
      <div className="font-mono text-xl font-bold" style={{ color: color || "var(--text)" }}>
        {value}
      </div>
      {sub && <div className="text-[0.72rem] text-[var(--text-muted)] mt-0.5">{sub}</div>}
    </div>
  );
}

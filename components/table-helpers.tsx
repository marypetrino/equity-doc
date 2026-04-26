"use client";

export function SectionHeader({
  label,
  colSpan,
  open,
  onToggle,
}: {
  label: string;
  colSpan: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <tr onClick={onToggle} className="cursor-pointer select-none group">
      <td
        colSpan={colSpan}
        className="border-b border-[var(--border)] pt-5 pb-2 font-sans text-sm font-bold uppercase tracking-wider text-[var(--accent-light)]"
      >
        <span
          className="inline-block mr-2 text-[0.65rem] transition-transform duration-200"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          ▼
        </span>
        {label}
      </td>
    </tr>
  );
}

export function Row<T extends { name: string }>({
  label,
  scenarios,
  fn,
  highlight,
  muted,
}: {
  label: string;
  scenarios: T[];
  fn: (s: T) => string;
  highlight?: boolean;
  muted?: boolean;
}) {
  const cls = highlight ? "text-[var(--green)] font-medium" : muted ? "text-[var(--text-muted)]" : "";
  return (
    <tr>
      <td className="py-2 pr-4 border-b border-[var(--border)]/40 font-sans text-[0.8rem]">{label}</td>
      {scenarios.map((s) => (
        <td
          key={s.name}
          className={`py-2 px-3 text-right border-b border-[var(--border)]/40 whitespace-nowrap ${cls}`}
        >
          {fn(s)}
        </td>
      ))}
    </tr>
  );
}

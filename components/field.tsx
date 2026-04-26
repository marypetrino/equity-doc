"use client";

import { InfoTip } from "@/components/info-tip";
import { addCommas } from "@/lib/format";

export function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  commas = false,
  info,
  /** Use inside CSS grid so the control fills its cell (no flex-1 growth). */
  fillWidth = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  commas?: boolean;
  /** Optional tooltip next to the label */
  info?: string;
  fillWidth?: boolean;
}) {
  const display = commas ? addCommas(value) : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    onChange(raw);
  };

  return (
    <div
      className={
        fillWidth
          ? "flex min-w-0 w-full flex-col gap-1"
          : "flex min-w-[140px] flex-1 flex-col gap-1"
      }
    >
      <label
        className={`flex items-start gap-0.5 text-[0.68rem] font-semibold uppercase leading-snug tracking-wider text-[var(--text-muted)] ${
          fillWidth ? "" : "min-h-[3.25rem]"
        }`}
      >
        <span className="min-w-0 flex-1">{label}</span>
        {info ? (
          <span className="shrink-0 pt-px">
            <InfoTip content={info} label={`About ${label}`} />
          </span>
        ) : null}
      </label>
      <div className="relative min-w-0">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs font-mono">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={display}
          onChange={handleChange}
          className={prefix ? "!pl-5" : ""}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs font-mono">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

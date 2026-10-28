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
  fillWidth = false,
  locked = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  commas?: boolean;
  info?: string;
  fillWidth?: boolean;
  locked?: boolean;
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
        <span className="min-w-0 flex-1">
          {label}
          {locked ? <span className="ml-1.5 normal-case tracking-normal text-[var(--accent-light)]">· Locked</span> : null}
        </span>
        {info ? (
          <span className="shrink-0 pt-px">
            <InfoTip content={info} label={`About ${label}`} />
          </span>
        ) : null}
      </label>
      <div className="relative min-w-0">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--text-muted)]">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={display}
          onChange={handleChange}
          readOnly={locked}
          aria-readonly={locked}
          className={`${prefix ? "!pl-5" : ""} ${locked ? "cursor-default !border-dashed !bg-transparent" : ""}`}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--text-muted)]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

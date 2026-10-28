"use client";

import { useMemo, useState } from "react";
import { Field } from "@/components/field";
import { OfferView, compute } from "@/components/offer-view";
import { fmt, fmtK, pct } from "@/lib/format";
import {
  DEFAULT_DILUTION_PCT,
  DEFAULT_EXPIRY_DAYS,
  DEFAULT_VESTING,
  EXPIRY_OPTIONS,
  MAX_SCENARIOS,
  VARIABLE_TYPES,
  currentCompany,
  variableTypeInfo,
  type OfferTerms,
  type VariableType,
} from "@/lib/offer-types";
import { EXIT_SCENARIOS, OFFICE_LOCATIONS, type OfficeLocation, type VestCadence } from "@/config";

interface ScenarioInput {
  exitVal: string;
  sub: string;
  rounds: string;
}

const parse = (s: string) => parseFloat(s.replace(/,/g, "")) || 0;

const labelCls =
  "text-[0.68rem] font-semibold uppercase leading-snug tracking-wider text-[var(--text-muted)]";
const selectCls =
  "w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-[0.4rem] font-mono text-[0.82rem] text-[var(--text)]";

function TextField({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <input type="text" value={value} maxLength={100} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

interface Created {
  url: string;
  password: string;
  candidateName: string;
}

export function OfferBuilder({ fdShares }: { fdShares: number }) {
  const [candidateName, setCandidateName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [location, setLocation] = useState<OfficeLocation | "">("");
  const [startDate, setStartDate] = useState("");
  const [base, setBase] = useState("150000");
  const [variableType, setVariableType] = useState<VariableType>("commission");
  const [variable, setVariable] = useState("0");
  const [scenarioInputs, setScenarioInputs] = useState<ScenarioInput[]>(() =>
    EXIT_SCENARIOS.map((s) => ({ exitVal: String(s.exitVal), sub: s.sub, rounds: String(s.rounds) }))
  );
  const updateScenario = (i: number, patch: Partial<ScenarioInput>) =>
    setScenarioInputs((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const [options, setOptions] = useState("10000");
  const [vestYears, setVestYears] = useState(String(DEFAULT_VESTING.vestYears));
  const [cliffMonths, setCliffMonths] = useState(String(DEFAULT_VESTING.cliffMonths));
  const [cadence, setCadence] = useState<VestCadence>(DEFAULT_VESTING.cadence);
  const [dilutionPct, setDilutionPct] = useState(String(DEFAULT_DILUTION_PCT));
  const [expiryDays, setExpiryDays] = useState<number>(DEFAULT_EXPIRY_DAYS);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  const terms: OfferTerms = useMemo(
    () => ({
      candidateName: candidateName.trim(),
      roleTitle: roleTitle.trim(),
      location: location || undefined,
      startDate: startDate || undefined,
      base: parse(base),
      variable: parse(variable),
      variableType,
      options: Math.round(parse(options)),
      vestYears: parse(vestYears),
      cliffMonths: Math.round(parse(cliffMonths)),
      cadence,
      dilutionPct: parse(dilutionPct),
      company: {
        ...currentCompany(),
        scenarios: scenarioInputs
          .filter((s) => parse(s.exitVal) > 0)
          .map((s) => ({
            name: fmtK(parse(s.exitVal)),
            sub: s.sub.trim(),
            exitVal: parse(s.exitVal),
            rounds: Math.max(0, Math.round(parse(s.rounds))),
          })),
      },
    }),
    [candidateName, roleTitle, location, startDate, base, variable, variableType, options, vestYears, cliffMonths, cadence, dilutionPct, scenarioInputs]
  );

  const d = Math.max(0, terms.dilutionPct) / 100;
  const scenarios = compute(terms).scenarios;

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms: { ...terms, scenarios: terms.company.scenarios }, expiryDays }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 401 ? "Your session expired. Reload and sign in again." : body.error ?? "Couldn't create the link.");
        return;
      }
      setCreated({ url: body.url, password: body.password, candidateName: terms.candidateName });
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex">
      <aside className="sticky top-[49px] h-[calc(100vh-49px)] w-[300px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] px-5 py-6">
        <h2 className="card-section-heading mb-5">Offer Details</h2>
        <div className="flex flex-col gap-4">
          <TextField label="Candidate Name" value={candidateName} onChange={setCandidateName} placeholder="Jane Doe" />
          <TextField label="Role Title" value={roleTitle} onChange={setRoleTitle} placeholder="Member of Technical Staff" />
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Location</span>
            <select value={location} onChange={(e) => setLocation(e.target.value as OfficeLocation)} className={selectCls}>
              <option value="" disabled>Select office…</option>
              {OFFICE_LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Start Date</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={selectCls} />
          </label>
          <Field label="Base Salary" value={base} onChange={setBase} prefix="$" commas fillWidth />

          <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
            <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Variable (cash, optional)</span>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Variable Label</span>
              <select value={variableType} onChange={(e) => setVariableType(e.target.value as VariableType)} className={selectCls}>
                {VARIABLE_TYPES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </label>
            <Field
              label={variableTypeInfo(variableType).annual ? "Amount (annual target)" : "Amount (one-time)"}
              value={variable}
              onChange={setVariable}
              prefix="$"
              commas
              fillWidth
              info="Commission and variable cash are annual and shown as OTE (base + variable). A sign-on bonus is one-time: it's added once to total package value, not to annual cash."
            />
          </div>
          <Field label="Options Granted" value={options} onChange={setOptions} suffix="options" commas fillWidth />

          <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
            <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Vesting</span>
            <Field label="Vest Period" value={vestYears} onChange={setVestYears} suffix="yr" fillWidth />
            <Field label="Cliff" value={cliffMonths} onChange={setCliffMonths} suffix="mo" fillWidth />
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Vesting Cadence</span>
              <select value={cadence} onChange={(e) => setCadence(e.target.value as VestCadence)} className={selectCls}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={labelCls}>Link Expires In</span>
            <select value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))} className={selectCls}>
              {EXPIRY_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} days</option>
              ))}
            </select>
          </label>

          {error && <p className="text-[0.78rem] text-[var(--red)]">{error}</p>}
          <button
            type="button"
            onClick={create}
            disabled={busy}
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create candidate link"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-center text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
          Candidate preview · exactly what {terms.candidateName || "the candidate"} will see
        </div>
        <OfferView terms={terms} />
      </main>

      <aside className="sticky top-[49px] h-[calc(100vh-49px)] w-[280px] shrink-0 overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] px-5 py-6">
        <h2 className="card-section-heading mb-1">Exit Scenarios</h2>
        <p className="mb-4 text-[0.7rem] text-[var(--text-muted)]">
          The first bar is always today&apos;s valuation. Clear an exit value to drop its bar.
        </p>
        <div className="flex flex-col gap-3">
          {scenarioInputs.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Scenario {i + 2}</span>
                <button
                  type="button"
                  onClick={() => setScenarioInputs((prev) => prev.filter((_, j) => j !== i))}
                  className="text-[0.68rem] text-[var(--text-muted)] hover:text-[var(--red)]"
                  aria-label={`Remove scenario ${i + 2}`}
                >
                  Remove
                </button>
              </div>
              <Field label="Exit Value" value={s.exitVal} onChange={(v) => updateScenario(i, { exitVal: v })} prefix="$" commas fillWidth />
              <div className="grid grid-cols-[1fr_72px] gap-2">
                <TextField label="Label" value={s.sub} onChange={(v) => updateScenario(i, { sub: v })} placeholder="IPO" />
                <Field label="Rounds" value={s.rounds} onChange={(v) => updateScenario(i, { rounds: v })} fillWidth />
              </div>
            </div>
          ))}
          {scenarioInputs.length < MAX_SCENARIOS && (
            <button
              type="button"
              onClick={() => setScenarioInputs((prev) => [...prev, { exitVal: "", sub: "", rounds: String(prev.length + 1) }])}
              className="rounded-md border border-dashed border-[var(--border)] py-2 text-[0.75rem] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
            >
              + Add scenario
            </button>
          )}
          <Field
            label="Dilution / Round"
            value={dilutionPct}
            onChange={setDilutionPct}
            suffix="%"
            fillWidth
            info="Each future financing round issues new shares, lowering the value per share. Rounds sets how many rounds happen before each exit."
          />
        </div>

        <div className="mt-6">
          <div className="rounded-lg border border-dashed border-[var(--orange)]/60 px-3 py-3 text-[0.72rem]">
            <div className="mb-2 text-[0.62rem] font-semibold uppercase tracking-wider text-[var(--orange)]">
              Locked company figures
            </div>
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>Current valuation</span>
              <span className="font-mono text-[var(--text)]">{fmtK(terms.company.valuation)}</span>
            </div>
            <div className="mt-1 flex justify-between text-[var(--text-muted)]">
              <span>Preferred price</span>
              <span className="font-mono text-[var(--text)]">{fmt(terms.company.preferredPrice, 2)}</span>
            </div>
            <div className="mt-1 flex justify-between text-[var(--text-muted)]">
              <span>Strike price</span>
              <span className="font-mono text-[var(--text)]">{fmt(terms.company.strikePrice, 2)}</span>
            </div>
            <div className="mt-1 flex justify-between text-[var(--text-muted)]">
              <span>FD shares <span className="text-[var(--orange)]">· internal only</span></span>
              <span className="font-mono text-[var(--text)]">{fdShares.toLocaleString()}</span>
            </div>
            <div className="mt-1 flex justify-between text-[var(--text-muted)]">
              <span>Ownership today</span>
              <span className="font-mono text-[var(--text)]">{pct(terms.options / fdShares, 4)}</span>
            </div>
            {scenarios.slice(1).map((s) => (
              <div key={s.name} className="mt-1 flex justify-between text-[var(--text-muted)]">
                <span>Ownership at {s.name}</span>
                <span className="font-mono">{pct(terms.options / (fdShares / Math.pow(1 - d, s.rounds)), 4)}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {created && <CreatedDialog created={created} onClose={() => setCreated(null)} />}
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const labelCls = "text-[0.68rem] font-semibold uppercase leading-snug tracking-wider text-[var(--text-muted)]";
  return (
    <div className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
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

function CreatedDialog({ created, onClose }: { created: Created; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-bold">Link created for {created.candidateName}</h2>
        <p className="mt-1 text-[0.8rem] text-[var(--text-muted)]">
          Send the link and the password separately (e.g. link by email, password by text).
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <CopyRow label="Candidate link" value={created.url} />
          <CopyRow label="Password" value={created.password} />
        </div>
        <p className="mt-4 rounded-md border border-[var(--orange)]/50 bg-[var(--orange-muted)] px-3 py-2 text-[0.75rem] text-[var(--orange)]">
          This password is shown only once. If it&apos;s lost, use New password in My offers to issue a replacement.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <a href="/internal/offers" className="rounded-full px-4 py-2 text-[0.8rem] text-[var(--text-muted)] hover:text-[var(--text)]">
            Go to my offers
          </a>
          <button type="button" onClick={onClose} className="rounded-full bg-[var(--accent)] px-4 py-2 text-[0.8rem] font-semibold text-white">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

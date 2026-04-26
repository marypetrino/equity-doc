"use client";

import { useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Field } from "@/components/field";
import { Stat } from "@/components/stat";
import { SectionHeader, Row } from "@/components/table-helpers";
import { C, defX, defY, defLegend, fontSm } from "@/lib/chart-theme";
import { fmt, fmtK, pct } from "@/lib/format";
import { registerCharts } from "@/lib/register-charts";

registerCharts();

const INFO = {
  baseSalary:
    "Your guaranteed annual cash. Doesn't depend on exit outcome.",
  optionGrant:
    "Number of shares you can buy at the strike price as you vest. You don't 'have' these shares yet — you have the right to buy them.",
  strikePrice:
    "Price per share to exercise your options. Set by a 409A appraisal at grant time — typically not negotiable.",
  vestPeriod:
    "How long until you've earned the full grant. Standard is 4 years with a 1-year cliff.",
  currentValuation:
    "Most recent post-money valuation — the company's implied total value after the last round closed.",
  currentFds:
    "Total fully-diluted shares outstanding today — common, preferred, options, warrants. Used to compute share price.",
} as const;

interface Scenario {
  name: string;
  exitVal: number;
  fds: number;
  pps: number;
  spread: number;
  grantValue: number;
  annualEquity: number;
  totalAnnualComp: number;
  ownership: number;
  exerciseCost: number;
  isCurrent: boolean;
}

interface Inputs {
  base: number;
  grant: number;
  strike: number;
  vestYears: number;
  currentVal: number;
  currentFds: number;
  dilutionPct: number;
}

function compute(inputs: Inputs) {
  const { base, grant, strike, vestYears, currentVal, currentFds, dilutionPct } = inputs;
  const dilution = dilutionPct / 100;

  // Pre-dilution: "Today" uses preferred share price as the basis (no dilution applied)
  const ppsPreferred = currentFds > 0 ? currentVal / currentFds : 0;
  const ownershipCurrent = currentFds > 0 ? grant / currentFds : 0;

  // Post-dilution: exits use fully-diluted FDS (more shares exist by then)
  const fdsAtExit = dilution < 1 ? currentFds / (1 - dilution) : currentFds;
  const ownershipAtExit = fdsAtExit > 0 ? grant / fdsAtExit : 0;

  function makeScenario(name: string, val: number, fds: number, isCurrent: boolean): Scenario {
    const pps = fds > 0 ? val / fds : 0;
    const spread = Math.max(0, pps - strike);
    const grantValue = grant * spread;
    const annualEquity = vestYears > 0 ? grantValue / vestYears : 0;
    return {
      name,
      exitVal: val,
      fds,
      pps,
      spread,
      grantValue,
      annualEquity,
      totalAnnualComp: base + annualEquity,
      ownership: fds > 0 ? grant / fds : 0,
      exerciseCost: grant * strike,
      isCurrent,
    };
  }

  // Today uses currentFds (no dilution). Exits use fdsAtExit (full dilution).
  const current = makeScenario("Today", currentVal, currentFds, true);
  const exitScenarios = [
    makeScenario("2×", currentVal * 2, fdsAtExit, false),
    makeScenario("5×", currentVal * 5, fdsAtExit, false),
    makeScenario("10×", currentVal * 10, fdsAtExit, false),
  ];

  return {
    current,
    exitScenarios,
    ppsPreferred,
    ownershipCurrent,
    ownershipAtExit,
  };
}

export default function Calculator() {
  const [base, setBase] = useState("175000");
  const [grant, setGrant] = useState("11250");
  const [strike, setStrike] = useState("5.84");
  const [vestYears, setVestYears] = useState("4");
  const [currentVal, setCurrentVal] = useState("500000000");
  const [currentFds, setCurrentFds] = useState("12044242");
  const [dilutionPct, setDilutionPct] = useState("20");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tableOpen, setTableOpen] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cap: true,
    equity: true,
    comp: true,
  });
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const parse = (s: string) => parseFloat(s.replace(/,/g, "")) || 0;

  const inputs: Inputs = useMemo(
    () => ({
      base: parse(base),
      grant: parse(grant),
      strike: parse(strike),
      vestYears: parse(vestYears),
      currentVal: parse(currentVal),
      currentFds: parse(currentFds),
      dilutionPct: parse(dilutionPct),
    }),
    [base, grant, strike, vestYears, currentVal, currentFds, dilutionPct]
  );

  const {
    current,
    exitScenarios,
    ppsPreferred,
    ownershipCurrent,
    ownershipAtExit,
  } = useMemo(() => compute(inputs), [inputs]);

  const allScenarios = [current, ...exitScenarios];
  const allLabels = allScenarios.map((s) => s.name);
  const grossPreferred = inputs.grant * ppsPreferred;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      {sidebarOpen ? (
        <aside className="sticky top-0 h-screen w-[300px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] px-5 py-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="card-section-heading">Inputs</h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--accent-light)]"
            >
              ← Hide
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <Field label="Base Salary" value={base} onChange={setBase} prefix="$" commas fillWidth info={INFO.baseSalary} />
            <Field label="Option Grant" value={grant} onChange={setGrant} commas fillWidth info={INFO.optionGrant} />
            <Field label="Strike Price" value={strike} onChange={setStrike} prefix="$" fillWidth info={INFO.strikePrice} />
            <Field label="Vest Period" value={vestYears} onChange={setVestYears} suffix="yr" fillWidth info={INFO.vestPeriod} />
            <Field label="Current Valuation" value={currentVal} onChange={setCurrentVal} prefix="$" commas fillWidth info={INFO.currentValuation} />
            <Field label="Current FD Shares" value={currentFds} onChange={setCurrentFds} commas fillWidth info={INFO.currentFds} />
            <Field
              label="Est. Dilution to Exit"
              value={dilutionPct}
              onChange={setDilutionPct}
              suffix="%"
              fillWidth
              info={`Your ownership % shrinks as the company raises more rounds. ${inputs.dilutionPct}% means your slice is ${(100 - inputs.dilutionPct).toFixed(0)}% of what it is today by the time of exit. We apply this consistently to today's value and all exit scenarios.`}
            />
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 z-10 -translate-y-1/2 rounded-r-md border border-l-0 border-[var(--border)] bg-[var(--surface)] px-2 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--accent-light)] hover:bg-[var(--surface-2)]"
          style={{ writingMode: "vertical-rl" }}
        >
          Show inputs →
        </button>
      )}

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Forge Total Offer Visualizer</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              See your full Forge offer — cash plus equity, today and at exit
            </p>
          </div>

          {/* GLOSSARY: How your offer works */}
          <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="card-section-heading mb-3">How Your Offer Works</h2>
            <ul className="w-full list-none space-y-3 text-sm text-[var(--text-muted)]">
              <li>
                <span className="font-semibold text-[var(--text)]">Annual cash.</span> Your guaranteed base salary.
              </li>
              <li>
                <span className="font-semibold text-[var(--text)]">Shares granted.</span>{" "}How many shares you&apos;ll earn over time.
              </li>
              <li>
                <span className="font-semibold text-[var(--text)]">Strike price.</span> What you pay per share to buy them. Set when your grant is issued — not something you negotiate.
              </li>
              <li>
                <span className="font-semibold text-[var(--text)]">Grant value.</span> What your shares are worth, minus what you paid for them. Paper money until exit.
              </li>
            </ul>
          </section>

          {/* 1. PACKAGE SUMMARY */}
          <section className="mb-10">
            <div className="mb-2 flex items-center gap-3">
              <span className="section-divider-title">Your Package</span>
              <div className="section-divider-line" />
            </div>
            <p className="mb-4 text-[0.78rem] text-[var(--text-muted)]">
              What you have today — guaranteed cash and current paper value of your grant.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat
                label="Annual Cash"
                value={fmt(inputs.base)}
                sub="Base salary"
              />
              <Stat
                label="Shares Granted"
                value={inputs.grant.toLocaleString()}
                sub={`${inputs.vestYears}-year vest · $${inputs.strike.toFixed(2)} strike · ${fmt(ppsPreferred, 2)} preferred`}
              />
              <Stat
                label="Grant Value (today)"
                value={fmtK(current.grantValue)}
                sub={`Gross ${fmtK(grossPreferred)} · net of strike, at today's preferred price`}
                color="var(--green)"
              />
            </div>
          </section>

          {/* 2. EQUITY BREAKOUT */}
          <section className="mb-10">
            <div className="mb-2 flex items-center gap-3">
              <span className="section-divider-title">Equity Breakout</span>
              <div className="section-divider-line" />
            </div>
            <p className="mb-4 text-[0.78rem] text-[var(--text-muted)]">
              How your grant value gets calculated at today's valuation.
            </p>

            {/* Math walkdown — preferred → net → grant value */}
            <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="card-subsection-heading mb-4">Current Grant Value — Step by Step</h3>
              <div className="space-y-1 font-mono text-sm">
                <div className="flex items-center justify-between border-b border-[var(--border)]/40 py-1.5">
                  <span className="font-sans text-[0.82rem] text-[var(--text-muted)]">Preferred share price (today)</span>
                  <span>{fmt(ppsPreferred, 2)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)]/40 py-1.5">
                  <span className="font-sans text-[0.82rem] text-[var(--text-muted)]">− Strike price</span>
                  <span>({fmt(inputs.strike, 2)})</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--accent-light)]/30 py-1.5">
                  <span className="font-sans text-[0.82rem] font-semibold">= Net value / share</span>
                  <span className="text-[var(--green)]">{fmt(current.spread, 2)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)]/40 py-1.5">
                  <span className="font-sans text-[0.82rem] text-[var(--text-muted)]">× Your shares</span>
                  <span>{inputs.grant.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="font-sans text-[0.82rem] font-semibold">= Current grant value</span>
                  <span className="text-base font-bold text-[var(--green)]">{fmt(current.grantValue)}</span>
                </div>
              </div>
              <p className="mt-4 text-[0.7rem] leading-relaxed text-[var(--text-muted)]">
                Today's value uses the current preferred share price. Exit scenarios below apply the dilution % you set — by exit, more shares typically exist, so your slice of each new dollar is smaller.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat
                label="Exercise Cost"
                value={fmtK(inputs.grant * inputs.strike)}
                sub="Real cash you spend before any payout"
              />
              <Stat
                label="Ownership Today"
                value={pct(ownershipCurrent, 3)}
                sub="Pre-dilution"
                color="var(--accent-light)"
              />
              <Stat
                label="Ownership at Exit"
                value={pct(ownershipAtExit, 3)}
                sub={`After ${inputs.dilutionPct}% dilution`}
                color="var(--orange)"
              />
            </div>
          </section>

          {/* 3. CHARTS */}
          <section className="mb-10">
            <div className="mb-2 flex items-center gap-3">
              <span className="section-divider-title">Visualized</span>
              <div className="section-divider-line" />
            </div>
            <p className="mb-4 text-[0.78rem] text-[var(--text-muted)]">
              How your total package value scales with company growth at exit.
            </p>

            {/* Chart 1: Stacked Cash + Net Equity, today + exits */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="card-section-heading mb-1">Total Package Value</h2>
              <p className="mb-4 text-[0.7rem] text-[var(--text-muted)]">
                Cash plus net equity, today and at exit
              </p>
              <Bar
                data={{
                  labels: allLabels,
                  datasets: [
                    {
                      label: `Cash (${inputs.vestYears}yr base)`,
                      data: allScenarios.map(() => inputs.base * inputs.vestYears),
                      backgroundColor: C.accentBg,
                      borderColor: C.accent,
                      borderWidth: 1,
                      barPercentage: 0.55,
                    },
                    {
                      label: "Net Equity",
                      data: allScenarios.map((s) => s.grantValue),
                      backgroundColor: C.green,
                      borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                      barPercentage: 0.55,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: defLegend,
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ctx.dataset.label + ": " + fmt(ctx.parsed.y ?? 0),
                        footer: (items) => {
                          const total = items.reduce((sum, i) => sum + (i.parsed.y ?? 0), 0);
                          return "Total: " + fmt(total);
                        },
                      },
                    },
                  },
                  scales: {
                    x: { stacked: true, ...defX, title: { display: true, text: "Scenario", color: C.text, font: fontSm } },
                    y: { stacked: true, ...defY },
                  },
                }}
              />
              <p className="mt-4 text-[0.72rem] leading-relaxed text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text)]">Why 2× exit isn&apos;t 2× of today&apos;s equity:</span>{" "}
                Today shows pre-dilution paper value. Exit scenarios apply your {inputs.dilutionPct}% expected dilution — by exit, more total shares typically exist, so doubling the company&apos;s value doesn&apos;t double your share. The visible drag from Today → 2× is the dilution cost; from there, each additional doubling scales cleanly.
              </p>
            </div>
          </section>

          {/* 4. DETAILED TABLE — collapsed by default */}
          <section className="mb-10">
            <button
              type="button"
              onClick={() => setTableOpen((v) => !v)}
              className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-left hover:border-[var(--accent-light)]/50"
            >
              <span
                className="text-[0.65rem] transition-transform duration-200"
                style={{ transform: tableOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
              >
                ▼
              </span>
              <span className="card-section-heading">Detailed Scenario Breakdown</span>
              <span className="ml-auto text-[0.7rem] text-[var(--text-muted)]">
                {tableOpen ? "Hide" : "Show"} full numbers
              </span>
            </button>

            {tableOpen && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="pb-1 pr-4" />
                      <th className="border-r border-r-[var(--border)] pb-1" />
                      <th
                        colSpan={exitScenarios.length}
                        className="border-b border-[var(--accent-light)]/20 px-3 pb-1 text-left text-[0.62rem] font-semibold uppercase tracking-widest text-[var(--accent-light)]"
                      >
                        Exit Scenarios →
                      </th>
                    </tr>
                    <tr>
                      <th className="min-w-[180px] pb-3 pr-4 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Metric
                      </th>
                      {allScenarios.map((s, i) => (
                        <th
                          key={s.name}
                          className={`whitespace-nowrap px-3 pb-3 text-right text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] ${
                            i === 0 ? "border-r border-r-[var(--border)]" : ""
                          }`}
                        >
                          {s.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[0.82rem]">
                    <SectionHeader label="Cap Table" colSpan={allScenarios.length + 1} open={openSections.cap} onToggle={() => toggleSection("cap")} />
                    {openSections.cap && (
                      <>
                        <Row label="Valuation" scenarios={allScenarios} fn={(s) => fmtK(s.exitVal)} />
                        <Row label="Fully Diluted Shares" scenarios={allScenarios} fn={(s) => (s.fds / 1e6).toFixed(1) + "M"} muted />
                        <Row label="Share Price" scenarios={allScenarios} fn={(s) => fmt(s.pps, 2)} />
                        <Row label="Your Ownership" scenarios={allScenarios} fn={(s) => pct(s.ownership, 4)} muted />
                      </>
                    )}

                    <SectionHeader label="Your Equity" colSpan={allScenarios.length + 1} open={openSections.equity} onToggle={() => toggleSection("equity")} />
                    {openSections.equity && (
                      <>
                        <Row label="Share Price" scenarios={allScenarios} fn={(s) => fmt(s.pps, 2)} muted />
                        <Row label="Less: Strike Price" scenarios={allScenarios} fn={() => `(${fmt(inputs.strike, 2)})`} muted />
                        <Row label="Net Value / Share" scenarios={allScenarios} fn={(s) => fmt(s.spread, 2)} highlight />
                        <Row label="Exercise Cost" scenarios={allScenarios} fn={(s) => fmt(s.exerciseCost)} muted />
                      </>
                    )}

                    <SectionHeader label="Total Compensation (Cash + Equity)" colSpan={allScenarios.length + 1} open={openSections.comp} onToggle={() => toggleSection("comp")} />
                    {openSections.comp && (
                      <>
                        <Row label={`Total Cash (${inputs.vestYears}yr)`} scenarios={allScenarios} fn={() => fmt(inputs.base * inputs.vestYears)} muted />
                        <Row label="Grant Value" scenarios={allScenarios} fn={(s) => fmt(s.grantValue)} highlight />
                        <Row label="Total Package Value" scenarios={allScenarios} fn={(s) => fmt(inputs.base * inputs.vestYears + s.grantValue)} highlight />
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="border-t border-[var(--border)] pt-4 text-[0.7rem] italic text-[var(--text-muted)]">
            Illustrative only. Not a guarantee or projection of future value. All valuations, share
            prices, and dilution assumptions are hypothetical. Options may be subject to additional
            terms (vesting cliffs, exercise windows, tax implications) not modeled here. Consult a
            financial advisor before making decisions based on equity compensation.
          </p>
        </div>
      </main>
    </div>
  );
}

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

// Locked company values — not user-editable
const LOCKED_VAL = 210_000_000;
const LOCKED_FDS = 27_255_286;
const LOCKED_STRIKE = 1.16;
const LOCKED_PREFERRED_PPS = 7.89; // stated preferred price from cap table

// Base FDS for dilution math derived from preferred price
const BASE_FDS = LOCKED_VAL / LOCKED_PREFERRED_PPS;

const EXIT_SCENARIOS = [
  { name: "$210M", sub: "Series B",    exitVal: 210_000_000,    rounds: 0 },
  { name: "$1B",   sub: "Series C+",   exitVal: 1_000_000_000,  rounds: 1 },
  { name: "$5B",   sub: "Series D+",   exitVal: 5_000_000_000,  rounds: 2 },
  { name: "$15B",  sub: "IPO / Public", exitVal: 15_000_000_000, rounds: 3 },
  { name: "$50B",  sub: "IPO / Public", exitVal: 50_000_000_000, rounds: 2 },
] as const;

const INFO = {
  baseSalary: "Your guaranteed annual cash. Doesn't depend on exit outcome.",
  optionGrant:
    "Number of shares you can buy at the strike price as you vest. You don't 'have' these shares yet — you have the right to buy them.",
  vestPeriod:
    "How long until you've earned the full grant. Standard is 4 years with a 1-year cliff.",
  dilution:
    "Each future financing round issues new shares, shrinking your ownership %. 15% per round is a typical assumption.",
} as const;

interface Scenario {
  name: string;
  sub: string;
  exitVal: number;
  fds: number;
  pps: number;
  spread: number;
  grantValue: number;
  annualEquity: number;
  totalAnnualComp: number;
  ownership: number;
  exerciseCost: number;
  rounds: number;
}

interface Inputs {
  base: number;
  grant: number;
  vestYears: number;
  dilutionPct: number;
}

function compute(inputs: Inputs) {
  const { base, grant, vestYears, dilutionPct } = inputs;
  const d = Math.max(0, dilutionPct) / 100;

  const scenarios: Scenario[] = EXIT_SCENARIOS.map((s) => {
    const fds = BASE_FDS / Math.pow(1 - d, s.rounds);
    const pps = fds > 0 ? s.exitVal / fds : 0;
    const spread = Math.max(0, pps - LOCKED_STRIKE);
    const grantValue = grant * spread;
    const annualEquity = vestYears > 0 ? grantValue / vestYears : 0;
    return {
      name: s.name,
      sub: s.sub,
      exitVal: s.exitVal,
      fds,
      pps,
      spread,
      grantValue,
      annualEquity,
      totalAnnualComp: base + annualEquity,
      ownership: fds > 0 ? grant / fds : 0,
      exerciseCost: grant * LOCKED_STRIKE,
      rounds: s.rounds,
    };
  });

  const ownershipCurrent = LOCKED_FDS > 0 ? grant / LOCKED_FDS : 0;
  return { scenarios, ownershipCurrent };
}

export default function Calculator() {
  const [base, setBase] = useState("150000");
  const [grant, setGrant] = useState("10000");
  const [vestYears, setVestYears] = useState("4");
  const [dilutionPct, setDilutionPct] = useState("15");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tableOpen, setTableOpen] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    comp: false,
    annual: false,
    equity: false,
    cap: false,
  });
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const parse = (s: string) => parseFloat(s.replace(/,/g, "")) || 0;

  const inputs: Inputs = useMemo(
    () => ({
      base: parse(base),
      grant: parse(grant),
      vestYears: parse(vestYears),
      dilutionPct: parse(dilutionPct),
    }),
    [base, grant, vestYears, dilutionPct]
  );

  const { scenarios, ownershipCurrent } = useMemo(() => compute(inputs), [inputs]);

  // $210M scenario serves as "today" for package summary / equity breakout
  const today = scenarios[0];
  const grossPreferred = inputs.grant * LOCKED_PREFERRED_PPS;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      {sidebarOpen ? (
        <aside className="sticky top-0 h-screen w-[300px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] px-5 py-6">
          <div className="mb-1 text-[0.62rem] font-semibold uppercase tracking-widest text-[var(--accent-light)]">Luminai</div>
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
            <Field label="Vest Period" value={vestYears} onChange={setVestYears} suffix="yr" fillWidth info={INFO.vestPeriod} />

            {/* Locked company fields */}
            <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
              <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Company</span>
              <div className="flex flex-col gap-1">
                <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Current Valuation</span>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-[0.82rem] text-[var(--text-muted)]">
                  $210,000,000
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Current FD Shares</span>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-[0.82rem] text-[var(--text-muted)]">
                  {LOCKED_FDS.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Strike Price</span>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-[0.82rem] text-[var(--text-muted)]">
                  ${LOCKED_STRIKE.toFixed(2)}
                </div>
              </div>
            </div>

            <Field label="Dilution / Round" value={dilutionPct} onChange={setDilutionPct} suffix="%" fillWidth info={INFO.dilution} />
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
            <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--accent-light)]">Luminai</div>
            <h1 className="text-2xl font-bold tracking-tight">Offer Visualizer</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              See your full offer — cash plus equity, today and at exit
            </p>
          </div>

          {/* GLOSSARY */}
          <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="card-section-heading mb-3">How Your Offer Works</h2>
            <ul className="w-full list-none space-y-3 text-sm text-[var(--text-muted)]">
              <li>
                <span className="font-semibold text-[var(--text)]">Annual cash.</span>{" "}Your guaranteed base salary.
              </li>
              <li>
                <span className="font-semibold text-[var(--text)]">Options granted.</span>{" "}How many options you&apos;ll earn over time. Each one is the right to buy a share at the strike price.
              </li>
              <li>
                <span className="font-semibold text-[var(--text)]">Strike price.</span>{" "}What you pay per share to buy your vested options. Set when your grant is issued.
              </li>
              <li>
                <span className="font-semibold text-[var(--text)]">Grant value.</span>{" "}What your shares are worth at exit, minus what you paid for them.
              </li>
            </ul>
          </section>

          {/* VISUALIZED — moved above Your Package */}
          <section className="mb-10">
            <div className="mb-2 flex items-center gap-3">
              <span className="section-divider-title">Visualized</span>
              <div className="section-divider-line" />
            </div>
            <p className="mb-4 text-[0.78rem] text-[var(--text-muted)]">
              How your total package value scales with company growth at exit.
            </p>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="card-section-heading mb-1">Total Package Value</h2>
              <p className="mb-4 text-[0.7rem] text-[var(--text-muted)]">
                Cash plus net equity across five outcomes — assuming {inputs.dilutionPct}% dilution per round
              </p>
              <Bar
                data={{
                  labels: scenarios.map((s) => `${s.name}\n${s.sub}`),
                  datasets: [
                    {
                      label: `Cash (${inputs.vestYears}yr base)`,
                      data: scenarios.map(() => inputs.base * inputs.vestYears),
                      backgroundColor: C.accentBg,
                      borderColor: C.accent,
                      borderWidth: 1,
                      barPercentage: 0.55,
                    },
                    {
                      label: "Net Equity",
                      data: scenarios.map((s) => s.grantValue),
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
                    x: { stacked: true, ...defX, title: { display: true, text: "Outcome", color: C.text, font: fontSm } },
                    y: { stacked: true, ...defY },
                  },
                }}
              />

              {/* Outcome cards — Net Equity per scenario */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {scenarios.map((s) => (
                  <div
                    key={s.name}
                    className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[0.72rem]"
                  >
                    <div className="font-semibold text-[var(--text)]">{s.name}</div>
                    <div className="text-[var(--text-muted)]">{s.sub}</div>
                    <div className="mt-1 text-[var(--text-muted)]">
                      Net Equity:
                      <div className="font-semibold text-[var(--green)]">{fmtK(s.grantValue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* YOUR PACKAGE */}
          <section className="mb-10">
            <div className="mb-2 flex items-center gap-3">
              <span className="section-divider-title">Your Package</span>
              <div className="section-divider-line" />
            </div>
            <p className="mb-4 text-[0.78rem] text-[var(--text-muted)]">
              What you have today — guaranteed cash and current paper value of your grant.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Annual Cash" value={fmt(inputs.base)} sub="Base salary" />
              <Stat
                label="Options Granted"
                value={inputs.grant.toLocaleString()}
                sub={`${inputs.vestYears}-year vest · $${LOCKED_STRIKE.toFixed(2)} strike · $${LOCKED_PREFERRED_PPS.toFixed(2)} preferred`}
              />
              <Stat
                label="Grant Value (today)"
                value={fmtK(today.grantValue)}
                sub={`Gross ${fmtK(grossPreferred)} · net of strike, at today's preferred price`}
                color="var(--green)"
              />
              <Stat
                label="Annual Total Comp"
                value={fmtK(inputs.base + (inputs.vestYears > 0 ? today.grantValue / inputs.vestYears : 0))}
                sub={`Base + net equity ÷ ${inputs.vestYears}yr`}
                color="var(--green)"
              />
            </div>
          </section>

          {/* EQUITY BREAKOUT */}
          <section className="mb-10">
            <div className="mb-2 flex items-center gap-3">
              <span className="section-divider-title">Equity Breakout</span>
              <div className="section-divider-line" />
            </div>
            <p className="mb-4 text-[0.78rem] text-[var(--text-muted)]">
              How your grant value gets calculated at today&apos;s valuation.
            </p>

            <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="card-subsection-heading mb-4">Current Grant Value — Step by Step</h3>
              <div className="space-y-1 font-mono text-sm">
                <div className="flex items-center justify-between border-b border-[var(--border)]/40 py-1.5">
                  <span className="font-sans text-[0.82rem] text-[var(--text-muted)]">Preferred share price (today)</span>
                  <span>{fmt(LOCKED_PREFERRED_PPS, 2)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)]/40 py-1.5">
                  <span className="font-sans text-[0.82rem] text-[var(--text-muted)]">− Strike price</span>
                  <span>({fmt(LOCKED_STRIKE, 2)})</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--accent-light)]/30 py-1.5">
                  <span className="font-sans text-[0.82rem] font-semibold">= Net value / share</span>
                  <span className="text-[var(--green)]">{fmt(today.spread, 2)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)]/40 py-1.5">
                  <span className="font-sans text-[0.82rem] text-[var(--text-muted)]">× Your options</span>
                  <span>{inputs.grant.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="font-sans text-[0.82rem] font-semibold">= Current grant value</span>
                  <span className="text-base font-bold text-[var(--green)]">{fmt(today.grantValue)}</span>
                </div>
              </div>
              {inputs.vestYears > 0 && inputs.grant > 0 && (
                <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-sans text-[0.78rem] text-[var(--text-muted)]">
                  <span className="font-semibold text-[var(--text)]">Vests over {inputs.vestYears} years:</span>{" "}
                  ~{Math.round(inputs.grant / inputs.vestYears).toLocaleString()} options (~{fmtK(today.grantValue / inputs.vestYears)}) per year
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Stat
                label="Exercise Cost"
                value={fmtK(inputs.grant * LOCKED_STRIKE)}
                sub="Cash you spend to exercise your options"
              />
              <Stat
                label="Your Ownership"
                value={pct(ownershipCurrent, 3)}
                sub="Of fully-diluted shares today"
                color="var(--accent-light)"
              />
            </div>
          </section>

          {/* DETAILED TABLE */}
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
                      <th className="min-w-[180px] pb-3 pr-4 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Metric
                      </th>
                      {scenarios.map((s) => (
                        <th
                          key={s.name}
                          className="whitespace-nowrap px-3 pb-3 text-right text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                        >
                          {s.name}
                          <div className="font-normal normal-case tracking-normal text-[0.6rem]">{s.sub}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[0.82rem]">
                    <SectionHeader label={`Total Compensation (${inputs.vestYears}yr)`} colSpan={scenarios.length + 1} open={openSections.comp} onToggle={() => toggleSection("comp")} />
                    {openSections.comp && (
                      <>
                        <Row label={`Total Cash (${inputs.vestYears}yr)`} scenarios={scenarios} fn={() => fmt(inputs.base * inputs.vestYears)} muted />
                        <Row label="Grant Value" scenarios={scenarios} fn={(s) => fmt(s.grantValue)} highlight />
                        <Row label="Total Package Value" scenarios={scenarios} fn={(s) => fmt(inputs.base * inputs.vestYears + s.grantValue)} highlight />
                      </>
                    )}

                    <SectionHeader label="Annual Total Compensation" colSpan={scenarios.length + 1} open={openSections.annual} onToggle={() => toggleSection("annual")} />
                    {openSections.annual && (
                      <>
                        <Row label="Annual Base Salary" scenarios={scenarios} fn={() => fmt(inputs.base)} muted />
                        <Row label={`Annual Equity (÷ ${inputs.vestYears}yr)`} scenarios={scenarios} fn={(s) => fmt(inputs.vestYears > 0 ? s.grantValue / inputs.vestYears : 0)} muted />
                        <Row label="Annual Total Comp" scenarios={scenarios} fn={(s) => fmt(inputs.base + (inputs.vestYears > 0 ? s.grantValue / inputs.vestYears : 0))} highlight />
                      </>
                    )}

                    <SectionHeader label="Your Equity" colSpan={scenarios.length + 1} open={openSections.equity} onToggle={() => toggleSection("equity")} />
                    {openSections.equity && (
                      <>
                        <Row label="Share Price" scenarios={scenarios} fn={(s) => fmt(s.pps, 2)} muted />
                        <Row label="Less: Strike Price" scenarios={scenarios} fn={() => `(${fmt(LOCKED_STRIKE, 2)})`} muted />
                        <Row label="Net Value / Share" scenarios={scenarios} fn={(s) => fmt(s.spread, 2)} highlight />
                        <Row label="Exercise Cost" scenarios={scenarios} fn={(s) => fmt(s.exerciseCost)} muted />
                      </>
                    )}

                    <SectionHeader label="Cap Table" colSpan={scenarios.length + 1} open={openSections.cap} onToggle={() => toggleSection("cap")} />
                    {openSections.cap && (
                      <>
                        <Row label="Valuation" scenarios={scenarios} fn={(s) => fmtK(s.exitVal)} />
                        <Row label="Fully Diluted Shares" scenarios={scenarios} fn={(s) => (s.fds / 1e6).toFixed(1) + "M"} muted />
                        <Row label="Share Price" scenarios={scenarios} fn={(s) => fmt(s.pps, 2)} />
                        <Row label="Your Ownership" scenarios={scenarios} fn={(s) => pct(s.ownership, 4)} muted />
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

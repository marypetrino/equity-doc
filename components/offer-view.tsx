"use client";

import { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Stat } from "@/components/stat";
import { SectionHeader, Row } from "@/components/table-helpers";
import { LuminaiLogo } from "@/components/luminai-logo";
import { C, defX, defY, defLegend, fontSm } from "@/lib/chart-theme";
import { fmt, fmtK } from "@/lib/format";
import { registerCharts } from "@/lib/register-charts";
import { variableTypeInfo, type OfferTerms } from "@/lib/offer-types";
import type { VestCadence } from "@/config";
import { benefitsFor, detailText } from "@/lib/benefits";

registerCharts();

const CADENCE_MONTHS: Record<VestCadence, number> = { monthly: 1, quarterly: 3 };

export function vestSummary(vestYears: number, cliffMonths: number, cadence: VestCadence) {
  const cliff =
    cliffMonths <= 0
      ? "no cliff"
      : cliffMonths % 12 === 0
        ? `${cliffMonths / 12}-year cliff`
        : `${cliffMonths}-month cliff`;
  return `${vestYears}-year vest, ${cliff}, ${cadence} ${cliffMonths > 0 ? "after" : ""}`.trim();
}

interface Scenario {
  name: string;
  sub: string;
  exitVal: number;
  pps: number;
  spread: number;
  grantValue: number;
  annualEquity: number;
  totalAnnualComp: number;
  rounds: number;
}

export function cashParts(t: OfferTerms) {
  const v = Math.max(0, t.variable);
  const info = variableTypeInfo(t.variableType);
  const annualVariable = info.annual ? v : 0;
  const oneTime = info.annual ? 0 : v;
  return { info, annualVariable, oneTime, ote: t.base + annualVariable };
}

export function formatStartDate(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function compute(t: OfferTerms) {
  const d = Math.max(0, t.dilutionPct) / 100;
  const { ote } = cashParts(t);
  const { valuation, preferredPrice, strikePrice, scenarios: exits } = t.company;

  const all = [{ name: fmtK(valuation), sub: "Current", exitVal: valuation, rounds: 0 }, ...exits];

  const scenarios: Scenario[] = all.map((s) => {
    const pps = valuation > 0 ? preferredPrice * (s.exitVal / valuation) * Math.pow(1 - d, s.rounds) : 0;
    const spread = Math.max(0, pps - strikePrice);
    const grantValue = t.options * spread;
    const annualEquity = t.vestYears > 0 ? grantValue / t.vestYears : 0;
    return {
      name: s.name,
      sub: s.sub,
      exitVal: s.exitVal,
      pps,
      spread,
      grantValue,
      annualEquity,
      totalAnnualComp: ote + annualEquity,
      rounds: s.rounds,
    };
  });

  return { scenarios, ote };
}

export function OfferView({ terms }: { terms: OfferTerms }) {
  const [tableOpen, setTableOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const { scenarios, ote } = useMemo(() => compute(terms), [terms]);
  const today = scenarios[0];
  const { company } = terms;
  const { info: variableInfo, annualVariable, oneTime } = cashParts(terms);
  const hasVariable = annualVariable > 0;
  const variableName = variableInfo.label.toLowerCase();
  const cashLabel = `${hasVariable ? "OTE" : "base"}${oneTime > 0 ? " + sign-on" : ""}`;
  const totalCash = ote * terms.vestYears + oneTime;
  const startText = formatStartDate(terms.startDate);
  const benefits = benefitsFor(terms.location);

  const vestMonths = Math.max(0, terms.vestYears * 12);
  const cliff = Math.min(Math.max(0, terms.cliffMonths), vestMonths);
  const perMonth = vestMonths > 0 ? terms.options / vestMonths : 0;
  const cliffOptions = perMonth * cliff;
  const perTranche = perMonth * CADENCE_MONTHS[terms.cadence];
  const vestText = vestSummary(terms.vestYears, cliff, terms.cadence);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <LuminaiLogo variant="badge" className="h-8 w-8" />
          <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Luminai</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {terms.candidateName ? `Your offer, ${terms.candidateName}` : "Your offer"}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {[terms.roleTitle, terms.location, startText && `Starting ${startText}`].filter(Boolean).join(" · ") ||
            "Cash plus equity, today and at exit"}
        </p>
      </div>

      {/* HOW YOUR OFFER WORKS */}
      <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="card-section-heading mb-2">How Your Offer Works</h2>
        <div className="divide-y divide-[var(--border)]">
          {[
            {
              title: "Annual cash",
              body: hasVariable
                ? `Your base salary plus your target ${variableName} (together, your OTE).`
                : "Your guaranteed base salary.",
            },
            ...(oneTime > 0
              ? [{ title: "Sign-on bonus", body: "A one-time cash payment counted once in your total package, not in your annual cash." }]
              : []),
            { title: "Options granted", body: "The number of stock options you receive. Each option gives you the right to buy one share of Luminai at the strike price." },
            { title: "Strike price", body: "The price per share to exercise your options, set by a 409A appraisal at grant time. You pay this when you convert options into shares." },
            { title: "Preferred price", body: "The price per share investors paid in Luminai's most recent round." },
            { title: "Grant value", body: "Options × (share price − strike price) — what your options are worth if you exercised and sold today, or at a future exit." },
            {
              title: "Dilution",
              body: "Each future financing round issues new shares, which lowers the value of each existing share. The exit scenarios assume a set amount of dilution per round.",
            },
          ].map((item) => (
            <details key={item.title} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-semibold text-[var(--text)] [&::-webkit-details-marker]:hidden">
                <span className="text-[0.7rem] text-[var(--text-muted)] transition-transform group-open:rotate-90">›</span>
                {item.title}
              </summary>
              <p className="mt-2 pl-6 text-sm text-[var(--text-muted)]">{item.body}</p>
            </details>
          ))}
        </div>
      </section>

      {/* HOW STOCK OPTIONS WORK */}
      <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="card-section-heading mb-3">How Stock Options Work</h2>
        <ul className="w-full list-disc space-y-3 pl-5 text-sm text-[var(--text-muted)]">
          <li>Options give you the right to buy shares at the strike price — they&apos;re not shares yet.</li>
          <li>You earn options over your vesting schedule. After the cliff, options vest on your {terms.cadence} schedule.</li>
          <li>When you exercise (buy) vested options, you pay the strike price per share.</li>
          <li>You profit when the share price is higher than your strike price. If the share price is at or below the strike, the options have no exercise value.</li>
          <li>Options are typically ISOs (Incentive Stock Options) with favorable tax treatment. Ask your tax advisor about AMT and timing.</li>
        </ul>
      </section>

      {/* YOUR PACKAGE */}
      <section className="mb-10">
        <div className="mb-2 flex items-center gap-3">
          <span className="section-divider-title">Your Package</span>
          <div className="section-divider-line" />
        </div>
        <p className="mb-4 text-[0.78rem] text-[var(--text-muted)]">
          What you have today — cash and the current paper value of your grant.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label={hasVariable ? "Annual Cash (OTE)" : "Annual Cash"}
            value={fmt(ote)}
            sub={
              <>
                {hasVariable ? `${fmtK(terms.base)} base + ${fmtK(annualVariable)} ${variableName}` : "Base salary"}
                {oneTime > 0 && <span className="mt-1 block">+ {fmtK(oneTime)} sign-on bonus (one-time)</span>}
              </>
            }
          />
          <Stat label="Options Granted" value={terms.options.toLocaleString()} sub={vestText} />
          <Stat
            label="Grant Paper Value (today)"
            value={fmtK(today.grantValue)}
            sub={
              <>
                Options × ({fmt(company.preferredPrice, 2)} − {fmt(company.strikePrice, 2)} strike)
                <span className="mt-1 block text-[0.66rem] italic">
                  Current intrinsic value if exercised & sold
                </span>
              </>
            }
            color="var(--green)"
          />
          <Stat
            label="Annual Total Comp"
            value={fmtK(today.totalAnnualComp)}
            sub={`${hasVariable ? "OTE" : "Base"} + grant paper value ÷ ${terms.vestYears}yr`}
            color="var(--green)"
          />
        </div>
      </section>

      {/* YOUR BENEFITS */}
      {benefits && (
        <section className="mb-10">
          <div className="mb-2 flex items-center gap-3">
            <span className="section-divider-title">Your Benefits</span>
            <div className="section-divider-line" />
          </div>
          <p className="mb-4 text-[0.78rem] text-[var(--text-muted)]">
            What&apos;s included at Luminai {terms.location}. Open any card for details.
          </p>
          <div className="@container">
            <div className="grid grid-cols-1 items-start gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
              {benefits.categories.map((c) => (
                <details key={c.id} className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-[var(--text)]">{c.title}</span>
                      <span className="text-[0.75rem] text-[var(--text-muted)] transition-transform group-open:rotate-90">›</span>
                    </div>
                    <p className="mt-1 text-[0.78rem] text-[var(--text-muted)]">{c.summary}</p>
                  </summary>
                  <ul className="mt-3 list-disc space-y-1.5 border-t border-[var(--border)] pl-4 pt-3 text-[0.76rem] text-[var(--text-muted)]">
                    {c.details.map((d) => (
                      <li key={detailText(d)}>{detailText(d)}</li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
          <p className="mt-4 text-[0.72rem] italic text-[var(--text-muted)]">
            Benefits summarized for {benefits.label}. Full plan details are shared during onboarding and may change at
            open enrollment.
          </p>
        </section>
      )}

      {/* VISUALIZED */}
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
            Cash plus equity across {scenarios.length} outcomes — assuming {terms.dilutionPct}% dilution per round
          </p>
          <Bar
            data={{
              labels: scenarios.map((s) => `${s.name}\n${s.sub}`),
              datasets: [
                {
                  label: `Cash (${terms.vestYears}yr ${cashLabel})`,
                  data: scenarios.map(() => totalCash),
                  backgroundColor: C.accentBg,
                  borderColor: C.accent,
                  borderWidth: 1,
                  barPercentage: 0.55,
                },
                {
                  label: "Equity",
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
                    footer: (items) => "Total: " + fmt(items.reduce((sum, i) => sum + (i.parsed.y ?? 0), 0)),
                  },
                },
              },
              scales: {
                x: { stacked: true, ...defX, title: { display: true, text: "Outcome", color: C.text, font: fontSm } },
                y: { stacked: true, ...defY },
              },
            }}
          />

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {scenarios.map((s) => (
              <div
                key={s.name}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[0.72rem]"
              >
                <div className="font-semibold text-[var(--text)]">{s.name}</div>
                <div className="text-[var(--text-muted)]">{s.sub}</div>
                <div className="mt-1 text-[var(--text-muted)]">
                  Equity:
                  <div className="font-semibold text-[var(--green)]">{fmtK(s.grantValue)}</div>
                </div>
              </div>
            ))}
          </div>
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

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="card-subsection-heading mb-4">Current Grant Value — Step by Step</h3>
          <div className="space-y-1 font-mono text-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)]/40 py-1.5">
              <span className="font-sans text-[0.82rem] text-[var(--text-muted)]">Share price at current valuation</span>
              <span>{fmt(company.preferredPrice, 2)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border)]/40 py-1.5">
              <span className="font-sans text-[0.82rem] text-[var(--text-muted)]">− Strike price (your cost to exercise)</span>
              <span>{fmt(company.strikePrice, 2)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border)]/40 py-1.5">
              <span className="font-sans text-[0.82rem] text-[var(--text-muted)]">= Intrinsic value per option</span>
              <span>{fmt(Math.max(0, company.preferredPrice - company.strikePrice), 2)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border)]/40 py-1.5">
              <span className="font-sans text-[0.82rem] text-[var(--text-muted)]">× Your options</span>
              <span>{terms.options.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="font-sans text-[0.82rem] font-semibold">= Current grant paper value</span>
              <span className="text-base font-bold text-[var(--green)]">{fmt(today.grantValue)}</span>
            </div>
          </div>
          {terms.vestYears > 0 && terms.options > 0 && (
            <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-sans text-[0.78rem] text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">{vestText}:</span>{" "}
              {cliff > 0 ? <>~{Math.round(cliffOptions).toLocaleString()} options vest at the {cliff}-month cliff, then </> : null}
              ~{Math.round(perTranche).toLocaleString()} options {terms.cadence === "monthly" ? "per month" : "per quarter"}
              {" "}(~{fmtK(today.grantValue / terms.vestYears)} per year on paper)
            </div>
          )}
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
          <span className="ml-auto text-[0.7rem] text-[var(--text-muted)]">{tableOpen ? "Hide" : "Show"} full numbers</span>
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
                <SectionHeader label={`Total Compensation (${terms.vestYears}yr)`} colSpan={scenarios.length + 1} open={!!openSections.comp} onToggle={() => toggleSection("comp")} />
                {openSections.comp && (
                  <>
                    <Row label={`Total Cash (${terms.vestYears}yr ${cashLabel})`} scenarios={scenarios} fn={() => fmt(totalCash)} muted />
                    {oneTime > 0 && <Row label="Includes Sign-on Bonus (one-time)" scenarios={scenarios} fn={() => fmt(oneTime)} muted />}
                    <Row label="Grant Value" scenarios={scenarios} fn={(s) => fmt(s.grantValue)} highlight />
                    <Row label="Total Package Value" scenarios={scenarios} fn={(s) => fmt(totalCash + s.grantValue)} highlight />
                  </>
                )}

                <SectionHeader label="Annual Total Compensation" colSpan={scenarios.length + 1} open={!!openSections.annual} onToggle={() => toggleSection("annual")} />
                {openSections.annual && (
                  <>
                    <Row label="Annual Base Salary" scenarios={scenarios} fn={() => fmt(terms.base)} muted />
                    {hasVariable && <Row label={`Annual ${variableInfo.label} (cash)`} scenarios={scenarios} fn={() => fmt(annualVariable)} muted />}
                    <Row label={`Annual Equity (÷ ${terms.vestYears}yr)`} scenarios={scenarios} fn={(s) => fmt(s.annualEquity)} muted />
                    <Row label="Annual Total Comp" scenarios={scenarios} fn={(s) => fmt(s.totalAnnualComp)} highlight />
                  </>
                )}

                <SectionHeader label="Your Equity" colSpan={scenarios.length + 1} open={!!openSections.equity} onToggle={() => toggleSection("equity")} />
                {openSections.equity && (
                  <>
                    <Row label="Share Price" scenarios={scenarios} fn={(s) => fmt(s.pps, 2)} muted />
                    <Row label="Strike Price" scenarios={scenarios} fn={() => fmt(company.strikePrice, 2)} muted />
                    <Row label="Spread per Option" scenarios={scenarios} fn={(s) => fmt(s.spread, 2)} muted />
                    <Row label="Your Options" scenarios={scenarios} fn={() => terms.options.toLocaleString()} muted />
                    <Row label="Grant Value" scenarios={scenarios} fn={(s) => fmt(s.grantValue)} highlight />
                  </>
                )}

                <SectionHeader label="Cap Table" colSpan={scenarios.length + 1} open={!!openSections.cap} onToggle={() => toggleSection("cap")} />
                {openSections.cap && (
                  <>
                    <Row label="Valuation" scenarios={scenarios} fn={(s) => fmtK(s.exitVal)} />
                    <Row label="Dilution Rounds" scenarios={scenarios} fn={(s) => String(s.rounds)} muted />
                    <Row label="Share Price" scenarios={scenarios} fn={(s) => fmt(s.pps, 2)} />
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="border-t border-[var(--border)] pt-4 text-[0.7rem] italic text-[var(--text-muted)]">
        Illustrative only. These values are not a guarantee or projection of future value. All valuations, share prices,
        and dilution assumptions are hypothetical. Stock options are subject to vesting and may expire if unexercised.
        Options generally can&apos;t be sold before a liquidity event. Exercise may trigger tax obligations including
        AMT. Grants may be subject to additional terms not modeled here. Consult a tax or financial advisor before
        making decisions based on equity compensation.
      </p>
    </div>
  );
}

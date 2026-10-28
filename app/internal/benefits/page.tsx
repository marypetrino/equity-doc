import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentRecruiter } from "@/lib/recruiter-auth";
import { ALL_BENEFITS, detailText, officesFor, type BenefitCategory } from "@/lib/benefits";
import { InternalNav } from "../internal-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Benefits · Luminai" };

const ROWS: { label: string; ids: string[] }[] = [
  { label: "Health & insurance", ids: ["health"] },
  { label: "Financial & retirement", ids: ["financial"] },
  { label: "Parental leave", ids: ["parental"] },
  { label: "Commuter", ids: ["commuter"] },
  { label: "Office & workspace", ids: ["office"] },
  { label: "Time off", ids: ["time-off"] },
  { label: "Learning & development", ids: ["growth"] },
];

function Cell({ category }: { category?: BenefitCategory }) {
  if (!category) return <div className="text-[0.78rem] text-[var(--text-muted)]">Not offered / not listed</div>;
  return (
    <div>
      <div className="text-sm font-semibold">{category.title}</div>
      <p className="mt-1 text-[0.78rem] text-[var(--text)]">{category.summary}</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-[0.74rem] text-[var(--text-muted)]">
        {category.details.map((d) => (
          <li key={detailText(d)}>{detailText(d)}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function BenefitsPage() {
  const who = await currentRecruiter();
  if (!who) redirect("/gate");

  return (
    <>
      <InternalNav email={who.email} active="benefits" />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Benefits</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Exactly what candidates see on their offer page, by office location.
        </p>

        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="grid min-w-[600px] grid-cols-[180px_1fr]">
            <div className="border-b border-[var(--border)] p-4" />
            {ALL_BENEFITS.map((b) => (
              <div key={b.region} className="border-b border-l border-[var(--border)] p-4">
                <div className="text-base font-bold">{b.label}</div>
                <div className="mt-0.5 text-[0.72rem] text-[var(--text-muted)]">Offices: {officesFor(b.region).join(", ")}</div>
              </div>
            ))}

            {ROWS.map((row) => (
              <div key={row.label} className="contents">
                <div className="border-b border-[var(--border)] p-4 text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {row.label}
                </div>
                {ALL_BENEFITS.map((b) => (
                  <div key={b.region} className="border-b border-l border-[var(--border)] p-4">
                    <Cell category={b.categories.find((c) => row.ids.includes(c.id))} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-[0.72rem] text-[var(--text-muted)]">
          Source: Luminai Benefits 2026 PDF. Internal details (forms, contacts, enrollment steps) are intentionally left out.
        </p>
      </main>
    </>
  );
}

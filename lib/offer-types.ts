import {
  CURRENT_VALUATION,
  PREFERRED_PRICE,
  STRIKE_PRICE,
  VEST_YEARS,
  CLIFF_MONTHS,
  VEST_CADENCE,
  EXIT_SCENARIOS,
  OFFICE_LOCATIONS,
  type ExitScenario,
  type OfficeLocation,
  type VestCadence,
} from "@/config";
import { fmtK } from "@/lib/format";

/** Company figures snapshotted onto each offer at creation time so a later
 *  config.ts change never silently rewrites a letter a candidate already has. */
export interface CompanySnapshot {
  valuation: number;
  preferredPrice: number;
  strikePrice: number;
  scenarios: ExitScenario[];
}

/** Everything the candidate page renders. Nothing else is ever sent to them. */
export interface OfferTerms {
  candidateName: string;
  roleTitle: string;
  location?: OfficeLocation;
  startDate?: string;
  base: number;
  variable: number;
  variableType?: VariableType;
  options: number;
  vestYears: number;
  cliffMonths: number;
  cadence: VestCadence;
  dilutionPct: number;
  company: CompanySnapshot;
}

export const VARIABLE_TYPES = [
  { value: "commission", label: "Commission", annual: true },
  { value: "variable_cash", label: "Variable cash", annual: true },
  { value: "sign_on", label: "Sign-on bonus", annual: false },
] as const;
export type VariableType = (typeof VARIABLE_TYPES)[number]["value"];

export const variableTypeInfo = (t: VariableType | undefined) =>
  VARIABLE_TYPES.find((v) => v.value === (t ?? "commission")) ?? VARIABLE_TYPES[0];

export const MAX_SCENARIOS = 6;

export const EXPIRY_OPTIONS = [3, 7, 14, 30] as const;
export const DEFAULT_EXPIRY_DAYS = 7;

export const DEFAULT_DILUTION_PCT = 15;

export function currentCompany(): CompanySnapshot {
  return {
    valuation: CURRENT_VALUATION,
    preferredPrice: PREFERRED_PRICE,
    strikePrice: STRIKE_PRICE,
    scenarios: EXIT_SCENARIOS.map((s) => ({ ...s })),
  };
}

export const DEFAULT_VESTING = {
  vestYears: VEST_YEARS,
  cliffMonths: CLIFF_MONTHS,
  cadence: VEST_CADENCE,
};

const num = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v.replace(/,/g, "")) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
};

function parseScenarios(raw: unknown): ExitScenario[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ExitScenario[] = [];
  for (const s of raw.slice(0, MAX_SCENARIOS)) {
    const r = (s ?? {}) as Record<string, unknown>;
    if (r.exitVal === "" || r.exitVal === undefined || r.exitVal === null) continue;
    const exitVal = num(r.exitVal, 1, 100_000_000_000_000);
    const rounds = num(r.rounds ?? 0, 0, 10);
    if (exitVal === null || rounds === null) return null;
    const sub = typeof r.sub === "string" ? r.sub.trim().slice(0, 40) : "";
    out.push({ name: fmtK(exitVal), sub, exitVal, rounds: Math.round(rounds) });
  }
  return out;
}

export function parseTerms(
  raw: unknown
): { ok: true; terms: OfferTerms } | { ok: false; error: string } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const candidateName = text(r.candidateName, 100);
  const roleTitle = text(r.roleTitle, 100);
  const base = num(r.base, 1, 10_000_000);
  const variable = num(r.variable ?? 0, 0, 10_000_000);
  const options = num(r.options, 1, 100_000_000);
  const vestYears = num(r.vestYears, 1, 10);
  const cliffMonths = num(r.cliffMonths, 0, 60);
  const dilutionPct = num(r.dilutionPct, 0, 90);
  const cadence = r.cadence === "monthly" || r.cadence === "quarterly" ? r.cadence : null;
  const location = (OFFICE_LOCATIONS as readonly string[]).includes(r.location as string)
    ? (r.location as OfficeLocation)
    : null;
  const startDate =
    typeof r.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.startDate) && !isNaN(Date.parse(r.startDate))
      ? r.startDate
      : null;
  const variableType = VARIABLE_TYPES.some((v) => v.value === r.variableType)
    ? (r.variableType as VariableType)
    : null;
  const scenarios = parseScenarios(r.scenarios);

  if (!candidateName) return { ok: false, error: "Candidate name is required." };
  if (!roleTitle) return { ok: false, error: "Role title is required." };
  if (!location) return { ok: false, error: "Choose a location." };
  if (!startDate) return { ok: false, error: "Choose a start date." };
  if (base === null) return { ok: false, error: "Base salary must be a positive number." };
  if (variable === null) return { ok: false, error: "Variable must be 0 or more." };
  if (!variableType) return { ok: false, error: "Choose a variable type." };
  if (!scenarios) return { ok: false, error: "Each exit scenario needs a valid value and rounds (0–10)." };
  if (options === null) return { ok: false, error: "Options granted must be a positive number." };
  if (vestYears === null) return { ok: false, error: "Vest period must be 1–10 years." };
  if (cliffMonths === null || cliffMonths > vestYears * 12)
    return { ok: false, error: "Cliff must be between 0 months and the vest period." };
  if (!cadence) return { ok: false, error: "Vesting cadence must be monthly or quarterly." };
  if (dilutionPct === null) return { ok: false, error: "Dilution must be 0–90%." };

  return {
    ok: true,
    terms: {
      candidateName,
      roleTitle,
      location,
      startDate,
      base,
      variable,
      variableType,
      options: Math.round(options),
      vestYears,
      cliffMonths: Math.round(cliffMonths),
      cadence,
      dilutionPct,
      company: { ...currentCompany(), scenarios },
    },
  };
}

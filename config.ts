/**
 * Company and grant settings for the Luminai offer visualizer.
 * Update these when the numbers are confirmed.
 */

/** Most recent post-money valuation, in dollars. */
export const CURRENT_VALUATION = 210_000_000;

/** Preferred price per share from the most recent round. */
export const PREFERRED_PRICE = 7.71;

/** Strike price (409A fair market value) for new option grants. */
export const STRIKE_PRICE = 1.16;

// Fully diluted shares are confidential and live in config.server.ts.

/** Default vest period in years for new offers (editable in the builder). */
export const VEST_YEARS = 4;

/** Default cliff length in months for new offers (editable in the builder). */
export const CLIFF_MONTHS = 12;

/** Default vesting cadence after the cliff (editable in the builder). */
export const VEST_CADENCE: VestCadence = "monthly";

/** Offices a candidate can report into. Both map to US benefits. */
export const OFFICE_LOCATIONS = ["San Francisco", "NYC"] as const;
export type OfficeLocation = (typeof OFFICE_LOCATIONS)[number];

/**
 * Exit scenarios shown after "today". `rounds` is how many future financing
 * rounds of dilution are applied before that exit.
 */
export const EXIT_SCENARIOS: ExitScenario[] = [
  { name: "$1B",  sub: "Series C+",    exitVal: 1_000_000_000,  rounds: 1 },
  { name: "$5B",  sub: "Series D+",    exitVal: 5_000_000_000,  rounds: 2 },
  { name: "$15B", sub: "IPO",          exitVal: 15_000_000_000, rounds: 3 },
  { name: "$50B", sub: "Public, mature", exitVal: 50_000_000_000, rounds: 2 },
];

export type VestCadence = "monthly" | "quarterly";

export interface ExitScenario {
  name: string;
  sub: string;
  exitVal: number;
  rounds: number;
}

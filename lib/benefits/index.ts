import type { OfficeLocation } from "@/config";
import type { BenefitCategory, BenefitDetail, BenefitsRegion, RegionBenefits } from "./types";
import { US_BENEFITS } from "./us";

export type { BenefitCategory, BenefitDetail, BenefitsRegion, RegionBenefits } from "./types";

export const OFFICE_REGION: Record<OfficeLocation, BenefitsRegion> = {
  "San Francisco": "US",
  NYC: "US",
};

export const ALL_BENEFITS: RegionBenefits[] = [US_BENEFITS];

export const benefitsForRegion = (region: BenefitsRegion) =>
  ALL_BENEFITS.find((b) => b.region === region)!;

export function officesFor(region: BenefitsRegion): OfficeLocation[] {
  return (Object.keys(OFFICE_REGION) as OfficeLocation[]).filter((o) => OFFICE_REGION[o] === region);
}

export const detailText = (d: BenefitDetail) => (typeof d === "string" ? d : d.text);

export const appliesTo = (d: BenefitDetail, office?: OfficeLocation) =>
  typeof d === "string" || !office || d.offices.includes(office);

export function benefitsFor(office: OfficeLocation | undefined): RegionBenefits | null {
  if (!office || !(office in OFFICE_REGION)) return null;
  const data = benefitsForRegion(OFFICE_REGION[office]);
  return {
    ...data,
    categories: data.categories.map(
      (c): BenefitCategory => ({ ...c, details: c.details.filter((d) => appliesTo(d, office)) })
    ),
  };
}

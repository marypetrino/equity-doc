import type { OfficeLocation } from "@/config";

export type BenefitsRegion = "US";

export type BenefitDetail = string | { text: string; offices: OfficeLocation[] };

export interface BenefitCategory {
  id: string;
  title: string;
  summary: string;
  details: BenefitDetail[];
}

export interface RegionBenefits {
  region: BenefitsRegion;
  label: string;
  lastUpdated: string;
  categories: BenefitCategory[];
}

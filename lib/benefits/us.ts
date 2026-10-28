import type { RegionBenefits } from "./types";

export const US_BENEFITS: RegionBenefits = {
  region: "US",
  label: "United States",
  lastUpdated: "2026-01-01",
  categories: [
    {
      id: "health",
      title: "Medical, Dental & Vision",
      summary: "80% employer-sponsored premiums for you and dependents.",
      details: [
        "Medical insurance — 80% employer-sponsored",
        "Dental insurance — 80% employer-sponsored",
        "Vision insurance — 80% employer-sponsored",
        "Life insurance",
        "Short-term & long-term disability (STD/LTD)",
        "FSA / HSA",
      ],
    },
    {
      id: "financial",
      title: "Financial & Retirement",
      summary: "401(k) plus wellness and stipend budgets via Ramp.",
      details: [
        "401(k) retirement plan",
        "$300/month health & wellness budget (Ramp) — gym, massage, therapy, acupuncture",
        "$150/month lifestyle stipend (Ramp) — meals, groceries, internet, phone, subscriptions",
      ],
    },
    {
      id: "parental",
      title: "Parental Leave",
      summary: "12 weeks birthing / 6 weeks non-birthing, with paid re-engagement.",
      details: [
        "12 weeks paid leave for birthing parent",
        "6 weeks paid leave for non-birthing parent",
        "2-week paid part-time re-engagement period",
      ],
    },
    {
      id: "commuter",
      title: "Commuter Benefits",
      summary: "Parking, transit, and rideshare covered.",
      details: [
        "Parking",
        { text: "Transit — Clipper card / monthly pass", offices: ["San Francisco"] },
        "Monthly transit pass",
        "Rideshare — Uber, Lyft, Waymo",
      ],
    },
    {
      id: "office",
      title: "Office & Workspace",
      summary: "Fully equipped office with meals, snacks, and amenities.",
      details: [
        "Laptop provided",
        "Catered lunch",
        "Coffee, snacks, and beverages",
        "Quiet rooms",
        "Mother's room",
        { text: "Fitness room", offices: ["San Francisco"] },
        "Roof deck",
        "Bike room",
        "Front desk staffed 8am–9pm",
      ],
    },
    {
      id: "time-off",
      title: "Time Off",
      summary: "Flexible PTO with 8 company holidays.",
      details: [
        "Flexible PTO — no accrual, take what you need",
        "8 company holidays per year",
      ],
    },
    {
      id: "growth",
      title: "Learning & Development",
      summary: "Budget for conferences, education, and professional dues.",
      details: [
        "Conference attendance",
        "Education and courses",
        "Professional dues and memberships",
        "Company-wide offsites (last one: Kauai!)",
      ],
    },
  ],
};

"use client";

import { OfferView } from "@/components/offer-view";
import type { OfferTerms } from "@/lib/offer-types";

export function CandidateOffer({ terms }: { terms: OfferTerms }) {
  return (
    <main className="min-h-screen">
      <OfferView terms={terms} />
    </main>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentRecruiter } from "@/lib/recruiter-auth";
import { listOffersBy, offerStatus } from "@/lib/offer-store";
import { InternalNav } from "../internal-nav";
import { OffersList, type OfferRow } from "./offers-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My offers · Luminai" };

export default async function OffersPage() {
  const who = await currentRecruiter();
  if (!who) redirect("/gate");

  const rows: OfferRow[] = (await listOffersBy(who.email)).map((o) => ({
    token: o.token,
    candidateName: o.terms.candidateName,
    roleTitle: o.terms.roleTitle,
    createdAt: o.createdAt,
    expiresAt: o.expiresAt,
    firstOpenedAt: o.firstOpenedAt ?? null,
    status: offerStatus(o),
  }));

  return (
    <>
      <InternalNav email={who.email} active="offers" />
      <OffersList rows={rows} />
    </>
  );
}

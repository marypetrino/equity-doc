import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentRecruiter } from "@/lib/recruiter-auth";
import { FULLY_DILUTED_SHARES } from "@/config.server";
import { InternalNav } from "./internal-nav";
import { OfferBuilder } from "./offer-builder";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New offer · Luminai" };

export default async function InternalPage() {
  const who = await currentRecruiter();
  if (!who) redirect("/gate");
  return (
    <>
      <InternalNav email={who.email} active="builder" />
      <OfferBuilder fdShares={FULLY_DILUTED_SHARES} />
    </>
  );
}

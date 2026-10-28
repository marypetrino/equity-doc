import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getOffer, offerStatus } from "@/lib/offer-store";
import { VIEW_COOKIE, viewCookieGrants } from "@/lib/share";
import { LuminaiLogo } from "@/components/luminai-logo";
import { CandidateOffer } from "./candidate-offer";
import { UnlockForm } from "./unlock-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your offer · Luminai",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OfferPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rec = await getOffer(token);

  if (rec && offerStatus(rec) !== "active") {
    return (
      <Shell>
        <h1 className="text-2xl font-bold tracking-tight">This offer link has expired.</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Please reach out to your recruiter for a new one.</p>
      </Shell>
    );
  }

  const cookie = (await cookies()).get(VIEW_COOKIE)?.value;
  if (rec && viewCookieGrants(cookie, token)) {
    return <CandidateOffer terms={rec.terms} />;
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold tracking-tight">Your Luminai offer</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Enter the password your recruiter sent you to view your offer.
      </p>
      <UnlockForm token={token} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-6 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-widest">
        <LuminaiLogo className="h-4 w-auto" />
        Luminai
      </div>
      <div className="w-full max-w-sm text-center">{children}</div>
    </main>
  );
}

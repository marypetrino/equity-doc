import { NextResponse } from "next/server";
import { currentRecruiter } from "@/lib/recruiter-auth";
import { updateOffer } from "@/lib/offer-store";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const who = await currentRecruiter();
  if (!who) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { token } = await params;

  let owned = false;
  let updated;
  try {
    updated = await updateOffer(token, (rec) => {
      owned = rec.createdBy.toLowerCase() === who.email.toLowerCase();
      if (!owned || rec.revokedAt) return null;
      return { ...rec, revokedAt: Date.now() };
    });
  } catch (err) {
    console.error("offer update failed", err);
    return NextResponse.json({ error: "Couldn't save the change. Try again." }, { status: 503 });
  }
  if (!updated || !owned) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

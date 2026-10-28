import { NextResponse } from "next/server";
import { currentRecruiter } from "@/lib/recruiter-auth";
import { updateOffer } from "@/lib/offer-store";
import { EXPIRY_OPTIONS } from "@/lib/offer-types";

export const runtime = "nodejs";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const who = await currentRecruiter();
  if (!who) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { token } = await params;

  const { days } = (await req.json().catch(() => ({}))) as { days?: unknown };
  const d = Number(days);
  if (!(EXPIRY_OPTIONS as readonly number[]).includes(d)) {
    return NextResponse.json({ error: "Choose 3, 7, 14 or 30 days." }, { status: 400 });
  }

  let owned = false;
  let revoked = false;
  let updated;
  try {
    updated = await updateOffer(token, (rec) => {
      owned = rec.createdBy.toLowerCase() === who.email.toLowerCase();
      revoked = Boolean(rec.revokedAt);
      if (!owned || revoked) return null;
      return { ...rec, expiresAt: Date.now() + d * DAY_MS };
    });
  } catch (err) {
    console.error("offer update failed", err);
    return NextResponse.json({ error: "Couldn't save the change. Try again." }, { status: 503 });
  }
  if (!updated || !owned) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (revoked) return NextResponse.json({ error: "This link was revoked. Create a new one." }, { status: 409 });
  return NextResponse.json({ ok: true, expiresAt: updated.expiresAt });
}

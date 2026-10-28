import { NextResponse } from "next/server";
import { currentRecruiter } from "@/lib/recruiter-auth";
import { updateOffer } from "@/lib/offer-store";
import { hashPassword, newPassword } from "@/lib/share";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const who = await currentRecruiter();
  if (!who) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { token } = await params;

  const password = newPassword();
  const { passHash, passSalt } = await hashPassword(password);

  let owned = false;
  let revoked = false;
  try {
    const updated = await updateOffer(token, (rec) => {
      owned = rec.createdBy.toLowerCase() === who.email.toLowerCase();
      revoked = Boolean(rec.revokedAt);
      if (!owned || revoked) return null;
      return { ...rec, passHash, passSalt, attempts: 0, lockedUntil: undefined };
    });
    if (!updated || !owned) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (revoked) return NextResponse.json({ error: "This link was revoked. Create a new offer instead." }, { status: 409 });
  } catch (err) {
    console.error("reset password failed", err);
    return NextResponse.json({ error: "Couldn't save the new password. Try again." }, { status: 503 });
  }

  const res = NextResponse.json({ password });
  res.headers.set("Cache-Control", "no-store, private");
  return res;
}

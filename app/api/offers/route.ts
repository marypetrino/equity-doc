import { NextResponse, type NextRequest } from "next/server";
import { currentRecruiter } from "@/lib/recruiter-auth";
import { createOffer, listOffersBy, offerStatus } from "@/lib/offer-store";
import { EXPIRY_OPTIONS, parseTerms } from "@/lib/offer-types";
import { hashPassword, newPassword, newToken } from "@/lib/share";

export const runtime = "nodejs";

const DAY_MS = 24 * 60 * 60 * 1000;

const noStore = (res: NextResponse) => {
  res.headers.set("Cache-Control", "no-store, private");
  return res;
};

export async function POST(req: NextRequest) {
  const who = await currentRecruiter();
  if (!who) return noStore(NextResponse.json({ error: "unauthorized" }, { status: 401 }));

  let body: { terms?: unknown; expiryDays?: unknown };
  try {
    body = await req.json();
  } catch {
    return noStore(NextResponse.json({ error: "Invalid request." }, { status: 400 }));
  }

  const parsed = parseTerms(body.terms);
  if (!parsed.ok) return noStore(NextResponse.json({ error: parsed.error }, { status: 400 }));

  const expiryDays = Number(body.expiryDays);
  if (!(EXPIRY_OPTIONS as readonly number[]).includes(expiryDays)) {
    return noStore(NextResponse.json({ error: "Choose an expiry of 3, 7, 14 or 30 days." }, { status: 400 }));
  }

  const now = Date.now();
  const token = newToken();
  const password = newPassword();
  const { passHash, passSalt } = await hashPassword(password);

  await createOffer({
    token,
    createdAt: now,
    createdBy: who.email,
    terms: parsed.terms,
    passHash,
    passSalt,
    expiresAt: now + expiryDays * DAY_MS,
    attempts: 0,
  });

  const url = new URL(`/offer/${token}`, req.nextUrl.origin).toString();
  return noStore(NextResponse.json({ url, password, token }, { status: 201 }));
}

export async function GET() {
  const who = await currentRecruiter();
  if (!who) return noStore(NextResponse.json({ error: "unauthorized" }, { status: 401 }));

  const now = Date.now();
  const offers = (await listOffersBy(who.email)).map((o) => ({
    token: o.token,
    candidateName: o.terms.candidateName,
    roleTitle: o.terms.roleTitle,
    createdAt: o.createdAt,
    expiresAt: o.expiresAt,
    revokedAt: o.revokedAt ?? null,
    firstOpenedAt: o.firstOpenedAt ?? null,
    status: offerStatus(o, now),
  }));
  return noStore(NextResponse.json({ offers }));
}

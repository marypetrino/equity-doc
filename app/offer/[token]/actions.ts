"use server";

import { cookies } from "next/headers";
import { getOffer, offerStatus, updateOffer } from "@/lib/offer-store";
import {
  LOCKOUT_MS,
  MAX_ATTEMPTS,
  VIEW_COOKIE,
  hashPassword,
  mintViewCookie,
  verifyPassword,
} from "@/lib/share";

export type UnlockState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "invalid" }
  | { status: "locked"; minutes: number }
  | { status: "expired" }
  | { status: "error" };

const WRONG: UnlockState = { status: "invalid" };

export async function unlockOffer(
  token: string,
  prev: UnlockState,
  formData: FormData
): Promise<UnlockState> {
  try {
    return await unlock(token, prev, formData);
  } catch (err) {
    console.error("unlockOffer failed", err);
    return { status: "error" };
  }
}

async function unlock(token: string, _prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const password = String(formData.get("password") ?? "").slice(0, 100);
  if (!password.trim()) return WRONG;

  const rec = await getOffer(token);
  if (!rec) {
    await hashPassword(password);
    return WRONG;
  }
  if (offerStatus(rec) !== "active") return { status: "expired" };

  let lockedFor = 0;
  const reserved = await updateOffer(token, (r) => {
    const now = Date.now();
    if (r.lockedUntil && r.lockedUntil > now) {
      lockedFor = r.lockedUntil - now;
      return null;
    }
    const attempts = r.attempts + 1;
    return attempts >= MAX_ATTEMPTS
      ? { ...r, attempts: 0, lockedUntil: now + LOCKOUT_MS }
      : { ...r, attempts, lockedUntil: undefined };
  });
  if (lockedFor > 0) return { status: "locked", minutes: Math.ceil(lockedFor / 60000) };
  if (!reserved) return WRONG;

  if (!(await verifyPassword(password, rec))) {
    if (reserved.lockedUntil) {
      return { status: "locked", minutes: Math.ceil((reserved.lockedUntil - Date.now()) / 60000) };
    }
    return WRONG;
  }

  const now = Date.now();
  const opened = await updateOffer(token, (r) => ({
    ...r,
    attempts: 0,
    lockedUntil: undefined,
    firstOpenedAt: r.firstOpenedAt ?? now,
    lastOpenedAt: now,
  }));
  if (!opened || offerStatus(opened) !== "active") return { status: "expired" };

  (await cookies()).set(VIEW_COOKIE, mintViewCookie(token, opened.expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/offer/${token}`,
    maxAge: Math.max(1, Math.floor((opened.expiresAt - now) / 1000)),
  });
  return { status: "ok" };
}

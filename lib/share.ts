import {
  createHmac,
  randomBytes,
  randomInt,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const SCRYPT_KEYLEN = 32;

export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export function newToken(): string {
  return randomBytes(16).toString("base64url");
}

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function newPassword(): string {
  const pick = () => ALPHABET[randomInt(ALPHABET.length)];
  const group = () => Array.from({ length: 5 }, pick).join("");
  return `${group()}-${group()}`;
}

function normalize(password: string) {
  return password.trim().toUpperCase().replace(/[\s-]/g, "");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64");
  const key = await scrypt(normalize(password), salt, SCRYPT_KEYLEN);
  return { passHash: key.toString("base64"), passSalt: salt };
}

export async function verifyPassword(
  password: string,
  rec: { passHash: string; passSalt: string }
): Promise<boolean> {
  const key = await scrypt(normalize(password), rec.passSalt, SCRYPT_KEYLEN);
  const expected = Buffer.from(rec.passHash, "base64");
  return expected.length === key.length && timingSafeEqual(key, expected);
}

export const VIEW_COOKIE = "luminai_offer_view";

function signingKey(): string {
  const key = process.env.AUTH_SECRET;
  if (!key) throw new Error("Set AUTH_SECRET to sign candidate view cookies");
  return key;
}

const mac = (body: string) =>
  createHmac("sha256", signingKey()).update(body).digest("base64url");

export function mintViewCookie(token: string, expiresAt: number): string {
  const body = `${token}.${expiresAt}`;
  return `${body}.${mac(body)}`;
}

export function viewCookieGrants(
  value: string | undefined,
  token: string,
  now = Date.now()
): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [cookieToken, expRaw, sig] = parts;
  const a = Buffer.from(sig);
  const b = Buffer.from(mac(`${cookieToken}.${expRaw}`));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const exp = Number(expRaw);
  return Number.isFinite(exp) && exp > now && cookieToken === token;
}

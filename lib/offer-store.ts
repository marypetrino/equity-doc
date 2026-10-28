import { promises as fs } from "node:fs";
import path from "node:path";
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { BlobNotFoundError, BlobPreconditionFailedError, get, head, list, put } from "@vercel/blob";
import type { OfferTerms } from "./offer-types";

export interface OfferRecord {
  token: string;
  createdAt: number;
  createdBy: string;
  terms: OfferTerms;
  passHash: string;
  passSalt: string;
  expiresAt: number;
  revokedAt?: number;
  attempts: number;
  lockedUntil?: number;
  firstOpenedAt?: number;
  lastOpenedAt?: number;
}

export type OfferStatus = "active" | "expired" | "revoked";

export function offerStatus(rec: OfferRecord, now = Date.now()): OfferStatus {
  if (rec.revokedAt) return "revoked";
  if (now >= rec.expiresAt) return "expired";
  return "active";
}

const isDeployed = () =>
  process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

function encKey(): Buffer | null {
  const hex = process.env.OFFERS_ENC_KEY;
  if (!hex) {
    if (isDeployed()) throw new Error("OFFERS_ENC_KEY must be set outside local development");
    return null;
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("OFFERS_ENC_KEY must be 64 hex characters (openssl rand -hex 32)");
  }
  return Buffer.from(hex, "hex");
}

function encode(rec: OfferRecord): string {
  const json = JSON.stringify(rec);
  const key = encKey();
  if (!key) return json;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  return JSON.stringify({
    __enc: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  });
}

function decode(raw: string): OfferRecord {
  const parsed = JSON.parse(raw);
  if (parsed?.__enc !== "aes-256-gcm") return parsed as OfferRecord;
  const key = encKey();
  if (!key) throw new Error("Offer is encrypted but OFFERS_ENC_KEY is unset");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(parsed.iv, "base64"));
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));
  const json = Buffer.concat([
    decipher.update(Buffer.from(parsed.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(json) as OfferRecord;
}

class VersionConflict extends Error {}

const OVERWRITE = "*overwrite*";

interface Adapter {
  read(token: string): Promise<{ rec: OfferRecord; version: string } | null>;
  write(rec: OfferRecord, version?: string): Promise<void>;
  tokens(): Promise<string[]>;
}

const BLOB_DIR = "offers";
const blobPath = (token: string) => `${BLOB_DIR}/${token}.json`;

const blobAdapter: Adapter = {
  async read(token) {
    let version: string;
    try {
      version = (await head(blobPath(token))).etag;
    } catch (err) {
      if (err instanceof BlobNotFoundError) return null;
      throw err;
    }
    const res = await get(blobPath(token), { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return { rec: decode(await new Response(res.stream).text()), version };
  },
  async write(rec, version) {
    try {
      await put(blobPath(rec.token), encode(rec), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: version !== undefined,
        ...(version && version !== OVERWRITE ? { ifMatch: version } : {}),
        cacheControlMaxAge: 60,
      });
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError) throw new VersionConflict();
      throw err;
    }
  },
  async tokens() {
    const out: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: `${BLOB_DIR}/`, cursor });
      for (const b of page.blobs) {
        const m = b.pathname.match(/^offers\/([A-Za-z0-9_-]+)\.json$/);
        if (m) out.push(m[1]);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out;
  },
};

const DIR = path.join(process.cwd(), ".data", "offers");
const filePath = (token: string) => path.join(DIR, `${token}.json`);

const fileAdapter: Adapter = {
  async read(token) {
    try {
      const [raw, stat] = await Promise.all([
        fs.readFile(filePath(token), "utf8"),
        fs.stat(filePath(token)),
      ]);
      return { rec: decode(raw), version: String(stat.mtimeMs) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  },
  async write(rec, version) {
    await fs.mkdir(DIR, { recursive: true });
    const current = await this.read(rec.token);
    if (version === undefined ? current : version !== OVERWRITE && current?.version !== version) {
      throw new VersionConflict();
    }
    const tmp = `${filePath(rec.token)}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, encode(rec), "utf8");
    await fs.rename(tmp, filePath(rec.token));
  },
  async tokens() {
    try {
      return (await fs.readdir(DIR))
        .filter((n) => n.endsWith(".json"))
        .map((n) => n.slice(0, -".json".length));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  },
};

function adapter(): Adapter {
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return blobAdapter;
  if (isDeployed()) {
    throw new Error("Connect a private Vercel Blob store to this project (sets BLOB_STORE_ID)");
  }
  return fileAdapter;
}

const TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;

export async function getOffer(token: string): Promise<OfferRecord | null> {
  if (!TOKEN_RE.test(token)) return null;
  return (await adapter().read(token))?.rec ?? null;
}

export async function createOffer(rec: OfferRecord): Promise<void> {
  await adapter().write(rec);
}

export async function updateOffer(
  token: string,
  fn: (rec: OfferRecord) => OfferRecord | null
): Promise<OfferRecord | null> {
  if (!TOKEN_RE.test(token)) return null;
  const store = adapter();
  let previous: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await store.read(token);
    if (!current) return null;
    const next = fn(structuredClone(current.rec));
    if (!next) return current.rec;
    const snapshot = JSON.stringify(current.rec);
    const unchanged = previous === snapshot;
    previous = snapshot;
    try {
      await store.write(next, unchanged ? OVERWRITE : current.version);
      return next;
    } catch (err) {
      if (!(err instanceof VersionConflict)) throw err;
    }
  }
  throw new Error("Offer is being updated concurrently; try again");
}

export async function listOffersBy(email: string): Promise<OfferRecord[]> {
  const store = adapter();
  const tokens = await store.tokens();
  const recs = await Promise.all(tokens.map((t) => store.read(t)));
  const me = email.toLowerCase();
  return recs
    .flatMap((r) => (r && r.rec.createdBy.toLowerCase() === me ? [r.rec] : []))
    .sort((a, b) => b.createdAt - a.createdAt);
}

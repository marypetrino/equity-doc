import { auth, authConfigured, isAllowedEmail } from "@/auth";

export interface Recruiter {
  email: string;
  via: "google" | "dev";
}

const isProdHost = () =>
  process.env.VERCEL === "1" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

function devOpen(): boolean {
  return process.env.OFFER_TOOL_OPEN_DEV === "1" && !isProdHost();
}

export async function currentRecruiter(): Promise<Recruiter | null> {
  if (devOpen()) return { email: "dev@localhost", via: "dev" };
  if (authConfigured()) {
    const session = await auth();
    const email = session?.user?.email;
    if (isAllowedEmail(email)) return { email: email as string, via: "google" };
  }
  return null;
}

export function gateOptions() {
  return { google: authConfigured(), open: devOpen() };
}

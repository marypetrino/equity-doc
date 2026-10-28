import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Recruiter sign-in: Google, restricted to @luminai.com.
 *
 * Configure in the environment:
 *   AUTH_SECRET            openssl rand -base64 32
 *   AUTH_GOOGLE_ID         from the Google Cloud OAuth client
 *   AUTH_GOOGLE_SECRET     likewise
 *   ALLOWED_EMAIL_DOMAINS  luminai.com
 */

export function allowedDomains(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function authConfigured(): boolean {
  return Boolean(
    process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET &&
      process.env.AUTH_SECRET &&
      allowedDomains().length > 0
  );
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  return Boolean(domain) && allowedDomains().includes(domain);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/gate", error: "/gate" },
  callbacks: {
    signIn({ profile }) {
      if (profile && profile.email_verified === false) return false;
      return isAllowedEmail(profile?.email);
    },
    session({ session }) {
      if (!isAllowedEmail(session.user?.email)) {
        return null as unknown as typeof session;
      }
      return session;
    },
  },
});

import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { currentRecruiter, gateOptions } from "@/lib/recruiter-auth";
import { LuminaiLogo } from "@/components/luminai-logo";

export const dynamic = "force-dynamic";

export default async function Gate({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentRecruiter()) redirect("/internal");
  const { error } = await searchParams;
  const opts = gateOptions();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-3">
        <LuminaiLogo variant="badge" className="h-12 w-12" />
        <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Luminai</span>
      </div>

      {!opts.google ? (
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight">Not configured</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Google sign-in isn&apos;t set up on this deployment. It needs{" "}
            <code className="font-mono text-[0.8rem]">AUTH_SECRET</code>,{" "}
            <code className="font-mono text-[0.8rem]">AUTH_GOOGLE_ID</code>,{" "}
            <code className="font-mono text-[0.8rem]">AUTH_GOOGLE_SECRET</code> and{" "}
            <code className="font-mono text-[0.8rem]">ALLOWED_EMAIL_DOMAINS</code>.
          </p>
        </div>
      ) : error ? (
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight">Access restricted</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            This tool is only available to Luminai team members. Sign in with your Luminai Google account.
          </p>
          <SignInButton label="Try a different account" />
        </div>
      ) : (
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight">Offer Builder</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Sign in with your Luminai Google account.</p>
          <SignInButton label="Continue with Google" />
        </div>
      )}
    </main>
  );
}

function SignInButton({ label }: { label: string }) {
  return (
    <form
      className="mt-6"
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/internal" }, { prompt: "select_account" });
      }}
    >
      <button
        type="submit"
        className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        {label}
      </button>
    </form>
  );
}

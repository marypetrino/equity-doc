import Link from "next/link";
import { signOutAction } from "@/app/auth-actions";
import { LuminaiLogo } from "@/components/luminai-logo";

export function InternalNav({ email, active }: { email: string; active: "builder" | "offers" | "benefits" }) {
  const tab = (href: string, label: string, on: boolean) => (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-[0.75rem] font-semibold ${
        on ? "bg-[var(--surface-2)] text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-3">
      <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-widest">
        <LuminaiLogo className="h-3.5 w-auto" />
        Luminai · Offers
      </div>
      <nav className="flex gap-1">
        {tab("/internal", "New offer", active === "builder")}
        {tab("/internal/offers", "My offers", active === "offers")}
        {tab("/internal/benefits", "Benefits", active === "benefits")}
      </nav>
      <div className="ml-auto flex items-center gap-3 text-[0.72rem] text-[var(--text-muted)]">
        <span className="hidden sm:inline">{email}</span>
        <form action={signOutAction}>
          <button type="submit" className="hover:text-[var(--text)]">Sign out</button>
        </form>
      </div>
    </header>
  );
}

import Link from "next/link";
import { signOutAction } from "@/app/auth-actions";
import { LuminaiLogo } from "@/components/luminai-logo";

export function InternalNav({ email, active }: { email: string; active: "builder" | "offers" | "benefits" }) {
  const tab = (href: string, label: string, on: boolean) => (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-[0.75rem] font-semibold transition-colors ${
        on ? "bg-white/15 text-white" : "text-white/55 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 bg-[#0a0b0f] px-5 py-3">
      <div className="flex items-center gap-2">
        <LuminaiLogo variant="badge" className="h-7 w-7" />
        <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-white/70">Luminai</span>
      </div>
      <nav className="flex gap-1">
        {tab("/internal", "New offer", active === "builder")}
        {tab("/internal/offers", "My offers", active === "offers")}
        {tab("/internal/benefits", "Benefits", active === "benefits")}
      </nav>
      <div className="ml-auto flex items-center gap-3 text-[0.72rem] text-white/50">
        <span className="hidden sm:inline">{email}</span>
        <form action={signOutAction}>
          <button type="submit" className="hover:text-white/80">Sign out</button>
        </form>
      </div>
    </header>
  );
}

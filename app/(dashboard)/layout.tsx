import Link from "next/link";
import { signOut } from "@/lib/actions";

// Every dashboard page reads live, per-user DB/auth state — never statically
// prerender any of them. Setting this on the shared layout applies it to all
// nested pages (jobSources/matches/etc. have no per-request signal of their
// own, like a cookies() call, that would make Next infer this automatically).
export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/matches", label: "Matches" },
  { href: "/dashboard/cvs", label: "CVs" },
  { href: "/dashboard/templates", label: "Referral templates" },
  { href: "/dashboard/sources", label: "Sources" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold">GetHired</span>
          <form action={signOut}>
            <button type="submit" className="text-sm text-neutral-500 hover:underline">
              Sign out
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-4 overflow-x-auto px-4 pb-3 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap text-neutral-600 hover:text-neutral-900">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

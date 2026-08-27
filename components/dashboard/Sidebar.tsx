"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  FileStack,
  MessageSquareText,
  Rss,
  UserRound,
  Settings,
  Briefcase,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/matches", label: "Matches", icon: Inbox },
  { href: "/dashboard/cvs", label: "CVs", icon: FileStack },
  { href: "/dashboard/templates", label: "Referral templates", icon: MessageSquareText },
  { href: "/dashboard/sources", label: "Sources", icon: Rss },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5 font-semibold text-slate-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Briefcase className="h-4.5 w-4.5" />
        </span>
        GetHired
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-x-auto px-3 sm:overflow-visible">
        <div className="flex gap-0.5 sm:flex-col">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <form action={onSignOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

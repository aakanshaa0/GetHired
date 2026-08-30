import Link from "next/link";
import { Briefcase } from "lucide-react";

export default function Footer({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 font-medium text-slate-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-white">
            <Briefcase className="h-3.5 w-3.5" />
          </span>
          GetHired
        </Link>
        <p>A personal job-alert pipeline — not an autonomous applier.</p>
        <Link href={isAuthenticated ? "/dashboard" : "/login"} className="font-medium text-teal-600 hover:text-teal-500">
          {isAuthenticated ? "Dashboard" : "Sign in"}
        </Link>
      </div>
    </footer>
  );
}

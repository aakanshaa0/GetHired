import Link from "next/link";
import { Briefcase } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Briefcase className="h-3.5 w-3.5" />
          </span>
          GetHired
        </div>
        <p>A personal job-alert pipeline — not an autonomous applier.</p>
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </div>
    </footer>
  );
}

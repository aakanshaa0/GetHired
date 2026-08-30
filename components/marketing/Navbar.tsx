import Link from "next/link";
import { Briefcase } from "lucide-react";

export default function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Briefcase className="h-4.5 w-4.5" />
          </span>
          GetHired
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 sm:flex">
          <a href="#features" className="hover:text-slate-900">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-slate-900">
            How it works
          </a>
        </nav>
        <Link href={isAuthenticated ? "/dashboard" : "/login"} className="btn-primary">
          {isAuthenticated ? "Dashboard" : "Sign in"}
        </Link>
      </div>
    </header>
  );
}

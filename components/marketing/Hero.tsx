import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -10%, rgba(13,148,136,0.12), transparent), radial-gradient(40% 40% at 90% 10%, rgba(20,184,166,0.10), transparent)",
        }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2">
        <div>
          <span className="badge-neutral">One dashboard, every job source</span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Every good opening, <span className="text-teal-600">before it&apos;s gone.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-slate-600">
            GetHired watches Telegram channels, Naukri, Wellfound, LinkedIn, and foundit for roles
            that meet your salary bar and screens out scams — then hands you a ready-to-send
            referral message and a staged application, CV already picked.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={isAuthenticated ? "/dashboard" : "/login"} className="btn-primary px-6 py-3 text-base">
              {isAuthenticated ? "Go to dashboard" : "Get started"} <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="btn-secondary px-6 py-3 text-base">
              See how it works
            </a>
          </div>
          <ul className="mt-8 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:gap-6">
            {["No auto-apply spam", "Scam screening on every listing", "Your templates, your voice"].map(
              (item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  {item}
                </li>
              )
            )}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-teal-100 to-transparent blur-2xl" />
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">Backend Engineer</p>
                <p className="text-sm text-slate-500">Razorpay · Bangalore, remote</p>
              </div>
              <span className="badge-success shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Looks legit
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">₹18–24 LPA · via Telegram</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <p className="font-medium text-slate-700">Referral message ready</p>
              <p className="mt-1 line-clamp-2">
                Hi! I noticed Razorpay is hiring for Backend Engineer. I&apos;m a backend-focused
                engineer from...
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="flex-1 rounded-lg bg-teal-600 py-2 text-center text-xs font-medium text-white">
                Open apply link
              </span>
              <span className="rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-medium text-slate-700">
                Skip
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

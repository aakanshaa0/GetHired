import { UserRoundPlus, ScanSearch, MailCheck } from "lucide-react";

const STEPS = [
  {
    icon: UserRoundPlus,
    title: "Set up once",
    description: "Add your profile, upload CVs per role, write your referral template, and turn on the job sources you care about.",
  },
  {
    icon: ScanSearch,
    title: "The pipeline watches and filters",
    description: "New postings are pulled in, checked against your salary bar, matched to the right CV, and screened for legitimacy.",
  },
  {
    icon: MailCheck,
    title: "You get a ready-to-act email",
    description: "A clean summary lands in your inbox with the CV picked, the referral message written, and a link to the real posting.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-slate-200 bg-slate-50/60 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">How it works</h2>
          <p className="mt-3 text-slate-600">Three steps, then it runs in the background every 30 minutes.</p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                {i + 1}
              </div>
              <Icon className="mt-4 h-6 w-6 text-indigo-600" />
              <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

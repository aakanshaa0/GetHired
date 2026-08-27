import { Rss, IndianRupee, ShieldCheck, FileStack, MessageSquareText, MousePointerClick } from "lucide-react";

const FEATURES = [
  {
    icon: Rss,
    title: "Every source, one feed",
    description: "Telegram channels, Naukri, Wellfound, LinkedIn, and foundit — watched continuously so you don't have to check five tabs a day.",
  },
  {
    icon: IndianRupee,
    title: "Your salary bar, enforced",
    description: "Set a minimum LPA once. Anything below it never reaches you; anything with no stated salary lands in a separate digest instead of vanishing.",
  },
  {
    icon: ShieldCheck,
    title: "Scam screening built in",
    description: "Every posting is checked against a legitimacy model before you ever see it — flagged listings get a clear warning, not a silent notification.",
  },
  {
    icon: FileStack,
    title: "The right CV, every time",
    description: "Upload a CV per role track. Matching picks the best fit automatically, and you can override it in one click if it guesses wrong.",
  },
  {
    icon: MessageSquareText,
    title: "Referral messages, pre-filled",
    description: "Write your outreach template once with placeholders. Every match arrives with it already filled in and ready to copy to LinkedIn.",
  },
  {
    icon: MousePointerClick,
    title: "Staged, not automated",
    description: "GetHired never logs in or submits forms on your behalf — it prepares everything and hands you one real apply link to click yourself.",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Built for the actual job hunt</h2>
        <p className="mt-3 text-slate-600">Not another job board — a filter between the noise and your inbox.</p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

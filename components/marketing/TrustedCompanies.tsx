const WATCHED_COMPANIES = [
  "Google", "Microsoft", "Amazon", "Adobe",
  "TCS", "Infosys", "Capgemini", "Accenture",
  "Flipkart", "Razorpay", "Freshworks", "Zoho",
];

export default function TrustedCompanies() {
  return (
    <section className="border-y border-slate-100 bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-6 py-14 text-center">
        <p className="text-sm font-medium text-slate-500">
          Watching openings from FAANG-tier to mid-tier to underrated startups — including
        </p>
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
          {WATCHED_COMPANIES.map((name) => (
            <span key={name} className="badge-neutral bg-white text-slate-700 shadow-sm">
              {name}
            </span>
          ))}
          <span className="badge-neutral bg-white text-slate-500 shadow-sm">+ 30 more, pre-screened</span>
        </div>
      </div>
    </section>
  );
}

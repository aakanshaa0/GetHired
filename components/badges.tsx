import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, type LucideIcon } from "lucide-react";

const LEGITIMACY_CONFIG: Record<string, { label: string; className: string; icon: LucideIcon }> = {
  legit: { label: "Looks legit", className: "badge-success", icon: CheckCircle2 },
  suspicious: { label: "Suspicious", className: "badge-warning", icon: AlertTriangle },
  scam: { label: "Likely scam", className: "badge-danger", icon: XCircle },
  unscored: { label: "Scoring...", className: "badge-neutral", icon: HelpCircle },
};

export function LegitimacyBadge({ verdict }: { verdict: string }) {
  const config = LEGITIMACY_CONFIG[verdict] ?? LEGITIMACY_CONFIG.unscored;
  const Icon = config.icon;
  return (
    <span className={config.className}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

const STATUS_LABEL: Record<string, string> = {
  suggested: "New",
  viewed: "Viewed",
  ready: "Ready to apply",
  applied: "Applied",
  skipped: "Skipped",
  expired: "Expired",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className="badge-neutral">{STATUS_LABEL[status] ?? status}</span>;
}

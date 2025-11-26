import { cx } from '../../../utils/cx';
import { ReactNode } from "react";

type KpiTone = "brand-cyan" | "brand-teal" | "warning" | "success";

type Props = {
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: KpiTone;
  hint?: string;
};

const bgMap: Record<string, string> = {
  "brand-cyan": "bg-[var(--brand-cyan)]/10",
  "brand-teal": "bg-[var(--brand-teal)]/10",
  warning: "bg-[var(--warning)]/10",
  success: "bg-[var(--success)]/10",
};
const fgMap: Record<string, string> = {
  "brand-cyan": "text-[var(--brand-cyan)]",
  "brand-teal": "text-[var(--brand-teal)]",
  warning: "text-[var(--warning)]",
  success: "text-[var(--success)]",
};

/**
 * Card padronizado para exibir um KPI (Key Performance Indicator).
 */
export default function KpiCard({ icon, label, value, tone, hint }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
          {hint && <div className="text-xs text-muted-foreground/80">{hint}</div>}
        </div>
        <div className={cx("size-10 rounded-lg grid place-items-center", tone ? bgMap[tone] : "bg-[var(--muted)]")}>
          <div className={cx("opacity-90", tone ? fgMap[tone] : "text-muted-foreground")}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
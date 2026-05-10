import { cx } from "../../../utils/cx";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { ReactNode } from "react";

type Variant = "error" | "warning" | "success" | "info";

type Props = {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
};

const config: Record<Variant, { icon: ReactNode; cls: string }> = {
  error: {
    icon: <AlertCircle className="size-4 shrink-0" />,
    cls: "border-destructive/30 bg-destructive/5 text-destructive",
  },
  warning: {
    icon: <TriangleAlert className="size-4 shrink-0" />,
    cls: "border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]",
  },
  success: {
    icon: <CheckCircle2 className="size-4 shrink-0" />,
    cls: "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]",
  },
  info: {
    icon: <Info className="size-4 shrink-0" />,
    cls: "border-[var(--info)]/40 bg-[var(--info)]/10 text-[var(--info)]",
  },
};

export default function Alert({ variant = "error", title, children, className }: Props) {
  const { icon, cls } = config[variant];
  return (
    <div className={cx("flex items-start gap-3 rounded-lg border p-3 text-sm", cls, className)}>
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}

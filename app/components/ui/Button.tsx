import { cx } from "../../../utils/cx";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline" | "link";
type Size = "sm" | "md" | "lg" | "icon";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
};

const variantCls: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 shadow-sm disabled:opacity-60",
  secondary:
    "border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-foreground",
  ghost:
    "hover:bg-[var(--muted)] text-foreground",
  destructive:
    "bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm disabled:opacity-60",
  outline:
    "border border-[var(--border)] bg-transparent hover:bg-[var(--muted)] text-foreground",
  link:
    "text-[var(--brand-cyan)] underline-offset-4 hover:underline p-0 h-auto",
};

const sizeCls: Record<Size, string> = {
  sm:   "h-8 px-3 text-xs gap-1.5",
  md:   "h-9 px-4 text-sm gap-2",
  lg:   "h-11 px-6 text-base gap-2",
  icon: "h-9 w-9",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  children,
  className,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed",
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}

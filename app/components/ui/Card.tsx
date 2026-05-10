import { cx } from "../../../utils/cx";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
};

export default function Card({ children, className, padding = "md" }: Props) {
  const padCls = {
    none: "",
    sm:   "p-3 sm:p-4",
    md:   "p-4 sm:p-5",
    lg:   "p-5 sm:p-6",
  }[padding];

  return (
    <div
      className={cx(
        "rounded-xl border border-[var(--border)] bg-card",
        padCls,
        className,
      )}
    >
      {children}
    </div>
  );
}

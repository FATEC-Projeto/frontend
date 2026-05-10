import { cx } from "../../../utils/cx";
import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, description, actions, className }: Props) {
  return (
    <div className={cx("flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div>
        <h1 className="font-grotesk text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

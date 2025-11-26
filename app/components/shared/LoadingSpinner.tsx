// app/components/shared/LoadingSpinner.tsx
import { Loader2 } from "lucide-react";
import React from "react";
import { cx } from "../../../utils/cx";

type Props = {
  label?: string;
  className?: string;
};

/**
 * Exibe um spinner de carregamento padronizado.
 */
export default function LoadingSpinner({ label = "Carregando...", className }: Props) {
  return (
    <div className={cx("flex items-center gap-2 text-muted-foreground text-sm", className)}>
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}
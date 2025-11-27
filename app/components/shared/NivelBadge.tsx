
// app/components/shared/NivelBadge.tsx
import { cx } from "../../../utils/cx";
import React from "react";

type Nivel = "N1" | "N2" | "N3";

type Props = {
  /** Valor do Nível (N1, N2, N3) */
  nivel: Nivel;
};

/**
 * Exibe um badge formatado para o Nível do chamado (N1, N2, N3).
 */
export default function NivelBadge({ nivel }: Props) {
  const map: Record<Nivel, string> = {
    N1: "bg-blue-500/12 text-blue-600 border-blue-500/30",
    N2: "bg-purple-500/12 text-purple-600 border-purple-500/30",
    N3: "bg-rose-500/12 text-rose-600 border-rose-500/30",
  };

  const cls = map[nivel] || "bg-[var(--muted)] text-muted-foreground border-[var(--border)]";

  return (
    <span className={cx("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border", cls)}>
      {nivel}
    </span>
  );
}
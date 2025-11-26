// app/components/shared/PriorityDot.tsx
import { cx } from "../../../utils/cx";
import React from "react";

type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

type Props = {
  /** Valor da Prioridade (BAIXA, MEDIA, ALTA, URGENTE) */
  prioridade: Prioridade;
  /** Tamanho do ponto (default: size-2) */
  className?: string;
};

/**
 * Exibe um ponto colorido que indica a prioridade do chamado.
 */
export default function PriorityDot({ prioridade, className = "size-2" }: Props) {
  const map: Record<Prioridade, string> = {
    BAIXA: "bg-[var(--muted-foreground)]",
    MEDIA: "bg-[var(--brand-cyan)]",
    ALTA: "bg-[var(--brand-teal)]",
    URGENTE: "bg-[var(--brand-red)]",
  };

  return <span className={cx("inline-block rounded-full", map[prioridade], className)} />;
}
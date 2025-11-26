// app/components/shared/SetorChip.tsx
import { Building2 } from "lucide-react";
import React from "react";

type Props = {
  /** Nome do setor */
  nome?: string | null;
};

/**
 * Exibe o nome de um setor formatado como um chip com ícone.
 */
export default function SetorChip({ nome }: Props) {
  if (!nome) return <span className="text-muted-foreground">—</span>;

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-0.5 text-xs">
      <Building2 className="size-3" /> {nome}
    </span>
  );
}
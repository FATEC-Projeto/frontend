import { cx } from '../../../utils/cx'

type StatusSugestao = "NAO_RESPONDIDO" | "RESPONDIDO";

type Props = {
  status: StatusSugestao;
};

/**
 * Badge padronizado para o status da Caixa de Sugestões.
 * NÃO RESPONDIDO -> vermelho | RESPONDIDO -> verde
 */
export default function SugestaoStatusBadge({ status }: Readonly<Props>) {
  const map: Record<StatusSugestao, { label: string; cls: string }> = {
    NAO_RESPONDIDO: {
      label: "Não respondido",
      cls: "bg-[var(--destructive)]/12 text-[var(--destructive)] border-[var(--destructive)]/30",
    },
    RESPONDIDO: {
      label: "Respondido",
      cls: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30",
    },
  };

  const v = map[status] || { label: status, cls: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]" };

  return (
    <span className={cx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border", v.cls)}>
      {v.label}
    </span>
  );
}
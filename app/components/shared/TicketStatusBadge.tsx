import { cx } from '../../../utils/cx' // (Ajuste o caminho se necessário)

// Definimos o tipo de Status aqui.
// (Idealmente, isso viria de um arquivo de tipos compartilhado no frontend)
type Status =
  | "ABERTO"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "RESOLVIDO"
  | "ENCERRADO";

type Props = {
  status: Status;
};

/**
 * Badge padronizado para exibir o status de uma solicitação acadêmica.
 */
export default function TicketStatusBadge({ status }: Props) {
  // Mapeamento centralizado de cores e textos
  const map: Record<Status, { label: string; cls: string }> = {
    ABERTO: {
      label: "Solicitação recebida pela Fatec.",
      cls: "bg-[var(--brand-cyan)]/12 text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30",
    },
    EM_ATENDIMENTO: {
      label: "Em análise pelo setor responsável.",
      cls: "bg-[var(--brand-teal)]/12 text-[var(--brand-teal)] border-[var(--brand-teal)]/30",
    },
    AGUARDANDO_USUARIO: {
      label: "Aguardando documento ou resposta do aluno.",
      cls: "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/30",
    },
    RESOLVIDO: {
      label: "Solicitação respondida.",
      cls: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30",
    },
    ENCERRADO: {
      label: "Atendimento finalizado.",
      cls: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]",
    },
  };

  // Fallback para status inesperado
  const v = map[status] || { label: status, cls: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]" };

  return (
    <span className={cx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border", v.cls)}>
      {v.label}
    </span>
  );
}
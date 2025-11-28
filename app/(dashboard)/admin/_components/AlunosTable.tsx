import Link from "next/link";
import { Mail, IdCard, User as UserIcon, Loader2 } from "lucide-react";
import { cx } from "../../../../utils/cx";

type StatusAtivo = "ATIVO" | "INATIVO";
type AlunoRow = {
  id: string;
  ra: string;
  emailEducacional: string;
  nome?: string | null;
  status: StatusAtivo;
  criadoEm: string;
};

function StatusBadge({ status }: { status: StatusAtivo }) {
  const map: Record<StatusAtivo, string> = {
    ATIVO: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30",
    INATIVO: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]",
  };
  const label = status === "ATIVO" ? "Ativo" : "Inativo";
  return (
    <span className={cx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border", map[status])}>
      {label}
    </span>
  );
}

const ALUNO_DETAIL_PREFIX = "/admin/alunos/";

type Props = {
  loading: boolean;
  visibleRows: AlunoRow[];
  total: number;
  page: number;
  perPage: number;
  error: string | null;
  selectedIds: Set<string>;
  toggleSelectAllVisible: (checked: boolean) => void;
  toggleSelectOne: (id: string, checked: boolean) => void;
  setPage: (page: number) => void;
};

export default function AlunosTable({
  loading, visibleRows, total, page, perPage, error, selectedIds,
  toggleSelectAllVisible, toggleSelectOne, setPage,
}: Props) {

  // Lógica de seleção
  const hasSelected = selectedIds.size > 0;
  const allVisibleSelected =
    visibleRows.length > 0 &&
    visibleRows.every((r) => selectedIds.has(r.id));
  
  const prevEnabled = page > 1;
  const nextEnabled = total ? page * perPage < total : visibleRows.length === perPage;
  
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--muted)] text-foreground/90">
            <tr>
              {/* checkbox header */}
              <th className="px-3 py-3 w-8">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--border)]"
                  checked={allVisibleSelected}
                  onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                  aria-label="Selecionar todos desta página"
                  disabled={loading || visibleRows.length === 0}
                />
              </th>
              <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">RA</th>
              <th className="text-left font-medium px-4 py-3">E-mail educacional</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Nome (opcional)</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Criado em</th>
              <th className="text-right font-medium px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  <Loader2 className="size-4 animate-spin inline-block mr-2" /> Carregando...
                </td>
              </tr>
            )}

            {!loading &&
              visibleRows.map((a) => (
                <tr key={a.id} className="border-t border-[var(--border)]">
                  {/* checkbox da linha */}
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[var(--border)]"
                      checked={selectedIds.has(a.id)}
                      onChange={(e) => toggleSelectOne(a.id, e.target.checked)}
                      aria-label={`Selecionar aluno RA ${a.ra}`}
                    />
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="inline-flex items-center gap-2">
                      <IdCard className="size-4 text-muted-foreground" />
                      <span className="font-medium">{a.ra || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <span>{a.emailEducacional}</span>
                    </div>
                    <div className="md:hidden text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <UserIcon className="size-3" />
                      <span>{a.nome || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="inline-flex items-center gap-2">
                      <UserIcon className="size-4 text-muted-foreground" />
                      <span>{a.nome || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {new Date(a.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`${ALUNO_DETAIL_PREFIX}${a.id}`} className="h-9 px-3 rounded-md hover:bg-[var(--muted)]">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}

            {!loading && visibleRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  {error ? "Falha ao carregar dados." : "Nenhum aluno encontrado com os filtros atuais."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer (paginação) */}
      <div className="flex items-center justify-between p-3 text-xs text-muted-foreground border-t border-[var(--border)]">
        <div>
          {total ? (
            <>Mostrando {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} de {total}</>
          ) : (
            <>Mostrando {visibleRows.length}{visibleRows.length === perPage ? "+" : ""}</>
          )}
        </div>
        <div className="inline-flex items-center gap-1">
          <button
            className={cx("h-8 px-2 rounded-md", prevEnabled ? "hover:bg-[var(--muted)]" : "opacity-50 cursor-not-allowed")}
            disabled={!prevEnabled}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <button
            className={cx("h-8 px-2 rounded-md", nextEnabled ? "hover:bg-[var(--muted)]" : "opacity-50 cursor-not-allowed")}
            disabled={!nextEnabled}
            onClick={() => setPage(page + 1)}
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
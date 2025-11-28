import { Search, Filter, Plus, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { cx } from "../../../../utils/cx";

type StatusAtivo = "ATIVO" | "INATIVO";

type Props = {
  q: string;
  setQ: (q: string) => void;
  status: StatusAtivo | "ALL";
  setStatus: (status: StatusAtivo | "ALL") => void;
  hasSelected: boolean;
  deleting: boolean;
  selectedCount: number;
  onCadastrarClick: () => void;
  onImportClick: () => void;
  onExportCsvClick: () => void;
  onDeleteSelected: () => void;
};

export default function AlunosToolbar({
  q, setQ, status, setStatus, hasSelected, deleting, selectedCount,
  onCadastrarClick, onImportClick, onExportCsvClick, onDeleteSelected
}: Props) {
  
  function baixarModeloCSV() {
    const headers = [
      "ra", "emailEducacional", "nome", "emailPessoal", "cursoNome", "cursoSigla", "ativo",
    ];
    const exemploMinimo = [
      "123456", "joao.silva@fatec.sp.gov.br", "", "", "", "", "",
    ];
    const exemploCompleto = [
      "654321", "maria.souza@fatec.sp.gov.br", "Maria Souza", "maria.souza@gmail.com", "Desenvolvimento de Software Multiplataforma", "DSM", "TRUE",
    ];

    const rows = [headers, exemploMinimo, exemploCompleto]
      .map((r) => r.map((cell) => {
            const v = String(cell ?? "");
            return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          }).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${rows}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "modelo_alunos_primeiro_acesso.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Ações à esquerda */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCadastrarClick}
            className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95"
            title="Cadastrar aluno (RA + e-mail educacional)"
          >
            <Plus className="size-4" /> Cadastrar aluno
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-sm hover:bg-[var(--muted)]"
            title="Importar CSV"
          >
            <Upload className="size-4" /> Importar planilha
          </button>
          <button
            type="button"
            onClick={baixarModeloCSV}
            className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-sm hover:bg-[var(--muted)]"
            title="Baixar modelo CSV (mínimo)"
          >
            <Download className="size-4" /> Modelo CSV
          </button>

          {/* botão de excluir em massa */}
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={!hasSelected || deleting}
            className={cx(
              "inline-flex items-center gap-2 h-10 px-3 rounded-lg border text-sm",
              hasSelected && !deleting
                ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                : "border-[var(--border)] text-muted-foreground opacity-60 cursor-not-allowed",
            )}
            title={hasSelected ? `Excluir ${selectedCount} aluno(s) selecionado(s)` : "Selecione pelo menos um aluno para excluir"}
          >
            <Trash2 className="size-4" />
            {deleting ? "Excluindo..." : `Excluir (${selectedCount})`}
          </button>
        </div>

        {/* Filtros à direita */}
        <div className="flex w-full sm:w-auto flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-[320px]">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Buscar por RA, e-mail educacional ou nome"
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Filter className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                className="h-10 w-[160px] pl-9 pr-8 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="ALL">Todos</option>
                <option value="ATIVO">Ativos</option>
                <option value="INATIVO">Inativos</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
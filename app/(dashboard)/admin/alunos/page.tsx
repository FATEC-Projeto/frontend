"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  Mail,
  IdCard,
  User as UserIcon,
  Trash2, // 👈 novo
} from "lucide-react";

import FormAlunoCreate from "./../_components/FormAlunoCreate";
import ImportAlunos from "./../_components/ImportAlunos";

import { cx } from '../../../../utils/cx'

/* ========= Tipos ========= */
type Papel = "USUARIO" | "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";
type StatusAtivo = "ATIVO" | "INATIVO";

type Usuario = {
  id: string;
  nome: string | null;
  emailPessoal: string;
  emailEducacional: string | null;
  ra: string | null;
  ativo: boolean;
  criadoEm: string; // ISO
  papel?: Papel | null; // pode vir ausente do backend
};

type AlunoRow = {
  id: string;
  ra: string;
  emailEducacional: string;
  nome?: string | null;
  status: StatusAtivo;
  criadoEm: string;
};

/* ========= ENV ========= */
/* ========= ENV ========= */
const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

const USERS_PATH = process.env.NEXT_PUBLIC_USERS_PATH ?? "/auth/usuarios";

// detalhe do aluno
const ALUNO_DETAIL_PREFIX = "/admin/alunos/";

/* ========= Utils ========= 
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}*/

function StatusBadge({ status }: { status: StatusAtivo }) {
  const map: Record<StatusAtivo, string> = {
    ATIVO: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30",
    INATIVO: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]",
  };
  const label = status === "ATIVO" ? "Ativo" : "Inativo";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border",
        map[status],
      )}
    >
      {label}
    </span>
  );
}

/* ========= Página ========= */
export default function AdminAlunosPage() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusAtivo | "ALL">("ALL");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AlunoRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<null | string>(null);

  // seleção em massa
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // paginação simples
  const [page, setPage] = useState(1);
  const perPage = 20;

  async function fetchAlunos() {
    try {
      setLoading(true);
      setError(null);

      const token =
        (typeof window !== "undefined" && localStorage.getItem("accessToken")) ||
        process.env.NEXT_PUBLIC_ACCESS_TOKEN ||
        "";

      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const qs = new URLSearchParams();
      // ainda enviamos a intenção para o backend (caso ele já suporte)
      qs.set("papel", "USUARIO");
      if (q) qs.set("search", q);
      if (status !== "ALL") qs.set("ativo", String(status === "ATIVO"));
      qs.set("page", String(page));
      qs.set("perPage", String(perPage));

      // tenta USERS_PATH; se falhar, tenta /usuarios
      let res = await fetch(`${API_URL}${USERS_PATH}?${qs}`, {
        headers,
        cache: "no-store",
      });
      if (!res.ok) {
        const fallback = USERS_PATH === "/usuarios" ? "/auth/usuarios" : "/usuarios";
        const res2 = await fetch(`${API_URL}${fallback}?${qs}`, {
          headers,
          cache: "no-store",
        });
        if (!res2.ok) {
          const text = await res2.text().catch(() => "");
          throw new Error(text || `Falha ao buscar alunos (${res2.status})`);
        }
        res = res2;
      }

      const json = await res.json();
      const usuarios: Usuario[] = Array.isArray(json) ? json : json.data ?? [];

      // === FILTRO CLIENT-SIDE: somente alunos ===
      // Regra: é aluno se papel === "USUARIO" OU se papel estiver ausente/null.
      const alunosApenas = usuarios.filter((u) => (u.papel ?? "USUARIO") === "USUARIO");

      const mapped: AlunoRow[] = alunosApenas.map((u) => ({
        id: u.id,
        ra: u.ra ?? "",
        emailEducacional: u.emailEducacional ?? u.emailPessoal,
        nome: u.nome,
        status: u.ativo ? "ATIVO" : "INATIVO",
        criadoEm: u.criadoEm,
      }));

      const totalCount: number = Array.isArray(json)
        ? alunosApenas.length
        : typeof json.total === "number"
        ? json.total
        : alunosApenas.length;

      setRows(mapped);
      setTotal(totalCount);
      // ao recarregar, limpa seleção (pra não ficar com IDs de outra página / filtro)
      setSelectedIds(new Set());
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : String(e);
      setRows([]);
      setTotal(0);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlunos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, page]);

  function baixarModeloCSV() {
    // - OBRIGATÓRIOS: ra, emailEducacional
    // - OPCIONAIS: nome, emailPessoal, cursoNome, cursoSigla, ativo
    const headers = [
      "ra",
      "emailEducacional",
      "nome",
      "emailPessoal",
      "cursoNome",
      "cursoSigla",
      "ativo",
    ];

    const exemploMinimo = [
      "123456",
      "joao.silva@fatec.sp.gov.br",
      "",
      "",
      "",
      "",
      "",
    ];

    const exemploCompleto = [
      "654321",
      "maria.souza@fatec.sp.gov.br",
      "Maria Souza",
      "maria.souza@gmail.com",
      "Desenvolvimento de Software Multiplataforma",
      "DSM",
      "TRUE",
    ];

    const rows = [headers, exemploMinimo, exemploCompleto]
      .map((r) =>
        r
          .map((cell) => {
            const v = String(cell ?? "");
            return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${rows}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_alunos_primeiro_acesso.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const prevEnabled = page > 1;
  const nextEnabled = total ? page * perPage < total : rows.length === perPage;

  const visibleRows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((a) => {
      const matchQ =
        !query ||
        (a.ra && a.ra.toLowerCase().includes(query)) ||
        a.emailEducacional.toLowerCase().includes(query) ||
        (a.nome?.toLowerCase().includes(query) ?? false);
      const matchStatus = status === "ALL" || a.status === status;
      return matchQ && matchStatus;
    });
  }, [rows, q, status]);

  // ===== seleção derivada =====
  const hasSelected = selectedIds.size > 0;
  const allVisibleSelected =
    visibleRows.length > 0 &&
    visibleRows.every((r) => selectedIds.has(r.id));

  function toggleSelectAllVisible(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        visibleRows.forEach((r) => next.add(r.id));
      } else {
        visibleRows.forEach((r) => next.delete(r.id));
      }
      return next;
    });
  }

  function toggleSelectOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (!hasSelected) return;
    const count = selectedIds.size;

    const confirmMsg =
      count === 1
        ? "Tem certeza que deseja excluir este aluno?"
        : `Tem certeza que deseja excluir ${count} alunos?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setDeleting(true);

      const token =
        (typeof window !== "undefined" && localStorage.getItem("accessToken")) ||
        process.env.NEXT_PUBLIC_ACCESS_TOKEN ||
        "";

      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const idsArray = Array.from(selectedIds);

      const results = await Promise.allSettled(
        idsArray.map((id) =>
          // 👇 ajuste essa rota se o seu backend usar outro padrão (ex.: /auth/usuarios/:id ou /usuarios/:id/soft)
          fetch(`${API_URL}/usuarios/${id}`, {
            method: "DELETE",
            headers,
          }),
        ),
      );

      const failed = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.ok),
      );

      if (failed.length) {
        alert(
          `Alguns registros não puderam ser excluídos (${failed.length}/${idsArray.length}).`,
        );
      }

      setSelectedIds(new Set());
      setPage(1);
      fetchAlunos();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir alunos selecionados.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-[var(--border)] bg-red-50 text-red-800 px-4 py-3">
          <div className="font-medium">Erro ao carregar alunos</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* ===== Modal: Importar CSV ===== */}
      {showImport && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowImport(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-[880px] -translate-x-1/2 -translate-y-1/2 bg-background rounded-xl shadow-xl border border-[var(--border)] p-4">
            <ImportAlunos
              onClose={() => setShowImport(false)}
              onDone={() => {
                setShowImport(false);
                setPage(1);
                fetchAlunos();
              }}
            />
          </div>
        </div>
      )}

      {/* ===== Form inline (toggle) ===== */}
      {showForm ? (
        <div className="rounded-xl border border-[var(--border)] bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Cadastrar novo aluno</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm border px-3 h-8 rounded-md hover:bg-[var(--muted)]"
            >
              ← Voltar
            </button>
          </div>
          <FormAlunoCreate
            onSuccess={() => {
              setShowForm(false);
              setPage(1);
              fetchAlunos();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <>
          {/* ===== Toolbar ===== */}
          <div className="rounded-xl border border-[var(--border)] bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Ações à esquerda */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95"
                  title="Cadastrar aluno (RA + e-mail educacional)"
                >
                  <Plus className="size-4" />
                  Cadastrar aluno
                </button>
                <button
                  type="button"
                  onClick={() => setShowImport(true)}
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-sm hover:bg-[var(--muted)]"
                  title="Importar CSV"
                >
                  <Upload className="size-4" />
                  Importar planilha
                </button>
                <button
                  type="button"
                  onClick={baixarModeloCSV}
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-sm hover:bg-[var(--muted)]"
                  title="Baixar modelo CSV (mínimo)"
                >
                  <Download className="size-4" />
                  Modelo CSV
                </button>

                {/* 👇 botão de excluir em massa */}
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={!hasSelected || deleting}
                  className={cx(
                    "inline-flex items-center gap-2 h-10 px-3 rounded-lg border text-sm",
                    hasSelected && !deleting
                      ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                      : "border-[var(--border)] text-muted-foreground opacity-60 cursor-not-allowed",
                  )}
                  title={
                    hasSelected
                      ? "Excluir alunos selecionados"
                      : "Selecione pelo menos um aluno para excluir"
                  }
                >
                  <Trash2 className="size-4" />
                  {deleting ? "Excluindo..." : "Excluir selecionados"}
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
                    onChange={(e) => {
                      setPage(1);
                      setQ(e.target.value);
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <Filter className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      className="h-10 w-[160px] pl-9 pr-8 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      value={status}
                      onChange={(e) => {
                        setPage(1);
                        setStatus(e.target.value as any);
                      }}
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

          {/* ===== Tabela ===== */}
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
                      />
                    </th>
                    <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">
                      RA
                    </th>
                    <th className="text-left font-medium px-4 py-3">
                      E-mail educacional
                    </th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">
                      Nome (opcional)
                    </th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">
                      Criado em
                    </th>
                    <th className="text-right font-medium px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        Carregando...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    visibleRows.map((a) => (
                      <tr
                        key={a.id}
                        className="border-t border-[var(--border)]"
                      >
                        {/* checkbox da linha */}
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[var(--border)]"
                            checked={selectedIds.has(a.id)}
                            onChange={(e) =>
                              toggleSelectOne(a.id, e.target.checked)
                            }
                            aria-label={`Selecionar aluno RA ${a.ra}`}
                          />
                        </td>

                        <td className="px-4 py-3 hidden xl:table-cell">
                          <div className="inline-flex items-center gap-2">
                            <IdCard className="size-4 text-muted-foreground" />
                            <span className="font-medium">
                              {a.ra || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="size-4 text-muted-foreground" />
                            <span>{a.emailEducacional}</span>
                          </div>
                          {/* Nome no mobile */}
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

                        <td className="px-4 py-3">
                          <StatusBadge status={a.status} />
                        </td>

                        <td className="px-4 py-3 hidden lg:table-cell">
                          {new Date(a.criadoEm).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`${ALUNO_DETAIL_PREFIX}${a.id}`}
                            className="h-9 px-3 rounded-md hover:bg-[var(--muted)]"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}

                  {!loading && visibleRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        {error
                          ? "Falha ao carregar dados."
                          : "Nenhum aluno encontrado com os filtros atuais."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ===== Footer (paginação) ===== */}
            <div className="flex items-center justify-between p-3 text-xs text-muted-foreground border-t border-[var(--border)]">
              <div>
                {total ? (
                  <>
                    Mostrando {(page - 1) * perPage + 1}-
                    {Math.min(page * perPage, total)} de {total}
                  </>
                ) : (
                  <>
                    Mostrando {visibleRows.length}
                    {visibleRows.length === perPage ? "+" : ""}
                  </>
                )}
              </div>
              <div className="inline-flex items-center gap-1">
                <button
                  className={cx(
                    "h-8 px-2 rounded-md",
                    prevEnabled
                      ? "hover:bg-[var(--muted)]"
                      : "opacity-50 cursor-not-allowed",
                  )}
                  disabled={!prevEnabled}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>

                <button
                  className={cx(
                    "h-8 px-2 rounded-md",
                    nextEnabled
                      ? "hover:bg-[var(--muted)]"
                      : "opacity-50 cursor-not-allowed",
                  )}
                  disabled={!nextEnabled}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

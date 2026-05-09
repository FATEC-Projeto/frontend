"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search, Filter, Plus, Upload, Download,
  Mail, BadgeCheck, Building2, User as UserIcon
} from "lucide-react";
import { apiFetch } from "../../../../utils/api";
import { cx } from '../../../../utils/cx';

type Papel = "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR" | "USUARIO";
type StatusAtivo = "ATIVO" | "INATIVO";

type UsuarioApi = {
  id: string;
  nome: string | null;
  emailPessoal: string | null;
  emailEducacional: string | null;
  ra: string | null;
  papel?: Papel | null;
  papeis?: Papel[] | null;
  setores?: Array<{ nome: string }> | string[] | null;
  ativo: boolean;
  criadoEm: string;
};

type FuncionarioRow = {
  id: string;
  emailEducacional: string;
  emailPessoal?: string | null;
  nome?: string | null;
  papel: Exclude<Papel, "USUARIO">;
  setores: string[];
  status: StatusAtivo;
  criadoEm: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const FUNC_DETAIL_PREFIX = "/admin/funcionarios";

function StatusBadge({ status }: { status: StatusAtivo }) {
  const map: Record<StatusAtivo, string> = {
    ATIVO: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30",
    INATIVO: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]",
  };
  return (
    <span className={cx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border", map[status])}>
      {status === "ATIVO" ? "Ativo" : "Inativo"}
    </span>
  );
}

function normalizarSetores(s?: UsuarioApi["setores"]): string[] {
  if (!s || !Array.isArray(s) || s.length === 0) return [];
  if (typeof s[0] === "string") return s as string[];
  return (s as Array<{ nome: string }>).map((x) => x?.nome).filter(Boolean) as string[];
}

function extrairPapel(u: UsuarioApi): Papel | null {
  if (u.papel) return u.papel;
  if (u.papeis && u.papeis.length) return u.papeis[0]!;
  return null;
}

function mapRow(u: UsuarioApi): FuncionarioRow | null {
  const p = extrairPapel(u);
  if (!p || p === "USUARIO") return null;
  return {
    id: u.id,
    emailEducacional: u.emailEducacional ?? u.emailPessoal ?? "",
    emailPessoal: u.emailPessoal ?? null,
    nome: u.nome ?? null,
    papel: p as Exclude<Papel, "USUARIO">,
    setores: normalizarSetores(u.setores),
    status: u.ativo ? "ATIVO" : "INATIVO",
    criadoEm: u.criadoEm,
  };
}

export default function AdminFuncionariosPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusAtivo | "ALL">("ALL");
  const [papel, setPapel] = useState<Exclude<Papel, "USUARIO"> | "ALL">("ALL");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FuncionarioRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<null | string>(null);

  const [page, setPage] = useState(1);
  const perPage = 20;

  const fileRef = useRef<HTMLInputElement | null>(null);

  async function fetchFuncionarios() {
    try {
      setLoading(true);
      setError(null);

      const qs = new URLSearchParams();
      if (q) qs.set("search", q);
      if (status !== "ALL") qs.set("ativo", String(status === "ATIVO"));
      qs.set("page", String(page));
      qs.set("perPage", String(perPage));

      const res = await apiFetch(`${API_URL}/usuarios?${qs}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Falha ao buscar funcionários (${res.status})`);
      }

      const json = await res.json();
      const usuarios: UsuarioApi[] = Array.isArray(json)
        ? json
        : (json.items ?? json.data ?? []);

      const mapped = usuarios.map(mapRow).filter((x): x is FuncionarioRow => !!x);
      setRows(mapped);
      setTotal(mapped.length);
    } catch (e: unknown) {
      setRows([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFuncionarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, page]);

  const visibleRows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((f) => {
      const matchQ =
        !query ||
        f.emailEducacional.toLowerCase().includes(query) ||
        (f.emailPessoal?.toLowerCase().includes(query) ?? false) ||
        (f.nome?.toLowerCase().includes(query) ?? false) ||
        f.setores.some((s) => s.toLowerCase().includes(query));
      const matchStatus = status === "ALL" || f.status === status;
      const matchPapel = papel === "ALL" || f.papel === papel;
      return matchQ && matchStatus && matchPapel;
    });
  }, [rows, q, status, papel]);

  const prevEnabled = page > 1;
  const nextEnabled = total ? page * perPage < total : rows.length === perPage;

  function onImportClick() { fileRef.current?.click(); }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(`Planilha selecionada: ${file.name}`);
    e.target.value = "";
  }

  function baixarModeloCSV() {
    const headers = ["emailEducacional", "emailPessoal", "nome", "papel", "setores", "status"];
    const exemplo = ["nome.sobrenome@fatec.sp.gov.br", "nome.sobrenome@gmail.com", "Nome Sobrenome", "TECNICO", "TI Acadêmica", "ATIVO"];
    const csv = [headers.join(","), exemplo.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modelo_funcionarios.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-[var(--border)] bg-red-50 text-red-800 px-4 py-3">
          <div className="font-medium">Erro ao carregar funcionários</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Toolbar */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Link
              href="/admin/funcionarios/novo"
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95"
            >
              <Plus className="size-4" /> Cadastrar funcionário
            </Link>
            <button type="button" onClick={onImportClick}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-sm hover:bg-[var(--muted)]">
              <Upload className="size-4" /> Importar planilha
            </button>
            <button type="button" onClick={baixarModeloCSV}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-sm hover:bg-[var(--muted)]">
              <Download className="size-4" /> Modelo CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={onFileChange} />
          </div>

          <div className="flex w-full sm:w-auto flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-[320px]">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Buscar por e-mail, nome, setor…"
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={q}
                onChange={(e) => { setPage(1); setQ(e.target.value); }}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  className="h-10 w-[200px] pl-9 pr-8 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={papel}
                  onChange={(e) => { setPage(1); setPapel(e.target.value as any); }}
                >
                  <option value="ALL">Todos os papéis</option>
                  <option value="BACKOFFICE">Backoffice</option>
                  <option value="TECNICO">Técnico</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>
              <select
                className="h-10 w-[160px] px-3 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={status}
                onChange={(e) => { setPage(1); setStatus(e.target.value as any); }}
              >
                <option value="ALL">Todos</option>
                <option value="ATIVO">Ativos</option>
                <option value="INATIVO">Inativos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--muted)] text-foreground/90">
              <tr>
                <th className="text-left font-medium px-4 py-3">Nome</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">E-mail institucional</th>
                <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">Papéis / Setores</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Criado em</th>
                <th className="text-right font-medium px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {!loading && visibleRows.map((f) => (
                <tr key={f.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserIcon className="size-4 text-muted-foreground" />
                      <span className="font-medium">{f.nome || "—"}</span>
                    </div>
                    <div className="lg:hidden text-xs text-muted-foreground mt-0.5">{f.emailEducacional || f.emailPessoal || "—"}</div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">{f.emailEducacional || f.emailPessoal || "—"}</td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-0.5 text-xs">
                        <BadgeCheck className="size-3" /> {f.papel}
                      </span>
                      {f.setores.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-0.5 text-xs">
                          <Building2 className="size-3" /> {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {new Date(f.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`${FUNC_DETAIL_PREFIX}/${encodeURIComponent(f.id)}`} className="h-9 px-3 rounded-md hover:bg-[var(--muted)]">Ver</Link>
                  </td>
                </tr>
              ))}
              {!loading && visibleRows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {error ? "Falha ao carregar dados." : "Nenhum funcionário encontrado com os filtros atuais."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3 text-xs text-muted-foreground border-t border-[var(--border)]">
          <div>
            {total
              ? <>Mostrando {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} de {total}</>
              : <>Mostrando {visibleRows.length}{visibleRows.length === perPage ? "+" : ""}</>}
          </div>
          <div className="inline-flex items-center gap-1">
            <button className={cx("h-8 px-2 rounded-md", prevEnabled ? "hover:bg-[var(--muted)]" : "opacity-50 cursor-not-allowed")}
              disabled={!prevEnabled} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</button>
            <button className={cx("h-8 px-2 rounded-md", nextEnabled ? "hover:bg-[var(--muted)]" : "opacity-50 cursor-not-allowed")}
              disabled={!nextEnabled} onClick={() => setPage((p) => p + 1)}>Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

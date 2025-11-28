"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import FormAlunoCreate from "./../_components/FormAlunoCreate";
import ImportAlunos from "./../_components/ImportAlunos";
import AlunosTable from "./../_components/AlunosTable"; 
import AlunosToolbar from "./../_components/AlunosToolbar"; 

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
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3333";
const USERS_PATH = process.env.NEXT_PUBLIC_USERS_PATH ?? "/auth/usuarios"; 

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
      qs.set("papel", "USUARIO");
      if (q) qs.set("search", q);
      if (status !== "ALL") qs.set("ativo", String(status === "ATIVO"));
      qs.set("page", String(page));
      qs.set("perPage", String(perPage));

      let res = await fetch(`${API_URL}${USERS_PATH}?${qs}`, { headers, cache: "no-store" });
      if (!res.ok) {
        const fallback = USERS_PATH === "/usuarios" ? "/auth/usuarios" : "/usuarios";
        const res2 = await fetch(`${API_URL}${fallback}?${qs}`, { headers, cache: "no-store" });
        if (!res2.ok) {
          const text = await res2.text().catch(() => "");
          throw new Error(text || `Falha ao buscar alunos (${res2.status})`);
        }
        res = res2;
      }

      const json = await res.json();
      const usuarios: Usuario[] = Array.isArray(json) ? json : json.data ?? [];

      const alunosApenas = usuarios.filter((u) => (u.papel ?? "USUARIO") === "USUARIO" && !!u.ra);

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

  // Efeito para carregar dados
  useEffect(() => {
    fetchAlunos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, page]);

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

  const hasSelected = selectedIds.size > 0;

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

      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const idsArray = Array.from(selectedIds);

      const results = await Promise.allSettled(
        idsArray.map((id) =>
          fetch(`${API_URL}/usuarios/${id}`, {
            method: "DELETE",
            headers,
          }),
        ),
      );

      const failed = results.filter(
        (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)
      );

      if (failed.length) {
        toast.error(`Alguns registros não puderam ser excluídos (${failed.length}/${idsArray.length}).`);
      } else {
        toast.success(`Excluídos ${idsArray.length} aluno(s) com sucesso!`);
      }

      setSelectedIds(new Set());
      setPage(1);
      fetchAlunos();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir alunos selecionados.");
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
          <AlunosToolbar
            q={q}
            setQ={(newQ) => { setPage(1); setQ(newQ); }}
            status={status}
            setStatus={(newStatus) => { setPage(1); setStatus(newStatus); }}
            hasSelected={hasSelected}
            deleting={deleting}
            selectedCount={selectedIds.size}
            onCadastrarClick={() => setShowForm(true)}
            onImportClick={() => setShowImport(true)}
            onExportCsvClick={() => {}}
            onDeleteSelected={handleDeleteSelected}
          />
          
          {/* ===== Tabela ===== */}
          <AlunosTable
            loading={loading}
            visibleRows={visibleRows}
            total={total}
            page={page}
            perPage={perPage}
            error={error}
            selectedIds={selectedIds}
            toggleSelectAllVisible={toggleSelectAllVisible}
            toggleSelectOne={toggleSelectOne}
            setPage={setPage}
          />
        </>
      )}
    </div>
  );
}
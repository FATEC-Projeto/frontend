"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search, Filter, Plus, Upload, Download,
  Mail, IdCard, User as UserIcon
} from "lucide-react";

type StatusAtivo = "ATIVO" | "INATIVO";

type Aluno = {
  id: string;
  ra: string;
  emailEducacional: string;
  // opcionais (preenchidos depois)
  nome?: string | null;
  status: StatusAtivo;
  criadoEm: string; // ISO
};

const MOCK: Aluno[] = [
  {
    id: "a1",
    ra: "123456",
    emailEducacional: "joao.silva@fatec.sp.gov.br",
    nome: "João Silva",
    status: "ATIVO",
    criadoEm: "2025-10-12T14:21:00Z",
  },
  {
    id: "a2",
    ra: "654321",
    emailEducacional: "maria.souza@fatec.sp.gov.br",
    nome: null,
    status: "ATIVO",
    criadoEm: "2025-10-10T09:05:00Z",
  },
  {
    id: "a3",
    ra: "777222",
    emailEducacional: "carlos.lima@fatec.sp.gov.br",
    nome: "Carlos Lima",
    status: "INATIVO",
    criadoEm: "2025-09-30T11:40:00Z",
  },
];

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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

export default function AdminAlunosPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusAtivo | "ALL">("ALL");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const alunos = useMemo(() => {
    return MOCK.filter(a => {
      const matchQ =
        !q ||
        a.ra.toLowerCase().includes(q.toLowerCase()) ||
        a.emailEducacional.toLowerCase().includes(q.toLowerCase()) ||
        (a.nome?.toLowerCase().includes(q.toLowerCase()) ?? false);
      const matchStatus = status === "ALL" || a.status === status;
      return matchQ && matchStatus;
    });
  }, [q, status]);

  function onImportClick() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: enviar para backend (Fastify) em /admin/alunos/import
    // const form = new FormData(); form.append("file", file);
    // await fetch("/api/admin/alunos/import", { method: "POST", body: form, headers: { Authorization: `Bearer ...` } });
    alert(`Planilha selecionada: ${file.name}`);
    e.target.value = "";
  }

  function baixarModeloCSV() {
    // modelo mínimo: RA e e-mail institucional
    const headers = ["ra", "emailEducacional"];
    const exemplo = ["123456", "nome.sobrenome@fatec.sp.gov.br"];
    const csv = [headers.join(","), exemplo.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_alunos_minimo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Esquerda: ações */}
          <div className="flex gap-2">
            <Link
              href="/admin/alunos/novo"
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95"
              title="Cadastrar aluno (RA + e-mail educacional)"
            >
              <Plus className="size-4" />
              Cadastrar aluno
            </Link>
            <button
              type="button"
              onClick={onImportClick}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-sm hover:bg-[var(--muted)]"
              title="Importar planilha (.csv / .xlsx)"
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
            <input
              ref={fileRef}
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {/* Direita: busca e filtro */}
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

      {/* Tabela */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--muted)] text-foreground/90">
              <tr>
                <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">RA</th>
                <th className="text-left font-medium px-4 py-3">E-mail educacional</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Nome (opcional)</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Criado em</th>
                <th className="text-right font-medium px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((a) => (
                <tr key={a.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="inline-flex items-center gap-2">
                      <IdCard className="size-4 text-muted-foreground" />
                      <span className="font-medium">{a.ra}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <span>{a.emailEducacional}</span>
                    </div>
                    {/* Nome visível no mobile abaixo do e-mail */}
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
                    <div className="inline-flex items-center gap-1">
                      <Link href={`/admin/alunos/${a.id}`} className="h-9 px-3 rounded-md hover:bg-[var(--muted)]">
                        Ver
                      </Link>
                      <Link href={`/admin/alunos/${a.id}/editar`} className="h-9 px-3 rounded-md hover:bg-[var(--muted)]">
                        Editar
                      </Link>
                      {a.status === "ATIVO" ? (
                        <button className="h-9 px-3 rounded-md hover:bg-[var(--muted)] text-[var(--brand-red)]">
                          Desativar
                        </button>
                      ) : (
                        <button className="h-9 px-3 rounded-md hover:bg-[var(--muted)] text-[var(--success)]">
                          Reativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {alunos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer (paginaçao placeholder) */}
        <div className="flex items-center justify-between p-3 text-xs text-muted-foreground border-t border-[var(--border)]">
          <div>Mostrando {alunos.length} de {MOCK.length}</div>
          <div className="inline-flex items-center gap-1">
            <button className="h-8 px-2 rounded-md hover:bg-[var(--muted)]">Anterior</button>
            <button className="h-8 px-2 rounded-md hover:bg-[var(--muted)]">Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

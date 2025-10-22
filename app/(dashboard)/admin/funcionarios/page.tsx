"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search, Filter, Plus, Upload, Download,
  Mail, BadgeCheck, Building2, User as UserIcon
} from "lucide-react";

type Papel = "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";
type StatusAtivo = "ATIVO" | "INATIVO";

type Funcionario = {
  id: string;
  // sem RA aqui!
  emailEducacional: string;
  emailPessoal?: string | null;
  nome?: string | null;
  papel: Papel;
  setores: string[];
  status: StatusAtivo;
  criadoEm: string; // ISO
};

const MOCK: Funcionario[] = [
  {
    id: "f1",
    emailEducacional: "ana.pereira@fatec.sp.gov.br",
    emailPessoal: "ana.pereira@gmail.com",
    nome: "Ana Pereira",
    papel: "ADMINISTRADOR",
    setores: ["Secretaria", "Financeiro"],
    status: "ATIVO",
    criadoEm: "2025-10-12T14:21:00Z",
  },
  {
    id: "f2",
    emailEducacional: "bruno.santos@fatec.sp.gov.br",
    emailPessoal: null,
    nome: "Bruno Santos",
    papel: "TECNICO",
    setores: ["TI Acadêmica"],
    status: "ATIVO",
    criadoEm: "2025-10-10T09:05:00Z",
  },
  {
    id: "f3",
    emailEducacional: "carla.mendes@fatec.sp.gov.br",
    emailPessoal: "carla.mendes@hotmail.com",
    nome: "Carla Mendes",
    papel: "BACKOFFICE",
    setores: ["Secretaria"],
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

export default function AdminFuncionariosPage() {
  const [q, setQ] = useState("");
  const [papel, setPapel] = useState<Papel | "ALL">("ALL");
  const [status, setStatus] = useState<StatusAtivo | "ALL">("ALL");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const funcionarios = useMemo(() => {
    return MOCK.filter((f) => {
      const matchQ =
        !q ||
        f.emailEducacional.toLowerCase().includes(q.toLowerCase()) ||
        (f.emailPessoal?.toLowerCase().includes(q.toLowerCase()) ?? false) ||
        (f.nome?.toLowerCase().includes(q.toLowerCase()) ?? false);
      const matchPapel = papel === "ALL" || f.papel === papel;
      const matchStatus = status === "ALL" || f.status === status;
      return matchQ && matchPapel && matchStatus;
    });
  }, [q, papel, status]);

  function onImportClick() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: enviar para backend (Fastify): /admin/funcionarios/import
    // const form = new FormData(); form.append("file", file);
    // await fetch("/api/admin/funcionarios/import", { method: "POST", body: form, headers: { Authorization: `Bearer ...` } });
    alert(`Planilha selecionada: ${file.name}`);
    e.target.value = "";
  }

  function baixarModeloCSV() {
    // modelo focado em funcionário, sem RA
    const headers = [
      "emailEducacional", // obrigatório
      "emailPessoal",     // opcional
      "nome",             // opcional
      "papel",            // BACKOFFICE|TECNICO|ADMINISTRADOR
      "setores",          // nomes separados por ;  (ex.: Secretaria;Financeiro)
      "status",           // ATIVO|INATIVO
    ];
    const exemplo = [
      "nome.sobrenome@fatec.sp.gov.br",
      "nome.sobrenome@gmail.com",
      "Nome Sobrenome",
      "TECNICO",
      "TI Acadêmica",
      "ATIVO",
    ];
    const csv = [headers.join(","), exemplo.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_funcionarios.csv";
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
              href="/admin/funcionarios/novo"
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95"
              title="Cadastrar funcionário"
            >
              <Plus className="size-4" />
              Cadastrar funcionário
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
              title="Baixar modelo CSV"
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

          {/* Direita: busca e filtros */}
          <div className="flex w/full sm:w-auto flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-[320px]">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Buscar por e-mail, nome, setor…"
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Filter className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  className="h-10 w-[200px] pl-9 pr-8 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={papel}
                  onChange={(e) => setPapel(e.target.value as any)}
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

      {/* Tabela */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--muted)] text-foreground/90">
              <tr>
                <th className="text-left font-medium px-4 py-3">E-mail educacional</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">E-mail pessoal</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Nome</th>
                <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">Papéis / Setores</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Criado em</th>
                <th className="text-right font-medium px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((f) => (
                <tr key={f.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <span className="font-medium">{f.emailEducacional}</span>
                    </div>
                    {/* Nome visível no mobile abaixo do e-mail */}
                    <div className="md:hidden text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <UserIcon className="size-3" />
                      <span>{f.nome || "—"}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell">
                    {f.emailPessoal || "—"}
                  </td>

                  <td className="px-4 py-3 hidden md:table-cell">
                    {f.nome || "—"}
                  </td>

                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-0.5 text-xs">
                        <BadgeCheck className="size-3" />
                        {f.papel}
                      </span>
                      {f.setores.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-0.5 text-xs">
                          <Building2 className="size-3" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={f.status} />
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell">
                    {new Date(f.criadoEm).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    })}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link href={`/admin/funcionarios/${f.id}`} className="h-9 px-3 rounded-md hover:bg-[var(--muted)]">
                        Ver
                      </Link>
                      <Link href={`/admin/funcionarios/${f.id}/editar`} className="h-9 px-3 rounded-md hover:bg-[var(--muted)]">
                        Editar
                      </Link>
                      {f.status === "ATIVO" ? (
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
              {funcionarios.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer (paginação placeholder) */}
        <div className="flex items-center justify-between p-3 text-xs text-muted-foreground border-t border-[var(--border)]">
          <div>Mostrando {funcionarios.length} de {MOCK.length}</div>
          <div className="inline-flex items-center gap-1">
            <button className="h-8 px-2 rounded-md hover:bg-[var(--muted)]">Anterior</button>
            <button className="h-8 px-2 rounded-md hover:bg-[var(--muted)]">Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

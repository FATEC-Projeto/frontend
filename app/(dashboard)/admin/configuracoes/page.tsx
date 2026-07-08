"use client";

import { useMemo, useState } from "react";
import { Check, X, Shield, Info, Lock } from "lucide-react";

/* ===================== Papéis (enum Papel do backend) ===================== */
type Role = "USUARIO" | "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";

const ROLES: Role[] = ["USUARIO", "BACKOFFICE", "TECNICO", "ADMINISTRADOR"];

const ROLE_LABEL: Record<Role, string> = {
  USUARIO: "Usuário (Aluno)",
  BACKOFFICE: "Backoffice",
  TECNICO: "Técnico",
  ADMINISTRADOR: "Administrador",
};

/* ===================== Recursos ===================== */
type ResourceKey =
  | "CHAMADO_CRIAR"
  | "CHAMADO_VER"
  | "CHAMADO_COMENTAR"
  | "CHAMADO_ANEXAR"
  | "CHAMADO_EDITAR"
  | "CHAMADO_REMOVER"
  | "CATALOGO_LISTAR"
  | "USUARIOS_LISTAR"
  | "USUARIOS_CRIAR"
  | "USUARIOS_EDITAR"
  | "USUARIOS_REMOVER"
  | "SETORES_GERENCIAR"
  | "VINCULAR_USUARIO_SETOR"
  | "PAPEIS_GERENCIAR"
  | "COMUNICACOES_GERENCIAR"
  | "AUDITORIA_VISUALIZAR"
  | "RELATORIOS";

type Rota = { metodo: string; caminho: string };

type LinhaRecurso = {
  label: string;
  rota: Rota;
  perfis: Partial<Record<Role, "todos" | "proprios">>; // ausente = negado
};

/**
 * Política REAL aplicada pelo backend (por rota). Derivada dos preHandlers
 * `authenticate` + `authorize([...])` e das verificações de posse do aluno.
 * Esta tela é somente-leitura: reflete o que o servidor impõe hoje, não é
 * configurável (a autorização está no código, por rota).
 */
const POLICY: Record<ResourceKey, LinhaRecurso> = {
  CHAMADO_CRIAR: {
    label: "Chamado — abrir",
    rota: { metodo: "POST", caminho: "/tickets" },
    perfis: { USUARIO: "proprios", BACKOFFICE: "todos", TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
  CHAMADO_VER: {
    label: "Chamado — ver / listar",
    rota: { metodo: "GET", caminho: "/tickets, /tickets/:id" },
    perfis: { USUARIO: "proprios", BACKOFFICE: "todos", TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
  CHAMADO_COMENTAR: {
    label: "Chamado — mensagens",
    rota: { metodo: "GET/POST", caminho: "/tickets/:id/mensagens" },
    perfis: { USUARIO: "proprios", BACKOFFICE: "todos", TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
  CHAMADO_ANEXAR: {
    label: "Chamado — anexos",
    rota: { metodo: "GET/POST", caminho: "/tickets/:id/anexos" },
    perfis: { USUARIO: "proprios", BACKOFFICE: "todos", TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
  CHAMADO_EDITAR: {
    label: "Chamado — atualizar (status, campos)",
    rota: { metodo: "PATCH", caminho: "/tickets/:id" },
    perfis: { USUARIO: "proprios", BACKOFFICE: "todos", TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
  CHAMADO_REMOVER: {
    label: "Chamado — remover (soft delete)",
    rota: { metodo: "DELETE", caminho: "/tickets/:id" },
    perfis: { USUARIO: "proprios", BACKOFFICE: "todos", TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
  CATALOGO_LISTAR: {
    label: "Catálogo de serviços — listar",
    rota: { metodo: "GET", caminho: "/catalogo" },
    perfis: { USUARIO: "todos", BACKOFFICE: "todos", TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
  USUARIOS_LISTAR: {
    label: "Usuários — listar / ver",
    rota: { metodo: "GET", caminho: "/usuarios" },
    perfis: { BACKOFFICE: "todos", TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
  USUARIOS_CRIAR: {
    label: "Usuários — criar",
    rota: { metodo: "POST", caminho: "/usuarios" },
    perfis: { ADMINISTRADOR: "todos" },
  },
  USUARIOS_EDITAR: {
    label: "Usuários — editar",
    rota: { metodo: "PATCH", caminho: "/usuarios/:id" },
    perfis: { USUARIO: "proprios", BACKOFFICE: "todos", TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
  USUARIOS_REMOVER: {
    label: "Usuários — remover",
    rota: { metodo: "DELETE", caminho: "/usuarios/:id" },
    perfis: { ADMINISTRADOR: "todos" },
  },
  SETORES_GERENCIAR: {
    label: "Setores — criar / editar / remover",
    rota: { metodo: "POST/PATCH/DELETE", caminho: "/admin/setores" },
    perfis: { ADMINISTRADOR: "todos" },
  },
  VINCULAR_USUARIO_SETOR: {
    label: "Vincular usuário ⇄ setor",
    rota: { metodo: "POST/PATCH/DELETE", caminho: "/admin/usuarios-setores" },
    perfis: { TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
  PAPEIS_GERENCIAR: {
    label: "Papéis (catálogo) — gerenciar",
    rota: { metodo: "POST/PATCH/DELETE", caminho: "/admin/papeis" },
    perfis: { ADMINISTRADOR: "todos" },
  },
  COMUNICACOES_GERENCIAR: {
    label: "Comunicações (templates) — gerenciar",
    rota: { metodo: "GET/PUT/POST", caminho: "/admin/comunicacoes" },
    perfis: { ADMINISTRADOR: "todos" },
  },
  AUDITORIA_VISUALIZAR: {
    label: "Auditoria — visualizar",
    rota: { metodo: "GET", caminho: "/auditoria" },
    perfis: { ADMINISTRADOR: "todos" },
  },
  RELATORIOS: {
    label: "Relatórios / estatísticas",
    rota: { metodo: "GET", caminho: "/tickets/stats" },
    perfis: { BACKOFFICE: "todos", TECNICO: "todos", ADMINISTRADOR: "todos" },
  },
};

const ESCOPO_LABEL = { todos: "todos", proprios: "próprios" } as const;

/* ===================== Página (somente leitura) ===================== */
export default function ConfiguracoesPermissoesPage() {
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const all = Object.keys(POLICY) as ResourceKey[];
    const q = filter.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (k) =>
        POLICY[k].label.toLowerCase().includes(q) ||
        POLICY[k].rota.caminho.toLowerCase().includes(q),
    );
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg grid place-items-center bg-primary text-primary-foreground">
            <Shield className="size-5" />
          </div>
          <div>
            <h1 className="font-grotesk text-xl font-semibold">Permissões de acesso</h1>
            <p className="text-sm text-muted-foreground">
              Quem pode fazer o quê, por papel — conforme aplicado pelo backend.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Somente leitura
        </span>
      </div>

      {/* Aviso */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <div className="flex items-start gap-2">
          <Info className="size-4 mt-[2px] text-amber-600 shrink-0" />
          <p className="text-muted-foreground">
            Esta tela <b>reflete</b> a política de acesso que o servidor já aplica em cada rota
            (papel + posse do recurso). Ela <b>não é configurável por aqui</b>: as regras estão no
            código do backend. <b>Próprios</b> = apenas os registros do próprio usuário (ex.:
            chamados criados por ele); <b>todos</b> = sem restrição de posse.
          </p>
        </div>
      </div>

      {/* Filtro */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-3">
        <input
          placeholder="Filtrar por recurso ou rota (ex.: chamado, /usuarios...)"
          className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Matriz */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="text-left font-semibold px-4 py-3 w-[300px]">Recurso / Ação</th>
              {ROLES.map((r) => (
                <th key={r} className="text-left font-semibold px-4 py-3 whitespace-nowrap">{ROLE_LABEL[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((rk) => {
              const linha = POLICY[rk];
              return (
                <tr key={rk} className="border-t border-[var(--border)] align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{linha.label}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {linha.rota.metodo} {linha.rota.caminho}
                    </div>
                  </td>
                  {ROLES.map((role) => {
                    const escopo = linha.perfis[role];
                    const permitido = !!escopo;
                    return (
                      <td key={role} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              permitido
                                ? "inline-flex items-center justify-center size-7 rounded-md bg-[var(--success)]/15 text-[var(--success)]"
                                : "inline-flex items-center justify-center size-7 rounded-md bg-[var(--muted)] text-muted-foreground"
                            }
                            title={permitido ? "Permitido" : "Negado"}
                          >
                            {permitido ? <Check className="size-4" /> : <X className="size-4" />}
                          </span>
                          {permitido && (
                            <span className="text-xs rounded-md border border-[var(--border)] bg-background px-2 py-0.5">
                              {ESCOPO_LABEL[escopo]}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Nota */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4 text-sm">
        <div className="flex items-start gap-2">
          <Info className="size-4 mt-[2px] shrink-0" />
          <div className="space-y-1.5 text-muted-foreground">
            <p>
              Para alunos (papel <b>Usuário</b>), o backend restringe as ações de chamado aos
              próprios registros (verificação de posse por <code>criadoPorId</code>), e o
              <code> PATCH /usuarios/:id</code> permite editar apenas o próprio cadastro, sem os
              campos privilegiados (papel, ativo, senha).
            </p>
            <p>
              <b>Relatórios</b> (<code>/tickets/stats</code>) são restritos à equipe
              (Backoffice, Técnico e Administrador); o aluno não acessa estatísticas globais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

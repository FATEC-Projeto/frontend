"use client";

import { useMemo, useRef, useState } from "react";
import { Check, X, Shield, Download, Upload, RotateCcw, Info } from "lucide-react";

/* ===================== PAPÉIS (alinhados ao enum Papel) ===================== */
type Role = "USUARIO" | "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";

/* ===================== Recursos/Ações ===================== */
type ResourceKey =
  | "CHAMADO_CRIAR"
  | "CHAMADO_VER"
  | "CHAMADO_COMENTAR"
  | "CHAMADO_ANEXAR"
  | "CHAMADO_ALTERAR_STATUS"
  | "CHAMADO_ATRIBUIR_RESP"
  | "CHAMADO_REABRIR"
  | "CHAMADO_ENCERRAR"
  | "CHAMADO_HISTORICO_VER"
  | "CATALOGO_LISTAR"
  | "CATALOGO_EDITAR"
  | "CATEGORIAS_SETORES_EDITAR"
  | "USUARIOS_LISTAR"
  | "USUARIOS_EDITAR"
  | "VINCULAR_USUARIO_SETOR"
  | "AUDITORIA_VISUALIZAR"
  | "RELATORIOS"
  | "ADMIN_CONFIG";

/* Escopos possíveis por ação (não é todo mundo que usa todos) */
type Scope =
  | "sempre"                  // sempre pode (sem escopo)
  | "proprios"
  | "todos"
  | "organizacao"
  | "setores"
  | "atribuido_e_setor"
  | "para_si_ou_time"
  | "qualquer"
  | "operacional"
  | "opcional"
  | "limitado"
  | "gerencial"
  | "resolvido_para_encerrado"; // caso especial do aluno encerrar só de RESOLVIDO→ENCERRADO

type Cell = { allow: boolean; scope?: Scope };

type Matrix = Record<ResourceKey, Record<Role, Cell>>;

/* ===================== Rótulos ===================== */
const ROLE_LABEL: Record<Role, string> = {
  USUARIO: "Usuário (Aluno)",
  BACKOFFICE: "Backoffice",
  TECNICO: "Técnico",
  ADMINISTRADOR: "Administrador",
};

const RESOURCE_LABEL: Record<ResourceKey, string> = {
  CHAMADO_CRIAR: "Chamado — criar",
  CHAMADO_VER: "Chamado — ver",
  CHAMADO_COMENTAR: "Chamado — comentar/mensagens",
  CHAMADO_ANEXAR: "Chamado — anexar arquivos",
  CHAMADO_ALTERAR_STATUS: "Chamado — alterar status",
  CHAMADO_ATRIBUIR_RESP: "Chamado — atribuir responsável",
  CHAMADO_REABRIR: "Chamado — reabrir",
  CHAMADO_ENCERRAR: "Chamado — encerrar",
  CHAMADO_HISTORICO_VER: "Chamado — ver histórico",
  CATALOGO_LISTAR: "Catálogo/Serviços — listar",
  CATALOGO_EDITAR: "Catálogo/Serviços — criar/editar",
  CATEGORIAS_SETORES_EDITAR: "Categorias/Setores — criar/editar",
  USUARIOS_LISTAR: "Usuários — listar",
  USUARIOS_EDITAR: "Usuários — criar/editar",
  VINCULAR_USUARIO_SETOR: "Vincular usuário a setor",
  AUDITORIA_VISUALIZAR: "Auditoria — visualizar",
  RELATORIOS: "Relatórios",
  ADMIN_CONFIG: "Administração — configurações gerais",
};

const SCOPE_LABEL: Record<Scope, string> = {
  sempre: "(sempre)",
  proprios: "próprios",
  todos: "todos",
  organizacao: "todos da organização",
  setores: "do(s) setor(es)",
  atribuido_e_setor: "atribuídos + setor(es)",
  para_si_ou_time: "(para si/time)",
  qualquer: "(qualquer)",
  operacional: "(operacional)",
  opcional: "(opcional)",
  limitado: "(limitado)",
  gerencial: "(gerencial)",
  resolvido_para_encerrado: "próprios (RESOLVIDO → ENCERRADO)",
};

/* ===================== Matriz Padrão (a partir da planilha) ===================== */
function defaultMatrix(): Matrix {
  return {
    CHAMADO_CRIAR: {
      USUARIO: { allow: true, scope: "sempre" },
      BACKOFFICE: { allow: true, scope: "sempre" },
      TECNICO: { allow: true, scope: "setores" },
      ADMINISTRADOR: { allow: true, scope: "todos" },
    },
    CHAMADO_VER: {
      USUARIO: { allow: true, scope: "proprios" },
      BACKOFFICE: { allow: true, scope: "organizacao" },
      TECNICO: { allow: true, scope: "atribuido_e_setor" },
      ADMINISTRADOR: { allow: true, scope: "todos" },
    },
    CHAMADO_COMENTAR: {
      USUARIO: { allow: true, scope: "proprios" },
      BACKOFFICE: { allow: true, scope: "todos" },
      TECNICO: { allow: true, scope: "atribuido_e_setor" },
      ADMINISTRADOR: { allow: true, scope: "todos" },
    },
    CHAMADO_ANEXAR: {
      USUARIO: { allow: true, scope: "proprios" },
      BACKOFFICE: { allow: true, scope: "todos" },
      TECNICO: { allow: true, scope: "atribuido_e_setor" },
      ADMINISTRADOR: { allow: true, scope: "todos" },
    },
    CHAMADO_ALTERAR_STATUS: {
      USUARIO: { allow: false },
      BACKOFFICE: { allow: true, scope: "todos" },
      TECNICO: { allow: true, scope: "para_si_ou_time" },
      ADMINISTRADOR: { allow: true, scope: "qualquer" },
    },
    CHAMADO_ATRIBUIR_RESP: {
      USUARIO: { allow: false },
      BACKOFFICE: { allow: true },
      TECNICO: { allow: false },
      ADMINISTRADOR: { allow: true },
    },
    CHAMADO_REABRIR: {
      USUARIO: { allow: true, scope: "proprios" },
      BACKOFFICE: { allow: true },
      TECNICO: { allow: false },
      ADMINISTRADOR: { allow: true },
    },
    CHAMADO_ENCERRAR: {
      USUARIO: { allow: true, scope: "resolvido_para_encerrado" },
      BACKOFFICE: { allow: false },
      TECNICO: { allow: true },
      ADMINISTRADOR: { allow: true },
    },
    CHAMADO_HISTORICO_VER: {
      USUARIO: { allow: true, scope: "proprios" },
      BACKOFFICE: { allow: true, scope: "todos" },
      TECNICO: { allow: true, scope: "setores" },
      ADMINISTRADOR: { allow: true, scope: "todos" },
    },
    CATALOGO_LISTAR: {
      USUARIO: { allow: true },
      BACKOFFICE: { allow: true },
      TECNICO: { allow: true },
      ADMINISTRADOR: { allow: true },
    },
    CATALOGO_EDITAR: {
      USUARIO: { allow: false },
      BACKOFFICE: { allow: true, scope: "operacional" },
      TECNICO: { allow: true, scope: "setores" },
      ADMINISTRADOR: { allow: true, scope: "todos" },
    },
    CATEGORIAS_SETORES_EDITAR: {
      USUARIO: { allow: false },
      BACKOFFICE: { allow: false, scope: "opcional" },
      TECNICO: { allow: false },
      ADMINISTRADOR: { allow: true },
    },
    USUARIOS_LISTAR: {
      USUARIO: { allow: false },
      BACKOFFICE: { allow: true, scope: "limitado" },
      TECNICO: { allow: false },
      ADMINISTRADOR: { allow: true },
    },
    USUARIOS_EDITAR: {
      USUARIO: { allow: false },
      BACKOFFICE: { allow: false },
      TECNICO: { allow: false },
      ADMINISTRADOR: { allow: true },
    },
    VINCULAR_USUARIO_SETOR: {
      USUARIO: { allow: false },
      BACKOFFICE: { allow: false },
      TECNICO: { allow: true, scope: "para_si_ou_time" }, // auto/time
      ADMINISTRADOR: { allow: true },
    },
    AUDITORIA_VISUALIZAR: {
      USUARIO: { allow: false },
      BACKOFFICE: { allow: true, scope: "operacional" },
      TECNICO: { allow: true, scope: "setores" },
      ADMINISTRADOR: { allow: true, scope: "gerencial" },
    },
    RELATORIOS: {
      USUARIO: { allow: false },
      BACKOFFICE: { allow: true },
      TECNICO: { allow: true, scope: "setores" },
      ADMINISTRADOR: { allow: true },
    },
    ADMIN_CONFIG: {
      USUARIO: { allow: false },
      BACKOFFICE: { allow: false },
      TECNICO: { allow: false },
      ADMINISTRADOR: { allow: true },
    },
  };
}

/* Escopos disponíveis por linha/coluna (para limitar dropdown) */
const ROW_ROLE_SCOPES: Partial<Record<ResourceKey, Partial<Record<Role, Scope[]>>>> = {
  CHAMADO_VER: {
    USUARIO: ["proprios"],
    BACKOFFICE: ["organizacao"],
    TECNICO: ["atribuido_e_setor", "setores"],
    ADMINISTRADOR: ["todos"],
  },
  CHAMADO_COMENTAR: {
    USUARIO: ["proprios"],
    BACKOFFICE: ["todos"],
    TECNICO: ["atribuido_e_setor", "setores"],
    ADMINISTRADOR: ["todos"],
  },
  CHAMADO_ANEXAR: {
    USUARIO: ["proprios"],
    BACKOFFICE: ["todos"],
    TECNICO: ["atribuido_e_setor", "setores"],
    ADMINISTRADOR: ["todos"],
  },
  CHAMADO_ALTERAR_STATUS: {
    BACKOFFICE: ["todos"],
    TECNICO: ["para_si_ou_time"],
    ADMINISTRADOR: ["qualquer"],
  },
  CHAMADO_ENCERRAR: {
    USUARIO: ["resolvido_para_encerrado"],
  },
  CHAMADO_HISTORICO_VER: {
    USUARIO: ["proprios"],
    BACKOFFICE: ["todos"],
    TECNICO: ["setores"],
    ADMINISTRADOR: ["todos"],
  },
  CATALOGO_EDITAR: {
    BACKOFFICE: ["operacional"],
    TECNICO: ["setores"],
    ADMINISTRADOR: ["todos"],
  },
  AUDITORIA_VISUALIZAR: {
    BACKOFFICE: ["operacional"],
    TECNICO: ["setores"],
    ADMINISTRADOR: ["gerencial"],
  },
  RELATORIOS: {
    TECNICO: ["setores"],
  },
};

/* ===================== UI helpers ===================== */
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ===================== Página ===================== */
export default function ConfiguracoesPermissoesPage() {
  const [matrix, setMatrix] = useState<Matrix>(() => defaultMatrix());
  const [filter, setFilter] = useState(""); // busca por recurso
  const fileRef = useRef<HTMLInputElement | null>(null);

  const rows = useMemo(() => {
    const all = Object.keys(RESOURCE_LABEL) as ResourceKey[];
    return all.filter((k) =>
      !filter || RESOURCE_LABEL[k].toLowerCase().includes(filter.toLowerCase())
    );
  }, [filter]);

  function toggle(role: Role, key: ResourceKey) {
    setMatrix((prev) => {
      const next = structuredClone(prev);
      const cell = next[key][role];
      cell.allow = !cell.allow;
      // se desabilitar, limpa escopo; se habilitar e houver lista restrita, pega o primeiro
      if (!cell.allow) {
        delete cell.scope;
      } else if (!cell.scope) {
        const opts = ROW_ROLE_SCOPES[key]?.[role];
        if (opts?.length) cell.scope = opts[0];
      }
      return next;
    });
  }

  function setScope(role: Role, key: ResourceKey, scope: Scope) {
    setMatrix((prev) => {
      const next = structuredClone(prev);
      next[key][role].scope = scope;
      return next;
    });
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(matrix, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "permissoes_roles.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Matrix;
        // validação simples
        if (!data || typeof data !== "object") throw new Error("inválido");
        setMatrix(data);
      } catch {
        alert("JSON inválido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function resetDefaults() {
    if (confirm("Restaurar a matriz padrão?")) {
      setMatrix(defaultMatrix());
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg grid place-items-center bg-primary text-primary-foreground">
            <Shield className="size-5" />
          </div>
          <div>
            <h1 className="font-grotesk text-xl font-semibold">Configurações — Permissões de Papéis</h1>
            <p className="text-sm text-muted-foreground">
              Defina o que cada papel pode fazer e em qual escopo (próprios, setor, organização, etc.).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportJSON}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
          >
            <Download className="size-4" /> Exportar JSON
          </button>
          <div>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
            >
              <Upload className="size-4" /> Importar
            </button>
          </div>
          <button
            onClick={resetDefaults}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
          >
            <RotateCcw className="size-4" /> Restaurar padrão
          </button>
        </div>
      </div>

      {/* Filtro */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-3">
        <input
          placeholder="Filtrar por recurso/ação (ex.: chamado, catálogo...)"
          className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-3"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Matriz */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="text-left font-semibold px-4 py-3 w-[360px]">Recurso / Ação</th>
              {(["USUARIO","BACKOFFICE","TECNICO","ADMINISTRADOR"] as Role[]).map((r) => (
                <th key={r} className="text-left font-semibold px-4 py-3">{ROLE_LABEL[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((rk) => (
              <tr key={rk} className="border-t border-[var(--border)] align-top">
                <td className="px-4 py-3 font-medium">{RESOURCE_LABEL[rk]}</td>

                {(["USUARIO","BACKOFFICE","TECNICO","ADMINISTRADOR"] as Role[]).map((role) => {
                  const cell = matrix[rk][role];
                  const scopeOptions = ROW_ROLE_SCOPES[rk]?.[role];

                  return (
                    <td key={role} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggle(role, rk)}
                          className={cx(
                            "inline-flex items-center justify-center size-7 rounded-md border",
                            cell.allow
                              ? "bg-primary text-primary-foreground border-transparent"
                              : "hover:bg-[var(--muted)]"
                          )}
                          title={cell.allow ? "Permitido" : "Negado"}
                        >
                          {cell.allow ? <Check className="size-4" /> : <X className="size-4" />}
                        </button>

                        {/* Scope quando aplicável e permitido */}
                        {cell.allow && scopeOptions?.length ? (
                          <select
                            className="h-8 rounded-md border border-[var(--border)] bg-background px-2"
                            value={cell.scope ?? scopeOptions[0]}
                            onChange={(e) => setScope(role, rk, e.target.value as Scope)}
                          >
                            {scopeOptions.map((s) => (
                              <option key={s} value={s}>{SCOPE_LABEL[s]}</option>
                            ))}
                          </select>
                        ) : cell.allow && cell.scope ? (
                          <span className="text-xs rounded-md border border-[var(--border)] bg-background px-2 py-0.5">
                            {SCOPE_LABEL[cell.scope]}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legenda / Dicas */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4 text-sm">
        <div className="flex items-start gap-2">
          <Info className="size-4 mt-[2px]" />
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Esta matriz define as capabilities da aplicação. Em tempo de execução, recomenda-se
              validar as regras combinando o <b>Papel do usuário</b>, suas relações em <code>UsuarioSetor</code> e o
              ownership do recurso (por exemplo, <code>Chamado.criadoPorId</code> para “próprios”, ou <code>setorId</code> para “setor(es)”).
            </p>
            <ul className="list-disc pl-4 text-muted-foreground">
              <li><b>atribuídos + setor(es)</b>: o usuário vê/atua nos chamados que estão atribuídos a ele(a) <i>ou</i> pertencem ao(s) setor(es) dele(a).</li>
              <li><b>para si/time</b>: mudanças de status que afetem apenas chamados sob responsabilidade do próprio técnico ou time imediato.</li>
              <li><b>operacional/gerencial</b>: filtros/escopos de dados mais restritos/abrangentes para Backoffice/Administrador.</li>
              <li><b>Aluno encerrar</b>: permitido apenas quando o status vai de <code>RESOLVIDO → ENCERRADO</code>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { apiFetch } from "../../../../../utils/api";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User as UserIcon, Mail, Shield, Building2, BadgeCheck,
  CheckCircle2, XCircle, Plus, Trash2, X, Loader2
} from "lucide-react";
import { cx } from '../../../../../utils/cx';

type Papel = "USUARIO" | "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";

type UsuarioApi = {
  id: string;
  nome: string | null;
  emailPessoal: string | null;
  emailEducacional: string | null;
  papel?: Papel | null;
  papeis?: Papel[] | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm?: string;
};

type Funcionario = {
  id: string;
  nome: string | null;
  emailPessoal: string | null;
  emailEducacional: string | null;
  papel: Exclude<Papel, "USUARIO">;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm?: string;
};

type SetorLite = {
  usuarioSetorId: string; // ID do vínculo — usado no DELETE
  id: string;             // ID do setor — display
  nome: string;
  papelNoSetor?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const FUNC_LIST = "/admin/funcionarios";

function extrairPapel(u: UsuarioApi): Funcionario["papel"] | null {
  if (u.papel && u.papel !== "USUARIO") return u.papel as Funcionario["papel"];
  if (u.papeis && u.papeis.length) {
    const p = u.papeis.find((x) => x !== "USUARIO");
    if (p) return p as Funcionario["papel"];
  }
  return null;
}

function StatusPill({ ativo }: { ativo: boolean }) {
  return (
    <span className={cx(
      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
      ativo
        ? "border-[var(--success)]/30 bg-[var(--success)]/12 text-[var(--success)]"
        : "border-[var(--border)] bg-[var(--muted)] text-muted-foreground"
    )}>
      {ativo ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

function showToast(msg: string) { alert(msg); }

export default function FuncionarioDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [func, setFunc] = useState<Funcionario | null>(null);
  const [setores, setSetores] = useState<SetorLite[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [delOpen, setDelOpen] = useState(false);
  const [delConfirmText, setDelConfirmText] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [novoSetorId, setNovoSetorId] = useState("");
  const [novoPapelId, setNovoPapelId] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Busca dados do usuário
        const uRes = await apiFetch(`${API_URL}/usuarios/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!uRes.ok) throw new Error(uRes.status === 404 ? "Funcionário não encontrado." : `Erro ${uRes.status} ao buscar funcionário.`);

        const json: UsuarioApi = await uRes.json();
        const papel = extrairPapel(json);
        if (papel === null) throw new Error("Usuário não possui papel de funcionário válido.");
        const mapped: Funcionario = {
          id: json.id,
          nome: json.nome ?? null,
          emailPessoal: json.emailPessoal ?? null,
          emailEducacional: json.emailEducacional ?? null,
          papel,
          ativo: Boolean(json.ativo),
          criadoEm: json.criadoEm,
          atualizadoEm: json.atualizadoEm,
        };
        if (alive) setFunc(mapped);

        // Busca setores do usuário — rota: GET /admin/usuarios/:id/setores
        const sRes = await apiFetch(`${API_URL}/admin/usuarios/${encodeURIComponent(id)}/setores`, { cache: "no-store" });
        if (!sRes.ok) throw new Error(`Erro ${sRes.status} ao buscar setores do funcionário.`);
        const data = await sRes.json();
        const arr: any[] = Array.isArray(data) ? data : (data.data ?? []);
        const setoresNorm: SetorLite[] = arr
          .filter((item) => item?.setor?.id)
          .map((item) => ({
            usuarioSetorId: String(item.id),
            id: String(item.setor.id),
            nome: String(item.setor.nome),
            papelNoSetor: item?.papel?.nome ?? null,
          }));
        if (alive) setSetores(setoresNorm);
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : "Falha ao carregar funcionário.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (id) load();
    return () => { alive = false; };
  }, [id]);

  async function onResetSenha() {
    showToast("Reset de senha enviado (stub).");
  }

  async function onExcluirUsuario() {
    if (!func) return;
    const expected = func.emailEducacional ?? func.emailPessoal ?? "";
    if (delConfirmText !== expected) {
      showToast("Digite exatamente o e-mail do usuário para confirmar.");
      return;
    }
    try {
      const res = await apiFetch(`${API_URL}/usuarios/${encodeURIComponent(func.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir funcionário.");
      showToast("Funcionário excluído com sucesso.");
      router.push(FUNC_LIST);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Não foi possível excluir o funcionário.");
    } finally {
      setDelOpen(false);
      setDelConfirmText("");
    }
  }

  async function onAddSetor(e: React.FormEvent) {
    e.preventDefault();
    if (!func) return;
    if (!novoSetorId.trim()) { showToast("Informe o ID do setor."); return; }
    try {
      const body = {
        setorId: novoSetorId.trim(),
        ...(novoPapelId.trim() ? { papelId: novoPapelId.trim() } : {}),
      };
      // Rota real: POST /admin/usuarios/:usuarioId/setores
      const res = await apiFetch(`${API_URL}/admin/usuarios/${encodeURIComponent(func.id)}/setores`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Falha ao adicionar ao setor.");
      const data = await res.json();
      const novo: SetorLite = {
        usuarioSetorId: String(data.id),
        id: String(data.setor?.id ?? novoSetorId.trim()),
        nome: String(data.setor?.nome ?? novoSetorId.trim()),
        papelNoSetor: data.papel?.nome ?? (novoPapelId.trim() || null),
      };
      setSetores((prev) => prev.some((s) => s.usuarioSetorId === novo.usuarioSetorId) ? prev : [...prev, novo]);
      setAddOpen(false);
      setNovoSetorId("");
      setNovoPapelId("");
      showToast("Setor adicionado.");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Não foi possível adicionar ao setor.");
    }
  }

  async function onRemoverSetor(usuarioSetorId: string) {
    try {
      // Rota real: DELETE /admin/usuarios-setores/:usuarioSetorId
      const res = await apiFetch(`${API_URL}/admin/usuarios-setores/${encodeURIComponent(usuarioSetorId)}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Falha ao remover do setor.");
      setSetores((prev) => prev.filter((s) => s.usuarioSetorId !== usuarioSetorId));
      showToast("Removido do setor.");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Não foi possível remover do setor.");
    }
  }

  if (loading && !func) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 mr-2 inline animate-spin" /> Carregando dados do funcionário…
      </div>
    );
  }

  if (error || !func) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[var(--border)] bg-card p-6 text-center">
          <div className="text-lg font-semibold mb-1">Funcionário não encontrado</div>
          <div className="text-sm text-muted-foreground">{error ?? "Verifique o ID na URL."}</div>
          <Link prefetch={false} href={FUNC_LIST}
            className="inline-flex items-center gap-2 mt-4 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link prefetch={false} href={FUNC_LIST}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm">
            <ArrowLeft className="size-4" /> Funcionários
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium truncate max-w-[60vw]">{func.nome ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link prefetch={false} href={`${FUNC_LIST}/${func.id}/editar`}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm">Editar</Link>
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm" onClick={onResetSenha}>
            Resetar senha
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-red-300 text-red-600 hover:bg-red-50 text-sm" onClick={() => setDelOpen(true)}>
            <Trash2 className="size-4" /> Excluir
          </button>
        </div>
      </div>

      {/* Card do funcionário */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-[var(--muted)] grid place-items-center">
              <UserIcon className="size-6 text-muted-foreground" />
            </div>
            <div>
              <div className="text-lg font-semibold">{func.nome ?? "—"}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-0.5 text-xs">
                  <Mail className="size-3" />{func.emailEducacional ?? func.emailPessoal ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-0.5 text-xs">
                  <Shield className="size-3" /> {func.papel}
                </span>
                <StatusPill ativo={func.ativo} />
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Criado em {new Date(func.criadoEm).toLocaleDateString("pt-BR")}
            {" • "}
            Atualizado em {func.atualizadoEm ? new Date(func.atualizadoEm).toLocaleDateString("pt-BR") : "—"}
          </div>
        </div>
      </div>

      {/* Setores */}
      <div className="rounded-xl border border-[var(--border)] bg-card">
        <div className="p-4 flex items-center justify-between">
          <div className="font-semibold">Setores do funcionário</div>
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Adicionar a setor
          </button>
        </div>
        <div className="px-4 pb-4">
          {setores.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum setor vinculado.</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {setores.map((s) => (
                <div key={s.usuarioSetorId} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-background p-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium leading-5">{s.nome}</span>
                      {s.papelNoSetor && (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <BadgeCheck className="size-3" /> {s.papelNoSetor}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 h-8 px-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50 text-xs"
                    onClick={() => onRemoverSetor(s.usuarioSetorId)}
                  >
                    <Trash2 className="size-3" /> Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Adicionar a setor */}
      {addOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAddOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 bg-background rounded-xl shadow-xl border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="font-semibold">Adicionar funcionário a um setor</div>
              <button className="h-8 w-8 grid place-items-center rounded-md hover:bg-[var(--muted)]" onClick={() => setAddOpen(false)}><X className="size-4" /></button>
            </div>
            <form className="p-4 space-y-3" onSubmit={onAddSetor}>
              <div className="space-y-1">
                <label className="text-sm">ID do setor</label>
                <input className="w-full h-10 rounded-md border border-[var(--border)] bg-background px-3"
                  placeholder="ex.: clx9… (cuid do Setor)"
                  value={novoSetorId} onChange={(e) => setNovoSetorId(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm">ID do papel (opcional)</label>
                <input className="w-full h-10 rounded-md border border-[var(--border)] bg-background px-3"
                  placeholder="PapelCatalogo.id (opcional)"
                  value={novoPapelId} onChange={(e) => setNovoPapelId(e.target.value)} />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm" onClick={() => setAddOpen(false)}>Cancelar</button>
                <button type="submit" className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:brightness-95">
                  <Plus className="size-4" /> Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Excluir */}
      {delOpen && func && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDelOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 bg-background rounded-xl shadow-xl border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
              <Trash2 className="size-4 text-red-600" />
              <div className="font-semibold">Confirmar exclusão do funcionário</div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm">Essa ação é <b>irreversível</b>. Para confirmar, digite o e-mail do funcionário:</p>
              <div className="rounded-md border border-[var(--border)] bg-card p-3 text-sm">
                <div className="text-muted-foreground">E-mail esperado</div>
                <div className="font-mono">{func.emailEducacional ?? func.emailPessoal ?? "—"}</div>
              </div>
              <input className="w-full h-10 rounded-md border border-[var(--border)] bg-background px-3"
                placeholder="Digite aqui exatamente o e-mail"
                value={delConfirmText} onChange={(e) => setDelConfirmText(e.target.value)} />
            </div>
            <div className="p-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
              <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm" onClick={() => setDelOpen(false)}>
                <X className="size-4" /> Cancelar
              </button>
              <button
                className={cx(
                  "inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm",
                  delConfirmText === (func.emailEducacional ?? func.emailPessoal ?? "")
                    ? "bg-red-600 text-white hover:brightness-95"
                    : "bg-red-600/50 text-white/80 cursor-not-allowed"
                )}
                onClick={onExcluirUsuario}
                disabled={delConfirmText !== (func.emailEducacional ?? func.emailPessoal ?? "")}
              >
                <Trash2 className="size-4" /> Excluir definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

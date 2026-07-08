"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, Plus, Building2, Users, Pencil, Trash2, X, Check,
  User as UserIcon, BadgeCheck, Filter, ArrowRightLeft, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cx } from '../../../../utils/cx'
import { apiFetch } from "../../../../utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/* ===================== Tipos alinhados ao schema ===================== */
type PapelCatalogo = {
  id: string;
  nome: string;
  descricao?: string | null;
};

type Usuario = {
  id: string;
  nome?: string | null;
  emailEducacional?: string | null;
  emailPessoal?: string | null;
  papel?: string | null;
  ativo: boolean;
};

type Setor = {
  id: string;
  nome: string;
  descricao?: string | null;
};

/** Vínculo usuário↔setor, com usuário e papel embutidos (include do backend). */
type Membro = {
  id: string;           // id do vínculo (usuarioSetor)
  usuarioId: string;
  setorId: string;
  papelId?: string | null;
  usuario: Usuario;
  papel?: PapelCatalogo | null;
};

/* ===================== Helpers de e-mail ===================== */
const emailDe = (u: Usuario) => u.emailEducacional ?? u.emailPessoal ?? "—";

/* ===================== Chips / Badges ===================== */
function PapelBadge({ nome }: { nome?: string | null }) {
  if (!nome) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border bg-indigo-500/12 text-indigo-600 border-indigo-500/30">
      <BadgeCheck className="size-3" /> {nome}
    </span>
  );
}

function AtivoDot({ ativo }: { ativo: boolean }) {
  return (
    <span className={cx("inline-block size-2 rounded-full", ativo ? "bg-[var(--success)]" : "bg-[var(--muted-foreground)]")} />
  );
}

/* ===================== Página ===================== */
export default function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [papeis, setPapeis] = useState<PapelCatalogo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);

  const [loadingSetores, setLoadingSetores] = useState(true);
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [busy, setBusy] = useState(false);

  const [qSetor, setQSetor] = useState("");
  const [currentSetorId, setCurrentSetorId] = useState<string>("");
  const currentSetor = setores.find(s => s.id === currentSetorId) ?? null;

  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── Carga inicial: setores, papéis e funcionários ── */
  const carregarSetores = useCallback(async (selecionar?: string) => {
    setLoadingSetores(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/setores?perPage=100`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Falha ao carregar setores (${res.status})`);
      const json = await res.json();
      const lista: Setor[] = json?.data ?? [];
      setSetores(lista);
      setCurrentSetorId(prev => selecionar ?? (lista.some(s => s.id === prev) ? prev : lista[0]?.id ?? ""));
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar setores");
    } finally {
      setLoadingSetores(false);
    }
  }, []);

  useEffect(() => {
    carregarSetores();

    apiFetch(`${API_URL}/admin/papeis`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPapeis(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch(() => {});

    // Candidatos para atribuição: apenas contas de equipe (não-aluno) e ativas.
    apiFetch(`${API_URL}/usuarios?perPage=100&ativo=true`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const items: Usuario[] = json?.items ?? [];
        setUsuarios(items.filter((u) => u.papel && u.papel !== "USUARIO"));
      })
      .catch(() => {});
  }, [carregarSetores]);

  /* ── Membros do setor selecionado ── */
  const carregarMembros = useCallback(async (setorId: string) => {
    if (!setorId) { setMembros([]); return; }
    setLoadingMembros(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/setores/${setorId}/usuarios?perPage=100`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Falha ao carregar membros (${res.status})`);
      const json = await res.json();
      setMembros(json?.data ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar membros do setor");
      setMembros([]);
    } finally {
      setLoadingMembros(false);
    }
  }, []);

  useEffect(() => {
    carregarMembros(currentSetorId);
  }, [currentSetorId, carregarMembros]);

  const setoresFiltrados = useMemo(() => {
    return setores.filter(s => !qSetor || s.nome.toLowerCase().includes(qSetor.toLowerCase()));
  }, [setores, qSetor]);

  const membrosOrdenados = useMemo(
    () => [...membros].sort((a, b) => (a.usuario.nome ?? "").localeCompare(b.usuario.nome ?? "")),
    [membros],
  );

  /* ── CRUD de setores ── */
  async function criarSetor() {
    const nome = prompt("Nome do novo setor:")?.trim();
    if (!nome) return;
    setBusy(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/setores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      if (!res.ok) throw new Error(`Falha ao criar setor (${res.status})`);
      const novo = await res.json();
      toast.success("Setor criado.");
      await carregarSetores(novo?.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar setor");
    } finally {
      setBusy(false);
    }
  }

  async function renomearSetor() {
    if (!currentSetor) return;
    const nome = prompt("Novo nome do setor:", currentSetor.nome)?.trim();
    if (!nome || nome === currentSetor.nome) return;
    setBusy(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/setores/${currentSetor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      if (!res.ok) throw new Error(`Falha ao renomear (${res.status})`);
      toast.success("Setor renomeado.");
      await carregarSetores(currentSetor.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao renomear setor");
    } finally {
      setBusy(false);
    }
  }

  async function removerSetor() {
    if (!currentSetor) return;
    const temMembros = membros.length > 0;
    const msg = temMembros
      ? "Este setor possui membros. Remover mesmo assim? Os vínculos serão excluídos."
      : `Remover o setor "${currentSetor.nome}"?`;
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/setores/${currentSetor.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Falha ao remover (${res.status})`);
      toast.success("Setor removido.");
      await carregarSetores();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover setor");
    } finally {
      setBusy(false);
    }
  }

  /* ── Membros ── */
  async function trocarPapel(usuarioSetorId: string, novoPapelId: string) {
    setBusy(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/usuarios-setores/${usuarioSetorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ papelId: novoPapelId || null }),
      });
      if (!res.ok) throw new Error(`Falha ao alterar papel (${res.status})`);
      await carregarMembros(currentSetorId);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao alterar papel");
    } finally {
      setBusy(false);
    }
  }

  async function removerMembro(usuarioSetorId: string) {
    if (!confirm("Remover este funcionário do setor?")) return;
    setBusy(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/usuarios-setores/${usuarioSetorId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Falha ao remover membro (${res.status})`);
      toast.success("Membro removido do setor.");
      await carregarMembros(currentSetorId);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover membro");
    } finally {
      setBusy(false);
    }
  }

  async function atribuirUsuariosAoSetor(userIds: string[], papelId?: string | null) {
    if (!currentSetor || userIds.length === 0) return;
    setBusy(true);
    try {
      const resultados = await Promise.allSettled(
        userIds.map((uid) =>
          apiFetch(`${API_URL}/admin/usuarios/${uid}/setores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ setorId: currentSetor.id, papelId: papelId ?? null }),
          }).then((r) => {
            if (!r.ok) throw new Error(String(r.status));
          }),
        ),
      );
      const falhas = resultados.filter((r) => r.status === "rejected").length;
      if (falhas === 0) toast.success("Funcionários atribuídos ao setor.");
      else toast.warning(`${userIds.length - falhas} atribuído(s), ${falhas} com erro.`);
      setDrawerOpen(false);
      await carregarMembros(currentSetorId);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao atribuir funcionários");
    } finally {
      setBusy(false);
    }
  }

  const idsNoSetor = useMemo(() => new Set(membros.map((m) => m.usuarioId)), [membros]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Painel de lista de setores */}
      <aside className="xl:col-span-4">
        <div className="rounded-2xl border border-[var(--border)] bg-card p-3">
          <div className="px-2 py-2">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Buscar setor"
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9"
                value={qSetor}
                onChange={(e) => setQSetor(e.target.value)}
              />
            </div>
          </div>

          {loadingSetores ? (
            <div className="px-3 py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (
            <ul className="mt-2 space-y-1">
              {setoresFiltrados.map((s) => (
                <li key={s.id}>
                  <button
                    className={cx(
                      "w-full text-left rounded-lg px-3 py-2 transition flex items-center justify-between",
                      currentSetorId === s.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-[var(--muted)]/70"
                    )}
                    onClick={() => setCurrentSetorId(s.id)}
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="size-4 opacity-80" />
                      <span className="font-medium">{s.nome}</span>
                    </span>
                    {currentSetorId === s.id && (
                      <span className="inline-flex items-center gap-1 text-xs rounded-md border bg-background/20 px-1.5 py-0.5">
                        <Users className="size-3" /> {membros.length}
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {setoresFiltrados.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">Nenhum setor encontrado.</li>
              )}
            </ul>
          )}

          {/* Ações do catálogo */}
          <div className="mt-3 flex items-center justify-between px-2">
            <button
              onClick={criarSetor}
              disabled={busy}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:brightness-95 disabled:opacity-50"
            >
              <Plus className="size-4" /> Novo setor
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={renomearSetor}
                disabled={!currentSetor || busy}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] text-sm hover:bg-[var(--muted)] disabled:opacity-50"
              >
                <Pencil className="size-4" /> Renomear
              </button>
              <button
                onClick={removerSetor}
                disabled={!currentSetor || busy}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] text-sm hover:bg-[var(--muted)] disabled:opacity-50"
              >
                <Trash2 className="size-4" /> Remover
              </button>
            </div>
          </div>
        </div>

        {/* Dica UX */}
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-card p-4 text-sm text-muted-foreground">
          Dica: cada funcionário pode ter <b>papéis diferentes por setor</b> (ex.: Técnico em TI, Backoffice na Secretaria).
          Use o botão <i>Atribuir funcionários</i> para criar os vínculos.
        </div>
      </aside>

      {/* Painel de detalhes do setor selecionado */}
      <section className="xl:col-span-8">
        {!currentSetor ? (
          <div className="rounded-xl border border-[var(--border)] bg-card p-6 text-center text-muted-foreground">
            {loadingSetores ? "Carregando…" : "Nenhum setor cadastrado. Crie o primeiro à esquerda."}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header do setor */}
            <div className="rounded-xl border border-[var(--border)] bg-card p-4 flex items-center justify-between">
              <div>
                <h2 className="font-grotesk text-xl font-semibold">{currentSetor.nome}</h2>
                <p className="text-sm text-muted-foreground">Gerencie membros e papéis neste setor.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerOpen(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:brightness-95 disabled:opacity-50"
                >
                  <Plus className="size-4" /> Atribuir funcionários
                </button>
              </div>
            </div>

            {/* Membros */}
            <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
              <div className="px-4 py-3 bg-[var(--muted)] text-sm font-semibold flex items-center justify-between">
                <span>Membros do setor</span>
                <span className="text-muted-foreground font-normal">{membros.length} membro(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-background">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Funcionário</th>
                      <th className="text-left font-medium px-4 py-3 hidden md:table-cell">E-mail</th>
                      <th className="text-left font-medium px-4 py-3">Papel no setor</th>
                      <th className="text-right font-medium px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingMembros ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                          <Loader2 className="size-5 animate-spin inline" />
                        </td>
                      </tr>
                    ) : membrosOrdenados.map((m) => (
                      <tr key={m.id} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <AtivoDot ativo={m.usuario.ativo} />
                            <UserIcon className="size-4 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="font-medium leading-tight">{m.usuario.nome ?? "—"}</div>
                              <div className="md:hidden text-xs text-muted-foreground">{emailDe(m.usuario)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">{emailDe(m.usuario)}</td>
                        <td className="px-4 py-3">
                          <PapelBadge nome={m.papel?.nome} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <select
                              className="h-9 px-2 rounded-md border border-[var(--border)] bg-background text-sm disabled:opacity-50"
                              value={m.papelId ?? ""}
                              disabled={busy}
                              onChange={(e) => trocarPapel(m.id, e.target.value)}
                            >
                              <option value="">— sem papel —</option>
                              {papeis.map((p) => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                              ))}
                            </select>
                            <button
                              className="h-9 px-3 rounded-md hover:bg-[var(--muted)] disabled:opacity-50"
                              onClick={() => removerMembro(m.id)}
                              disabled={busy}
                              title="Remover do setor"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loadingMembros && membrosOrdenados.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                          Nenhum membro neste setor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Integração (atalhos) */}
            <div className="rounded-xl border border-[var(--border)] bg-card p-4">
              <div className="text-sm font-semibold mb-2">Atalhos</div>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/funcionarios" className="h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm inline-flex items-center gap-2">
                  <Users className="size-4" /> Gerenciar Funcionários
                </Link>
                <Link href="/admin/chamados" className="h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm inline-flex items-center gap-2">
                  <ArrowRightLeft className="size-4" /> Ver chamados por setor
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Drawer de atribuição */}
      {drawerOpen && currentSetor && (
        <AssignDrawer
          onClose={() => setDrawerOpen(false)}
          usuarios={usuarios}
          idsNoSetor={idsNoSetor}
          setor={currentSetor}
          papeis={papeis}
          busy={busy}
          onAssign={atribuirUsuariosAoSetor}
        />
      )}
    </div>
  );
}

/* ===================== Drawer ===================== */
function AssignDrawer({
  onClose,
  usuarios,
  idsNoSetor,
  setor,
  papeis,
  busy,
  onAssign,
}: {
  onClose: () => void;
  usuarios: Usuario[];
  idsNoSetor: Set<string>;
  setor: Setor;
  papeis: PapelCatalogo[];
  busy: boolean;
  onAssign: (userIds: string[], papelId?: string | null) => void;
}) {
  const [q, setQ] = useState("");
  const [papelId, setPapelId] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const candidatos = useMemo(() => {
    return usuarios
      .filter(u => !idsNoSetor.has(u.id))
      .filter(u =>
        !q ||
        emailDe(u).toLowerCase().includes(q.toLowerCase()) ||
        (u.nome?.toLowerCase().includes(q.toLowerCase()) ?? false)
      )
      .sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? ""));
  }, [usuarios, q, idsNoSetor]);

  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[92%] sm:w-[520px] bg-background shadow-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="font-grotesk font-semibold">Atribuir funcionários — {setor.nome}</div>
          <button
            className="inline-grid place-items-center size-9 rounded-md hover:bg-[var(--muted)]"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-card p-3 space-y-3">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Buscar por nome ou e-mail"
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <select
              className="h-10 w-[220px] rounded-lg border border-[var(--border)] bg-background px-3"
              value={papelId}
              onChange={(e) => setPapelId(e.target.value)}
            >
              <option value="">Papel (opcional)</option>
              {papeis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          <div className="max-h-[60vh] overflow-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Selecionar</th>
                  <th className="text-left font-medium px-3 py-2">Funcionário</th>
                  <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">E-mail</th>
                </tr>
              </thead>
              <tbody>
                {candidatos.map(u => (
                  <tr key={u.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={selected.has(u.id)}
                          onChange={() => toggle(u.id)}
                        />
                        <span className="sr-only">Selecionar</span>
                      </label>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <AtivoDot ativo={u.ativo} />
                        <span className="font-medium">{u.nome ?? "—"}</span>
                      </div>
                      <div className="sm:hidden text-xs text-muted-foreground">{emailDe(u)}</div>
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell">{emailDe(u)}</td>
                  </tr>
                ))}
                {candidatos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                      Nenhum funcionário disponível com esse filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{selected.size} selecionado(s)</div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => onAssign(Array.from(selected), papelId || null)}
                disabled={selected.size === 0 || busy}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:brightness-95 disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Atribuir ao setor
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Dica: se nenhum papel for escolhido, o vínculo é criado sem papel e pode ser definido depois.
        </div>
      </div>
    </div>
  );
}

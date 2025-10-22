"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, Plus, Building2, Users, Pencil, Trash2, X, Check, ChevronRight,
  User as UserIcon, BadgeCheck, Filter, ArrowRightLeft
} from "lucide-react";

/* ===================== Tipos alinhados ao seu schema ===================== */
type PapelKey = "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";

type PapelCatalogo = {
  id: string;
  nome: PapelKey;           // em seu schema o nome é único
  descricao?: string | null;
};

type Usuario = {
  id: string;
  nome?: string | null;
  emailEducacional: string;
  emailPessoal?: string | null;
  ativo: boolean;
};

type Setor = {
  id: string;
  nome: string;
  descricao?: string | null;
};

type UsuarioSetor = {
  id: string;
  usuarioId: string;
  setorId: string;
  papelId?: string | null;
};

/* ===================== MOCK ===================== */
const PAPEIS: PapelCatalogo[] = [
  { id: "p1", nome: "BACKOFFICE" },
  { id: "p2", nome: "TECNICO" },
  { id: "p3", nome: "ADMINISTRADOR" },
];

const SETORES: Setor[] = [
  { id: "s1", nome: "Secretaria" },
  { id: "s2", nome: "Financeiro" },
  { id: "s3", nome: "TI Acadêmica" },
];

const USERS: Usuario[] = [
  { id: "u1", nome: "Ana Pereira", emailEducacional: "ana.pereira@fatec.sp.gov.br", ativo: true },
  { id: "u2", nome: "Bruno Santos", emailEducacional: "bruno.santos@fatec.sp.gov.br", ativo: true },
  { id: "u3", nome: "Carla Mendes", emailEducacional: "carla.mendes@fatec.sp.gov.br", ativo: true },
  { id: "u4", nome: "Diego Lima", emailEducacional: "diego.lima@fatec.sp.gov.br", ativo: false },
];

const USUARIOS_SETORES: UsuarioSetor[] = [
  { id: "us1", usuarioId: "u1", setorId: "s1", papelId: "p3" }, // Ana — Secretaria — ADMIN
  { id: "us2", usuarioId: "u2", setorId: "s3", papelId: "p2" }, // Bruno — TI — TECNICO
  { id: "us3", usuarioId: "u3", setorId: "s2", papelId: "p1" }, // Carla — Financeiro — BACKOFFICE
];

/* ===================== Utils ===================== */
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
const papelById = (id?: string | null) => PAPEIS.find(p => p.id === id) ?? null;

/* ===================== Chips / Badges ===================== */
function PapelBadge({ papelId }: { papelId?: string | null }) {
  const papel = papelById(papelId)?.nome;
  const map: Record<PapelKey, string> = {
    BACKOFFICE: "bg-slate-500/12 text-slate-600 border-slate-500/30",
    TECNICO: "bg-indigo-500/12 text-indigo-600 border-indigo-500/30",
    ADMINISTRADOR: "bg-emerald-500/12 text-emerald-600 border-emerald-500/30",
  };
  if (!papel) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border", map[papel])}>
      <BadgeCheck className="size-3" /> {papel}
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
  // Em um app real, estes estados viriam do backend (fetch + useEffect).
  const [setores, setSetores] = useState<Setor[]>(SETORES);
  const [usuarios, setUsuarios] = useState<Usuario[]>(USERS);
  const [rel, setRel] = useState<UsuarioSetor[]>(USUARIOS_SETORES);

  const [qSetor, setQSetor] = useState("");
  const [currentSetorId, setCurrentSetorId] = useState<string>(setores[0]?.id ?? "");
  const currentSetor = setores.find(s => s.id === currentSetorId) ?? null;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const setoresFiltrados = useMemo(() => {
    return setores
      .map(s => ({
        ...s,
        count: rel.filter(r => r.setorId === s.id).length,
      }))
      .filter(s => !qSetor || s.nome.toLowerCase().includes(qSetor.toLowerCase()));
  }, [setores, rel, qSetor]);

  const membrosDoSetor = useMemo(() => {
    if (!currentSetor) return [];
    const rows = rel.filter(r => r.setorId === currentSetor.id)
      .map(r => {
        const u = usuarios.find(x => x.id === r.usuarioId)!;
        return { usId: r.id, usuario: u, papelId: r.papelId };
      })
      .sort((a, b) => (a.usuario.nome ?? "").localeCompare(b.usuario.nome ?? ""));
    return rows;
  }, [currentSetor, rel, usuarios]);

  function criarSetor() {
    const nome = prompt("Nome do novo setor:");
    if (!nome) return;
    const novo: Setor = { id: `s${Date.now()}`, nome };
    setSetores(prev => [...prev, novo]);
    setCurrentSetorId(novo.id);
  }

  function renomearSetor() {
    if (!currentSetor) return;
    const nome = prompt("Novo nome do setor:", currentSetor.nome);
    if (!nome) return;
    setSetores(prev => prev.map(s => (s.id === currentSetor.id ? { ...s, nome } : s)));
  }

  function removerSetor() {
    if (!currentSetor) return;
    const temMembros = rel.some(r => r.setorId === currentSetor.id);
    if (temMembros && !confirm("Este setor possui membros. Remover mesmo assim? As relações serão excluídas.")) {
      return;
    }
    setRel(prev => prev.filter(r => r.setorId !== currentSetor.id));
    setSetores(prev => prev.filter(s => s.id !== currentSetor.id));
    setCurrentSetorId(setores.find(s => s.id !== currentSetor.id)?.id ?? "");
  }

  function trocarPapel(usId: string, novoPapelId: string) {
    setRel(prev => prev.map(r => (r.id === usId ? { ...r, papelId: novoPapelId } : r)));
  }

  function removerMembro(usId: string) {
    setRel(prev => prev.filter(r => r.id !== usId));
  }

  function atribuirUsuariosAoSetor(userIds: string[], papelId?: string | null) {
    if (!currentSetor) return;
    const novos: UsuarioSetor[] = [];
    for (const uid of userIds) {
      const existe = rel.some(r => r.setorId === currentSetor.id && r.usuarioId === uid);
      if (!existe) {
        novos.push({ id: `us${Date.now()}-${uid}`, usuarioId: uid, setorId: currentSetor.id, papelId: papelId ?? null });
      }
    }
    if (novos.length === 0) return;
    setRel(prev => [...prev, ...novos]);
  }

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
                  <span className="inline-flex items-center gap-1 text-xs rounded-md border bg-background px-1.5 py-0.5">
                    <Users className="size-3" /> {s.count}
                  </span>
                </button>
              </li>
            ))}
            {setoresFiltrados.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">Nenhum setor encontrado.</li>
            )}
          </ul>

          {/* Ações do catálogo */}
          <div className="mt-3 flex items-center justify-between px-2">
            <button
              onClick={criarSetor}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:brightness-95"
            >
              <Plus className="size-4" /> Novo setor
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={renomearSetor}
                disabled={!currentSetor}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] text-sm hover:bg-[var(--muted)] disabled:opacity-50"
              >
                <Pencil className="size-4" /> Renomear
              </button>
              <button
                onClick={removerSetor}
                disabled={!currentSetor}
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
          Use o botão <i>Atribuir funcionários</i> para criar relações <code>UsuarioSetor</code>.
        </div>
      </aside>

      {/* Painel de detalhes do setor selecionado */}
      <section className="xl:col-span-8">
        {!currentSetor ? (
          <div className="rounded-xl border border-[var(--border)] bg-card p-6 text-center text-muted-foreground">
            Selecione um setor à esquerda.
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
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:brightness-95"
                >
                  <Plus className="size-4" /> Atribuir funcionários
                </button>
              </div>
            </div>

            {/* Membros */}
            <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
              <div className="px-4 py-3 bg-[var(--muted)] text-sm font-semibold flex items-center justify-between">
                <span>Membros do setor</span>
                <span className="text-muted-foreground font-normal">{membrosDoSetor.length} membro(s)</span>
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
                    {membrosDoSetor.map((m) => (
                      <tr key={m.usId} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <AtivoDot ativo={m.usuario.ativo} />
                            <UserIcon className="size-4 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="font-medium leading-tight">{m.usuario.nome ?? "—"}</div>
                              <div className="md:hidden text-xs text-muted-foreground">{m.usuario.emailEducacional}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">{m.usuario.emailEducacional}</td>
                        <td className="px-4 py-3">
                          <PapelBadge papelId={m.papelId} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Trocar papel (dropdown simples) */}
                            <select
                              className="h-9 px-2 rounded-md border border-[var(--border)] bg-background text-sm"
                              value={m.papelId ?? ""}
                              onChange={(e) => trocarPapel(m.usId, e.target.value || "")}
                            >
                              <option value="">—</option>
                              {PAPEIS.map((p) => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                              ))}
                            </select>
                            <button
                              className="h-9 px-3 rounded-md hover:bg-[var(--muted)]"
                              onClick={() => removerMembro(m.usId)}
                              title="Remover do setor"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {membrosDoSetor.length === 0 && (
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
          rel={rel}
          setor={currentSetor}
          papeis={PAPEIS}
          onAssign={(ids, papel) => {
            atribuirUsuariosAoSetor(ids, papel);
            setDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ===================== Drawer ===================== */
function AssignDrawer({
  onClose,
  usuarios,
  rel,
  setor,
  papeis,
  onAssign,
}: {
  onClose: () => void;
  usuarios: Usuario[];
  rel: UsuarioSetor[];
  setor: Setor;
  papeis: PapelCatalogo[];
  onAssign: (userIds: string[], papelId?: string | null) => void;
}) {
  const [q, setQ] = useState("");
  const [papelId, setPapelId] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const jaNoSetor = new Set(rel.filter(r => r.setorId === setor.id).map(r => r.usuarioId));

  const candidatos = useMemo(() => {
    return usuarios
      .filter(u => !jaNoSetor.has(u.id))
      .filter(u =>
        !q ||
        u.emailEducacional.toLowerCase().includes(q.toLowerCase()) ||
        (u.nome?.toLowerCase().includes(q.toLowerCase()) ?? false)
      )
      .sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? ""));
  }, [usuarios, q, jaNoSetor]);

  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function confirmAssign() {
    onAssign(Array.from(selected), papelId || null);
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[92%] sm:w-[520px] bg-background shadow-xl p-4">
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
                      <div className="sm:hidden text-xs text-muted-foreground">{u.emailEducacional}</div>
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell">{u.emailEducacional}</td>
                  </tr>
                ))}
                {candidatos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                      Nenhum candidato disponível com esse filtro.
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
                onClick={confirmAssign}
                disabled={selected.size === 0}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:brightness-95 disabled:opacity-50"
              >
                <Check className="size-4" /> Atribuir ao setor
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Dica: se nenhum papel for escolhido, a relação é criada sem papel e pode ser definida depois.
        </div>
      </div>
    </div>
  );
}

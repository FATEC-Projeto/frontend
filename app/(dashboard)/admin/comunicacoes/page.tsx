"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Mail, Eye, Send, Download, Upload, Save, Check, X,
  Filter, ToggleLeft, ToggleRight, FileText, TriangleAlert
} from "lucide-react";
import { toast } from "sonner";
import { cx } from '../../../../utils/cx'
import { apiFetch } from "../../../../utils/api";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type TemplateKey =
  | "WELCOME_FIRST_ACCESS"
  | "PASSWORD_RESET"
  | "TICKET_OPENED"
  | "TICKET_STATUS_UPDATED"
  | "TICKET_RESOLVED"
  | "TICKET_WAITING_USER"
  | "TICKET_NEW_MESSAGE"
  | "TICKET_NEW_ATTACHMENT";

type Template = {
  id: string;
  key: TemplateKey;
  nome: string;
  descricao?: string;
  habilitado: boolean;
  assunto: string;
  corpo: string; // HTML simples ou text; aqui editamos como texto com variáveis
  variaveis: string[]; // lista de chaves disponíveis {{...}}
};


/** ---- Mock inicial (você vai carregar do backend futuramente) ---- */
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "tpl-01",
    key: "WELCOME_FIRST_ACCESS",
    nome: "Bem-vindo — Primeiro acesso",
    descricao: "Enviado quando o cadastro/aluno é criado no sistema.",
    habilitado: true,
    assunto: "Bem-vindo, {{aluno.nome}}! Seu acesso ao Portal do Aluno",
    corpo:
      `Olá {{aluno.nome}},<br/><br/>
      Seja bem-vindo(a) ao Portal do Aluno da {{organizacao.nome}}.<br/>
      Acesse: {{links.portalAluno}}<br/>
      Se for seu primeiro acesso, redefina a senha aqui: {{links.redefinirSenha}}.<br/><br/>
      Atenciosamente,<br/>{{organizacao.sigla}}`,
    variaveis: ["aluno.nome", "organizacao.nome", "organizacao.sigla", "links.portalAluno", "links.redefinirSenha"],
  },
  {
    id: "tpl-02",
    key: "PASSWORD_RESET",
    nome: "Resetar senha",
    descricao: "Enviado ao gerar um TokenResetSenha.",
    habilitado: true,
    assunto: "Redefinição de senha — {{organizacao.sigla}}",
    corpo:
      `Olá {{aluno.nome}},<br/><br/>
      Recebemos sua solicitação para redefinir a senha. Use o link:<br/>
      {{links.resetSenha}}<br/><br/>
      Este link expira em {{token.expiraEm}}.<br/><br/>
      Se você não solicitou, ignore este e-mail.`,
    variaveis: ["aluno.nome", "links.resetSenha", "token.expiraEm", "organizacao.sigla"],
  },
  {
    id: "tpl-03",
    key: "TICKET_OPENED",
    nome: "Chamado aberto",
    descricao: "Confirmar abertura de chamado ao aluno.",
    habilitado: true,
    assunto: "Chamado {{chamado.protocolo}} aberto",
    corpo:
      `Olá {{aluno.nome}},<br/><br/>
      Seu chamado <b>{{chamado.protocolo}}</b> foi aberto com o título: “{{chamado.titulo}}”.<br/>
      Nível: {{chamado.nivel}} — Prioridade: {{chamado.prioridade}} — Setor: {{setor.nome}}<br/>
      Acompanhe: {{links.portalAlunoChamado}}`,
    variaveis: ["aluno.nome", "chamado.protocolo", "chamado.titulo", "chamado.nivel", "chamado.prioridade", "setor.nome", "links.portalAlunoChamado"],
  },
  {
    id: "tpl-04",
    key: "TICKET_STATUS_UPDATED",
    nome: "Atualização de chamado (status)",
    descricao: "Enviado quando o status muda em HistoricoStatusChamado.",
    habilitado: true,
    assunto: "Chamado {{chamado.protocolo}} — atualizado para {{chamado.status}}",
    corpo:
      `Olá {{aluno.nome}},<br/><br/>
      Seu chamado {{chamado.protocolo}} foi atualizado para <b>{{chamado.status}}</b>.<br/>
      Observação: {{historico.observacao}}<br/>
      Acompanhe: {{links.portalAlunoChamado}}`,
    variaveis: ["aluno.nome", "chamado.protocolo", "chamado.status", "historico.observacao", "links.portalAlunoChamado"],
  },
  {
    id: "tpl-05",
    key: "TICKET_RESOLVED",
    nome: "Chamado resolvido",
    descricao: "Aviso de resolução para o aluno.",
    habilitado: true,
    assunto: "Chamado {{chamado.protocolo}} resolvido",
    corpo:
      `Olá {{aluno.nome}},<br/><br/>
      Seu chamado {{chamado.protocolo}} foi marcado como <b>Resolvido</b>.<br/>
      Caso o problema persista, reabra pelo portal: {{links.portalAlunoChamado}}`,
    variaveis: ["aluno.nome", "chamado.protocolo", "links.portalAlunoChamado"],
  },
  {
    id: "tpl-06",
    key: "TICKET_WAITING_USER",
    nome: "Aguardando ação do aluno",
    descricao: "Status AGUARDANDO_USUARIO — pedir resposta/documentos.",
    habilitado: true,
    assunto: "Chamado {{chamado.protocolo}} — aguardando sua ação",
    corpo:
      `Olá {{aluno.nome}},<br/><br/>
      Seu chamado {{chamado.protocolo}} está aguardando sua ação.<br/>
      Por favor, acesse o portal para responder ou anexar documentos: {{links.portalAlunoChamado}}`,
    variaveis: ["aluno.nome", "chamado.protocolo", "links.portalAlunoChamado"],
  },
  {
    id: "tpl-07",
    key: "TICKET_NEW_MESSAGE",
    nome: "Nova mensagem no chamado",
    descricao: "Enviado quando uma Mensagem é adicionada ao Chamado.",
    habilitado: true,
    assunto: "Nova mensagem — chamado {{chamado.protocolo}}",
    corpo:
      `Olá {{aluno.nome}},<br/><br/>
      Há uma nova mensagem no chamado {{chamado.protocolo}} de {{autor.nome}}:<br/>
      “{{mensagem.conteudo}}”<br/><br/>
      Responda pelo portal: {{links.portalAlunoChamado}}`,
    variaveis: ["aluno.nome", "chamado.protocolo", "autor.nome", "mensagem.conteudo", "links.portalAlunoChamado"],
  },
  {
    id: "tpl-08",
    key: "TICKET_NEW_ATTACHMENT",
    nome: "Novo anexo no chamado",
    descricao: "Enviado quando um Anexo é incluído no Chamado.",
    habilitado: true,
    assunto: "Novo anexo — chamado {{chamado.protocolo}}",
    corpo:
      `Olá {{aluno.nome}},<br/><br/>
      Um novo anexo foi adicionado ao chamado {{chamado.protocolo}}: {{anexo.nomeArquivo}} ({{anexo.tamanhoBytes}} bytes).<br/>
      Veja no portal: {{links.portalAlunoChamado}}`,
    variaveis: ["aluno.nome", "chamado.protocolo", "anexo.nomeArquivo", "anexo.tamanhoBytes", "links.portalAlunoChamado"],
  },
];

/** Mock data para pré-visualização (substitui {{chaves}}) */
const MOCK_DATA: Record<string, string> = {
  "aluno.nome": "João da Silva",
  "organizacao.nome": "Faculdade de Tecnologia",
  "organizacao.sigla": "FATEC",
  "links.portalAluno": "https://portal.exemplo/aluno",
  "links.redefinirSenha": "https://portal.exemplo/reset",
  "links.resetSenha": "https://portal.exemplo/reset?token=abc",
  "links.portalAlunoChamado": "https://portal.exemplo/chamados/WF-2025-0101",
  "token.expiraEm": "2 horas",
  "chamado.protocolo": "WF-2025-0101",
  "chamado.titulo": "Erro no acesso ao SIGA",
  "chamado.status": "EM_ATENDIMENTO",
  "chamado.nivel": "N2",
  "chamado.prioridade": "ALTA",
  "setor.nome": "Secretaria",
  "historico.observacao": "Encaminhado ao setor responsável.",
  "autor.nome": "Atendente Ana",
  "mensagem.conteudo": "Poderia anexar seu histórico?",
  "anexo.nomeArquivo": "comprovante.pdf",
  "anexo.tamanhoBytes": "128934",
};

function applyVars(text: string, vars: string[]) {
  let out = text;
  for (const key of vars) {
    const val = MOCK_DATA[key] ?? `{{${key}}}`;
    const re = new RegExp(`{{\\s*${key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*}}`, "g");
    out = out.replace(re, val);
  }
  return out;
}

export default function ComunicacoesPage() {
  const [query, setQuery] = useState("");
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [currentId, setCurrentId] = useState<string>(DEFAULT_TEMPLATES[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  // Versão "limpa" (última salva/carregada) de cada template, para descartar edições.
  const baselineRef = useRef<Map<string, Template>>(new Map(DEFAULT_TEMPLATES.map((t) => [t.id, t])));

  const markClean = (id: string, snapshot: Template) => {
    baselineRef.current.set(id, snapshot);
    setDirty((prev) => {
      if (!prev.has(id)) return prev;
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  /* Carrega os templates persistidos e mescla sobre os defaults (por chave). */
  useEffect(() => {
    apiFetch(`${API_URL}/admin/comunicacoes`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const persistidos: Array<Partial<Template> & { chave: string }> = json?.data ?? [];
        if (persistidos.length === 0) return;
        const porChave = new Map(persistidos.map((p) => [p.chave, p]));
        setTemplates((prev) =>
          prev.map((t) => {
            const salvo = porChave.get(t.key);
            if (!salvo) return t;
            const merged = {
              ...t,
              nome: salvo.nome ?? t.nome,
              descricao: salvo.descricao ?? t.descricao,
              habilitado: salvo.habilitado ?? t.habilitado,
              assunto: salvo.assunto ?? t.assunto,
              corpo: salvo.corpo ?? t.corpo,
              variaveis: (salvo.variaveis as string[] | undefined) ?? t.variaveis,
            };
            baselineRef.current.set(t.id, merged); // baseline = versão carregada
            return merged;
          }),
        );
      })
      .catch(() => {});
  }, []);

  // Avisa ao fechar/recarregar a aba com edições pendentes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty.size === 0) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Troca de template pedindo confirmação se houver edições não salvas.
  function requestSwitch(id: string) {
    if (id === currentId) return;
    if (dirty.has(currentId)) { setPendingSwitch(id); return; }
    setCurrentId(id);
  }

  function discardAndSwitch() {
    const base = baselineRef.current.get(currentId);
    if (base) {
      setTemplates((prev) => prev.map((t) => (t.id === currentId ? base : t)));
    }
    setDirty((prev) => {
      const n = new Set(prev);
      n.delete(currentId);
      return n;
    });
    if (pendingSwitch) setCurrentId(pendingSwitch);
    setPendingSwitch(null);
  }

  async function persistir(t: Template) {
    const res = await apiFetch(`${API_URL}/admin/comunicacoes/${encodeURIComponent(t.key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: t.nome,
        descricao: t.descricao ?? null,
        habilitado: t.habilitado,
        assunto: t.assunto,
        corpo: t.corpo,
        variaveis: t.variaveis,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error || `Erro ${res.status}`);
    }
  }

  async function salvarTemplate() {
    if (!current) return;
    setSaving(true);
    try {
      await persistir(current);
      markClean(current.id, current); // vira a nova baseline; limpa o "sujo"
      toast.success("Template salvo.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao salvar template");
    } finally {
      setSaving(false);
    }
  }

  const current = useMemo(
    () => templates.find((t) => t.id === currentId) ?? null,
    [templates, currentId]
  );

  const list = useMemo(() => {
    return templates.filter(t =>
      !query ||
      t.nome.toLowerCase().includes(query.toLowerCase()) ||
      t.key.toLowerCase().includes(query.toLowerCase())
    );
  }, [templates, query]);

  async function toggleEnabled(id: string) {
    const alvo = templates.find((t) => t.id === id);
    if (!alvo) return;
    const atualizado = { ...alvo, habilitado: !alvo.habilitado };
    setTemplates((prev) => prev.map(t => t.id === id ? atualizado : t));
    try {
      await persistir(atualizado);
      baselineRef.current.set(id, atualizado); // mantém a baseline em sincronia
    } catch (e: any) {
      // Reverte em caso de falha na persistência.
      setTemplates((prev) => prev.map(t => t.id === id ? alvo : t));
      toast.error(e?.message ?? "Falha ao atualizar status do template");
    }
  }

  function updateField<K extends keyof Template>(field: K, value: Template[K]) {
    setTemplates((prev) => prev.map(t => t.id === currentId ? { ...t, [field]: value } : t));
    setDirty((prev) => (prev.has(currentId) ? prev : new Set(prev).add(currentId)));
  }

  async function sendTest() {
    if (!current) return;
    const to = prompt("Enviar e-mail de teste para qual endereço?");
    if (!to) return;
    setTesting(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/comunicacoes/teste`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), assunto: current.assunto, corpo: current.corpo }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any)?.error || `Erro ${res.status}`);
      toast.success((json as any)?.message ?? `E-mail de teste enviado para ${to}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar e-mail de teste");
    } finally {
      setTesting(false);
    }
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(templates, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "templates_comunicacoes.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Template[];
        // validação básica
        if (!Array.isArray(data)) throw new Error("JSON inválido");
        setTemplates(data);
        setCurrentId(data[0]?.id ?? "");
      } catch (err) {
        alert("Erro ao importar JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Catálogo de templates */}
      <aside className="xl:col-span-4">
        <div className="rounded-2xl border border-[var(--border)] bg-card p-3">
          <div className="px-2 py-2">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Buscar template por nome ou chave"
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <ul className="mt-2 space-y-1">
            {list.map((t) => (
              <li key={t.id}>
                <button
                  className={cx(
                    "w-full text-left rounded-lg px-3 py-2 transition flex items-center justify-between",
                    currentId === t.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-[var(--muted)]/70"
                  )}
                  onClick={() => requestSwitch(t.id)}
                >
                  <span className="flex items-center gap-2">
                    <Mail className="size-4 opacity-80" />
                    <span className="font-medium">{t.nome}</span>
                    {dirty.has(t.id) && (
                      <span className="size-1.5 rounded-full bg-amber-500" title="Alterações não salvas" />
                    )}
                  </span>
                  <span
                    className={cx(
                      "inline-flex items-center gap-1 text-xs rounded-md border px-1.5 py-0.5",
                      t.habilitado ? "border-[var(--success)] text-[var(--success)]" : "border-[var(--border)] text-muted-foreground"
                    )}
                    onClick={(e) => { e.stopPropagation(); toggleEnabled(t.id); }}
                    title={t.habilitado ? "Desativar" : "Ativar"}
                  >
                    {t.habilitado ? <><ToggleRight className="size-3" /> Ativo</> : <><ToggleLeft className="size-3" /> Inativo</>}
                  </span>
                </button>
                <div className="px-3 pb-2 text-xs text-muted-foreground">{t.descricao}</div>
              </li>
            ))}
            {list.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                Nenhum template encontrado.
              </li>
            )}
          </ul>

          {/* Import/Export */}
          <div className="mt-3 flex items-center justify-between px-2">
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
          </div>
        </div>


        {/* <div className="mt-4 rounded-xl border border-[var(--border)] bg-card p-4 text-sm">
          <div className="font-semibold mb-1">Sugestões (schema)</div>
          <ul className="list-disc pl-4 text-muted-foreground space-y-1">
            <li><b>Reset de senha</b>: usar <code>TokenResetSenha</code> ({{`token.expiraEm`}}).</li>
            <li><b>Status do chamado</b>: basear em <code>HistoricoStatusChamado</code> ({{`historico.observacao`}}).</li>
            <li><b>Nova mensagem</b>: evento em <code>Mensagem</code> ({{`mensagem.conteudo`}}).</li>
            <li><b>Novo anexo</b>: evento em <code>Anexo</code> ({{`anexo.nomeArquivo`}}, {{`anexo.tamanhoBytes`}}).</li>
            <li>Persistir envios em <code>EmailEnvio</code> (log/auditoria).</li>
          </ul>
        </div> */}
      </aside>

      {/* Editor + Preview */}
      <section className="xl:col-span-8">
        {!current ? (
          <div className="rounded-xl border border-[var(--border)] bg-card p-6 text-center text-muted-foreground">
            Selecione um template à esquerda para editar.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="rounded-xl border border-[var(--border)] bg-card p-4">
              <div className="mb-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Chave</div>
                <div className="inline-flex items-center gap-2 text-sm border border-[var(--border)] bg-background rounded-md px-2 py-1">
                  <FileText className="size-4" />
                  {current.key}
                </div>
              </div>

              <label className="text-sm font-medium">Assunto</label>
              <input
                value={current.assunto}
                onChange={(e) => updateField("assunto", e.target.value)}
                className="mt-1 mb-3 w-full h-10 rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />

              {/* <label className="text-sm font-medium">Corpo (suporta variáveis {{`{{chave}}`}})</label> */}
              <textarea
                value={current.corpo}
                onChange={(e) => updateField("corpo", e.target.value)}
                className="mt-1 w-full min-h-[220px] rounded-lg border border-[var(--border)] bg-input p-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />

              {/* Variáveis disponíveis */}
              <div className="mt-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Variáveis disponíveis</div>
                <div className="flex flex-wrap gap-1.5">
                  {current.variaveis.map((v) => (
                    <span key={v} className="text-xs rounded-md border border-[var(--border)] bg-background px-2 py-0.5">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95 disabled:opacity-60"
                  onClick={salvarTemplate}
                  disabled={saving || !dirty.has(current.id)}
                >
                  <Save className="size-4" /> {saving ? "Salvando…" : "Salvar"}
                </button>
                {dirty.has(current.id) && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    Alterações não salvas
                  </span>
                )}
                <button
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-sm hover:bg-[var(--muted)] disabled:opacity-60"
                  onClick={sendTest}
                  disabled={testing}
                >
                  <Send className="size-4" /> {testing ? "Enviando…" : "Enviar teste"}
                </button>
                <button
                  className={cx(
                    "inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm border",
                    current.habilitado
                      ? "border-[var(--success)] text-[var(--success)]"
                      : "border-[var(--border)] text-muted-foreground"
                  )}
                  onClick={() => toggleEnabled(current.id)}
                >
                  {current.habilitado ? <><Check className="size-4" /> Habilitado</> : <><X className="size-4" /> Desabilitado</>}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-[var(--border)] bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold inline-flex items-center gap-2">
                  <Eye className="size-4" /> Pré-visualização
                </div>
                <div className="text-xs text-muted-foreground">Substituição com dados de exemplo</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-background p-3 text-sm leading-relaxed">
                <div className="font-medium mb-2">{applyVars(current.assunto, current.variaveis)}</div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: applyVars(current.corpo, current.variaveis) }}
                />
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Dica: você pode suportar **Markdown → HTML** no backend, e aqui editar em Markdown.
              </div>
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={pendingSwitch !== null}
        title="Descartar alterações não salvas?"
        description="Você editou este template mas não salvou. Trocar de template vai descartar as alterações."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        variant="danger"
        onConfirm={discardAndSwitch}
        onClose={() => setPendingSwitch(null)}
      />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Mail, Eye, Send, Download, Upload, Save, Check, X,
  Filter, ToggleLeft, ToggleRight, FileText, TriangleAlert
} from "lucide-react";
import { cx } from '../../../../utils/cx'

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
  const [currentId, setCurrentId] = useState<string>(templates[0]?.id ?? "");
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  function toggleEnabled(id: string) {
    setTemplates((prev) => prev.map(t => t.id === id ? { ...t, habilitado: !t.habilitado } : t));
  }

  function updateField<K extends keyof Template>(field: K, value: Template[K]) {
    setTemplates((prev) => prev.map(t => t.id === currentId ? { ...t, [field]: value } : t));
  }

  function sendTest() {
    if (!current) return;
    // TODO: POST /admin/comunicacoes/teste { templateKey, to }
    alert(`(stub) Enviar teste do template: ${current.nome}`);
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
                  onClick={() => setCurrentId(t.id)}
                >
                  <span className="flex items-center gap-2">
                    <Mail className="size-4 opacity-80" />
                    <span className="font-medium">{t.nome}</span>
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
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95"
                  onClick={() => alert("(stub) Salvar alterações")}
                >
                  <Save className="size-4" /> Salvar
                </button>
                <button
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-sm hover:bg-[var(--muted)]"
                  onClick={sendTest}
                >
                  <Send className="size-4" /> Enviar teste
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
    </div>
  );
}

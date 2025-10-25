"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HelpCircle, Search, MessageSquare, BookOpenCheck, ExternalLink } from "lucide-react";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";

type FAQ = {
  id: string;
  categoria: "Acesso & Senha" | "Acadêmico" | "Documentos" | "Plataforma";
  pergunta: string;
  resposta: string;
  links?: { label: string; href: string }[];
};

const FAQS: FAQ[] = [
  {
    id: "faq-1",
    categoria: "Acesso & Senha",
    pergunta: "Esqueci minha senha. Como redefinir?",
    resposta:
      "Use a opção “Esqueci a senha” na tela de login. Você receberá um e-mail com instruções. Se não encontrar, verifique a caixa de spam e confirme se seu e-mail educacional está correto em Meus Dados.",
    links: [{ label: "Recuperar Senha", href: "/recuperar-senha" }],
  },
  {
    id: "faq-2",
    categoria: "Acesso & Senha",
    pergunta: "Não consigo acessar meu e-mail educacional.",
    resposta:
      "Verifique se o e-mail educacional está cadastrado corretamente em Meus Dados. Em caso de erro de senha institucional, solicite a troca pelo serviço de ‘Troca de senha’ no catálogo.",
    links: [{ label: "Catálogo de Serviços", href: "/aluno/catalogo" }],
  },
  {
    id: "faq-3",
    categoria: "Acadêmico",
    pergunta: "Como peço revisão de nota?",
    resposta:
      "Acesse Catálogo → Secretaria → ‘Revisão de nota’. Abra um chamado com a disciplina, avaliação e justificativa. Anexe documentos se necessário.",
    links: [{ label: "Abrir chamado (Revisão de nota)", href: "/aluno/novo-chamado?servicoId=revisao-nota" }],
  },
  {
    id: "faq-4",
    categoria: "Documentos",
    pergunta: "Onde emito meu histórico escolar?",
    resposta:
      "No Catálogo, procure por ‘Histórico escolar’ ou ‘Declarações’. Abra um chamado e acompanhe o andamento em ‘Meus chamados’.",
    links: [
      { label: "Catálogo de Serviços", href: "/aluno/catalogo" },
      { label: "Meus Chamados", href: "/aluno/chamados" },
    ],
  },
  {
    id: "faq-6",
    categoria: "Plataforma",
    pergunta: "Minhas notificações não chegam.",
    resposta:
      "Confira se o seu e-mail pessoal e educacional estão corretos em Meus Dados. Ative notificações do navegador e verifique a caixa de spam.",
    links: [{ label: "Meus Dados", href: "/aluno/dados" }],
  },
];

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ---------- Acordeon simples ---------- */
function FAQItem({ f }: { f: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card">
      <button
        className="w-full text-left px-4 py-3 sm:px-5 sm:py-4 flex items-start justify-between gap-3"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.categoria}</div>
          <h3 className="font-medium leading-tight">{f.pergunta}</h3>
        </div>
        <HelpCircle className={cx("size-5 shrink-0 transition", open && "rotate-45 opacity-80")} />
      </button>
      {open && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm text-foreground/90">
          <p className="mb-3">{f.resposta}</p>
          {f.links && f.links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {f.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-xs"
                >
                  {l.label} <ExternalLink className="size-3.5 opacity-70" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AjudaAlunoPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"ALL" | "Acesso & Senha" | "Acadêmico" | "Documentos" | "Plataforma">("ALL");

  const categorias = useMemo(
    () => ["Acesso & Senha", "Acadêmico", "Documentos", "Plataforma"] as FAQ["categoria"][],
    []
  );

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return FAQS.filter((f) => {
      const byCat = cat === "ALL" || f.categoria === cat;
      const byText =
        !t ||
        f.pergunta.toLowerCase().includes(t) ||
        f.resposta.toLowerCase().includes(t) ||
        (f.links ?? []).some((l) => l.label.toLowerCase().includes(t));
      return byCat && byText;
    });
  }, [q, cat]);

  return (
    <div className="space-y-6">
      {/* Trigger da sidebar para mobile (sem saudação aqui; está no layout) */}
      <div className="flex items-center justify-end">
        <MobileSidebarTriggerAluno />
      </div>

      {/* Busca + filtro */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-[420px]">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Busque por palavra-chave (ex.: senha, histórico, boleto)"
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={cx(
                "h-9 px-3 rounded-lg border text-sm",
                cat === "ALL"
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-background hover:bg-[var(--muted)] border-[var(--border)]"
              )}
              onClick={() => setCat("ALL")}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c}
                className={cx(
                  "h-9 px-3 rounded-lg border text-sm",
                  cat === c
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-background hover:bg-[var(--muted)] border-[var(--border)]"
                )}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista FAQ */}
      <div className="grid gap-3">
        {filtradas.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-card p-8 text-center text-muted-foreground">
            Nenhum resultado para sua busca.
          </div>
        ) : (
          filtradas.map((f) => <FAQItem key={f.id} f={f} />)
        )}
      </div>

      {/* CTA final */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-5 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <BookOpenCheck className="size-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-medium">Não achou o que precisava?</div>
            <div className="text-sm text-muted-foreground">
              Abra um chamado e nossa equipe ajuda você com o seu caso.
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/aluno/catalogo"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--border)] bg-background hover:bg-[var(--muted)]"
          >
            <BookOpenCheck className="size-4" />
            Ir ao Catálogo
          </Link>
          <Link
            href="/aluno/chamados"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            <MessageSquare className="size-4" />
            Abrir chamado
          </Link>
        </div>
      </div>
    </div>
  );
}

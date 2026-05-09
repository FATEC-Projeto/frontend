"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import MobileSidebarTriggerAluno from "../../_components/MobileSidebarTriggerAluno";
import {
  CATALOGO_INSTITUCIONAL,
  type CatalogResponse,
  type FormularioCampo,
  type ServicoCatalogo,
} from "../../../../../utils/catalogo";
import { cx } from "../../../../../utils/cx";
import { apiFetch } from "../../../../../utils/api";

type ServicoComCategoria = ServicoCatalogo & { categoriaNome: string };
type DadosAcademicos = {
  unidadeFatec: string;
  curso: string;
  turno: string;
  semestre: string;
  turma: string;
  ra: string;
};
type CampoWizard = FormularioCampo & { placeholder?: string };
type TicketResponse = { id?: string | number; ticket?: { id?: string | number } };

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const TOTAL_STEPS = 5;

const TURNOS = ["Manhã", "Tarde", "Noite", "Integral", "EaD"];
const SEMESTRES = [
  "1º semestre", "2º semestre", "3º semestre",
  "4º semestre", "5º semestre", "6º semestre", "Outro",
];

const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
].join(",");
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(ALLOWED_UPLOAD_TYPES.split(","));

const SETOR_PROVAVEL: Record<string, string> = {
  "secretaria-academica": "Secretaria Acadêmica",
  "coordenacao-curso": "Coordenação de Curso",
  estagio: "Setor de Estágio",
  "sistemas-institucionais-siga": "Secretaria Acadêmica / Suporte SIGA",
  biblioteca: "Biblioteca",
  "diretoria-administrativo": "Diretoria / Administrativo",
  "apoio-academico": "Apoio Acadêmico",
};

const DOCUMENTOS_NECESSARIOS: Record<string, string[]> = {
  "secretaria-declaracao-matricula": ["Documento de identificação ou comprovante de RA"],
  "secretaria-historico-escolar": ["Documento de identificação ou comprovante de RA"],
  "secretaria-aproveitamento-estudos": ["Histórico escolar", "Ementas ou programas das disciplinas cursadas"],
  "secretaria-revisao-nota": ["Evidência da divergência de nota/menção, quando houver"],
  "secretaria-correcao-dados-siga": ["Documento comprobatório da alteração", "Documento de identificação"],
  "secretaria-rematricula-fora-prazo": ["Comprovante de matrícula/rematrícula ou justificativa documentada"],
  "secretaria-trancamento-destrancamento": ["Documento de identificação ou requerimento"],
  "coordenacao-analise-disciplina-equivalencia": ["Histórico escolar", "Ementas ou programas das disciplinas"],
  "sistemas-problema-acesso-siga": ["Print ou mensagem de erro, quando houver"],
  "sistemas-dados-divergentes-siga": ["Print da divergência no SIGA"],
  "sistemas-email-institucional": ["Print do erro ou mensagem recebida, quando disponível"],
  "sistemas-redefinicao-senha-institucional": ["Print do erro, se houver"],
  "estagio-termo-compromisso": ["Termo de compromisso assinado", "Plano de atividades"],
  "estagio-termo-aditivo": ["Termo aditivo assinado"],
  "estagio-relatorio": ["Relatório de estágio assinado", "Avaliação do supervisor, quando aplicável"],
  "estagio-rescisao": ["Documento de rescisão ou encerramento, quando disponível"],
};

function campo(
  id: string,
  label: string,
  tipo: CampoWizard["tipo"],
  obrigatorio: boolean,
  placeholder?: string,
  opcoes?: string[],
): CampoWizard {
  return { id, label, tipo, obrigatorio, placeholder, opcoes };
}

function camposEstagio(): CampoWizard[] {
  return [
    campo("empresa", "Empresa / Concedente", "texto", true, "Razão social da empresa"),
    campo("cnpj", "CNPJ da empresa", "texto", false, "00.000.000/0000-00"),
    campo("supervisor", "Supervisor responsável", "texto", false, "Nome completo do supervisor"),
    campo("emailEmpresa", "E-mail da empresa / supervisor", "texto", false, "supervisor@empresa.com.br"),
    campo("tipoEstagio", "Tipo de estágio", "select", true, undefined, ["Obrigatório", "Não obrigatório"]),
    campo("dataInicio", "Data de início", "texto", true, "DD/MM/AAAA"),
    campo("dataTermino", "Data de término (previsto)", "texto", false, "DD/MM/AAAA"),
    campo("cargaHorariaSemanal", "Carga horária semanal", "texto", false, "Ex.: 30h"),
    campo("tipoDocumento", "Tipo de documento solicitado", "select", true, undefined, [
      "Termo de compromisso",
      "Termo aditivo",
      "Relatório de estágio",
      "Rescisão",
    ]),
  ];
}

function camposCoordenacao(): CampoWizard[] {
  return [
    campo("curso", "Curso", "texto", false, "Ex.: Análise e Desenvolvimento de Sistemas"),
    campo("disciplina", "Disciplina relacionada", "texto", false, "Deixe em branco se não aplicável"),
    campo("professor", "Professor relacionado", "texto", false, "Nome do professor, se aplicável"),
    campo("tipoDemanda", "Tipo de demanda", "select", true, undefined, [
      "Dúvida sobre matriz curricular",
      "Dependência de disciplina",
      "Equivalência de disciplina",
      "Solicitação de reunião",
      "Orientação TG/TCC / Projeto integrador",
      "Horário de aula",
      "Outro",
    ]),
    campo("justificativa", "Justificativa / Descrição", "textarea", true, "Descreva sua necessidade com detalhes"),
  ];
}

function camposSIGA(): CampoWizard[] {
  return [
    campo("tipoProblema", "Tipo de problema", "select", true, undefined, [
      "Erro ao fazer login",
      "Senha incorreta / bloqueio de conta",
      "Dados incorretos ou desatualizados",
      "Acesso negado a funcionalidade",
      "Tela com erro ou travamento",
      "Funcionalidade indisponível",
      "Outro",
    ]),
    campo("telaFuncionalidade", "Tela ou funcionalidade afetada", "texto", false, "Ex.: Histórico escolar, Matrícula"),
    campo("mensagemErro", "Mensagem de erro exibida (se houver)", "textarea", false, "Cole aqui o texto do erro"),
  ];
}

function camposEmailSenha(): CampoWizard[] {
  return [
    campo("emailInstitucional", "E-mail institucional", "texto", true, "aluno@fatec.sp.gov.br"),
    campo("tipoProblema", "Tipo de problema", "select", true, undefined, [
      "Não consigo acessar o e-mail",
      "Esqueci a senha",
      "Conta bloqueada",
      "E-mail institucional não foi criado",
      "Problema de sincronização",
      "Recebo e-mails mas não consigo enviar",
      "Outro",
    ]),
    campo("tentativaRealizada", "O que já tentou fazer?", "textarea", false, "Descreva as tentativas de resolução já realizadas"),
  ];
}

const CAMPOS_ESPECIFICOS: Record<string, CampoWizard[]> = {
  "secretaria-declaracao-matricula": [
    campo("finalidade", "Finalidade da declaração", "textarea", true, "Ex.: estágio, benefício estudantil, comprovação de vínculo"),
  ],
  "secretaria-historico-escolar": [
    campo("semestreReferencia", "Semestre de referência", "texto", true),
    campo("formatoDesejado", "Formato desejado", "select", true, undefined, ["Digital", "Impresso", "Digital e impresso"]),
  ],
  "secretaria-aproveitamento-estudos": [
    campo("instituicaoOrigem", "Instituição de origem", "texto", true),
    campo("disciplinasOrigem", "Disciplinas cursadas na origem", "textarea", true),
    campo("disciplinasPretendidas", "Disciplinas pretendidas para aproveitamento", "textarea", true),
    campo("justificativa", "Justificativa", "textarea", true),
  ],
  "secretaria-revisao-nota": [
    campo("disciplina", "Disciplina", "texto", true),
    campo("professor", "Professor responsável", "texto", false),
    campo("avaliacao", "Avaliação/atividade relacionada", "texto", true),
    campo("justificativa", "Justificativa da revisão", "textarea", true),
  ],
  "secretaria-correcao-dados-siga": [
    campo("dadoAlterar", "Dado a alterar", "texto", true),
    campo("valorAtual", "Valor atual/incorreto", "texto", false),
    campo("novoValor", "Novo valor correto", "texto", true),
  ],
  "secretaria-rematricula-fora-prazo": [
    campo("disciplinas", "Disciplinas envolvidas", "textarea", false),
    campo("justificativa", "Justificativa", "textarea", true),
  ],
  "coordenacao-duvida-matriz-curricular": camposCoordenacao(),
  "coordenacao-reuniao": camposCoordenacao(),
  "coordenacao-analise-disciplina-equivalencia": camposCoordenacao(),
  "coordenacao-orientacao-tg-tcc-projeto-integrador": camposCoordenacao(),
  "estagio-termo-compromisso": camposEstagio(),
  "estagio-termo-aditivo": camposEstagio(),
  "estagio-relatorio": camposEstagio(),
  "estagio-rescisao": camposEstagio(),
  "estagio-duvida-obrigatorio-nao-obrigatorio": [
    campo("tipoEstagio", "Tipo de estágio", "select", true, undefined, ["Obrigatório", "Não obrigatório", "Ainda não sei"]),
    campo("duvida", "Dúvida", "textarea", true),
  ],
  "sistemas-problema-acesso-siga": camposSIGA(),
  "sistemas-dados-divergentes-siga": camposSIGA(),
  "sistemas-email-institucional": camposEmailSenha(),
  "sistemas-redefinicao-senha-institucional": camposEmailSenha(),
};

function normalizeCatalog(data: CatalogResponse): CatalogResponse {
  return { categorias: (data.categorias ?? []).map((c) => ({ ...c, servicos: c.servicos ?? [] })) };
}

function findServico(catalog: CatalogResponse, servicoId: string): ServicoComCategoria | null {
  for (const categoria of catalog.categorias) {
    const servico = categoria.servicos.find((item) => item.id === servicoId);
    if (servico) return { ...servico, categoriaId: categoria.id, categoriaNome: categoria.nome };
  }
  return null;
}

function buildDescricao(params: {
  servico: ServicoComCategoria;
  setorProvavel: string;
  dadosAcademicos: DadosAcademicos;
  camposEspecificos: Record<string, string>;
  anexos: File[];
}) {
  const { servico, setorProvavel, dadosAcademicos, camposEspecificos, anexos } = params;
  return [
    "Solicitação aberta pelo wizard do catálogo acadêmico.",
    "",
    "[Serviço selecionado]",
    `Serviço: ${servico.nome}`,
    `Serviço ID: ${servico.id}`,
    `Categoria: ${servico.categoriaNome}`,
    `Setor provável: ${setorProvavel}`,
    "",
    "[Dados acadêmicos]",
    `Unidade Fatec: ${dadosAcademicos.unidadeFatec}`,
    `Curso: ${dadosAcademicos.curso}`,
    `Turno: ${dadosAcademicos.turno}`,
    `Semestre: ${dadosAcademicos.semestre}`,
    `Turma: ${dadosAcademicos.turma}`,
    `RA: ${dadosAcademicos.ra}`,
    "",
    "[Campos específicos do serviço]",
    ...Object.entries(camposEspecificos).map(([k, v]) => `${k}: ${v || "Não informado"}`),
    "",
    "[Anexos informados]",
    ...(anexos.length
      ? anexos.map((f) => `- ${f.name} (${Math.ceil(f.size / 1024)} KB)`)
      : ["Nenhum anexo informado."]),
  ].join("\n");
}

export default function SolicitacaoCatalogoPage() {
  const params = useParams<{ servicoId: string }>();
  const router = useRouter();
  const servicoId = params.servicoId;

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalog, setCatalog] = useState<CatalogResponse>(CATALOGO_INSTITUCIONAL);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [dadosAcademicos, setDadosAcademicos] = useState<DadosAcademicos>({
    unidadeFatec: "", curso: "", turno: "", semestre: "", turma: "", ra: "",
  });
  const [camposEspecificos, setCamposEspecificos] = useState<Record<string, string>>({});
  const [anexos, setAnexos] = useState<File[]>([]);
  const [aceite, setAceite] = useState(false);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const url = API ? `${API}/catalogo` : "/catalogo";
        const res = await apiFetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("fallback");
        setCatalog(normalizeCatalog((await res.json()) as CatalogResponse));
      } catch {
        setCatalog(CATALOGO_INSTITUCIONAL);
      } finally {
        setLoadingCatalog(false);
      }
    }
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (!API) return;
    apiFetch(`${API}/auth/me`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setDadosAcademicos((prev) => ({
          unidadeFatec: data.unidadeFatec || prev.unidadeFatec,
          curso: data.curso || prev.curso,
          turno: data.turno || prev.turno,
          semestre: data.semestreAtual || prev.semestre,
          turma: data.turma || prev.turma,
          ra: data.ra || prev.ra,
        }));
      })
      .catch(() => {});
  }, []);

  const servico = useMemo(() => findServico(catalog, servicoId), [catalog, servicoId]);
  const setorProvavel = servico
    ? SETOR_PROVAVEL[servico.categoriaId] ?? servico.categoriaNome
    : "Setor responsável";
  const campos = useMemo<CampoWizard[]>(() => {
    if (!servico) return [];
    if (servico.formulario?.disponivel && servico.formulario.campos?.length)
      return servico.formulario.campos;
    return CAMPOS_ESPECIFICOS[servico.id] ?? [campo("descricao", "Descreva sua solicitação", "textarea", true)];
  }, [servico]);
  const documentosNecessarios = servico ? (DOCUMENTOS_NECESSARIOS[servico.id] ?? []) : [];

  function updateAcademico(key: keyof DadosAcademicos, value: string) {
    setDadosAcademicos((c) => ({ ...c, [key]: value }));
  }

  function validateStep(currentStep = step) {
    if (currentStep === 1 && (!servico || !servico.ativo))
      return "Serviço indisponível para solicitação.";
    if (currentStep === 2) {
      const missing = Object.entries(dadosAcademicos).find(([, v]) => !v.trim());
      if (missing) return "Preencha todos os dados acadêmicos básicos.";
    }
    if (currentStep === 3) {
      const missing = campos.find((f) => f.obrigatorio && !camposEspecificos[f.id]?.trim());
      if (missing) return `Preencha o campo obrigatório: ${missing.label}.`;
    }
    if (currentStep === 4 && documentosNecessarios.length > 0 && anexos.length === 0)
      return "Anexe ao menos um documento para apoiar a análise deste serviço.";
    if (currentStep === 5 && !aceite)
      return "Confirme a veracidade das informações antes de enviar.";
    return null;
  }

  function goNext() {
    const error = validateStep();
    if (error) { toast.error(error); return; }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const fileArray = Array.from(files);
    fileArray.filter((f) => f.size > MAX_UPLOAD_SIZE).forEach((f) =>
      toast.error(`"${f.name}" excede 10 MB e não foi adicionado.`)
    );
    fileArray
      .filter((f) => f.size <= MAX_UPLOAD_SIZE && !!f.type && !ALLOWED_TYPES.has(f.type))
      .forEach((f) => toast.error(`Tipo de arquivo não permitido: ${f.name}`));
    setAnexos((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      return [
        ...prev,
        ...fileArray.filter(
          (f) =>
            !existing.has(`${f.name}-${f.size}`) &&
            f.size <= MAX_UPLOAD_SIZE &&
            !!f.type &&
            ALLOWED_TYPES.has(f.type)
        ),
      ];
    });
  }

  function removeFile(index: number) {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadAnexos(ticketId: string | number) {
    if (!API || anexos.length === 0) return;
    for (const file of anexos) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await apiFetch(`${API}/tickets/${ticketId}/anexos`, { method: "POST", body: formData });
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      } catch {
        toast.error(`Falha ao enviar o anexo "${file.name}". Os outros foram enviados.`);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!servico) return;
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const error = validateStep(s);
      if (error) { toast.error(error); setStep(s); return; }
    }

    try {
      setSubmitting(true);
      const descricao = buildDescricao({ servico, setorProvavel, dadosAcademicos, camposEspecificos, anexos });
      const payload = {
        titulo: servico.nome,
        descricao,
        servicoId: servico.id,
        nivel: "N1",
        prioridade: "MEDIA",
        categoriaId: servico.categoriaId,
        categoriaNome: servico.categoriaNome,
        setorProvavel,
        dadosAcademicos,
        camposEspecificos,
        anexos: anexos.map((f) => ({ nome: f.name, tamanho: f.size, tipo: f.type || "application/octet-stream" })),
        origem: "catalogo_wizard_aluno",
      };

      const res = await apiFetch(`${API}/tickets`, { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Erro ao criar solicitação acadêmica");
      }

      const data = (await res.json()) as TicketResponse;
      const ticketId = data.id ?? data.ticket?.id;
      if (!ticketId) throw new Error("Solicitação criada, mas o backend não retornou o ID do ticket.");

      await uploadAnexos(ticketId);
      toast.success("Solicitação acadêmica criada com sucesso!");
      router.push(`/aluno/chamados/${ticketId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao criar solicitação acadêmica");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCatalog) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" /> Carregando serviço...
      </div>
    );
  }

  if (!servico) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-card p-8 text-center">
        <p className="font-medium">Serviço não encontrado.</p>
        <Link href="/aluno/catalogo" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="size-4" /> Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/aluno/catalogo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Voltar ao catálogo
          </Link>
          <h1 className="font-grotesk text-2xl font-semibold tracking-tight mt-3">Nova solicitação acadêmica</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Preencha as etapas abaixo. O ticket será criado somente após a revisão final.
          </p>
        </div>
        <MobileSidebarTriggerAluno />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {["Serviço", "Dados acadêmicos", "Campos específicos", "Documentos", "Revisão"].map((label, index) => {
            const number = index + 1;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(number)}
                className={cx(
                  "rounded-lg border px-3 py-2 text-left text-xs transition",
                  number === step ? "border-primary bg-primary/10 text-primary" : "border-[var(--border)] hover:bg-[var(--muted)]",
                  number < step && "border-emerald-500/50 text-emerald-600",
                )}
              >
                <span className="font-semibold">Etapa {number}</span>
                <span className="block mt-0.5">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-card p-5">
        {step === 1 && (
          <div className="space-y-4">
            <StepTitle title="Confirme o serviço selecionado" description="Confira categoria e setor provável antes de preencher os dados." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoCard label="Serviço" value={servico.nome} />
              <InfoCard label="Categoria" value={servico.categoriaNome} />
              <InfoCard label="Setor provável" value={setorProvavel} />
            </div>
            <p className="rounded-lg bg-[var(--muted)] p-4 text-sm text-muted-foreground">{servico.descricao}</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <StepTitle title="Dados acadêmicos básicos" description="Informe sua unidade, curso, turno, semestre, turma e RA." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput label="Unidade Fatec" value={dadosAcademicos.unidadeFatec} onChange={(v) => updateAcademico("unidadeFatec", v)} required placeholder="Ex.: Fatec Zona Leste" />
              <TextInput label="Curso" value={dadosAcademicos.curso} onChange={(v) => updateAcademico("curso", v)} required placeholder="Ex.: Análise e Desenvolvimento de Sistemas" />
              <SelectInput label="Turno" value={dadosAcademicos.turno} onChange={(v) => updateAcademico("turno", v)} options={TURNOS} required />
              <SelectInput label="Semestre" value={dadosAcademicos.semestre} onChange={(v) => updateAcademico("semestre", v)} options={SEMESTRES} required />
              <TextInput label="Turma" value={dadosAcademicos.turma} onChange={(v) => updateAcademico("turma", v)} required placeholder="Ex.: ADS 3º noite" />
              <TextInput label="RA" value={dadosAcademicos.ra} onChange={(v) => updateAcademico("ra", v)} required placeholder="Ex.: 123456789" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <StepTitle title="Campos específicos do serviço" description="Preencha as informações necessárias para o setor analisar sua solicitação." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campos.map((item) => (
                <CampoEspecifico
                  key={item.id}
                  campo={item}
                  value={camposEspecificos[item.id] ?? ""}
                  onChange={(value) => setCamposEspecificos((c) => ({ ...c, [item.id]: value }))}
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <StepTitle title="Anexar documentos" description="Inclua documentos ou evidências quando forem necessários para o serviço." />
            {documentosNecessarios.length > 0 ? (
              <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                <p className="font-medium">Documentos esperados para este serviço:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {documentosNecessarios.map((doc) => <li key={doc}>{doc}</li>)}
                </ul>
              </div>
            ) : (
              <p className="rounded-lg bg-[var(--muted)] p-4 text-sm text-muted-foreground">
                Nenhum documento obrigatório mapeado. Anexe evidências se ajudarem na análise.
              </p>
            )}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] p-8 text-center hover:bg-[var(--muted)]">
              <UploadCloud className="size-8 text-muted-foreground" />
              <span className="font-medium">Selecionar arquivos</span>
              <span className="text-xs text-muted-foreground">PDF, imagens, Word, Excel ou TXT · Máx. 10 MB por arquivo</span>
              <input type="file" multiple accept={ALLOWED_UPLOAD_TYPES} className="sr-only" onChange={(e) => addFiles(e.target.files)} />
            </label>
            {anexos.length > 0 && (
              <ul className="space-y-2">
                {anexos.map((file, i) => (
                  <li key={`${file.name}-${file.size}`} className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-3 text-sm">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-muted-foreground shrink-0">{Math.ceil(file.size / 1024)} KB</span>
                    <button type="button" onClick={() => removeFile(i)} className="shrink-0 text-destructive hover:opacity-70 transition" title="Remover arquivo">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <StepTitle title="Revisar antes de enviar" description="Confira todas as informações. Ao enviar, a solicitação será criada via POST /tickets." />
            <ReviewBlock title="Serviço" rows={{ "Serviço": servico.nome, "Categoria": servico.categoriaNome, "Setor provável": setorProvavel }} />
            <ReviewBlock title="Dados acadêmicos" rows={{ "Unidade Fatec": dadosAcademicos.unidadeFatec, "Curso": dadosAcademicos.curso, "Turno": dadosAcademicos.turno, "Semestre": dadosAcademicos.semestre, "Turma": dadosAcademicos.turma, "RA": dadosAcademicos.ra }} />
            <ReviewBlock title="Campos específicos" rows={Object.fromEntries(campos.map((f) => [f.label, camposEspecificos[f.id] || "Não informado"]))} />
            <ReviewBlock title="Anexos" rows={{ "Arquivos": anexos.length ? anexos.map((f) => f.name).join(", ") : "Nenhum anexo informado" }} />
            <label className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-4 text-sm cursor-pointer">
              <input type="checkbox" className="mt-1" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
              <span>Confirmo que as informações são verdadeiras e autorizo o encaminhamento ao setor responsável.</span>
            </label>
          </div>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || submitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm disabled:opacity-50"
        >
          <ArrowLeft className="size-4" /> Voltar
        </button>
        {step < TOTAL_STEPS ? (
          <button type="button" onClick={goNext} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground">
            Próxima etapa <ArrowRight className="size-4" />
          </button>
        ) : (
          <button type="submit" disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:opacity-60">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Enviar solicitação
          </button>
        )}
      </div>
    </form>
  );
}

function StepTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold"><CheckCircle2 className="size-5 text-primary" /> {title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function TextInput({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}{required && <span className="text-destructive"> *</span>}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
    </label>
  );
}

function SelectInput({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}{required && <span className="text-destructive"> *</span>}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
        <option value="">Selecione</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function CampoEspecifico({ campo, value, onChange }: { campo: CampoWizard; value: string; onChange: (v: string) => void }) {
  if (campo.tipo === "select")
    return <SelectInput label={campo.label} value={value} onChange={onChange} options={campo.opcoes ?? []} required={campo.obrigatorio} />;
  if (campo.tipo === "textarea") {
    return (
      <label className="space-y-1 text-sm md:col-span-2">
        <span className="font-medium">{campo.label}{campo.obrigatorio && <span className="text-destructive"> *</span>}</span>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={campo.placeholder ?? campo.ajuda} rows={4} className="w-full rounded-lg border border-[var(--border)] bg-input p-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
      </label>
    );
  }
  return <TextInput label={campo.label} value={value} onChange={onChange} required={campo.obrigatorio} placeholder={campo.placeholder ?? campo.ajuda} />;
}

function ReviewBlock({ title, rows }: { title: string; rows: Record<string, string> }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <h3 className="font-medium">{title}</h3>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        {Object.entries(rows).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium whitespace-pre-wrap">{value || "Não informado"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

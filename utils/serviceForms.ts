export type ServiceFormFieldType = "texto" | "textarea" | "select" | "arquivo" | "data" | "checkbox" | "numero";

export type ServiceFormOption = {
  label: string;
  value: string;
};

export type ServiceFormField = {
  id: string;
  label: string;
  tipo: ServiceFormFieldType;
  obrigatorio: boolean;
  opcoes?: ServiceFormOption[];
  ajuda?: string;
  placeholder?: string;
  accept?: string;
};

export type ServiceFormConfig = {
  servicoId: string;
  titulo: string;
  descricao: string;
  campos: ServiceFormField[];
};

export type ServiceFormValues = Record<string, string | boolean | string[]>;

export type ServicePayloadValidationResult =
  | { valid: true; values: ServiceFormValues }
  | { valid: false; errors: Record<string, string> };

const requiredMessage = (label: string) => `${label} é obrigatório.`;

export const SERVICE_FORM_CONFIGS: Record<string, ServiceFormConfig> = {
  "secretaria-declaracao-matricula": {
    servicoId: "secretaria-declaracao-matricula",
    titulo: "Formulário de Declaração de Matrícula",
    descricao: "Informe como a declaração deve ser emitida para a Secretaria Acadêmica.",
    campos: [
      {
        id: "finalidade",
        label: "Finalidade",
        tipo: "textarea",
        obrigatorio: true,
        placeholder: "Ex.: comprovação de vínculo para estágio, transporte, benefício estudantil...",
      },
      {
        id: "destinatario",
        label: "Destinatário",
        tipo: "texto",
        obrigatorio: true,
        placeholder: "Ex.: Empresa, órgão público, instituição ou A quem interessar possa",
      },
      {
        id: "incluirHorarioAulas",
        label: "Incluir horário das aulas",
        tipo: "checkbox",
        obrigatorio: false,
      },
      {
        id: "incluirPrevisaoConclusao",
        label: "Incluir previsão de conclusão",
        tipo: "checkbox",
        obrigatorio: false,
      },
      {
        id: "incluirCargaHoraria",
        label: "Incluir carga horária",
        tipo: "checkbox",
        obrigatorio: false,
      },
      {
        id: "formatoDesejado",
        label: "Formato desejado",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { label: "Digital (PDF)", value: "digital-pdf" },
          { label: "Impresso para retirada", value: "impresso-retirada" },
        ],
      },
    ],
  },
  "secretaria-historico-escolar": {
    servicoId: "secretaria-historico-escolar",
    titulo: "Formulário de Histórico Escolar",
    descricao: "Detalhe o tipo de histórico necessário e o prazo desejado.",
    campos: [
      {
        id: "finalidade",
        label: "Finalidade",
        tipo: "textarea",
        obrigatorio: true,
        placeholder: "Ex.: transferência, estágio, comprovação acadêmica, processo seletivo...",
      },
      {
        id: "tipoHistorico",
        label: "Tipo de histórico",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { label: "Parcial", value: "parcial" },
          { label: "Final", value: "final" },
        ],
      },
      {
        id: "precisaAssinaturaCarimbo",
        label: "Precisa de assinatura/carimbo",
        tipo: "checkbox",
        obrigatorio: false,
      },
      {
        id: "prazoDesejado",
        label: "Prazo desejado",
        tipo: "data",
        obrigatorio: true,
      },
    ],
  },
  "secretaria-aproveitamento-estudos": {
    servicoId: "secretaria-aproveitamento-estudos",
    titulo: "Formulário de Aproveitamento de Estudos",
    descricao: "Informe os dados da disciplina cursada e anexe a documentação obrigatória.",
    campos: [
      { id: "instituicaoOrigem", label: "Instituição de origem", tipo: "texto", obrigatorio: true },
      { id: "cursoOrigem", label: "Curso de origem", tipo: "texto", obrigatorio: true },
      { id: "disciplinaCursada", label: "Disciplina cursada", tipo: "texto", obrigatorio: true },
      { id: "cargaHoraria", label: "Carga horária", tipo: "numero", obrigatorio: true, placeholder: "Ex.: 80" },
      { id: "disciplinaPretendidaFatec", label: "Disciplina pretendida na Fatec", tipo: "texto", obrigatorio: true },
      {
        id: "historico",
        label: "Histórico",
        tipo: "arquivo",
        obrigatorio: true,
        accept: ".pdf,.jpg,.jpeg,.png",
        ajuda: "Anexo obrigatório.",
      },
      {
        id: "ementa",
        label: "Ementa",
        tipo: "arquivo",
        obrigatorio: true,
        accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
        ajuda: "Anexo obrigatório.",
      },
      {
        id: "conteudoProgramatico",
        label: "Conteúdo programático",
        tipo: "arquivo",
        obrigatorio: true,
        accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
        ajuda: "Anexo obrigatório.",
      },
    ],
  },
  "secretaria-revisao-nota": {
    servicoId: "secretaria-revisao-nota",
    titulo: "Formulário de Revisão de Nota",
    descricao: "Descreva a avaliação e apresente a justificativa para revisão.",
    campos: [
      { id: "disciplina", label: "Disciplina", tipo: "texto", obrigatorio: true },
      { id: "professor", label: "Professor", tipo: "texto", obrigatorio: true },
      { id: "turma", label: "Turma", tipo: "texto", obrigatorio: true },
      {
        id: "tipoAvaliacao",
        label: "Tipo de avaliação",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { label: "Prova", value: "prova" },
          { label: "Trabalho", value: "trabalho" },
          { label: "Atividade", value: "atividade" },
          { label: "Projeto", value: "projeto" },
          { label: "Outro", value: "outro" },
        ],
      },
      { id: "notaLancada", label: "Nota lançada", tipo: "numero", obrigatorio: true, placeholder: "Ex.: 7.5" },
      { id: "justificativa", label: "Justificativa", tipo: "textarea", obrigatorio: true },
      {
        id: "evidenciaAnexo",
        label: "Evidência/anexo",
        tipo: "arquivo",
        obrigatorio: true,
        accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
      },
    ],
  },
  "secretaria-correcao-dados-siga": {
    servicoId: "secretaria-correcao-dados-siga",
    titulo: "Formulário de Correção de Dados no SIGA",
    descricao: "Informe exatamente o dado incorreto e a correção solicitada.",
    campos: [
      {
        id: "tipoDadoIncorreto",
        label: "Tipo de dado incorreto",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { label: "Nome", value: "nome" },
          { label: "Documento", value: "documento" },
          { label: "Endereço", value: "endereco" },
          { label: "Telefone", value: "telefone" },
          { label: "E-mail", value: "email" },
          { label: "Outro", value: "outro" },
        ],
      },
      { id: "ondeApareceErro", label: "Onde aparece o erro", tipo: "texto", obrigatorio: true },
      { id: "informacaoAtual", label: "Informação atual", tipo: "textarea", obrigatorio: true },
      { id: "informacaoCorreta", label: "Informação correta", tipo: "textarea", obrigatorio: true },
      {
        id: "documentoComprobatorio",
        label: "Documento comprobatório",
        tipo: "arquivo",
        obrigatorio: true,
        accept: ".pdf,.jpg,.jpeg,.png",
      },
    ],
  },
};

export function getServiceFormConfig(servicoId: string): ServiceFormConfig | undefined {
  return SERVICE_FORM_CONFIGS[servicoId];
}

export function validateServicePayload(servicoId: string, values: ServiceFormValues): ServicePayloadValidationResult {
  const config = getServiceFormConfig(servicoId);
  if (!config) return { valid: true, values };

  const errors: Record<string, string> = {};

  config.campos.forEach((campo) => {
    const value = values[campo.id];
    const isEmptyString = typeof value === "string" && value.trim().length === 0;
    const isEmptyArray = Array.isArray(value) && value.length === 0;
    const isMissing = value === undefined || value === null || isEmptyString || isEmptyArray;

    if (campo.obrigatorio && isMissing) {
      errors[campo.id] = requiredMessage(campo.label);
      return;
    }

    if (campo.tipo === "numero" && typeof value === "string" && value.trim()) {
      const normalized = value.replace(",", ".");
      if (Number.isNaN(Number(normalized))) {
        errors[campo.id] = `${campo.label} deve ser um número válido.`;
      }
    }
  });

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, values };
}

export function getServicePayloadValidationMessages(servicoId: string, values: ServiceFormValues): string[] {
  const result = validateServicePayload(servicoId, values);
  if (result.valid) return [];
  return Object.values(result.errors);
}

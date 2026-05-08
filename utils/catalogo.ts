import { getServiceFormConfig } from "./serviceForms";

export type FormularioCampo = {
  id: string;
  label: string;
  tipo: "texto" | "textarea" | "select" | "arquivo" | "data" | "checkbox" | "numero";
  obrigatorio: boolean;
  opcoes?: string[];
  ajuda?: string;
};

export type FormularioMetadata = {
  versao: number;
  disponivel: boolean;
  campos: FormularioCampo[];
};

export type ServicoCatalogo = {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  categoriaId: string;
  palavrasChave: string[];
  formulario: FormularioMetadata;
};

export type CategoriaCatalogo = {
  id: string;
  nome: string;
  descricao: string;
  palavrasChave: string[];
  servicos: ServicoCatalogo[];
};

export type CatalogResponse = {
  categorias: CategoriaCatalogo[];
};

const FORMULARIO_FUTURO: FormularioMetadata = {
  versao: 1,
  disponivel: false,
  campos: [],
};

const fatecKeywords = [
  "cps",
  "centro paula souza",
  "fatec",
  "faculdade de tecnologia",
  "secretaria acadêmica fatec",
  "siga",
  "sistema integrado de gestão acadêmica",
];

function servico(
  categoriaId: string,
  id: string,
  nome: string,
  descricao: string,
  palavrasChave: string[],
  ativo = true
): ServicoCatalogo {
  const formConfig = getServiceFormConfig(id);

  return {
    id,
    nome,
    descricao,
    ativo,
    categoriaId,
    palavrasChave: [...palavrasChave, ...fatecKeywords],
    formulario: formConfig
      ? {
          versao: 1,
          disponivel: true,
          campos: formConfig.campos.map((campo) => ({
            id: campo.id,
            label: campo.label,
            tipo: campo.tipo,
            obrigatorio: campo.obrigatorio,
            opcoes: campo.opcoes?.map((opcao) => opcao.label),
            ajuda: campo.ajuda,
          })),
        }
      : FORMULARIO_FUTURO,
  };
}

export const CATALOGO_INSTITUCIONAL: CatalogResponse = {
  categorias: [
    {
      id: "secretaria-academica",
      nome: "Secretaria Acadêmica",
      descricao: "Documentos, registros acadêmicos, matrícula, rematrícula e correções cadastrais.",
      palavrasChave: ["secretaria", "acadêmico", "documentação", "registro", "aluno", ...fatecKeywords],
      servicos: [
        servico(
          "secretaria-academica",
          "secretaria-declaracao-matricula",
          "Declaração de matrícula",
          "Solicite declaração de matrícula ativa para comprovação acadêmica, estágio ou benefícios estudantis.",
          ["declaração", "matrícula", "comprovante", "vínculo", "atestado"]
        ),
        servico(
          "secretaria-academica",
          "secretaria-historico-escolar",
          "Histórico escolar",
          "Solicite emissão ou atualização do histórico escolar com disciplinas, cargas horárias e menções.",
          ["histórico", "boletim", "disciplinas", "notas", "menções"]
        ),
        servico(
          "secretaria-academica",
          "secretaria-aproveitamento-estudos",
          "Aproveitamento de estudos",
          "Abra pedido de aproveitamento de estudos cursados anteriormente para análise acadêmica.",
          ["aproveitamento", "equivalência", "dispensa", "disciplinas cursadas", "análise curricular"]
        ),
        servico(
          "secretaria-academica",
          "secretaria-revisao-nota",
          "Revisão de nota",
          "Solicite revisão de nota ou menção registrada em disciplina, avaliação ou atividade acadêmica.",
          ["revisão", "nota", "menção", "avaliação", "correção"]
        ),
        servico(
          "secretaria-academica",
          "secretaria-correcao-dados-siga",
          "Correção de dados no SIGA",
          "Informe divergências cadastrais para correção ou encaminhamento de ajuste no SIGA.",
          ["correção", "dados", "cadastro", "siga", "divergência"]
        ),
        servico(
          "secretaria-academica",
          "secretaria-rematricula-fora-prazo",
          "Rematrícula fora do prazo",
          "Solicite orientação ou regularização de rematrícula após o período previsto no calendário acadêmico.",
          ["rematrícula", "fora do prazo", "calendário acadêmico", "regularização"]
        ),
        servico(
          "secretaria-academica",
          "secretaria-trancamento-destrancamento",
          "Trancamento/destrancamento",
          "Solicite informações e abertura de processo de trancamento ou destrancamento de matrícula.",
          ["trancamento", "destrancamento", "matrícula", "reativação", "interrupção"]
        ),
      ],
    },
    {
      id: "coordenacao-curso",
      nome: "Coordenação de Curso",
      descricao: "Orientações pedagógicas, matriz curricular, equivalências e acompanhamento acadêmico.",
      palavrasChave: ["coordenação", "curso", "coordenador", "pedagógico", "matriz", ...fatecKeywords],
      servicos: [
        servico(
          "coordenacao-curso",
          "coordenacao-duvida-matriz-curricular",
          "Dúvida sobre matriz curricular",
          "Envie dúvidas sobre matriz curricular, pré-requisitos, componentes curriculares e percurso formativo.",
          ["matriz curricular", "grade", "pré-requisito", "componentes", "disciplinas"]
        ),
        servico(
          "coordenacao-curso",
          "coordenacao-reuniao",
          "Solicitação de reunião com coordenação",
          "Solicite agendamento de reunião com a coordenação do curso para orientação acadêmica.",
          ["reunião", "agendamento", "coordenação", "orientação", "atendimento"]
        ),
        servico(
          "coordenacao-curso",
          "coordenacao-analise-disciplina-equivalencia",
          "Análise de disciplina/equivalência",
          "Peça análise de disciplina, equivalência, compatibilidade de ementa ou aproveitamento curricular.",
          ["equivalência", "ementa", "disciplina", "análise", "compatibilidade"]
        ),
        servico(
          "coordenacao-curso",
          "coordenacao-orientacao-tg-tcc-projeto-integrador",
          "Orientação sobre TG/TCC/projeto integrador",
          "Solicite orientação sobre regras, etapas e encaminhamentos de TG, TCC ou projeto integrador.",
          ["tg", "tcc", "trabalho de graduação", "projeto integrador", "orientação"]
        ),
      ],
    },
    {
      id: "estagio",
      nome: "Estágio",
      descricao: "Documentos, contratos, relatórios e dúvidas sobre estágio obrigatório e não obrigatório.",
      palavrasChave: ["estágio", "empresa", "supervisor", "concedente", "fatec", ...fatecKeywords],
      servicos: [
        servico(
          "estagio",
          "estagio-termo-compromisso",
          "Termo de compromisso",
          "Encaminhe solicitação relacionada ao termo de compromisso de estágio.",
          ["termo de compromisso", "contrato", "estagiário", "empresa", "concedente"]
        ),
        servico(
          "estagio",
          "estagio-termo-aditivo",
          "Termo aditivo",
          "Solicite análise ou orientação sobre termo aditivo de estágio.",
          ["termo aditivo", "prorrogação", "alteração", "vigência", "carga horária"]
        ),
        servico(
          "estagio",
          "estagio-relatorio",
          "Relatório de estágio",
          "Envie dúvidas ou solicite orientação sobre relatório parcial ou final de estágio.",
          ["relatório", "parcial", "final", "atividades", "supervisor"]
        ),
        servico(
          "estagio",
          "estagio-rescisao",
          "Rescisão",
          "Solicite orientação sobre encerramento, rescisão ou baixa de estágio.",
          ["rescisão", "encerramento", "baixa", "cancelamento", "término"]
        ),
        servico(
          "estagio",
          "estagio-duvida-obrigatorio-nao-obrigatorio",
          "Dúvida sobre estágio obrigatório/não obrigatório",
          "Tire dúvidas sobre regras, prazos e documentação de estágio obrigatório ou não obrigatório.",
          ["obrigatório", "não obrigatório", "regras", "documentação", "prazo"]
        ),
      ],
    },
    {
      id: "sistemas-institucionais-siga",
      nome: "Sistemas Institucionais / SIGA",
      descricao: "Acesso ao SIGA, e-mail institucional, senhas e divergências em sistemas acadêmicos.",
      palavrasChave: ["sistemas", "siga", "e-mail institucional", "senha", "acesso", ...fatecKeywords],
      servicos: [
        servico(
          "sistemas-institucionais-siga",
          "sistemas-problema-acesso-siga",
          "Problema de acesso ao SIGA",
          "Relate falhas de login, bloqueios ou dificuldades para acessar o SIGA.",
          ["acesso", "login", "bloqueio", "siga", "erro"]
        ),
        servico(
          "sistemas-institucionais-siga",
          "sistemas-dados-divergentes-siga",
          "Dados divergentes no SIGA",
          "Informe inconsistências de dados acadêmicos ou cadastrais exibidos no SIGA.",
          ["dados divergentes", "inconsistência", "cadastro", "disciplinas", "siga"]
        ),
        servico(
          "sistemas-institucionais-siga",
          "sistemas-email-institucional",
          "Problema com e-mail institucional",
          "Abra solicitação para problemas de acesso, recebimento ou configuração do e-mail institucional.",
          ["e-mail institucional", "email", "outlook", "conta", "mensagens"]
        ),
        servico(
          "sistemas-institucionais-siga",
          "sistemas-redefinicao-senha-institucional",
          "Redefinição de senha institucional",
          "Solicite apoio para redefinição de senha institucional ou recuperação de credenciais.",
          ["senha", "redefinição", "credenciais", "recuperação", "login"]
        ),
      ],
    },
    {
      id: "biblioteca",
      nome: "Biblioteca",
      descricao: "Atendimento sobre acervo, empréstimos, normalização e acesso a recursos informacionais.",
      palavrasChave: ["biblioteca", "acervo", "empréstimo", "livros", "bases digitais", ...fatecKeywords],
      servicos: [],
    },
    {
      id: "diretoria-administrativo",
      nome: "Diretoria / Administrativo",
      descricao: "Demandas administrativas, encaminhamentos institucionais e assuntos da diretoria.",
      palavrasChave: ["diretoria", "administrativo", "institucional", "gestão", "encaminhamento", ...fatecKeywords],
      servicos: [],
    },
    {
      id: "apoio-academico",
      nome: "Apoio Acadêmico",
      descricao: "Acolhimento, acompanhamento acadêmico e suporte complementar à permanência estudantil.",
      palavrasChave: ["apoio", "acolhimento", "permanência", "orientação", "suporte acadêmico", ...fatecKeywords],
      servicos: [],
    },
  ],
};

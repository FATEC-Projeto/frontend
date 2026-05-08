export type Status =
  | "ABERTO"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "RESOLVIDO"
  | "ENCERRADO";

export type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

export type Papel = "USUARIO" | "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";

export type Nivel = "N1" | "N2" | "N3";

export type UsuarioMin = {
  id: string;
  nome?: string | null;
  emailPessoal?: string | null;
  ra?: string | null;
};

export type SetorMin = { id?: string | null; nome?: string | null };
export type ServicoMin = { id?: string | null; nome?: string | null };

export type TicketCamposAcademicos = {
  unidadeFatec?: string | null;
  curso?: string | null;
  turno?: string | null;
  turma?: string | null;
  semestre?: string | number | null;
  matrizCurricular?: string | null;
  processoAcademico?: string | null;
  categoriaAcademica?: string | null;
  servicoId?: string | null;
  impactoAluno?: string | null;
  prazoAcademicoRelacionado?: string | null;
  dataLimiteAcademica?: string | null;
  canalPreferencialResposta?: string | null;
  setorAtual?: string | null;
  responsavelAtual?: string | null;
  motivoEncaminhamento?: string | null;
  observacaoInterna?: string | null;
  documentosObrigatorios?: string[] | string | null;
  documentosPendentes?: string[] | string | null;
  slaHoras?: number | string | null;
  slaDias?: number | string | null;
  vencimentoSla?: string | null;
};

export type Chamado = TicketCamposAcademicos & {
  id: string;
  protocolo?: string | null;
  titulo: string;
  criadoEm: string;
  status: Status;
  prioridade: Prioridade;
  nivel?: Nivel | null;
  descricao?: string | null;
  atualizadoEm?: string | null;
  encerradoEm?: string | null;
  criadoPorId?: string | null;
  responsavelId?: string | null;
  setor?: SetorMin | null;
  criadoPor?: UsuarioMin | null;
  aluno?: UsuarioMin | null;
  responsavel?: UsuarioMin | null;
  servico?: ServicoMin | null;
  precisaAcaoDoAluno?: boolean | null;
  mensagensNaoLidas?: number | null;
};

export type PageResponse<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

export type Usuario = {
  id: string;
  nome?: string | null;
  ra?: string | null;
  papel?: Papel;
  emailPessoal?: string | null;
};

export const STATUS_LABEL: Record<Status, string> = {
  ABERTO: "Aberto",
  EM_ATENDIMENTO: "Em atendimento",
  AGUARDANDO_USUARIO: "Aguardando usuário",
  RESOLVIDO: "Resolvido",
  ENCERRADO: "Encerrado",
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

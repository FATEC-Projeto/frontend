export type Status =
  | "ABERTO"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "RESOLVIDO"
  | "ENCERRADO";

export type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

export type Papel = "USUARIO" | "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";

export type Chamado = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  criadoEm: string;
  status: Status;
  prioridade: Prioridade;
  setor?: { nome?: string | null } | null;
  criadoPor?: { nome?: string | null } | null;
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
  emailEducacional?: string | null;
  unidadeFatec?: string | null;
  curso?: string | null;
  eixoTecnologico?: string | null;
  turno?: string | null;
  turma?: string | null;
  semestreAtual?: string | number | null;
  matrizCurricular?: string | null;
  situacaoAcademica?: string | null;
  anoSemestreIngresso?: string | null;
  coordenadorCurso?: string | null;
  telefoneCelular?: string | null;
  whatsapp?: string | null;
  canalPreferencialContato?: string | null;
  melhorPeriodoContato?: string | null;
  necessitaAtendimentoAcessivel?: boolean | null;
  tipoAcessibilidade?: string | null;
  observacoesAtendimento?: string | null;
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

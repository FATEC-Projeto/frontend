import type { FormularioCampo } from "../../../../../utils/catalogo";

function campo(
  id: string,
  label: string,
  tipo: FormularioCampo["tipo"],
  obrigatorio: boolean,
  ajuda?: string,
  opcoes?: string[],
): FormularioCampo {
  return { id, label, tipo, obrigatorio, ajuda, opcoes };
}

export const SETOR_PROVAVEL: Record<string, string> = {
  "secretaria-academica": "Secretaria Acadêmica",
  "coordenacao-curso": "Coordenação de Curso",
  estagio: "Setor de Estágio",
  "sistemas-institucionais-siga": "Secretaria Acadêmica / Suporte SIGA",
  biblioteca: "Biblioteca",
  "diretoria-administrativo": "Diretoria / Administrativo",
  "apoio-academico": "Apoio Acadêmico",
};

export const DOCUMENTOS_NECESSARIOS: Record<string, string[]> = {
  "secretaria-declaracao-matricula": ["Documento de identificação ou comprovante de RA"],
  "secretaria-historico-escolar": ["Documento de identificação ou comprovante de RA"],
  "secretaria-aproveitamento-estudos": [
    "Histórico escolar da instituição de origem",
    "Ementa(s) da(s) disciplina(s) cursada(s)",
    "Conteúdo programático detalhado",
  ],
  "secretaria-revisao-nota": ["Evidência da divergência de nota/menção, quando houver"],
  "secretaria-correcao-dados-siga": [
    "Documento comprobatório da alteração",
    "Documento de identificação",
  ],
  "secretaria-rematricula-fora-prazo": ["Comprovante de matrícula/rematrícula ou justificativa documentada"],
  "secretaria-trancamento-destrancamento": ["Documento de identificação ou requerimento"],
  "coordenacao-analise-disciplina-equivalencia": [
    "Histórico escolar",
    "Ementas ou programas das disciplinas",
  ],
  "sistemas-problema-acesso-siga": ["Print ou mensagem de erro, quando houver"],
  "sistemas-dados-divergentes-siga": ["Print da divergência no SIGA"],
  "sistemas-email-institucional": ["Print do erro ou mensagem recebida, quando disponível"],
  "sistemas-redefinicao-senha-institucional": ["Print do erro, se houver"],
  "estagio-termo-compromisso": ["Termo de compromisso assinado", "Plano de atividades"],
  "estagio-termo-aditivo": ["Termo aditivo assinado"],
  "estagio-relatorio": ["Relatório de estágio assinado", "Avaliação do supervisor, quando aplicável"],
  "estagio-rescisao": ["Documento de rescisão ou encerramento, quando disponível"],
};

function camposEstagio(): FormularioCampo[] {
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

function camposCoordenacao(): FormularioCampo[] {
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

function camposSIGA(): FormularioCampo[] {
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

function camposEmailSenha(): FormularioCampo[] {
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

export const CAMPOS_ESPECIFICOS: Record<string, FormularioCampo[]> = {
  // ── Secretaria Acadêmica ──────────────────────────────────────────────────
  "secretaria-declaracao-matricula": [
    campo("finalidade", "Finalidade da declaração", "textarea", true, "Ex.: estágio, benefício estudantil, comprovação de vínculo"),
    campo("destinatario", "Destinatário", "texto", true, "Ex.: empresa, banco, INSS"),
    campo("incluirHorario", "Incluir horário das aulas", "checkbox", false),
    campo("incluirPrevisaoConclusao", "Incluir previsão de conclusão do curso", "checkbox", false),
    campo("incluirCargaHoraria", "Incluir carga horária total do curso", "checkbox", false),
    campo("formatoDesejado", "Formato desejado", "select", true, undefined, ["Digital", "Impresso", "Digital e impresso"]),
  ],
  "secretaria-historico-escolar": [
    campo("finalidade", "Finalidade", "textarea", true, "Ex.: concurso público, pós-graduação, transferência"),
    campo("tipoHistorico", "Tipo de histórico", "select", true, undefined, ["Parcial", "Final"]),
    campo("precisaAssinaturaCarimbo", "Precisa de assinatura/carimbo", "checkbox", false),
    campo("prazoDesejado", "Prazo desejado", "texto", false, "Ex.: até 20/06/2026"),
  ],
  "secretaria-aproveitamento-estudos": [
    campo("instituicaoOrigem", "Instituição de origem", "texto", true, "Ex.: FATEC Americana"),
    campo("cursoOrigem", "Curso de origem", "texto", true, "Ex.: Gestão da Tecnologia da Informação"),
    campo("disciplinaCursada", "Disciplina(s) cursada(s)", "textarea", true, "Informe nome, carga horária e ementa de cada disciplina"),
    campo("cargaHoraria", "Carga horária total", "texto", true, "Ex.: 60h"),
    campo("disciplinaPretendida", "Disciplina pretendida na Fatec", "texto", true, "Ex.: Sistemas Operacionais"),
  ],
  "secretaria-revisao-nota": [
    campo("disciplina", "Disciplina", "texto", true, "Ex.: Banco de Dados I"),
    campo("professor", "Professor responsável", "texto", false, "Nome completo do professor"),
    campo("turma", "Turma", "texto", false, "Ex.: ADS 3N"),
    campo("tipoAvaliacao", "Tipo de avaliação", "select", true, undefined, ["Prova", "Trabalho", "Exercício/Lista", "Projeto", "Outro"]),
    campo("notaLancada", "Nota lançada no sistema", "texto", true, "Ex.: 5.0"),
    campo("justificativa", "Justificativa da revisão", "textarea", true, "Explique o motivo da solicitação"),
  ],
  "secretaria-correcao-dados-siga": [
    campo("tipoDadoIncorreto", "Tipo de dado incorreto", "select", true, undefined, [
      "Nome",
      "CPF",
      "Data de nascimento",
      "E-mail",
      "Telefone",
      "Endereço",
      "Curso/Habilitação",
      "Outro",
    ]),
    campo("ondeAparece", "Onde aparece o erro", "texto", true, "Ex.: tela de dados cadastrais do SIGA"),
    campo("informacaoAtual", "Informação atual (incorreta)", "texto", true, "Como está hoje no sistema"),
    campo("informacaoCorreta", "Informação correta", "texto", true, "Como deveria estar"),
  ],
  "secretaria-rematricula-fora-prazo": [
    campo("disciplinas", "Disciplinas envolvidas", "textarea", false, "Deixe em branco se não houver disciplinas específicas"),
    campo("justificativa", "Justificativa", "textarea", true, "Explique o motivo da rematrícula fora do prazo"),
  ],
  // ── Coordenação ───────────────────────────────────────────────────────────
  "coordenacao-duvida-matriz-curricular": camposCoordenacao(),
  "coordenacao-reuniao": camposCoordenacao(),
  "coordenacao-analise-disciplina-equivalencia": camposCoordenacao(),
  "coordenacao-orientacao-tg-tcc-projeto-integrador": camposCoordenacao(),
  // ── Estágio ───────────────────────────────────────────────────────────────
  "estagio-termo-compromisso": camposEstagio(),
  "estagio-termo-aditivo": camposEstagio(),
  "estagio-relatorio": camposEstagio(),
  "estagio-rescisao": camposEstagio(),
  "estagio-duvida-obrigatorio-nao-obrigatorio": [
    campo("tipoEstagio", "Tipo de estágio", "select", true, undefined, ["Obrigatório", "Não obrigatório", "Ainda não sei"]),
    campo("duvida", "Dúvida", "textarea", true, "Descreva sua dúvida em detalhes"),
  ],
  // ── Sistemas / SIGA ───────────────────────────────────────────────────────
  "sistemas-problema-acesso-siga": camposSIGA(),
  "sistemas-dados-divergentes-siga": camposSIGA(),
  "sistemas-email-institucional": camposEmailSenha(),
  "sistemas-redefinicao-senha-institucional": camposEmailSenha(),
};

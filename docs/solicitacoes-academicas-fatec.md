# Base de processos para solicitações acadêmicas da Unidade Fatec

Este documento consolida o levantamento inicial para orientar a implementação
frontend e backend das próximas sprints do módulo de solicitações acadêmicas.
Ele deve ser validado com secretaria, coordenação e direção antes da criação
definitiva do catálogo de serviços.

## 1. Objetivo

- Levantar, padronizar e documentar os processos mais frequentes da Unidade
  Fatec.
- Criar uma base comum de categorias, nomenclaturas, campos e fluxos.
- Servir como referência para telas, formulários, regras de triagem, permissões,
  APIs e modelos de dados.

## 2. Levantamento com áreas responsáveis

O levantamento deve ser conduzido com representantes da Secretaria Acadêmica,
coordenações de curso e direção da Unidade Fatec. A etapa de descoberta deve
priorizar os processos com maior volume, maior criticidade ou maior impacto no
calendário acadêmico.

| Área consultada | Informações a levantar | Exemplos de evidências |
| --- | --- | --- |
| Secretaria Acadêmica | Solicitações recorrentes, documentos exigidos, prazos atuais, regras de aceite e motivos de devolução | Planilhas internas, e-mails, formulários físicos, relatórios do SIGA |
| Coordenação de Curso | Demandas que exigem análise pedagógica, parecer docente, validação de matriz curricular ou avaliação de semestre/turno | Atas, pareceres, orientações de curso, histórico de chamados |
| Direção/Administrativo | Demandas que exigem autorização institucional, disponibilidade de recursos ou decisão administrativa | Portarias, comunicados, regras internas, fluxos de aprovação |
| Apoio Acadêmico e demais setores | Dependências operacionais para atendimento, comunicação com aluno e registros complementares | Registros de atendimento, bases locais, comunicados institucionais |

## 3. Categorias iniciais

As categorias iniciais para organizar o catálogo de serviços são:

1. **Secretaria Acadêmica**: matrícula, rematrícula, histórico, declarações,
   documentos acadêmicos, atualização cadastral e regularização de dados.
2. **Coordenação de Curso**: aproveitamento de estudos, equivalência,
   orientação acadêmica, análise de matriz curricular, plano de estudos e
   demandas que exigem parecer pedagógico.
3. **Estágio**: termo de compromisso, relatório de estágio, convênio,
   validação de supervisor, horas de estágio e encerramento.
4. **Sistemas Institucionais/SIGA**: acesso, senha, inconsistências de dados,
   vínculo acadêmico, lançamento de notas/faltas e dúvidas operacionais.
5. **Biblioteca**: nada consta, empréstimos, renovações, pendências, ficha
   catalográfica e acesso a bases digitais.
6. **Diretoria/Administrativo**: requerimentos excepcionais, autorizações,
   recursos administrativos, infraestrutura e demandas institucionais.
7. **Apoio Acadêmico**: acolhimento, orientação de processos, acessibilidade,
   acompanhamento discente e encaminhamentos internos.

## 4. Nomenclatura padrão da interface

Para manter consistência entre telas, notificações, formulários, status e APIs,
a interface deve adotar os seguintes termos:

| Termo padrão | Uso recomendado |
| --- | --- |
| solicitação acadêmica | Nome genérico para qualquer pedido aberto pelo aluno |
| Secretaria Acadêmica | Setor responsável por registros e documentos acadêmicos |
| Coordenação de Curso | Área responsável por análise pedagógica e decisões do curso |
| RA | Registro Acadêmico do aluno |
| SIGA | Sistema institucional utilizado para registros acadêmicos |
| Unidade Fatec | Unidade à qual o aluno, curso ou solicitação está vinculado |
| curso | Curso do aluno ou curso relacionado à solicitação |
| turno | Período de oferta do curso ou disciplina |
| semestre | Semestre letivo, semestre cursado ou semestre de referência |
| matriz curricular | Estrutura curricular oficial usada na análise acadêmica |

Evitar sinônimos concorrentes como “pedido”, “chamado acadêmico”, “protocolo
escolar” ou “departamento acadêmico” quando o contexto exigir padronização de
produto.

## 5. Matriz inicial de serviços

A matriz abaixo é uma proposta inicial para validação. Os SLAs são sugestões de
prazo em dias úteis e podem variar conforme calendário acadêmico, complexidade,
feriados e dependência de outros setores.

| Nome do serviço | Categoria | Setor responsável | Documentos obrigatórios | SLA sugerido | Campos necessários |
| --- | --- | --- | --- | --- | --- |
| Emissão de declaração de matrícula | Secretaria Acadêmica | Secretaria Acadêmica | Documento de identificação, RA | 3 dias úteis | RA, nome completo, curso, turno, semestre, finalidade da declaração |
| Emissão de histórico escolar | Secretaria Acadêmica | Secretaria Acadêmica | Documento de identificação, RA | 5 dias úteis | RA, nome completo, curso, semestre de referência, formato desejado |
| Atualização de dados cadastrais | Secretaria Acadêmica | Secretaria Acadêmica | Documento comprobatório da alteração, documento de identificação | 5 dias úteis | RA, dado a alterar, novo valor, telefone, e-mail, anexos |
| Aproveitamento de estudos | Coordenação de Curso | Coordenação de Curso | Histórico escolar, ementas, programas das disciplinas | 15 dias úteis | RA, curso, semestre, disciplinas de origem, disciplinas pretendidas, instituição de origem, anexos |
| Revisão de matrícula/rematrícula | Secretaria Acadêmica | Secretaria Acadêmica e Coordenação de Curso | Comprovante de matrícula/rematrícula, justificativa | 7 dias úteis | RA, curso, turno, semestre, disciplinas envolvidas, justificativa |
| Análise de matriz curricular | Coordenação de Curso | Coordenação de Curso | Histórico escolar, matriz curricular vigente, documentos complementares | 15 dias úteis | RA, curso, turno, semestre, matriz curricular, dúvida ou solicitação específica |
| Regularização de acesso ao SIGA | Sistemas Institucionais/SIGA | Secretaria Acadêmica ou suporte responsável pelo SIGA | Documento de identificação, RA, evidência do erro quando houver | 3 dias úteis | RA, curso, e-mail institucional, tipo de problema, mensagem de erro, prints |
| Correção de nota ou falta no SIGA | Sistemas Institucionais/SIGA | Coordenação de Curso e professor responsável | Evidência da divergência, disciplina, turma | 10 dias úteis | RA, curso, semestre, disciplina, turma, professor, descrição da divergência |
| Validação de termo de estágio | Estágio | Setor de Estágio | Termo de compromisso, plano de atividades, dados da empresa e supervisor | 7 dias úteis | RA, curso, semestre, empresa, supervisor, carga horária, período do estágio |
| Entrega de relatório de estágio | Estágio | Setor de Estágio e Coordenação de Curso | Relatório assinado, avaliação do supervisor quando aplicável | 10 dias úteis | RA, curso, semestre, empresa, período avaliado, anexos |
| Emissão de nada consta | Biblioteca | Biblioteca | Documento de identificação, RA | 3 dias úteis | RA, nome completo, curso, finalidade, contato |
| Recurso administrativo | Diretoria/Administrativo | Diretoria da Unidade Fatec | Requerimento formal, documentos comprobatórios | 20 dias úteis | RA, curso, semestre, assunto, fundamentação, pedido, anexos |
| Solicitação de apoio acadêmico | Apoio Acadêmico | Apoio Acadêmico | Documentos de apoio quando aplicável | 5 dias úteis | RA, curso, turno, semestre, tipo de apoio, descrição da necessidade |

## 6. Campos mínimos comuns

Todos os formulários de solicitação acadêmica devem considerar os seguintes
campos comuns, além dos campos específicos de cada serviço:

- Tipo de serviço.
- Categoria.
- RA.
- Nome completo.
- E-mail de contato.
- Telefone de contato.
- Unidade Fatec.
- Curso.
- Turno.
- Semestre.
- Descrição da solicitação.
- Anexos.
- Aceite de responsabilidade sobre a veracidade das informações.

## 7. Fluxos principais

### 7.1 Abertura pelo aluno

1. Aluno acessa o portal autenticado.
2. Seleciona a opção **nova solicitação acadêmica**.
3. Escolhe categoria e serviço.
4. Preenche campos obrigatórios e anexa documentos.
5. Confirma os dados e envia a solicitação.
6. Sistema registra protocolo, status inicial e SLA sugerido.

### 7.2 Triagem da Secretaria Acadêmica

1. Secretaria Acadêmica visualiza solicitações recebidas.
2. Confere categoria, serviço, dados do aluno e documentos obrigatórios.
3. Caso faltem dados ou anexos, devolve ao aluno com pendência objetiva.
4. Caso a solicitação esteja completa, mantém atendimento na secretaria ou
   encaminha para o setor responsável.
5. Sistema registra responsável, data da triagem e histórico de movimentação.

### 7.3 Encaminhamento para coordenação, professor ou setor

1. Secretaria ou setor de origem seleciona o destinatário correto.
2. Sistema notifica coordenação, professor ou setor responsável.
3. Responsável analisa os dados, registra parecer, solicita complemento ou
   conclui a etapa sob sua responsabilidade.
4. Quando houver múltiplas áreas, o sistema deve manter rastreabilidade dos
   encaminhamentos e prazos por etapa.

### 7.4 Resposta ao aluno

1. Responsável registra resposta clara, objetiva e vinculada à solicitação.
2. Sistema notifica o aluno sobre atualização de status.
3. Quando necessário, aluno complementa informações ou anexos.
4. Todas as mensagens devem permanecer no histórico da solicitação acadêmica.

### 7.5 Resolução e encerramento

1. Setor responsável marca a solicitação como resolvida quando a demanda for
   atendida, indeferida ou encerrada por falta de complemento.
2. Sistema registra data de resolução, responsável final e resultado.
3. Aluno recebe notificação de encerramento.
4. Solicitação fica disponível para consulta histórica e auditoria.

## 8. Implicações para frontend

- Criar catálogo de serviços filtrável por categoria.
- Exibir nomes padronizados da interface conforme a seção de nomenclatura.
- Montar formulários dinâmicos com campos comuns e campos específicos por
  serviço.
- Mostrar documentos obrigatórios antes do envio.
- Exibir SLA sugerido, status, setor responsável e histórico de movimentações.
- Permitir devolução por pendência, complementação pelo aluno e encerramento.

## 9. Implicações para backend

- Modelar entidades para categoria, serviço, solicitação acadêmica, anexos,
  mensagens, movimentações, responsáveis e SLA.
- Disponibilizar endpoints para catálogo de serviços, abertura, triagem,
  encaminhamento, resposta, complementação, resolução e encerramento.
- Validar campos obrigatórios por serviço.
- Registrar trilha de auditoria para todas as mudanças de status e setor.
- Preparar permissões por perfil: aluno, Secretaria Acadêmica, Coordenação de
  Curso, professor, setor administrativo e direção.

## 10. Pendências de validação

- Confirmar a lista real de serviços mais frequentes da Unidade Fatec.
- Validar documentos obrigatórios com cada setor responsável.
- Ajustar SLAs conforme regras internas e calendário acadêmico.
- Confirmar quais etapas exigem aprovação da Coordenação de Curso, professor ou
  direção.
- Definir status oficiais e mensagens padrão para o aluno.
- Identificar integrações necessárias com SIGA ou outros sistemas institucionais.

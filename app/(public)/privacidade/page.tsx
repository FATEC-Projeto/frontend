import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade | Workflow Fatec",
  description: "Política de privacidade e proteção de dados do portal Workflow Fatec, em conformidade com a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground text-xs font-bold">
              WF
            </div>
            <span className="font-grotesk text-sm font-semibold">Workflow Fatec</span>
          </div>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground hover:underline transition">
            ← Voltar ao login
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Título */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[var(--success)]/10 grid place-items-center text-[var(--success)]">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="font-grotesk text-2xl font-semibold">Política de Privacidade</h1>
            <p className="text-sm text-muted-foreground">Última atualização: maio de 2026</p>
          </div>
        </div>

        {/* Destaque LGPD */}
        <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-4 text-sm text-[var(--success)]">
          Este portal está em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais
          (LGPD — Lei n.º 13.709/2018)</strong> e com o{" "}
          <strong>Decreto Estadual SP n.º 65.347/2020</strong>.
        </div>

        <div className="space-y-6 text-foreground/90 leading-relaxed text-sm">

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">1. Controlador dos Dados</h2>
            <p>
              O controlador responsável pelo tratamento dos dados pessoais neste portal é o{" "}
              <strong>Centro Estadual de Educação Tecnológica Paula Souza — CEETEPS</strong>,
              autarquia de regime especial do Governo do Estado de São Paulo, criada pelo
              Decreto-Lei de 6 de outubro de 1969 e transformada em autarquia pela Lei n.º 952/1976,
              vinculada à Secretaria de Ciência, Tecnologia e Inovação do Estado de São Paulo.
            </p>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-4 space-y-1 text-xs">
              <p><strong>CNPJ:</strong> 62.823.257/0001-09</p>
              <p><strong>Sede:</strong> Rua dos Andradas, 140 — Santa Ifigênia — CEP 01208-000 — São Paulo/SP</p>
              <p><strong>Telefone:</strong> (11) 3324-3300</p>
              <p><strong>E-mail:</strong> <a href="mailto:faleconosco@cps.sp.gov.br" className="text-[var(--brand-cyan)] hover:underline">faleconosco@cps.sp.gov.br</a></p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">2. Encarregado de Dados (DPO)</h2>
            <p>
              O CEETEPS designou formalmente um Encarregado pelo Tratamento de Dados Pessoais
              (Data Protection Officer — DPO), nos termos da Portaria CEETEPS-Presidência
              n.º 4718, de 22 de outubro de 2025.
            </p>
            <p>
              Solicitações relacionadas à proteção de dados podem ser encaminhadas por meio dos
              canais abaixo:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Ouvidoria: (11) 3324-3431 / 3324-3430</li>
              <li>SIC (Serviço de Informações ao Cidadão): <a href="https://www.sic.sp.gov.br" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-cyan)] hover:underline">sic.sp.gov.br</a></li>
              <li>E-mail institucional: <a href="mailto:faleconosco@cps.sp.gov.br" className="text-[var(--brand-cyan)] hover:underline">faleconosco@cps.sp.gov.br</a></li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">3. Dados Coletados</h2>
            <p>O Workflow Fatec coleta apenas os dados necessários para a prestação do serviço:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-[var(--border)] rounded-lg overflow-hidden">
                <thead className="bg-[var(--muted)]/60">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 border-b border-[var(--border)]">Categoria</th>
                    <th className="text-left font-medium px-3 py-2 border-b border-[var(--border)]">Dados</th>
                    <th className="text-left font-medium px-3 py-2 border-b border-[var(--border)]">Finalidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr>
                    <td className="px-3 py-2 font-medium">Identificação</td>
                    <td className="px-3 py-2">Nome, e-mail institucional, Registro de Aluno (RA)</td>
                    <td className="px-3 py-2">Autenticação e identificação do usuário</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Acadêmico</td>
                    <td className="px-3 py-2">Curso, turno, semestre, turma, situação acadêmica, matriz curricular</td>
                    <td className="px-3 py-2">Vinculação de solicitações ao setor correto</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Contato</td>
                    <td className="px-3 py-2">Telefone celular, WhatsApp (opcionais)</td>
                    <td className="px-3 py-2">Comunicação sobre solicitações abertas</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Solicitações</td>
                    <td className="px-3 py-2">Descrição, documentos anexados, mensagens trocadas</td>
                    <td className="px-3 py-2">Registro e resolução de chamados acadêmicos</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Uso do sistema</td>
                    <td className="px-3 py-2">Endereço IP, dados de sessão, interações na interface</td>
                    <td className="px-3 py-2">Segurança, auditoria e melhoria contínua</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Acessibilidade</td>
                    <td className="px-3 py-2">Necessidade de atendimento especial (somente se informado)</td>
                    <td className="px-3 py-2">Garantir atendimento adequado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">4. Base Legal para o Tratamento</h2>
            <p>O tratamento de dados pessoais neste portal é fundamentado nas seguintes bases legais da LGPD:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Execução de políticas públicas</strong> (art. 7.º, III) — prestação de serviços educacionais públicos;</li>
              <li><strong>Cumprimento de obrigação legal ou regulatória</strong> (art. 7.º, II) — registros acadêmicos exigidos por lei;</li>
              <li><strong>Legítimo interesse</strong> (art. 7.º, IX) — funcionamento e segurança do sistema de atendimento;</li>
              <li><strong>Consentimento</strong> (art. 7.º, I) — para dados opcionais e uso de cookies analíticos.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">5. Compartilhamento de Dados</h2>
            <p>Os dados coletados poderão ser compartilhados com:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Setores internos</strong> da Fatec e do CEETEPS envolvidos na resolução das solicitações;</li>
              <li><strong>Órgãos públicos</strong>, quando exigido por lei ou determinação judicial;</li>
              <li><strong>Prestadores de serviço</strong> contratados pelo CEETEPS com quem há ajuste formal (convênios, contratos), sempre vinculados às finalidades descritas.</li>
            </ul>
            <p className="text-muted-foreground">Os dados <strong>nunca serão comercializados ou transferidos a terceiros</strong> para fins distintos dos aqui descritos.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">6. Retenção e Eliminação</h2>
            <p>
              Os dados são retidos pelo prazo necessário para o cumprimento das finalidades descritas,
              observadas as <strong>Tabelas de Temporalidade de Documentos</strong> do Estado de São Paulo
              e as obrigações legais aplicáveis. Após o prazo, os dados são eliminados ou anonimizados,
              salvo quando a retenção for exigida por lei ou para exercício regular de direito.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">7. Segurança</h2>
            <p>
              O CEETEPS adota medidas técnicas e administrativas para proteger os dados pessoais contra
              acessos não autorizados e situações acidentais ou ilícitas de destruição, perda, alteração,
              comunicação ou qualquer forma de tratamento inadequado, incluindo:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Autenticação com tokens JWT de curta duração e renovação automática;</li>
              <li>Senhas armazenadas com hash seguro (bcrypt);</li>
              <li>Comunicação criptografada via HTTPS/TLS;</li>
              <li>Controle de acesso baseado em perfis (aluno, secretaria, coordenação, administrador);</li>
              <li>Monitoramento contínuo e registro de auditorias.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">8. Cookies e Tecnologias Analíticas</h2>
            <p>Este portal utiliza dois tipos de cookies:</p>
            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--border)] p-3 space-y-1">
                <p className="font-medium text-xs">Cookies essenciais (sempre ativos)</p>
                <p className="text-xs text-muted-foreground">
                  Necessários para autenticação e funcionamento do sistema. Incluem tokens de sessão
                  (accessToken, refreshToken). Sem eles, o portal não funciona.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-3 space-y-1">
                <p className="font-medium text-xs">Cookies analíticos (somente com consentimento)</p>
                <p className="text-xs text-muted-foreground">
                  Utilizamos o <strong>Microsoft Clarity</strong> para análise de uso e melhoria da
                  experiência. Esses cookies registram interações na interface de forma anonimizada.
                  Você pode recusar esses cookies no banner de consentimento sem prejuízo ao acesso.
                  Consulte a{" "}
                  <a href="https://privacy.microsoft.com/pt-br/privacystatement" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-cyan)] hover:underline">
                    Política de Privacidade da Microsoft
                  </a>.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">9. Direitos do Titular</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Confirmação e acesso</strong> — saber quais dados temos sobre você;</li>
              <li><strong>Correção</strong> — solicitar atualização de dados incompletos ou incorretos;</li>
              <li><strong>Anonimização, bloqueio ou eliminação</strong> — de dados desnecessários ou tratados em desconformidade;</li>
              <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado;</li>
              <li><strong>Revogação do consentimento</strong> — para dados tratados com essa base legal;</li>
              <li><strong>Informação</strong> — sobre a possibilidade de não fornecer consentimento e as consequências.</li>
            </ul>
            <p className="text-muted-foreground">
              O titular não é obrigado a fornecer todos os dados, porém a não disponibilização
              de informações obrigatórias poderá impedir o acesso a determinados serviços.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">10. Como Exercer seus Direitos</h2>
            <p>Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>E-mail: <a href="mailto:faleconosco@cps.sp.gov.br" className="text-[var(--brand-cyan)] hover:underline">faleconosco@cps.sp.gov.br</a></li>
              <li>Ouvidoria: (11) 3324-3431 / 3324-3430</li>
              <li>SIC: <a href="https://www.sic.sp.gov.br" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-cyan)] hover:underline">sic.sp.gov.br</a> (prazo de resposta: até 20 dias)</li>
              <li>Presencialmente: Rua dos Andradas, 140 — Santa Ifigênia — CEP 01208-000 — São Paulo/SP</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">11. Atualizações desta Política</h2>
            <p>
              Esta política pode ser revisada a qualquer momento. Sempre que houver alteração,
              o CEETEPS comunicará as novas diretrizes por meio das páginas eletrônicas oficiais.
              O uso continuado do sistema implica concordância com a versão vigente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">12. Autoridade de Proteção de Dados</h2>
            <p>
              Caso suas solicitações não sejam atendidas satisfatoriamente, você pode peticionar
              à <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>:{" "}
              <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-cyan)] hover:underline">gov.br/anpd</a>.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-12">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Centro Paula Souza — CEETEPS. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <Link href="/termos" className="hover:underline">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:underline">Privacidade</Link>
            <Link href="/login" className="hover:underline">Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

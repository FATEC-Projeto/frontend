import Link from "next/link";
import { Scale } from "lucide-react";

export const metadata = {
  title: "Termos de Uso | Workflow Fatec",
  description: "Termos e condições de uso do portal Workflow Fatec.",
};

export default function TermosPage() {
  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      {/* Header simples */}
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

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Título */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 grid place-items-center text-primary">
            <Scale className="size-5" />
          </div>
          <div>
            <h1 className="font-grotesk text-2xl font-semibold">Termos de Uso</h1>
            <p className="text-sm text-muted-foreground">Última atualização: maio de 2026</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90 leading-relaxed">

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">1. Identificação do Titular</h2>
            <p>
              O portal <strong>Workflow Fatec</strong> é um sistema de autoatendimento acadêmico desenvolvido
              para uso interno das Faculdades de Tecnologia (Fatec) vinculadas ao{" "}
              <strong>Centro Estadual de Educação Tecnológica Paula Souza — CEETEPS</strong>,
              autarquia de regime especial do Governo do Estado de São Paulo, inscrita no CNPJ sob o n.º{" "}
              <strong>62.823.257/0001-09</strong>, com sede na Rua dos Andradas, n.º 140,
              Santa Ifigênia, CEP 01208-000, São Paulo/SP.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">2. Objeto</h2>
            <p>
              O Workflow Fatec tem por finalidade facilitar a comunicação entre alunos e setores
              administrativos das Fatecs, permitindo o registro, acompanhamento e resolução de
              solicitações acadêmicas (declarações, revisão de notas, correção de dados, estágios,
              entre outros) de forma digital e rastreável.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">3. Acesso ao Sistema</h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>O acesso é restrito a alunos regularmente matriculados e funcionários autorizados pelo Centro Paula Souza.</li>
              <li>As credenciais de acesso (e-mail institucional ou Registro de Aluno — RA, e senha) são pessoais e intransferíveis.</li>
              <li>É vedado o compartilhamento de credenciais ou o acesso por pessoa não autorizada.</li>
              <li>O usuário é responsável por manter a confidencialidade de sua senha e por todas as ações realizadas com seu acesso.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">4. Uso Adequado</h2>
            <p>Ao utilizar o Workflow Fatec, o usuário compromete-se a:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Fornecer informações verídicas e atualizadas no cadastro e nas solicitações;</li>
              <li>Usar o sistema exclusivamente para fins acadêmicos legítimos;</li>
              <li>Não realizar tentativas de acesso não autorizado, engenharia reversa ou qualquer ação que comprometa a segurança ou disponibilidade do sistema;</li>
              <li>Não inserir conteúdo ofensivo, discriminatório, ilícito ou que viole direitos de terceiros;</li>
              <li>Respeitar os prazos institucionais comunicados por meio do sistema.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">5. Disponibilidade e Limitações</h2>
            <p>
              O Centro Paula Souza não garante a disponibilidade ininterrupta do sistema.
              O acesso pode ser suspenso para manutenção, atualização ou por razões de segurança,
              sem aviso prévio. O CEETEPS não se responsabiliza por danos decorrentes de falhas
              de conexão à internet, indisponibilidade de infraestrutura ou situações fora de seu controle.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">6. Propriedade Intelectual</h2>
            <p>
              Todos os conteúdos, marcas, layouts e funcionalidades do Workflow Fatec são de
              propriedade ou uso autorizado pelo CEETEPS. É vedada a reprodução, distribuição
              ou modificação sem autorização expressa.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">7. Proteção de Dados</h2>
            <p>
              O tratamento de dados pessoais realizado por este sistema está em conformidade com
              a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD — Lei n.º 13.709/2018)</strong>{" "}
              e com o <strong>Decreto Estadual n.º 65.347, de 9 de dezembro de 2020</strong>.
              Para detalhes sobre coleta, uso e seus direitos, consulte nossa{" "}
              <Link href="/privacidade" className="text-[var(--brand-cyan)] hover:underline">
                Política de Privacidade
              </Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">8. Suspensão e Encerramento de Acesso</h2>
            <p>
              O CEETEPS reserva-se o direito de suspender ou cancelar o acesso do usuário que
              descumprir estes Termos, praticar atos fraudulentos ou que prejudiquem outros
              usuários ou a instituição, sem prejuízo das medidas administrativas e legais cabíveis.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">9. Alterações</h2>
            <p>
              Estes Termos podem ser atualizados a qualquer momento. As alterações serão
              comunicadas por meio das páginas eletrônicas oficiais. O uso continuado do sistema
              após a publicação das alterações implica concordância com os novos termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">10. Lei Aplicável e Foro</h2>
            <p>
              Estes Termos são regidos pela legislação brasileira. Eventuais conflitos serão
              submetidos ao foro da Comarca de São Paulo, Estado de São Paulo, com renúncia
              expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-grotesk text-base font-semibold text-foreground">11. Contato</h2>
            <p>Dúvidas sobre estes Termos podem ser enviadas pelos canais institucionais:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>E-mail: <a href="mailto:faleconosco@cps.sp.gov.br" className="text-[var(--brand-cyan)] hover:underline">faleconosco@cps.sp.gov.br</a></li>
              <li>Telefone: (11) 3324-3300</li>
              <li>Ouvidoria: (11) 3324-3431 / 3324-3430</li>
              <li>Endereço: Rua dos Andradas, 140 — Santa Ifigênia — CEP 01208-000 — São Paulo/SP</li>
            </ul>
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

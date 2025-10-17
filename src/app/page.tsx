import Link from "next/link";
import { ENV } from "@/config/env";

<div className="test-tailwind-v4">Tailwind v4 ON?</div>

export default async function Home() {
  return (
    <main className="min-h-screen">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="#" className="flex items-center gap-3 group">
            <div className="size-9 grid place-items-center rounded-lg bg-primary text-primary-foreground font-bold">WF</div>
            <span className="font-grotesk text-lg tracking-tight group-hover:opacity-80 transition">Workflow Fatec</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#como-funciona" className="hover:opacity-80">Como Funciona</a>
            <a href="#recursos" className="hover:opacity-80">Recursos</a>
            <a href="#impacto" className="hover:opacity-80">Impacto</a>
            <Link href="/dashboard/aluno" className="inline-flex items-center rounded-md px-3 py-2 border hover:bg-secondary">Acessar Dashboard</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <p className="font-grotesk text-sm uppercase tracking-widest text-muted-foreground">WF · Workflow Fatec</p>
            <h1>Workflow Fatec</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-prose">
              Gestão acadêmica integrada entre alunos, professores e secretaria.
            </p>
            <p className="text-muted-foreground max-w-prose">
              Plataforma desenvolvida por alunos da FATEC Cotia para otimizar processos internos e a comunicação institucional.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#como-funciona" className="inline-flex items-center rounded-md px-4 py-2 bg-primary text-primary-foreground hover:opacity-90">Saiba como funciona</a>
              <Link href="/dashboard/aluno" className="inline-flex items-center rounded-md px-4 py-2 border hover:bg-secondary">Acessar Dashboard</Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="i-hero" aria-hidden />
              <a href="#sobre" className="underline underline-offset-4">Rolar para conhecer</a>
            </div>
            {/* Opcional: informações de ambiente */}
            {/* <p>Ambiente: <strong>{ENV.NEXT_PUBLIC_ENV}</strong></p>
            <p>API base: <strong>{ENV.NEXT_PUBLIC_API_BASE_URL}</strong></p> */}
          </div>
          <div className="relative">
            <div className="aspect-[4/3] w-full rounded-2xl border grid place-items-center text-center p-8">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Interface moderna e intuitiva</p>
                <h3 className="text-3xl font-grotesk">Workflow Fatec</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre o Projeto */}
      <section id="sobre" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 items-start">
          <div className="space-y-4">
            <p className="font-grotesk text-sm uppercase tracking-widest text-muted-foreground">Sobre o Projeto</p>
            <h2>Conheça a história e a missão do Workflow Fatec</h2>
            <p className="text-muted-foreground">Projeto Acadêmico</p>
            <p className="text-muted-foreground">
              O Workflow Fatec é um projeto desenvolvido por alunos do curso de Desenvolvimento de Software Multiplataforma (DSM) da FATEC Cotia, com o objetivo de otimizar os processos internos de gestão acadêmica e melhorar a comunicação entre alunos, professores e secretaria.
            </p>
            <p className="text-muted-foreground">
              Nascido da necessidade real de modernizar os fluxos de trabalho administrativos, a plataforma integra funcionalidades de sistema de chamados, gerenciamento de documentos e notificações centralizadas em uma única interface intuitiva.
            </p>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border p-6">
              <h3 className="mb-2">Evolução do Projeto</h3>
              <ol className="grid gap-4">
                <li className="rounded-lg border p-4">
                  <p className="font-medium">Início</p>
                  <p className="text-sm text-muted-foreground">Definição de escopo e requisitos com stakeholders</p>
                </li>
                <li className="rounded-lg border p-4">
                  <p className="font-medium">Desenvolvimento</p>
                  <p className="text-sm text-muted-foreground">Codificação, testes e refinamento das funcionalidades</p>
                </li>
                <li className="rounded-lg border p-4">
                  <p className="font-medium">Integração</p>
                  <p className="text-sm text-muted-foreground">Deploy e integração com sistemas da secretaria</p>
                </li>
              </ol>
            </div>
            <div className="rounded-2xl border p-6">
              <h3 className="mb-2">Curso DSM</h3>
              <p className="text-muted-foreground">
                Desenvolvimento de Software Multiplataforma é um curso técnico de nível superior da FATEC Cotia que prepara profissionais para atuar no desenvolvimento de soluções tecnológicas modernas, com foco em metodologias ágeis e tecnologias de mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="border-t border-b bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="space-y-3 mb-10">
            <p className="font-grotesk text-sm uppercase tracking-widest text-muted-foreground">Como Funciona</p>
            <h2>Fluxo integrado entre os três pilares da plataforma</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Secretaria */}
            <div className="rounded-2xl border p-6 bg-card">
              <h3 className="mb-2">Secretaria</h3>
              <p className="text-sm text-muted-foreground mb-4">Gerencia chamados N1, N2, N3 e centraliza documentos e evidências do projeto.</p>
              <ul className="space-y-2 text-sm">
                <li>• Criar e atribuir chamados</li>
                <li>• Gerenciar solicitações</li>
                <li>• Acessar histórico completo</li>
              </ul>
            </div>
            {/* Professores */}
            <div className="rounded-2xl border p-6 bg-card">
              <h3 className="mb-2">Professores</h3>
              <p className="text-sm text-muted-foreground mb-4">Visualizam solicitações atribuídas, atualizam status e fornecem feedback.</p>
              <ul className="space-y-2 text-sm">
                <li>• Ver chamados designados</li>
                <li>• Registrar progresso</li>
                <li>• Comunicação integrada</li>
              </ul>
            </div>
            {/* Alunos */}
            <div className="rounded-2xl border p-6 bg-card">
              <h3 className="mb-2">Alunos</h3>
              <p className="text-sm text-muted-foreground mb-4">Acompanham status de suas solicitações e recebem notificações em tempo real.</p>
              <ul className="space-y-2 text-sm">
                <li>• Consultar status</li>
                <li>• Receber notificações</li>
                <li>• Upload de evidências</li>
              </ul>
            </div>
          </div>

          {/* Fluxo de Integração */}
          <div className="mt-10 rounded-2xl border p-6">
            <h3 className="mb-4">Fluxo de Integração</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg border p-4">
                <p className="font-medium">N1</p>
                <p className="text-sm text-muted-foreground">Inicial</p>
              </div>
              <div className="grid place-items-center">→</div>
              <div className="rounded-lg border p-4">
                <p className="font-medium">N2</p>
                <p className="text-sm text-muted-foreground">Intermediário</p>
              </div>
              <div className="grid place-items-center col-span-3 md:col-span-3">→</div>
              <div className="rounded-lg border p-4 col-span-3">
                <p className="font-medium">N3</p>
                <p className="text-sm text-muted-foreground">Finalização</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principais Recursos */}
      <section id="recursos" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="space-y-3 mb-10">
          <p className="font-grotesk text-sm uppercase tracking-widest text-muted-foreground">Principais Recursos</p>
          <h2>Funcionalidades desenvolvidas para otimizar a gestão acadêmica</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {t:"Sistema de Chamados N1/N2/N3",d:"Estrutura hierárquica de atendimento com diferentes níveis de complexidade."},
            {t:"Histórico de Solicitações",d:"Rastreamento completo de todas as solicitações e suas evoluções."},
            {t:"Upload/Download de Evidências",d:"Compartilhamento seguro de documentos e arquivos entre os usuários."},
            {t:"Visualização Centralizada",d:"Dashboard intuitivo com todas as informações relevantes em um só lugar."},
            {t:"Logs e Auditoria",d:"Registro detalhado de todas as ações para conformidade e segurança."},
            {t:"Integração Entre Setores",d:"Comunicação fluida e integrada entre secretaria, professores e alunos."},
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border p-6 bg-card">
              <h3 className="mb-2">{f.t}</h3>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Desenvolvimento e Tecnologias */}
      <section className="border-t border-b bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="space-y-3 mb-10">
            <p className="font-grotesk text-sm uppercase tracking-widest text-muted-foreground">Desenvolvimento e Tecnologias</p>
            <h2>Construído com as melhores práticas e tecnologias de mercado</h2>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {["Node.js","React","TypeScript","PostgreSQL","Prisma","JWT","Docker"].map((tool) => (
              <div key={tool} className="rounded-xl border p-4 text-center bg-card">{tool}</div>
            ))}
          </div>
          <p className="mt-6 text-muted-foreground max-w-3xl">
            A plataforma foi desenvolvida seguindo as melhores práticas de engenharia de software, incluindo testes automatizados, CI/CD, segurança de dados e escalabilidade.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <p className="font-medium">Versionamento</p>
              <p className="text-sm text-muted-foreground">Git com estratégia de branches</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium">CI/CD</p>
              <p className="text-sm text-muted-foreground">Integração e deploy contínuos</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium">Segurança</p>
              <p className="text-sm text-muted-foreground">Autenticação e criptografia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Impacto Acadêmico */}
      <section id="impacto" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="space-y-3 mb-10">
          <p className="font-grotesk text-sm uppercase tracking-widest text-muted-foreground">Impacto Acadêmico</p>
          <h2>Métricas e resultados do projeto na FATEC Cotia</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border p-6 text-center bg-card">
            <p className="text-4xl font-grotesk font-bold">+200</p>
            <p className="text-sm text-muted-foreground">Chamados Testados</p>
          </div>
          <div className="rounded-2xl border p-6 text-center bg-card">
            <p className="text-4xl font-grotesk font-bold">+30</p>
            <p className="text-sm text-muted-foreground">Usuários em Fase Piloto</p>
          </div>
          <div className="rounded-2xl border p-6 text-center bg-card">
            <p className="text-4xl font-grotesk font-bold">100%</p>
            <p className="text-sm text-muted-foreground">Código Open Source</p>
          </div>
          <div className="rounded-2xl border p-6 text-center bg-card">
            <p className="text-4xl font-grotesk font-bold">∞</p>
            <p className="text-sm text-muted-foreground">Inovação Aplicada</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="font-medium">Mais Agilidade</p>
            <p className="text-sm text-muted-foreground">Redução de tempo em processos administrativos da secretaria</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">Mais Transparência</p>
            <p className="text-sm text-muted-foreground">Alunos e professores com visibilidade total do andamento</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">Inovação Aplicada</p>
            <p className="text-sm text-muted-foreground">Rotina acadêmica modernizada com tecnologia de mercado</p>
          </div>
        </div>
        <p className="mt-6 text-muted-foreground max-w-3xl">
          Projeto que faz a diferença — O Workflow Fatec demonstra como a inovação tecnológica pode ser aplicada aos desafios reais da instituição, criando valor tanto para a comunidade acadêmica quanto para os alunos desenvolvedores.
        </p>
      </section>

      {/* Equipe e Créditos */}
      <section className="border-t border-b bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="space-y-3 mb-10">
            <p className="font-grotesk text-sm uppercase tracking-widest text-muted-foreground">Equipe e Créditos</p>
            <h2>Projeto desenvolvido por alunos e professores da FATEC Cotia</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border p-6 bg-card">
              <h3 className="mb-2">Alunos Desenvolvedores</h3>
              <p className="text-sm text-muted-foreground mb-4">
                O projeto é desenvolvido por alunos do curso de Desenvolvimento de Software Multiplataforma (DSM), aplicando conhecimentos de engenharia de software, metodologias ágeis e tecnologias modernas em um contexto real.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["D1","D2","D3","D4"].map((n) => (
                  <div key={n} className="rounded-lg border p-4">
                    <p className="font-medium">{n}</p>
                    <p className="text-sm text-muted-foreground">Desenvolvedor</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border p-6 bg-card">
              <h3 className="mb-2">Orientação</h3>
              <p className="text-sm text-muted-foreground mb-4">
                O projeto conta com a orientação de professores experientes do curso DSM, que contribuem com supervisão técnica, feedback construtivo e direcionamento estratégico.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {["P1","P2","P3"].map((n) => (
                  <div key={n} className="rounded-lg border p-4 text-center">
                    <p className="font-medium">{n}</p>
                    <p className="text-sm text-muted-foreground">Professor</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Identidade institucional */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border p-4 text-center">
              <p className="font-grotesk text-2xl">FC</p>
              <p className="text-sm text-muted-foreground">FATEC</p>
              <p className="text-sm">FATEC Cotia</p>
              <p className="text-xs text-muted-foreground">Instituição de ensino superior técnico</p>
            </div>
            <div className="rounded-xl border p-4 text-center">
              <p className="font-grotesk text-2xl">DSM</p>
              <p className="text-sm text-muted-foreground">Curso</p>
              <p className="text-sm">Desenvolvimento de Software Multiplataforma</p>
              <p className="text-xs text-muted-foreground">Curso técnico de nível superior</p>
              <p className="text-xs">Preparando profissionais para o mercado de tecnologia</p>
            </div>
            <div className="rounded-xl border p-4 text-center">
              <p className="font-grotesk text-2xl">WF</p>
              <p className="text-sm text-muted-foreground">Workflow Fatec</p>
              <p className="text-sm">Plataforma de gestão acadêmica integrada para a FATEC Cotia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 md:grid-cols-4">
          <div className="space-y-2">
            <div className="size-9 grid place-items-center rounded-lg bg-primary text-primary-foreground font-bold">WF</div>
            <p className="text-sm text-muted-foreground max-w-xs">Plataforma de gestão acadêmica integrada para a FATEC Cotia.</p>
          </div>
          <div>
            <p className="font-medium mb-3">Recursos</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline">GitHub</a></li>
              <li><a href="#" className="hover:underline">Documentação</a></li>
              <li><a href="#" className="hover:underline">Manual do Usuário</a></li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-3">Instituição</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline">FATEC Cotia</a></li>
              <li><a href="#" className="hover:underline">Curso DSM</a></li>
              <li><a href="#" className="hover:underline">Sobre a FATEC</a></li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-3">Contato</p>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:workflow@fatec.sp.gov.br" className="hover:underline">workflow@fatec.sp.gov.br</a></li>
              <li className="text-muted-foreground">© 2025 Workflow Fatec. Projeto acadêmico do Curso DSM – FATEC Cotia.</li>
              <li className="flex gap-4">
                <a href="#" className="text-sm hover:underline">Privacidade</a>
                <a href="#" className="text-sm hover:underline">Termos de Uso</a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}


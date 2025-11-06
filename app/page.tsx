"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6F8F9] text-foreground">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-8 grid place-items-center rounded-md bg-red-600 text-white font-bold">WF</div>
            <span className="text-sm md:text-base tracking-tight group-hover:opacity-80 transition">
              Workflow Fatec
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#sobre" className="hover:opacity-80">Sobre</a>
            <a href="#como-funciona" className="hover:opacity-80">Como Funciona</a>
            <a href="#recursos" className="hover:opacity-80">Recursos</a>
            <Link
              href="/login"
              className="inline-flex items-center rounded-md px-3 py-2 border shadow-sm hover:bg-gray-50"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Workflow <span className="text-red-600">Fatec</span>
            </h1>

            <div className="w-14 h-1 rounded-full mx-auto bg-gray-200" />

            <p className="text-base md:text-lg text-muted-foreground">
              Gestão acadêmica <strong className="text-foreground">integrada</strong> entre alunos,
              professores e secretaria.
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Plataforma desenvolvida por alunos da FATEC Cotia para otimizar
              processos internos e a comunicação institucional.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href="#como-funciona"
                className="inline-flex items-center rounded-md px-4 py-2 bg-red-600 text-white shadow hover:opacity-95"
              >
                Saiba como funciona →
              </a>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md px-4 py-2 border bg-white hover:bg-gray-50"
              >
                Acessar Dashboard
              </Link>
            </div>
          </div>

        {/* Mock de mídia substituído por imagem real */}
        <div className="mt-10 md:mt-12">
          <div className="mx-auto max-w-3xl rounded-2xl border bg-gray-50 p-4 md:p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border bg-white">
              <img
                src="/images/aluno-dashboard.png"
                alt="Dashboard do aluno no Workflow Fatec"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>


          {/* Indicador de scroll */}
          <div className="pt-10 md:pt-12 flex justify-center">
            <a href="#sobre" className="group flex flex-col items-center gap-3 text-muted-foreground">
              <span className="inline-block w-6 h-9 rounded-full border relative">
                <span className="absolute left-1/2 top-2 -translate-x-1/2 w-1.5 h-2.5 rounded-full bg-gray-400 group-hover:translate-y-2 transition" />
              </span>
              <span className="text-xs">VOLTAR NA EXPLORAÇÃO</span>
            </a>
          </div>
        </div>
      </section>

      {/* SOBRE O PROJETO */}
      <section id="sobre" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 items-start">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 text-xs bg-red-50 text-red-700 border border-red-100 rounded-full px-3 py-1">
              Projeto acadêmico
            </span>
            <h2 className="text-2xl md:text-3xl font-bold">Sobre o Projeto</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              O Workflow Fatec é um projeto desenvolvido por alunos do curso DSM da FATEC Cotia,
              com foco em melhorar a comunicação e a eficiência entre alunos, professores e secretaria.
            </p>
            <p className="text-sm md:text-base text-muted-foreground">
              A iniciativa nasceu da necessidade de modernizar fluxos administrativos, centralizando
              chamados, documentos e notificações em uma interface única.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6">
              <h3 className="mb-2 font-semibold">Evolução do Projeto</h3>
              <ol className="space-y-3">
                <li className="rounded-lg border p-4">
                  <p className="font-medium">Visão</p>
                  <p className="text-sm text-muted-foreground">
                    Definição de escopo e mapeamento com stakeholders
                  </p>
                </li>
                <li className="rounded-lg border p-4">
                  <p className="font-medium">Desenvolvimento</p>
                  <p className="text-sm text-muted-foreground">
                    Codificação, testes e refinamento das funcionalidades
                  </p>
                </li>
                <li className="rounded-lg border p-4">
                  <p className="font-medium">Integração</p>
                  <p className="text-sm text-muted-foreground">
                    Deploy e integração com sistemas da secretaria
                  </p>
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <h3 className="mb-2 font-semibold">Curso DSM</h3>
              <p className="text-sm text-muted-foreground">
                Desenvolvimento de Software Multiplataforma na FATEC Cotia, com foco em metodologias ágeis,
                engenharia de software e tecnologias do mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="border-t border-b bg-[#F3F4F6]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Como funciona</h2>
            <p className="text-sm text-muted-foreground">
              Fluxo integrado entre os três pilares da plataforma
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                t: "Secretaria",
                d: "Gerencia chamados (N1, N2 e N3), centraliza documentos e evidências.",
                items: ["Criar e atribuir chamados", "Gerenciar solicitações", "Histórico completo"],
              },
              {
                t: "Professores",
                d: "Visualizam solicitações, atualizam status e fornecem feedback.",
                items: ["Ver chamados designados", "Registrar progresso", "Comunicação integrada"],
              },
              {
                t: "Alunos",
                d: "Acompanham seus chamados e recebem notificações.",
                items: ["Consultar status", "Receber notificações", "Upload de evidências"],
              },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border bg-white p-6">
                <h3 className="mb-2 font-semibold">{c.t}</h3>
                <p className="text-sm text-muted-foreground mb-4">{c.d}</p>
                <ul className="space-y-2 text-sm">
                  {c.items.map((i) => (
                    <li key={i}>• {i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Fluxo N1 → N2 → N3 */}
          <div className="mt-10 rounded-2xl border bg-white p-6">
            <h3 className="mb-4 font-semibold text-center">Fluxo de Integração</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              {[
                { n: "N1", d: "Inicial" },
                { n: "N2", d: "Intermediário" },
                { n: "N3", d: "Produção" },
              ].map((s, idx) => (
                <div key={s.n} className="flex items-center gap-4">
                  <div className="w-40 rounded-lg border p-4 text-center">
                    <p className="font-medium">{s.n}</p>
                    <p className="text-xs text-muted-foreground">{s.d}</p>
                  </div>
                  {idx < 2 && <span className="text-xl md:mx-2">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRINCIPAIS RECURSOS */}
      <section id="recursos" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">Principais Recursos</h2>
          <p className="text-sm text-muted-foreground">
            Explore as ferramentas que tornam a gestão acadêmica mais ágil, transparente e colaborativa.
          </p>
        </div>

        {/* Grade com cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* CARD 1 */}
          <div className="rounded-2xl border bg-white p-6 grid gap-3 hover:shadow-sm transition">
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-red-50 border border-red-100 text-red-600 font-bold text-lg">
              💬
            </div>
            <h3 className="font-semibold text-lg">Central de Chamados</h3>
            <p className="text-sm text-muted-foreground">
              Abertura e acompanhamento de solicitações entre alunos, secretaria e coordenação, com status e histórico em tempo real.
            </p>
          </div>

          {/* CARD 2 */}
          <div className="rounded-2xl border bg-white p-6 grid gap-3 hover:shadow-sm transition">
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-red-50 border border-red-100 text-red-600 font-bold text-lg">
              🗂️
            </div>
            <h3 className="font-semibold text-lg">Histórico Acadêmico Integrado</h3>
            <p className="text-sm text-muted-foreground">
              Visualize informações de matrícula, notas e frequência em um só ambiente conectado ao sistema institucional.
            </p>
          </div>

          {/* CARD 3 */}
          <div className="rounded-2xl border bg-white p-6 grid gap-3 hover:shadow-sm transition">
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-red-50 border border-red-100 text-red-600 font-bold text-lg">
              🧩
            </div>
            <h3 className="font-semibold text-lg">Suporte Técnico e Administrativo</h3>
            <p className="text-sm text-muted-foreground">
              Encaminhe chamados diretamente para os setores responsáveis (N1, N2, N3), garantindo agilidade e rastreabilidade.
            </p>
          </div>

          {/* CARD 4 */}
          <div className="rounded-2xl border bg-white p-6 grid gap-3 hover:shadow-sm transition">
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-red-50 border border-red-100 text-red-600 font-bold text-lg">
              🔐
            </div>
            <h3 className="font-semibold text-lg">Gestão de Usuários e Permissões</h3>
            <p className="text-sm text-muted-foreground">
              Controle de perfis e níveis de acesso para alunos, professores e servidores, com autenticação segura e centralizada.
            </p>
          </div>

          {/* CARD 5 */}
          <div className="rounded-2xl border bg-white p-6 grid gap-3 hover:shadow-sm transition">
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-red-50 border border-red-100 text-red-600 font-bold text-lg">
              🔔
            </div>
            <h3 className="font-semibold text-lg">Notificações e Alertas</h3>
            <p className="text-sm text-muted-foreground">
              Receba alertas automáticos sobre prazos, comunicados e atualizações de chamados diretamente na plataforma.
            </p>
          </div>

          {/* CARD 6 */}
          <div className="rounded-2xl border bg-white p-6 grid gap-3 hover:shadow-sm transition">
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-red-50 border border-red-100 text-red-600 font-bold text-lg">
              📊
            </div>
            <h3 className="font-semibold text-lg">Painel de Indicadores</h3>
            <p className="text-sm text-muted-foreground">
              Visualize métricas institucionais, volume de chamados e relatórios gerenciais em tempo real para decisões estratégicas.
            </p>
          </div>
        </div>
      </section>


      {/* FOOTER minimalista */}
      <footer className="bg-[#F3F4F6] border-t">
        <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 md:grid-cols-4">
          <div className="space-y-2">
            <div className="size-8 grid place-items-center rounded-md bg-red-600 text-white font-bold">WF</div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Plataforma de gestão acadêmica integrada para a FATEC Cotia.
            </p>
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
              <li className="text-muted-foreground">© 2025 Workflow Fatec. Projeto acadêmico DSM – FATEC Cotia.</li>
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

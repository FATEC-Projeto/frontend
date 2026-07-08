"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FormFuncionarioCreate from "../../_components/FormFuncionarioCreate";

export default function NovoFuncionarioPage() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div>
        <Link
          href="/admin/funcionarios"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar para funcionários
        </Link>
        <h1 className="font-grotesk mt-2 text-2xl font-semibold tracking-tight">
          Cadastrar funcionário
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Crie uma conta de equipe (backoffice, técnico ou administrador).
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-card p-5 sm:p-6">
        <FormFuncionarioCreate
          onSuccess={() => router.push("/admin/funcionarios")}
          onCancel={() => router.push("/admin/funcionarios")}
        />
      </div>
    </div>
  );
}

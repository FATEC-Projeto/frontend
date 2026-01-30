import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold font-grotesk text-primary">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Página não encontrada
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
      >
        Voltar ao início
      </Link>
    </div>
  );
}

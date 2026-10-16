import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = Readonly<{
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}>;

export default function SugestoesPaginacao({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginação das sugestões" className="flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label="Página anterior"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[var(--muted)]"
      >
        <ChevronLeft className="size-4" />
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          type="button"
          aria-label={`Página ${number}`}
          aria-current={number === page ? "page" : undefined}
          onClick={() => onPageChange(number)}
          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm ${number === page ? "bg-primary text-primary-foreground" : "border border-[var(--border)] hover:bg-[var(--muted)]"}`}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        aria-label="Próxima página"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[var(--muted)]"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

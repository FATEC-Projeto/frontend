import { cx } from "../../../utils/cx";

type Props = {
  className?: string;
};

export function Skeleton({ className }: Props) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-md bg-[var(--skeleton)]",
        className,
      )}
    />
  );
}

export function SkeletonCard({ rows = 2 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-card">
      <div className="bg-[var(--muted)] px-4 py-3">
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-6 px-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonKpi() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4 flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-12" />
      </div>
      <Skeleton className="size-10 rounded-lg shrink-0" />
    </div>
  );
}

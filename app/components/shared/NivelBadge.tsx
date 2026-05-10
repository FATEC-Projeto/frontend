import { cx } from "../../../utils/cx";

type Nivel = "N1" | "N2" | "N3";

type Props = { nivel: Nivel };

const map: Record<Nivel, string> = {
  N1: "bg-[var(--info)]/12 text-[var(--info)] border-[var(--info)]/30",
  N2: "bg-[var(--brand-teal)]/12 text-[var(--brand-teal)] border-[var(--brand-teal)]/30",
  N3: "bg-[var(--brand-red)]/12 text-[var(--brand-red)] border-[var(--brand-red)]/30",
};

export default function NivelBadge({ nivel }: Props) {
  const cls = map[nivel] ?? "bg-[var(--muted)] text-muted-foreground border-[var(--border)]";
  return (
    <span className={cx("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border", cls)}>
      {nivel}
    </span>
  );
}

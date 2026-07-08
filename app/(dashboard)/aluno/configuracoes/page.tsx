"use client";

import { useEffect, useState } from "react";
import { Bell, Globe, Loader2, Moon, RotateCcw, Save, Settings, Sun } from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { cx } from "../../../../utils/cx";
import { apiFetch, extractApiError } from "../../../../utils/api";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const LS_KEYS = {
  theme: "theme",
} as const;

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(LS_KEYS.theme) as "light" | "dark" | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cx(
        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors",
        checked ? "bg-primary" : "bg-[var(--muted)]"
      )}
    >
      <span
        className={cx(
          "absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function ConfiguracoesAlunoPage() {
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const [platNotif, setPlatNotif] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Preferência de notificações vem do backend (usuario.notificacoesInApp).
  useEffect(() => {
    apiFetch(`${API}/auth/me`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setUserId(data.id ?? null);
        if (typeof data.notificacoesInApp === "boolean") setPlatNotif(data.notificacoesInApp);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(LS_KEYS.theme, theme);
  }, [theme]);

  function handleRestoreDefaults() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LS_KEYS.theme);
    const defaultTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(defaultTheme);
    setPlatNotif(true);
    toast.info("Preferências restauradas. Clique em Salvar para aplicar as notificações.");
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) { toast.error("Não foi possível identificar seu usuário."); return; }
    try {
      setSaving(true);
      // Tema é local (visual); a preferência de notificações persiste no backend.
      const res = await apiFetch(`${API}/usuarios/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificacoesInApp: platNotif }),
      });
      if (!res.ok) throw new Error(await extractApiError(res, `Erro ${res.status}`));
      toast.success("Configurações salvas!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-end">
        <MobileSidebarTriggerAluno />
      </div>

      <form
        onSubmit={saveConfig}
        className="rounded-xl border border-[var(--border)] bg-card p-5 sm:p-6 grid gap-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Settings className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Preferências gerais</h2>
        </div>

        {/* Tema */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-3">
            {theme === "dark"
              ? <Moon className="size-5 text-muted-foreground" />
              : <Sun className="size-5 text-muted-foreground" />}
            <div>
              <div className="font-medium">Tema escuro</div>
              <div className="text-sm text-muted-foreground">Alterna entre o modo claro e escuro da interface.</div>
            </div>
          </div>
          <Toggle checked={theme === "dark"} onChange={() => setTheme((t) => t === "dark" ? "light" : "dark")} />
        </div>

        {/* Idioma */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-3">
            <Globe className="size-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Idioma</span>
                <span className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-muted-foreground">em breve</span>
              </div>
              <div className="text-sm text-muted-foreground">O sistema está disponível apenas em Português (Brasil).</div>
            </div>
          </div>
          <select disabled className="h-9 rounded-lg border border-[var(--border)] bg-input px-3 text-sm opacity-50 cursor-not-allowed" value="pt-BR">
            <option value="pt-BR">Português (Brasil)</option>
          </select>
        </div>

        {/* Notificações na plataforma */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Notificações na plataforma</div>
              <div className="text-sm text-muted-foreground">Receba alertas sobre atualizações de solicitações e mensagens diretamente aqui no sistema.</div>
              <div className="text-xs text-muted-foreground mt-1">Envio de e-mail é gerenciado pela instituição e não é configurável aqui.</div>
            </div>
          </div>
          <Toggle checked={platNotif} onChange={() => setPlatNotif((v) => !v)} />
        </div>

        {/* Restaurar preferências */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="size-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Restaurar preferências padrão</div>
              <div className="text-sm text-muted-foreground">Volta as configurações de tema e notificações para o padrão original.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-sm"
          >
            <RotateCcw className="size-4" />
            Restaurar
          </button>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className={cx(
              "inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm",
              saving && "opacity-60 cursor-not-allowed"
            )}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  );
}

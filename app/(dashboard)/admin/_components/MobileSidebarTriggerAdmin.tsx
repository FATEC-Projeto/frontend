"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import SidebarAdmin from "./SidebarAdmin";

export default function MobileSidebarTriggerAdmin() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="xl:hidden inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-4" /> Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* 🔥 Overlay agora é um <button> acessível */}
          <button
            type="button"
            aria-label="Fechar sidebar"
            className="absolute inset-0 bg-black/30 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[320px] bg-background shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-grotesk font-semibold">Secretaria</div>

              <button
                type="button"
                className="inline-grid place-items-center size-9 rounded-md hover:bg-[var(--muted)]"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <SidebarAdmin onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

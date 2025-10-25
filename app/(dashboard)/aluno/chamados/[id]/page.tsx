"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Chamado = {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  criadoEm: string;
};

export default function ChamadoDetalhePage() {
  const { id } = useParams();
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChamado() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Sessão expirada.");

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Não foi possível carregar o chamado.");
        const data = await res.json();
        setChamado(data);
      } catch (err: any) {
        toast.error(err.message || "Erro ao carregar chamado.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchChamado();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Carregando chamado...
      </div>
    );
  }

  if (!chamado) {
    return <div className="text-center py-16 text-muted-foreground">Chamado não encontrado.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 rounded-xl border border-[var(--border)] bg-card">
      <h1 className="text-2xl font-bold mb-2">{chamado.titulo}</h1>
      <p className="text-sm text-muted-foreground mb-4">ID: {chamado.id}</p>

      <div className="space-y-2">
        <p><strong>Descrição:</strong> {chamado.descricao}</p>
        <p><strong>Status:</strong> {chamado.status}</p>
        <p><strong>Criado em:</strong> {new Date(chamado.criadoEm).toLocaleString("pt-BR")}</p>
      </div>
    </div>
  );
}

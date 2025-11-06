"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import { apiFetch } from "../../utils/api";

export default function PrimeiroAcessoPage() {
  const ra = useMemo(() => localStorage.getItem("pendingRA") || "", []);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isValid = useMemo(() => {
    return (
      oldPassword.length >= 6 &&
      newPassword.length >= 6 &&
      confirmPassword === newPassword
    );
  }, [oldPassword, newPassword, confirmPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!ra) {
      toast.error("RA não encontrado. Faça login novamente.");
      window.location.href = "/login";
      return;
    }

    if (!isValid) {
      toast.error("Preencha todos os campos corretamente.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/password_reset`,
        {
          method: "POST",
          body: JSON.stringify({ ra, oldPassword, newPassword }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao redefinir senha");
      }

      toast.success("Senha redefinida com sucesso!");
      localStorage.removeItem("pendingRA");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err: any) {
      toast.error(err?.message || "Falha ao redefinir senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Lock size={40} className="text-blue-600 mb-2" />
          <h1 className="text-2xl font-semibold text-center">
            Redefinir senha de primeiro acesso
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Altere sua senha provisória para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Senha atual */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Senha atual
            </label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nova senha
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar nova senha */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirme a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className={`w-full flex items-center justify-center gap-2 py-2 mt-4 rounded-lg text-white transition ${
              loading || !isValid
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Atualizando..." : "Confirmar redefinição"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

type ResultRow = {
  idx: number;
  ra: string;
  emailEducacional: string;
  emailPessoal?: string;
  nome?: string;
  cursoNome?: string;
  cursoSigla?: string;
  status: "PENDING" | "OK" | "ERROR";
  errorMsg?: string;
  note?: string; // ex.: "Já existia"
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/** Parser simples (CSV com vírgula, sem aspas complexas). */
function parseCsvSimple(text: string): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map((l) => l.split(",").map((p) => p.trim()));
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
const DEFAULT_PASSWORD = "Mudar123#"; // atende o Zod atual (senha Required)

export default function ImportAlunos({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const total = rows.length;
  const ok = rows.filter((r) => r.status === "OK").length;
  const err = rows.filter((r) => r.status === "ERROR").length;
  const done = ok + err;
  const pct = total ? Math.round((done * 100) / total) : 0;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const text = await file.text();
    const raw = parseCsvSimple(text);
    if (raw.length <= 1) {
      alert("CSV vazio ou apenas header.");
      e.target.value = "";
      return;
    }

    const [header, ...data] = raw;
    const mapIdx = (key: string) =>
      header.findIndex((h) => h.toLowerCase() === key.toLowerCase());

    const iRA = mapIdx("ra");
    const iEdu = mapIdx("emailEducacional");
    const iPes = mapIdx("emailPessoal");
    const iNome = mapIdx("nome");
    const iCursoNome = mapIdx("cursoNome");
    const iCursoSigla = mapIdx("cursoSigla");

    if (iRA < 0 || iEdu < 0) {
      alert("Cabeçalho inválido. É obrigatório conter as colunas: ra, emailEducacional.");
      e.target.value = "";
      return;
    }

    const seenRA = new Set<string>();
    const parsed: ResultRow[] = data.map((cols, idx) => {
      const ra = (cols[iRA] || "").trim();
      const emailEducacional = (cols[iEdu] || "").trim();
      const emailPessoal = iPes >= 0 ? (cols[iPes] || "").trim() : "";
      const nome = iNome >= 0 ? (cols[iNome] || "").trim() : "";
      const cursoNome = iCursoNome >= 0 ? (cols[iCursoNome] || "").trim() : "";
      const cursoSigla = iCursoSigla >= 0 ? (cols[iCursoSigla] || "").trim() : "";

      const row: ResultRow = {
        idx: idx + 1,
        ra,
        emailEducacional,
        emailPessoal,
        nome,
        cursoNome,
        cursoSigla,
        status: "PENDING",
      };

      const key = ra.toLowerCase();
      if (key) {
        if (seenRA.has(key)) {
          row.status = "ERROR";
          row.errorMsg = "RA duplicado no arquivo";
        } else {
          seenRA.add(key);
        }
      }
      return row;
    });

    setRows(parsed);
    setFinished(false);
    e.target.value = "";
  }

  async function startImport() {
    if (!rows.length) {
      alert("Selecione um CSV primeiro.");
      return;
    }
    setRunning(true);
    setFinished(false);

    const token =
      (typeof window !== "undefined" && localStorage.getItem("accessToken")) ||
      process.env.NEXT_PUBLIC_ACCESS_TOKEN ||
      "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const clone = [...rows];

    for (let i = 0; i < clone.length; i++) {
      const r = clone[i];

      if (r.status === "ERROR" && r.errorMsg === "RA duplicado no arquivo") {
        setRows([...clone]);
        continue;
      }

      const ra = r.ra?.trim();
      const edu = r.emailEducacional?.trim();

      if (!ra || !edu) {
        clone[i] = {
          ...r,
          status: "ERROR",
          errorMsg: "RA e emailEducacional são obrigatórios.",
        };
        setRows([...clone]);
        continue;
      }

      const nomeFinal =
        (r.nome?.trim() || "").length >= 2 ? r.nome!.trim() : `Aluno ${ra}`;

      const payload = {
        emailPessoal: r.emailPessoal?.trim() || edu,
        emailEducacional: edu,
        ra,
        nome: nomeFinal,
        cursoNome: r.cursoNome || undefined,
        cursoSigla: r.cursoSigla || undefined,
        papel: "USUARIO",
        ativo: true,
        precisaTrocarSenha: true, // exige troca no 1º login
        senha: DEFAULT_PASSWORD,  // atende Zod (Required)
      };

      try {
        const resp = await fetch(`${API_URL}/usuarios`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          const isDuplicate =
            resp.status === 409 ||
            /RA\s*já está em uso/i.test(text) ||
            /duplicad/i.test(text) ||
            /unique/i.test(text) ||
            /P2002/.test(text);

          if (isDuplicate) {
            clone[i] = { ...r, status: "OK", note: "Já existia" };
          } else {
            clone[i] = {
              ...r,
              status: "ERROR",
              errorMsg: text || `HTTP ${resp.status}`,
            };
          }
        } else {
          clone[i] = { ...r, status: "OK" };
        }
      } catch (e: any) {
        clone[i] = {
          ...r,
          status: "ERROR",
          errorMsg: String(e?.message ?? e),
        };
      }

      setRows([...clone]);
    }

    setRunning(false);
    setFinished(true);
  }

  function resetImport() {
    setRows([]);
    setFileName(null);
    setFinished(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const canStart = useMemo(
    () => rows.length > 0 && !running,
    [rows.length, running]
  );

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Importar alunos (CSV)</h3>
        <button
          onClick={onClose}
          className="inline-grid place-items-center size-8 rounded-md hover:bg-[var(--muted)]"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Seletor */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
          disabled={running}
        >
          Selecionar arquivo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        {fileName && (
          <span className="text-sm text-muted-foreground truncate">
            Arquivo: {fileName}
          </span>
        )}
      </div>

      {/* Resumo + barra */}
      {!!rows.length && (
        <div className="mt-4 space-y-2">
          <div className="text-sm">
            Processados: <b>{done}</b> / {total} · OK:{" "}
            <b className="text-[var(--success)]">{ok}</b> · Erros:{" "}
            <b className="text-[var(--brand-red)]">{err}</b>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--muted)] overflow-hidden">
            <div
              className="h-full bg-primary transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabela */}
      {!!rows.length && (
        <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-[var(--border)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">RA</th>
                <th className="px-3 py-2 text-left">E-mail educacional</th>
                <th className="px-3 py-2 text-left">E-mail pessoal</th>
                <th className="px-3 py-2 text-left">Nome</th>
                <th className="px-3 py-2 text-left">Curso</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Erro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.idx} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2">{r.idx}</td>
                  <td className="px-3 py-2">{r.ra}</td>
                  <td className="px-3 py-2">{r.emailEducacional}</td>
                  <td className="px-3 py-2">{r.emailPessoal || "—"}</td>
                  <td className="px-3 py-2">{r.nome || `Aluno ${r.ra}`}</td>
                  <td className="px-3 py-2">
                    {r.cursoSigla || r.cursoNome || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.status === "PENDING" && (
                      <span className="text-muted-foreground">Pendente</span>
                    )}
                    {r.status === "OK" && (
                      <span className="text-[var(--success)] font-medium">
                        OK{r.note ? ` (${r.note})` : ""}
                      </span>
                    )}
                    {r.status === "ERROR" && (
                      <span className="text-[var(--brand-red)] font-medium">
                        Erro
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--brand-red)]">
                    {r.errorMsg || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer / ações */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={startImport}
          disabled={!canStart}
          className={cx(
            "h-9 px-3 rounded-md text-sm",
            canStart
              ? "bg-primary text-primary-foreground hover:brightness-95"
              : "bg-[var(--muted)] text-muted-foreground cursor-not-allowed"
          )}
        >
          {running ? "Processando..." : rows.length ? "Processar importação" : "Selecionar CSV"}
        </button>

        <button
          onClick={resetImport}
          disabled={running || rows.length === 0}
          className={cx(
            "h-9 px-3 rounded-md border border-[var(--border)] text-sm",
            running ? "opacity-60 cursor-not-allowed" : "hover:bg-[var(--muted)]"
          )}
        >
          Reiniciar
        </button>

        <div className="ml-auto" />

        <button
          onClick={() => {
            if (finished) onDone();
            else onClose();
          }}
          className="h-9 px-3 rounded-md border border-[var(--border)] text-sm hover:bg-[var(--muted)]"
        >
          {finished ? "Concluir" : "Fechar"}
        </button>
      </div>

      {/* Info */}
      <div className="mt-3 text-xs text-muted-foreground">
        Modelo CSV: <code>ra,emailEducacional,emailPessoal,nome,cursoNome,cursoSigla</code>.<br />
        <b>Obrigatórios:</b> <code>ra</code>, <code>emailEducacional</code>. Senha é definida automaticamente no import (padrão) e será exigida a troca no primeiro acesso.
      </div>
    </div>
  );
}

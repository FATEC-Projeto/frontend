import { NextRequest, NextResponse } from "next/server";
import { validateServicePayload, type ServiceFormValues } from "../../utils/serviceForms";

const API_BASE = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type TicketPayload = {
  servicoId?: string;
  formulario?: {
    campos?: ServiceFormValues;
  };
};

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as TicketPayload;
  const servicoId = payload.servicoId;

  if (!servicoId) {
    return NextResponse.json({ message: "servicoId é obrigatório para abrir uma solicitação acadêmica." }, { status: 400 });
  }

  const validation = validateServicePayload(servicoId, payload.formulario?.campos ?? {});
  if (!validation.valid) {
    return NextResponse.json(
      {
        message: "Solicitação incompleta. Verifique os campos obrigatórios do formulário.",
        errors: validation.errors,
      },
      { status: 400 }
    );
  }

  if (!API_BASE) {
    return NextResponse.json({ message: "Backend de tickets não configurado." }, { status: 503 });
  }

  const authorization = req.headers.get("authorization");
  const res = await fetch(`${API_BASE}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

import { describe, it, expect } from "vitest";
import { extractApiError } from "../utils/api";

// Response mínima: extractApiError só usa .text() e .status.
function fakeRes(status: number, body: string): Response {
  return { status, text: async () => body } as unknown as Response;
}

describe("extractApiError", () => {
  it("prioriza issues (validação Zod)", async () => {
    const res = fakeRes(400, JSON.stringify({ issues: [{ path: "ra", message: "obrigatório" }] }));
    expect(await extractApiError(res)).toBe("ra: obrigatório");
  });

  it("usa o campo error do backend", async () => {
    const res = fakeRes(409, JSON.stringify({ error: "Duplicidade (email/RA)" }));
    expect(await extractApiError(res)).toBe("Duplicidade (email/RA)");
  });

  it("usa message quando não há error", async () => {
    const res = fakeRes(400, JSON.stringify({ message: "algo deu errado" }));
    expect(await extractApiError(res)).toBe("algo deu errado");
  });

  it("cai para o texto cru quando não é JSON", async () => {
    const res = fakeRes(500, "Internal Server Error");
    expect(await extractApiError(res)).toBe("Internal Server Error");
  });

  it("usa o fallback quando o corpo é vazio", async () => {
    const res = fakeRes(503, "");
    expect(await extractApiError(res, "Serviço indisponível")).toBe("Serviço indisponível");
  });
});

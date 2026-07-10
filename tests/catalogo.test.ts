import { describe, it, expect } from "vitest";
import { enriquecerCatalogo, CATALOGO_INSTITUCIONAL } from "../utils/catalogo";
import { cx } from "../utils/cx";

describe("cx", () => {
  it("remove valores falsy e junta com espaço", () => {
    expect(cx("a", false, "b", null, undefined, "c")).toBe("a b c");
  });
});

describe("enriquecerCatalogo", () => {
  it("preserva as categorias/serviços vindos da API", () => {
    const apiData = {
      categorias: [
        { id: "cat-x", nome: "Categoria X", servicos: [{ id: "svc-x", nome: "Serviço X", ativo: true }] },
      ],
    } as any;
    const out = enriquecerCatalogo(apiData);
    expect(out.categorias).toHaveLength(1);
    expect(out.categorias[0].servicos[0].id).toBe("svc-x");
  });

  it("mescla palavras-chave do institucional quando os ids batem", () => {
    const catInst = CATALOGO_INSTITUCIONAL.categorias[0];
    const svcInst = catInst.servicos[0];
    const apiData = {
      categorias: [
        { id: catInst.id, nome: catInst.nome, servicos: [{ id: svcInst.id, nome: svcInst.nome, ativo: true }] },
      ],
    } as any;
    const out = enriquecerCatalogo(apiData);
    const svc = out.categorias[0].servicos[0] as any;
    // O serviço institucional tem palavrasChave; devem ser aplicadas ao serviço da API.
    expect(Array.isArray(svc.palavrasChave)).toBe(true);
    expect(svc.palavrasChave.length).toBeGreaterThan(0);
  });
});

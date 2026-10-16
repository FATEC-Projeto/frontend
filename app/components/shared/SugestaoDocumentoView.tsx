import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/react";

const FONTES = new Set(["Arial", "Verdana", "Georgia", "Times New Roman", "Courier New"]);
const TAMANHOS = new Set(["12px", "14px", "16px", "18px", "24px", "32px"]);
const COR = /^(?:#[\da-f]{3,8}|rgba?\([\d.,%\s]+\))$/i;

function estiloTexto(attrs?: Record<string, unknown>): CSSProperties {
  const estilo: CSSProperties = {};
  const { color, backgroundColor, fontFamily, fontSize } = attrs ?? {};
  if (typeof color === "string" && color.length <= 50 && COR.test(color)) estilo.color = color;
  if (typeof backgroundColor === "string" && backgroundColor.length <= 50 && COR.test(backgroundColor)) estilo.backgroundColor = backgroundColor;
  if (typeof fontFamily === "string" && FONTES.has(fontFamily)) estilo.fontFamily = fontFamily;
  if (typeof fontSize === "string" && TAMANHOS.has(fontSize)) estilo.fontSize = fontSize;
  return estilo;
}

function linkSeguro(valor: unknown): string | undefined {
  if (typeof valor !== "string" || valor.length > 2048) return undefined;
  try {
    return ["http:", "https:", "mailto:"].includes(new URL(valor).protocol) ? valor : undefined;
  } catch {
    return undefined;
  }
}

function aplicarMarcas(no: JSONContent): ReactNode {
  let texto: ReactNode = no.text ?? "";
  for (const marca of no.marks ?? []) {
    switch (marca.type) {
      case "bold": texto = <strong>{texto}</strong>; break;
      case "italic": texto = <em>{texto}</em>; break;
      case "underline": texto = <u>{texto}</u>; break;
      case "strike": texto = <s>{texto}</s>; break;
      case "textStyle": texto = <span style={estiloTexto(marca.attrs)}>{texto}</span>; break;
      case "link": {
        const href = linkSeguro(marca.attrs?.href);
        if (href) texto = <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 underline">{texto}</a>;
        break;
      }
    }
  }
  return texto;
}

function inteiro(valor: unknown, maximo: number, padrao = 1): number {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 1 && valor <= maximo ? valor : padrao;
}

function alinhamento(valor: unknown): CSSProperties {
  switch (valor) {
    case "left": case "center": case "right": case "justify": return { textAlign: valor };
    default: return {};
  }
}

function renderizarNos(nos: JSONContent[] = [], nivel = 0): ReactNode {
  if (nivel > 12) return null;
  const ocorrencias = new Map<string, number>();
  return nos.map((no) => {
    const assinatura = JSON.stringify(no);
    const ocorrencia = ocorrencias.get(assinatura) ?? 0;
    ocorrencias.set(assinatura, ocorrencia + 1);
    return <Fragment key={`${assinatura}:${ocorrencia}`}>{renderizarNo(no, nivel)}</Fragment>;
  });
}

function renderizarNo(no: JSONContent, nivel: number): ReactNode {
  const filhos = () => renderizarNos(no.content, nivel + 1);
  const estilo = alinhamento(no.attrs?.textAlign);
  switch (no.type) {
    case "text": return aplicarMarcas(no);
    case "hardBreak": return <br />;
    case "paragraph": return <p style={estilo} className="min-h-5 whitespace-pre-wrap break-words">{filhos()}</p>;
    case "heading": {
      switch (no.attrs?.level) {
        case 1: return <h1 style={estilo} className="text-3xl font-bold">{filhos()}</h1>;
        case 2: return <h2 style={estilo} className="text-2xl font-bold">{filhos()}</h2>;
        default: return <h3 style={estilo} className="text-xl font-bold">{filhos()}</h3>;
      }
    }
    case "bulletList": return <ul className="list-disc pl-6">{filhos()}</ul>;
    case "orderedList": return <ol start={inteiro(no.attrs?.start, 10000)} className="list-decimal pl-6">{filhos()}</ol>;
    case "listItem": return <li>{filhos()}</li>;
    case "blockquote": return <blockquote className="border-l-4 border-[var(--border)] pl-4 italic">{filhos()}</blockquote>;
    case "horizontalRule": return <hr className="my-4 border-[var(--border)]" />;
    case "table": return <div className="overflow-x-auto"><table className="w-full border-collapse"><tbody>{filhos()}</tbody></table></div>;
    case "tableRow": return <tr>{filhos()}</tr>;
    case "tableHeader": return <th scope="col" colSpan={inteiro(no.attrs?.colspan, 10)} rowSpan={inteiro(no.attrs?.rowspan, 20)} className="border border-[var(--border)] bg-[var(--muted)] p-2 text-left">{filhos()}</th>;
    case "tableCell": return <td colSpan={inteiro(no.attrs?.colspan, 10)} rowSpan={inteiro(no.attrs?.rowspan, 20)} className="border border-[var(--border)] p-2 align-top">{filhos()}</td>;
    case "image": {
      const src: unknown = no.attrs?.src;
      if (typeof src !== "string" || !/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(src)) return null;
      const alt = typeof no.attrs?.alt === "string" && no.attrs.alt.trim() ? no.attrs.alt : "Imagem da sugestão";
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt} className="my-2 h-auto max-w-full rounded-lg border border-[var(--border)]" />;
    }
    default: return null;
  }
}

export default function SugestaoDocumentoView({ documento, conteudo }: Readonly<{ documento?: JSONContent | null; conteudo: string }>) {
  if (documento?.type !== "doc" || !documento.content?.length) {
    return <p className="whitespace-pre-wrap break-words text-sm">{conteudo}</p>;
  }
  return <div className="space-y-2 break-words text-sm [&_p]:my-2">{renderizarNos(documento.content)}</div>;
}

"use client";

import { useState } from "react";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, IndentIncrease, IndentDecrease, Undo2, Redo2, RemoveFormatting, Link2, Unlink, ImagePlus, Minus, Table2, Paintbrush, Baseline } from "lucide-react";
import { useEditorState, type Editor } from "@tiptap/react";

type Props = Readonly<{ editor: Editor; disabled: boolean; adicionarImagem: () => void }>;
const classe = "inline-flex h-8 items-center justify-center rounded-md border-0 bg-transparent px-2 text-xs text-slate-600 transition hover:bg-slate-200/70 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500";

export default function SugestaoEditorBarra({ editor, disabled, adicionarImagem }: Props) {
  const [linkAberto, setLinkAberto] = useState(false);
  const [url, setUrl] = useState("");
  const [erro, setErro] = useState("");
  const estado = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"), italic: e.isActive("italic"), underline: e.isActive("underline"),
      strike: e.isActive("strike"), bullet: e.isActive("bulletList"), ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"), table: e.isActive("table"), link: e.isActive("link"),
      heading: String(e.getAttributes("heading").level ?? "0"),
      font: String(e.getAttributes("textStyle").fontFamily ?? "Arial"),
      size: String(e.getAttributes("textStyle").fontSize ?? "16px"),
      align: String(e.getAttributes("paragraph").textAlign ?? e.getAttributes("heading").textAlign ?? "left"),
      undo: e.can().undo(), redo: e.can().redo(),
    }),
  });
  function aplicarLink() {
    try {
      const destino = new URL(url.trim());
      if (!["https:", "http:", "mailto:"].includes(destino.protocol)) throw new Error();
      editor.chain().focus().extendMarkRange("link").setLink({ href: destino.href }).run();
      setLinkAberto(false);
      setErro("");
    } catch {
      setErro("Informe um endereço completo: https://exemplo.com ou mailto:nome@exemplo.com");
    }
  }
  const acoes = [
    { nome: "Negrito", Icone: Bold, ativo: estado.bold, executar: () => editor.chain().focus().toggleBold().run() },
    { nome: "Itálico", Icone: Italic, ativo: estado.italic, executar: () => editor.chain().focus().toggleItalic().run() },
    { nome: "Sublinhado", Icone: Underline, ativo: estado.underline, executar: () => editor.chain().focus().toggleUnderline().run() },
    { nome: "Tachado", Icone: Strikethrough, ativo: estado.strike, executar: () => editor.chain().focus().toggleStrike().run() },
    { nome: "Marcadores", Icone: List, ativo: estado.bullet, executar: () => editor.chain().focus().toggleBulletList().run() },
    { nome: "Lista numerada", Icone: ListOrdered, ativo: estado.ordered, executar: () => editor.chain().focus().toggleOrderedList().run() },
    { nome: "Citação", Icone: Quote, ativo: estado.quote, executar: () => editor.chain().focus().toggleBlockquote().run() },
  ];
  return (
    <fieldset disabled={disabled} className="m-0 min-w-0 space-y-1 border-0 border-b border-[var(--border)] bg-white/70 p-2">
      <legend className="sr-only">Formatação da sugestão</legend>
      <div className="flex flex-wrap items-center gap-0.5">
        <label className="text-xs"><span className="sr-only">Estilo</span>
          <select className={`${classe} max-w-28 cursor-pointer pl-1`} value={estado.heading} onChange={(e) => {
            const nivel = Number(e.target.value);
            if (nivel === 1 || nivel === 2 || nivel === 3) editor.chain().focus().setHeading({ level: nivel }).run();
            else editor.chain().focus().setParagraph().run();
          }}>
            <option value="0">Texto normal</option><option value="1">Título 1</option><option value="2">Título 2</option><option value="3">Título 3</option>
          </select>
        </label>
        <label className="text-xs"><span className="sr-only">Fonte</span>
          <select className={`${classe} max-w-28 cursor-pointer pl-1`} value={estado.font} onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}>
            {["Arial", "Verdana", "Georgia", "Times New Roman", "Courier New"].map((nome) => <option key={nome}>{nome}</option>)}
          </select>
        </label>
        <label className="text-xs"><span className="sr-only">Tamanho</span>
          <select className={`${classe} max-w-28 cursor-pointer pl-1`} value={estado.size} onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}>
            {[12, 14, 16, 18, 24, 32].map((n) => <option key={n} value={`${n}px`}>{n}</option>)}
          </select>
        </label>
        <label className="text-xs"><span className="sr-only">Alinhamento</span>
          <select className={`${classe} max-w-28 cursor-pointer pl-1`} value={estado.align} onChange={(e) => editor.chain().focus().setTextAlign(e.target.value).run()}>
            <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option><option value="justify">Justificado</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-0.5 rounded-xl bg-slate-100 px-1 py-0.5">
        {acoes.map((acao) => <button key={acao.nome} type="button" aria-label={acao.nome} title={acao.nome} aria-pressed={acao.ativo} className={`${classe} aria-pressed:bg-blue-100 aria-pressed:text-blue-800`} onClick={acao.executar}><acao.Icone size={16} aria-hidden="true" /></button>)}
        <label title="Cor do texto" className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-slate-200"><Baseline size={16} aria-hidden="true" /><input className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Cor do texto" type="color" defaultValue="#000000" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} /></label>
        <label title="Cor de destaque" className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-slate-200"><Paintbrush size={16} aria-hidden="true" /><input className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Cor de destaque" type="color" defaultValue="#ffff00" onChange={(e) => editor.chain().focus().setBackgroundColor(e.target.value).run()} /></label>
        <button aria-label="Aumentar recuo" title="Aumentar recuo" type="button" className={classe} disabled={!editor.can().sinkListItem("listItem")} onClick={() => editor.chain().focus().sinkListItem("listItem").run()}><IndentIncrease size={16} aria-hidden="true" /></button>
        <button aria-label="Diminuir recuo" title="Diminuir recuo" type="button" className={classe} disabled={!editor.can().liftListItem("listItem")} onClick={() => editor.chain().focus().liftListItem("listItem").run()}><IndentDecrease size={16} aria-hidden="true" /></button>
      </div>
      <div className="flex flex-wrap items-center gap-0.5">
        <button aria-label="Desfazer" title="Desfazer" type="button" className={classe} disabled={!estado.undo} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} aria-hidden="true" /></button>
        <button aria-label="Refazer" title="Refazer" type="button" className={classe} disabled={!estado.redo} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} aria-hidden="true" /></button>
        <button aria-label="Limpar formatação" title="Limpar formatação" type="button" className={classe} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run()}><RemoveFormatting size={16} aria-hidden="true" /></button>
        <button aria-label="Inserir/editar link" title="Inserir/editar link" type="button" className={classe} onClick={() => { setUrl(String(editor.getAttributes("link").href ?? "")); setErro(""); setLinkAberto(!linkAberto); }}><Link2 size={16} aria-hidden="true" /></button>
        <button aria-label="Remover link" title="Remover link" type="button" className={classe} disabled={!estado.link} onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}><Unlink size={16} aria-hidden="true" /></button>
        <button aria-label="Adicionar imagem" title="Adicionar imagem" type="button" className={classe} onClick={adicionarImagem}><ImagePlus size={16} aria-hidden="true" /></button>
        <button aria-label="Linha divisória" title="Linha divisória" type="button" className={classe} onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16} aria-hidden="true" /></button>
        <button aria-label="Inserir tabela 3 × 3" title="Inserir tabela 3 × 3" type="button" className={classe} disabled={estado.table} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 size={16} aria-hidden="true" /></button>
      </div>
      {estado.table && <details className="rounded-lg bg-slate-100 p-1"><summary className="cursor-pointer text-xs">Opções da tabela</summary><div className="flex flex-wrap items-center gap-1 p-1">
        <button type="button" className={classe} onClick={() => editor.chain().focus().addRowAfter().run()}>Adicionar linha</button>
        <button type="button" className={classe} onClick={() => editor.chain().focus().deleteRow().run()}>Excluir linha</button>
        <button type="button" className={classe} onClick={() => editor.chain().focus().addColumnAfter().run()}>Adicionar coluna</button>
        <button type="button" className={classe} onClick={() => editor.chain().focus().deleteColumn().run()}>Excluir coluna</button>
        <button type="button" className={classe} onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Cabeçalho</button>
        <button type="button" className={classe} onClick={() => editor.chain().focus().deleteTable().run()}>Excluir tabela</button>
      </div></details>}
      {linkAberto && <div className="space-y-1">
        <p className="text-xs">Selecione o texto que receberá o link.</p>
        <label className="block text-sm">Endereço do link<input className={`${classe} ml-2 w-full max-w-sm`} type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); aplicarLink(); } }} /></label>
        <button type="button" className={classe} onClick={aplicarLink}>Aplicar link</button>{" "}
        <button type="button" className={classe} onClick={() => setLinkAberto(false)}>Cancelar</button>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      </div>}
    </fieldset>
  );
}

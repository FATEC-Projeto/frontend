"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import { toast } from "sonner";
import { criarExtensoesSugestao } from "./SugestaoEditorExtensoes";
import SugestaoEditorBarra from "./SugestaoEditorBarra";

export type SugestaoEditorValor = {
  texto: string;
  documento: JSONContent;
};

type Props = Readonly<{
  disabled?: boolean;
  onChange: (valor: SugestaoEditorValor) => void;
}>;

const MAX_IMAGENS = 3;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const TIPOS_PERMITIDOS = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function contarImagens(editor: Editor): number {
  let quantidade = 0;
  editor.state.doc.descendants((no) => {
    if (no.type.name === "image") quantidade += 1;
  });
  return quantidade;
}

function lerArquivoComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      if (typeof leitor.result === "string") resolve(leitor.result);
      else reject(new Error("Falha ao ler a imagem."));
    };
    leitor.onerror = () => reject(new Error("Falha ao ler a imagem."));
    leitor.onabort = () => reject(new Error("Leitura da imagem cancelada."));
    leitor.readAsDataURL(arquivo);
  });
}

export default function SugestaoEditor({ disabled = false, onChange }: Props) {
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);
  const lendoRef = useRef(false);
  const [lendoImagem, setLendoImagem] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: criarExtensoesSugestao(),
    content: "",
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Texto da sugestão",
        "aria-multiline": "true",
        class:
          "min-h-64 px-4 py-3 text-sm outline-none whitespace-pre-wrap break-words " +
          "[&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through " +
          "[&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold " +
          "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 " +
          "[&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic " +
          "[&_a]:text-blue-700 [&_a]:underline [&_hr]:my-4 " +
          "[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-400 [&_td]:p-2 " +
          "[&_th]:border [&_th]:border-gray-400 [&_th]:p-2 [&_th]:bg-gray-100 [&_th]:text-black " +
          "[&_.selectedCell]:bg-blue-100 [&_img]:my-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-80 [&_img]:object-contain [&_img]:rounded-md",
      },
    },
    onUpdate: ({ editor: atual }) => {
      onChange({ texto: atual.getText(), documento: atual.getJSON() });
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  async function handleSelecionarImagem(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo || !editor || disabled || lendoRef.current) return;
    if (!TIPOS_PERMITIDOS.has(arquivo.type)) {
      toast.error("Envie uma imagem PNG, JPEG, WEBP ou GIF.");
      return;
    }
    if (arquivo.size > MAX_IMAGE_BYTES) {
      toast.error("A imagem deve ter no máximo 2 MB.");
      return;
    }
    if (contarImagens(editor) >= MAX_IMAGENS) {
      toast.error(`Você pode adicionar no máximo ${MAX_IMAGENS} imagens.`);
      return;
    }
    lendoRef.current = true;
    setLendoImagem(true);
    try {
      const src = await lerArquivoComoDataUrl(arquivo);
      if (editor.isDestroyed || !editor.isEditable) return;
      if (contarImagens(editor) >= MAX_IMAGENS) {
        toast.error(`Você pode adicionar no máximo ${MAX_IMAGENS} imagens.`);
        return;
      }
      const inseriu = editor.chain().focus().insertContentAt(
        editor.state.selection.to,
        [
          { type: "image", attrs: { src, alt: arquivo.name.slice(0, 200) } },
          { type: "paragraph" },
        ],
        { updateSelection: true },
      ).run();
      if (!inseriu) toast.error("Posicione o cursor em um parágrafo para inserir a imagem.");
    } catch {
      toast.error("Não foi possível carregar a imagem selecionada.");
    } finally {
      lendoRef.current = false;
      if (!editor.isDestroyed) setLendoImagem(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-input">
      {editor && <SugestaoEditorBarra
        editor={editor}
        disabled={disabled || lendoImagem}
        adicionarImagem={() => inputArquivoRef.current?.click()}
      />}
      <input
        ref={inputArquivoRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={disabled || lendoImagem}
        onChange={handleSelecionarImagem}
        className="hidden"
        aria-label="Selecionar imagem da sugestão"
      />
      {lendoImagem && <p role="status" className="px-3 py-1 text-xs">Carregando imagem… aguarde antes de enviar.</p>}
      <div className="overflow-x-auto"><EditorContent editor={editor} /></div>
    </div>
  );
}

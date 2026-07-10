import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "../app/components/ui/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("não renderiza nada quando open=false", () => {
    const { container } = render(
      <ConfirmDialog open={false} title="X" onConfirm={() => {}} onClose={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra título/descrição e dispara onConfirm ao confirmar", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Remover setor?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        variant="danger"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );
    expect(screen.getByText("Remover setor?")).toBeInTheDocument();
    expect(screen.getByText("Esta ação não pode ser desfeita.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remover" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    // Sucesso fecha o modal.
    expect(onClose).toHaveBeenCalled();
  });

  it("no modo prompt, passa o valor digitado ao onConfirm", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Novo setor"
        confirmLabel="Criar"
        input={{ label: "Nome", required: true }}
        onConfirm={onConfirm}
        onClose={() => {}}
      />,
    );
    // Botão desabilitado enquanto vazio (required).
    const criar = screen.getByRole("button", { name: "Criar" });
    expect(criar).toBeDisabled();

    await userEvent.type(screen.getByRole("textbox"), "Secretaria");
    expect(criar).toBeEnabled();
    await userEvent.click(criar);
    expect(onConfirm).toHaveBeenCalledWith("Secretaria");
  });

  it("cancelar chama onClose sem confirmar", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmDialog open title="X" onConfirm={onConfirm} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

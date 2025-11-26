import {
  Bell, Mail, MessageSquareText, Paperclip, Check, Info,
} from "lucide-react";

// (Idealmente, este tipo viria de um arquivo central)
type TipoNotificacao =
  | "CHAMADO_CRIADO"
  | "CHAMADO_ATRIBUIDO"
  | "CHAMADO_ATUALIZADO"
  | "STATUS_ALTERADO"
  | "MENSAGEM_NOVA"
  | "ANEXO_NOVO"
  | "SISTEMA";

type Props = {
  tipo: TipoNotificacao;
  className?: string;
};

/**
 * Exibe o ícone correto com base no Tipo da Notificação.
 */
export default function NotificationIcon({ tipo, className = "size-4" }: Props) {
  switch (tipo) {
    case "MENSAGEM_NOVA":
      return <MessageSquareText className={className} />;
    case "ANEXO_NOVO":
      return <Paperclip className={className} />;
    case "CHAMADO_ATRIBUIDO":
    case "CHAMADO_CRIADO":
    case "CHAMADO_ATUALIZADO":
    case "STATUS_ALTERADO":
      return <Bell className={className} />;
    case "SISTEMA":
      return <Info className={className} />;
    default:
      return <Mail className={className} />;
  }
}
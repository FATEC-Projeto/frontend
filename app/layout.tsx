// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Workflow Fatec",
  description: "Portal acadêmico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        {/* Sonner */}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

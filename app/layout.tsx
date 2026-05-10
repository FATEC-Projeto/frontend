import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Inter, Space_Grotesk } from "next/font/google";
import CookieBanner from "./components/ui/CookieBanner";

// === Fontes Google ===
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

// === Metadados ===
export const metadata: Metadata = {
  title: "Workflow Fatec",
  description: "Portal acadêmico",
  icons: {
    icon: "images/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

// === Layout Root ===
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="font-sans bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
        <CookieBanner />
      </body>
    </html>
  );
}

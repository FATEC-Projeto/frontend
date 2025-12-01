import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Inter, Space_Grotesk } from "next/font/google";

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
      <head>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/ueh2hk6os4";
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "ueh2hk6os4");
            `,
          }}
        />
      </head>

      <body className="font-sans bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

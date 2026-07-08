import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/query-provider";
import { HtmlLangSync } from "@/i18n/HtmlLangSync";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Barsum",
  description: "Образовательная платформа для детей",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${nunito.variable} font-sans`}>
        <QueryProvider>
          <HtmlLangSync />
          {children}
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}

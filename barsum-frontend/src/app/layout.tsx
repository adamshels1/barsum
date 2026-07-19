import type { Metadata, Viewport } from "next";
import { Manrope, Nunito, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/query-provider";
import { HtmlLangSync } from "@/i18n/HtmlLangSync";
import { YandexMetrica } from "@/components/YandexMetrica";
import { PwaInstall } from "@/components/PwaInstall";
import { SessionRefresher } from "@/components/SessionRefresher";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

// Шрифты сертификата читателя (макет заказчика).
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
  variable: "--font-playfair",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Barsum",
  description: "Образовательная платформа для детей",
  applicationName: "Barsum",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Barsum",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#4776e6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${nunito.variable} ${playfair.variable} ${manrope.variable} font-sans`}>
        <QueryProvider>
          <HtmlLangSync />
          <SessionRefresher />
          {children}
          <Toaster richColors position="top-center" />
          <PwaInstall />
        </QueryProvider>
        <YandexMetrica />
      </body>
    </html>
  );
}

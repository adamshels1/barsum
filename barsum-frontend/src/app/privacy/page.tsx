import type { Metadata } from "next";
import { PrivacyPolicy } from "./PrivacyPolicy";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Barsum",
  description:
    "Политика конфиденциальности приложения Barsum: какие данные мы собираем, как используем и защищаем. Privacy Policy / Құпиялылық саясаты.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}

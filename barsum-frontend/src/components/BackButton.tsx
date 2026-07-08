"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: { back: "Назад" },
  kk: { back: "Артқа" },
};

/** Кнопка «Назад» для страниц входа — возвращает на выбор роли на главной. */
export function BackButton({ href = "/" }: { href?: string }) {
  const router = useRouter();
  const t = useT(dict);
  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      aria-label={t("back")}
      style={{
        position: "fixed",
        top: "max(20px, env(safe-area-inset-top))",
        left: 16,
        zIndex: 2,
        width: 40,
        height: 40,
        borderRadius: 9999,
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <ChevronLeft size={20} color="#ffffff" strokeWidth={2.5} />
    </button>
  );
}

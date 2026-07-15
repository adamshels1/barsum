"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: { back: "Назад" },
  kk: { back: "Артқа" },
};

type Props = {
  /** Явный маршрут перехода. Если не задан и нет onClick — router.back(). */
  href?: string;
  /** Полностью переопределить действие (шаг мастера, инвалидация кэша и т.п.). */
  onClick?: () => void;
  /**
   * "fixed" — плавающая кнопка в левом верхнем углу (экраны входа);
   * "inline" — в потоке страницы, по умолчанию.
   */
  variant?: "fixed" | "inline";
  style?: React.CSSProperties;
};

/**
 * Круглая кнопка «Назад» в стиле экранов входа.
 * Область нажатия 48×48 (комфортно для пальца на телефоне), сам круг — 40px.
 */
export function BackButton({ href, onClick, variant = "inline", style }: Props) {
  const router = useRouter();
  const t = useT(dict);

  const handleClick = () => {
    if (onClick) return onClick();
    if (href) return router.push(href);
    router.back();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("back")}
      style={{
        // Крупная область нажатия 48×48, видимый круг — 40px по центру.
        width: 48,
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        ...(variant === "fixed"
          ? {
              position: "fixed",
              top: "max(16px, env(safe-area-inset-top))",
              left: 12,
              zIndex: 50,
            }
          : { marginLeft: -4, marginBottom: 16 }),
        ...style,
      }}
    >
      <span
        style={{
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
          flexShrink: 0,
        }}
      >
        <ChevronLeft size={20} color="#ffffff" strokeWidth={2.5} />
      </span>
    </button>
  );
}

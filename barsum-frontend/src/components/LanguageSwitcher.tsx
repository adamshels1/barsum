"use client";

import { useLocaleStore, type Locale } from "@/stores/locale-store";

const LABELS: Record<Locale, string> = {
  ru: "RU",
  kk: "ҚАЗ",
};

/**
 * Переключатель языка RU / ҚАЗ (сегментированный контрол).
 *
 * variant="glass"  — для цветных/тёмных фонов (белый текст) — по умолчанию.
 * variant="light"  — для светлых фонов (тёмный текст).
 */
export function LanguageSwitcher({
  variant = "glass",
  style,
}: {
  variant?: "glass" | "light";
  style?: React.CSSProperties;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const isGlass = variant === "glass";
  const containerBg = isGlass ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.05)";
  const containerBorder = isGlass
    ? "1px solid rgba(255,255,255,0.22)"
    : "1px solid rgba(0,0,0,0.08)";
  const inactiveColor = isGlass ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)";
  const activeBg = isGlass ? "rgba(255,255,255,0.9)" : "#4776e6";
  const activeColor = isGlass ? "#4776e6" : "#ffffff";

  return (
    <div
      role="group"
      aria-label="Язык интерфейса"
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        borderRadius: 9999,
        background: containerBg,
        border: containerBorder,
        backdropFilter: isGlass ? "blur(12px)" : undefined,
        WebkitBackdropFilter: isGlass ? "blur(12px)" : undefined,
        ...style,
      }}
    >
      {(Object.keys(LABELS) as Locale[]).map((lng) => {
        const active = locale === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => setLocale(lng)}
            aria-pressed={active}
            style={{
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.02em",
              padding: "6px 14px",
              borderRadius: 9999,
              background: active ? activeBg : "transparent",
              color: active ? activeColor : inactiveColor,
              transition: "background 0.15s ease, color 0.15s ease",
            }}
          >
            {LABELS[lng]}
          </button>
        );
      })}
    </div>
  );
}

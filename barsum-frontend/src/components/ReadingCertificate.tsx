"use client";

import { forwardRef } from "react";
import { useLocaleStore } from "@/stores/locale-store";

// Палитра и макет — по HTML-шаблону заказчика (сертификат читателя Barsum).
const INK = "#241E4E";
const INK_SOFT = "#3a3170";
const GOLD = "#C9973C";
const GOLD_LIGHT = "#E8C77A";
const PAPER = "#FBF8F2";

const SERIF = "var(--font-playfair), 'Playfair Display', Georgia, serif";
const SANS = "var(--font-manrope), 'Manrope', system-ui, sans-serif";

const TEXT = {
  ru: {
    title: "СЕРТИФИКАТ ЧИТАТЕЛЯ",
    intro: "Этот сертификат",
    marathonBrandFirst: false,
    marathon: "успешно завершил(а) марафон чтения ",
    confirm: "подтверждает полное прочтение книги.",
    congrats: "Поздравляем!",
    msg: [
      "Вы продемонстрировали страсть к чтению, настойчивость",
      "и стремление к новым знаниям.",
      "Каждая прочитанная книга — это шаг к новым возможностям.",
    ],
    footer: "Команда Barsum AI",
  },
  kk: {
    title: "ОҚЫРМАН СЕРТИФИКАТЫ",
    intro: "Осы сертификат",
    marathonBrandFirst: true,
    marathon: " оқу марафонын сәтті аяқтап,",
    confirm: "кітабын толық оқып шыққанын растайды.",
    congrats: "Құттықтаймыз!",
    msg: [
      "Сен кітап оқуға деген қызығушылығыңды, табандылығыңды",
      "және жаңа білімге ұмтылысыңды дәлелдедің.",
      "Әрбір оқылған кітап — жаңа мүмкіндіктерге бастар қадам.",
    ],
    footer: "Barsum AI командасы",
  },
} as const;

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const transform = { tl: "none", tr: "scaleX(-1)", bl: "scaleY(-1)", br: "scale(-1,-1)" }[pos];
  const s: React.CSSProperties = { position: "absolute", width: 64, height: 64, zIndex: 2, transform };
  if (pos === "tl") { s.top = 14; s.left = 14; }
  if (pos === "tr") { s.top = 14; s.right = 14; }
  if (pos === "bl") { s.bottom = 14; s.left = 14; }
  if (pos === "br") { s.bottom = 14; s.right = 14; }
  return (
    <div style={s}>
      <svg viewBox="0 0 64 64" style={{ width: "100%", height: "100%", display: "block" }}>
        <path d="M2 2 H30 M2 2 V30" stroke={GOLD} strokeWidth={2} fill="none" />
        <path d="M10 10 H24 M10 10 V24" stroke={GOLD} strokeWidth={1.2} fill="none" />
        <circle cx={10} cy={10} r={2.5} fill={GOLD} />
      </svg>
    </div>
  );
}

function Leaf({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke={INK} strokeWidth={1.6} style={{ width: 34, height: 34, transform: flip ? "scaleX(-1)" : undefined }}>
      <path d="M20 38 C20 20 8 8 2 4 C4 14 10 24 20 30" />
      <path d="M20 38 C20 20 10 12 6 8" strokeWidth={1} />
      <path d="M4 6 C8 8 12 12 14 16" />
      <path d="M2 12 C7 13 12 16 15 20" />
    </svg>
  );
}

interface Props {
  childName: string;
  bookTitle: string;
}

/**
 * «Сертификат читателя» — фиксированный макет 1500×1030 по шаблону заказчика.
 * Рендерится в натуральную величину; масштабирование/поворот под экран — в CertificateModal.
 * Текст локализован (RU/KZ), имя и книга подставляются динамически.
 */
export const ReadingCertificate = forwardRef<HTMLDivElement, Props>(function ReadingCertificate(
  { childName, bookTitle },
  ref,
) {
  const locale = useLocaleStore((s) => s.locale);
  const tx = TEXT[locale] ?? TEXT.ru;

  return (
    <div
      ref={ref}
      style={{
        width: 1500,
        height: 1030,
        boxSizing: "border-box",
        position: "relative",
        padding: 26,
        fontFamily: SANS,
        background: `radial-gradient(ellipse at 60% 45%, rgba(36,30,78,0.045) 0%, rgba(36,30,78,0) 55%), ${PAPER}`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          border: `1.5px solid ${GOLD}`,
          outline: `6px solid ${PAPER}`,
          outlineOffset: -14,
          overflow: "hidden",
        }}
      >
        {/* внутренняя тонкая рамка */}
        <div style={{ position: "absolute", inset: 8, border: `1px solid ${GOLD_LIGHT}`, pointerEvents: "none" }} />

        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />

        {/* водяной знак — тигр */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/certificate/watermark.png" alt="" style={{ position: "absolute", right: -40, top: "50%", transform: "translateY(-50%)", width: 520, height: "auto", opacity: 0.07, zIndex: 0 }} />

        {/* контент */}
        <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "46px 90px 30px", textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/certificate/logo.png" alt="Barsum" style={{ width: 110, height: "auto", display: "block", marginBottom: 6 }} />

          <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 34, letterSpacing: "0.12em", color: INK, margin: "2px 0 10px" }}>BARSUM</div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, color: GOLD, marginBottom: 22 }}>
            <span style={{ width: 150, height: 1, background: GOLD }} />
            <span style={{ width: 8, height: 8, background: GOLD, transform: "rotate(45deg)" }} />
            <span style={{ width: 150, height: 1, background: GOLD }} />
          </div>

          <h1 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 64, color: INK, letterSpacing: "0.02em", margin: "0 0 18px" }}>{tx.title}</h1>

          <div style={{ fontSize: 19, color: INK_SOFT, marginBottom: 14 }}>{tx.intro}</div>

          {/* имя ребёнка */}
          <div style={{ width: "78%", borderBottom: `1.5px solid ${INK_SOFT}`, margin: "6px 0 20px", minHeight: 46, fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: INK, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6 }}>
            {childName}
          </div>

          <div style={{ fontSize: 19, color: INK_SOFT, marginBottom: 16 }}>
            {tx.marathonBrandFirst ? (
              <><b style={{ color: INK }}>Barsum</b>{tx.marathon}</>
            ) : (
              <>{tx.marathon}<b style={{ color: INK }}>Barsum</b>,</>
            )}
          </div>

          {/* название книги */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 14, width: "90%", fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: INK, marginBottom: 8 }}>
            <span style={{ color: GOLD, fontSize: 30 }}>«</span>
            <span style={{ flex: 1, borderBottom: `1.5px solid ${INK_SOFT}`, minHeight: 40, paddingBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bookTitle}</span>
            <span style={{ color: GOLD, fontSize: 30 }}>»</span>
          </div>

          <div style={{ fontSize: 19, color: INK_SOFT, marginBottom: 26 }}>{tx.confirm}</div>

          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 26, color: INK, display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ color: GOLD, fontSize: 20 }}>✦</span>
            {tx.congrats}
            <span style={{ color: GOLD, fontSize: 20 }}>✦</span>
          </div>

          <div style={{ fontSize: 17, lineHeight: 1.6, color: INK_SOFT, maxWidth: 720, marginBottom: 22 }}>
            {tx.msg[0]}<br />{tx.msg[1]}<br />{tx.msg[2]}
          </div>

          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 16, fontFamily: SERIF, fontWeight: 700, fontSize: 19, color: INK }}>
            <Leaf />
            {tx.footer}
            <Leaf flip />
          </div>
        </div>

        {/* печать */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/certificate/seal.png" alt="" style={{ position: "absolute", right: 60, bottom: 56, width: 220, height: "auto", zIndex: 2 }} />
      </div>
    </div>
  );
});

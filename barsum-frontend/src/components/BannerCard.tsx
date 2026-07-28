"use client";

/**
 * Баннер-кнопка на главной у ребёнка: картинка вместо обычной кнопки.
 * Текст не «вшит» в картинку, а рисуется поверх её правой (пустой) половины —
 * так один файл работает и для RU, и для KZ.
 *
 * Размеры текста заданы в cqw (доля ширины самого баннера), поэтому подпись
 * масштабируется вместе с картинкой на любом экране.
 */
export function BannerCard({
  image,
  title,
  subtitle,
  onClick,
  ariaLabel,
  textFrom = "52%",
}: {
  image: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
  ariaLabel?: string;
  /** Где начинается текстовая колонка — зависит от того, докуда доходит рисунок. */
  textFrom?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel ?? title}
      style={{
        containerType: "inline-size",
        position: "relative",
        display: "block",
        width: "100%",
        marginBottom: 12,
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        borderRadius: 20,
        overflow: "hidden",
        lineHeight: 0,
        fontFamily: "inherit",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" style={{ width: "100%", height: "auto", display: "block", borderRadius: 20 }} />

      <span
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: textFrom,
          right: "6%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "1.2cqw",
          textAlign: "left",
          fontFamily: "var(--font-comfortaa), var(--font-nunito), sans-serif",
        }}
      >
        <span
          style={{
            fontSize: "5.6cqw",
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#ffffff",
            letterSpacing: "-0.01em",
            textShadow: "0 0.4cqw 1.4cqw rgba(60,20,90,0.55)",
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: "3.2cqw",
              fontWeight: 600,
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.92)",
              textShadow: "0 0.3cqw 1cqw rgba(60,20,90,0.5)",
            }}
          >
            {subtitle}
          </span>
        )}
      </span>
    </button>
  );
}

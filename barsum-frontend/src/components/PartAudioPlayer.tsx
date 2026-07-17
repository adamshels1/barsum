"use client";

// Плеер аудиоверсии части книги (озвучка эксперта). Используется в детском
// ридере сессии, детской «Библиотеке» и карточке книги у эксперта.
export function PartAudioPlayer({
  src,
  title,
  hint,
}: {
  src: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="glass" style={{ padding: 16, borderRadius: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: hint ? 4 : 10 }}>
        <span style={{ fontSize: 22 }}>🎧</span>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#ffffff" }}>{title}</p>
      </div>
      {hint && (
        <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>
          {hint}
        </p>
      )}
      <audio controls preload="metadata" src={src} style={{ width: "100%", display: "block", borderRadius: 12 }} />
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { sessionsApi } from "@/lib/api/sessions";
import { BackButton } from "@/components/BackButton";
import { PartAudioPlayer } from "@/components/PartAudioPlayer";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    bookLabel: "📖 Книга",
    part: "Часть {n} из {total}",
    prev: "Назад",
    next: "Дальше",
    loading: "Загружаем книгу...",
    notFound: "Книга не найдена",
    reread: "Перечитывай сколько хочешь 💛",
    listenTitle: "Послушай рассказ",
  },
  kk: {
    bookLabel: "📖 Кітап",
    part: "{total} бөлімнен {n}-бөлім",
    prev: "Артқа",
    next: "Әрі қарай",
    loading: "Кітап жүктелуде...",
    notFound: "Кітап табылмады",
    reread: "Қалағаныңша қайта оқи бер 💛",
    listenTitle: "Әңгімені тыңдап ал",
  },
};

interface Enrollment {
  id: string;
  challenge?: {
    id: string;
    title: string;
    bookTitle?: string;
    bookAuthor?: string;
    coverImage?: string;
    totalParts: number;
    partTexts?: string[] | null;
    partTitles?: string[] | null;
    partImages?: string[] | null;
    partAudios?: string[] | null;
  };
}

// Разбивка сплошного текста на абзацы/реплики диалога — как в ридере сессии.
function toReadingParagraphs(raw: string): { text: string; isDialogue: boolean }[] {
  let t = raw.replace(/\r\n/g, "\n").trim();
  t = t.replace(/([.!?…»"])\s+(—|–|-)\s+([А-ЯЁA-Z«])/g, "$1\n$2 $3");
  const lines = t
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.map((text) => ({
    text,
    isDialogue: /^(—|–|-)\s/.test(text),
  }));
}

export default function LibraryReaderPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const t = useT(dict);
  const [idx, setIdx] = useState(0);

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ["enrollments"],
    queryFn: sessionsApi.listEnrollments,
  });

  const enrollment = (enrollments as Enrollment[]).find((e) => e.id === enrollmentId);
  const ch = enrollment?.challenge;

  if (isLoading) {
    return (
      <main style={{ minHeight: "60dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <p style={{ fontSize: 36, margin: 0 }}>📚</p>
        <p style={{ fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>{t("loading")}</p>
      </main>
    );
  }

  if (!ch) {
    return (
      <main style={{ padding: "52px 20px 40px", maxWidth: 512, margin: "0 auto" }}>
        <BackButton href="/child/library" />
        <div className="glass" style={{ padding: 40, textAlign: "center", borderRadius: 20 }}>
          <p style={{ fontSize: 36, margin: 0 }}>🤔</p>
          <p style={{ margin: "12px 0 0", fontWeight: 900, fontSize: 16, color: "#ffffff" }}>{t("notFound")}</p>
        </div>
      </main>
    );
  }

  const total = ch.totalParts ?? 0;
  const clampedIdx = Math.min(Math.max(idx, 0), Math.max(total - 1, 0));
  const partNum = clampedIdx + 1;
  const pageImage = ch.partImages?.[clampedIdx] ?? null;
  const partText = ch.partTexts?.[clampedIdx] ?? null;
  const partTitle = ch.partTitles?.[clampedIdx] ?? null;
  const partAudio = ch.partAudios?.[clampedIdx] ?? null;

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 40px", maxWidth: 512, margin: "0 auto" }}>
      <BackButton href="/child/library" />

      {/* Book header */}
      <div className="glass" style={{ padding: 16, borderRadius: 20, marginBottom: 16, display: "flex", gap: 14, alignItems: "center" }}>
        {ch.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ch.coverImage} alt={ch.bookTitle} style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, background: "linear-gradient(135deg, #4776e6, #8e54e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📖</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("bookLabel")}</p>
          <h1 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 900, color: "#ffffff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ch.bookTitle || ch.title}
          </h1>
          {ch.bookAuthor && <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{ch.bookAuthor}</p>}
        </div>
      </div>

      {/* Part indicator */}
      <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {t("part", { n: partNum, total })}
      </p>

      {/* Аудиоверсия части (озвучка эксперта) — можно слушать при перечитывании. */}
      {partAudio && (
        <div style={{ marginBottom: 12 }}>
          <PartAudioPlayer src={partAudio} title={t("listenTitle")} />
        </div>
      )}

      {/* Content: если есть иллюстрация — показываем её сверху, а текст части снизу
          (в книгах-картинках со вшитым текстом это крупный читаемый вариант). */}
      {pageImage && (
        <div className="glass" style={{ padding: 12, borderRadius: 20, marginBottom: partText || partTitle ? 12 : 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pageImage} alt="" style={{ width: "100%", borderRadius: 14, display: "block", background: "#fff" }} />
        </div>
      )}
      {(partText || partTitle) && (
        <div className="glass" style={{ padding: 20, borderRadius: 20 }}>
          {partTitle && (
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: "0 0 14px", lineHeight: 1.25 }}>{partTitle}</h2>
          )}
          {partText && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {toReadingParagraphs(partText).map((p, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 16,
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.9)",
                    fontFamily: "Georgia, serif",
                    fontStyle: p.isDialogue ? "italic" : "normal",
                    paddingLeft: p.isDialogue ? 12 : 0,
                    margin: 0,
                  }}
                >
                  {p.text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {!pageImage && !partText && !partTitle && (
        <div className="glass" style={{ padding: 20, borderRadius: 20 }}>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: 0 }}>—</p>
        </div>
      )}

      {/* Pager */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 20 }}>
        <button
          onClick={() => setIdx((v) => Math.max(v - 1, 0))}
          disabled={clampedIdx === 0}
          className="glass-chip"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "12px 18px",
            border: "none",
            cursor: clampedIdx === 0 ? "default" : "pointer",
            fontFamily: "inherit",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: 14,
            opacity: clampedIdx === 0 ? 0.35 : 1,
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          {t("prev")}
        </button>

        <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
          {partNum} / {total}
        </span>

        <button
          onClick={() => setIdx((v) => Math.min(v + 1, total - 1))}
          disabled={clampedIdx >= total - 1}
          className="glass-chip"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "12px 18px",
            border: "none",
            cursor: clampedIdx >= total - 1 ? "default" : "pointer",
            fontFamily: "inherit",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: 14,
            opacity: clampedIdx >= total - 1 ? 0.35 : 1,
          }}
        >
          {t("next")}
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

      <p style={{ textAlign: "center", margin: "20px 0 0", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
        {t("reread")}
      </p>
    </main>
  );
}

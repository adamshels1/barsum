"use client";

import { useQuery } from "@tanstack/react-query";
import { BookMarked, Users2 } from "lucide-react";
import { useParams } from "next/navigation";
import { challengesApi } from "@/lib/api/challenges";
import { BackButton } from "@/components/BackButton";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    back: "Назад",
    loading: "Загрузка...",
    contents: "Содержание книги",
    part: "Часть {n}",
    partsCount: "{n} частей",
    noContent: "Содержание пока не добавлено",
    statusDraft: "Черновик",
    statusModeration: "На модерации",
    statusPublished: "Опубликован",
    statusRejected: "Отклонён",
  },
  kk: {
    back: "Артқа",
    loading: "Жүктелуде...",
    contents: "Кітап мазмұны",
    part: "{n}-бөлім",
    partsCount: "{n} бөлім",
    noContent: "Мазмұны әзірге қосылмаған",
    statusDraft: "Қаралама",
    statusModeration: "Модерацияда",
    statusPublished: "Жарияланды",
    statusRejected: "Қабылданбады",
  },
};

interface Challenge {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  totalParts: number;
  price: number;
  coinsReward: number;
  status: "draft" | "moderation" | "published" | "rejected";
  membersCount: number;
  coverImage?: string | null;
  partTexts?: string[] | null;
  partTitles?: string[] | null;
}

function statusBadgeStyle(status: string): React.CSSProperties {
  if (status === "moderation") return { background: "rgba(255,180,0,0.25)", color: "#ffd200", borderRadius: 9999, padding: "4px 10px", fontSize: 11, fontWeight: 700 };
  if (status === "published") return { background: "rgba(0,200,100,0.25)", color: "#aaffcc", borderRadius: 9999, padding: "4px 10px", fontSize: 11, fontWeight: 700 };
  if (status === "rejected") return { background: "rgba(220,0,0,0.25)", color: "#ffaaaa", borderRadius: 9999, padding: "4px 10px", fontSize: 11, fontWeight: 700 };
  return { background: "rgba(255,255,255,0.16)", color: "#ffffff", borderRadius: 9999, padding: "4px 10px", fontSize: 11, fontWeight: 700, border: "1px solid rgba(255,255,255,0.26)" };
}

function statusBadgeLabel(status: string, t: (key: string) => string): string {
  if (status === "draft") return t("statusDraft");
  if (status === "moderation") return t("statusModeration");
  if (status === "published") return t("statusPublished");
  if (status === "rejected") return t("statusRejected");
  return status;
}

export default function ExpertBookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT(dict);

  const { data: book, isLoading } = useQuery<Challenge>({
    queryKey: ["challenge", id],
    queryFn: () => challengesApi.get(id),
    enabled: !!id,
  });

  const parts = book?.partTexts ?? [];

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 40px", maxWidth: 640, margin: "0 auto" }}>
      {/* Back */}
      <BackButton href="/expert/books" />

      {isLoading || !book ? (
        <div className="glass" style={{ height: 140, borderRadius: 20, animation: "pulse 2s infinite", opacity: 0.5 }} />
      ) : (
        <>
          {/* Book header */}
          <div className="glass" style={{ padding: 20, borderRadius: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {book.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverImage}
                  alt={book.bookTitle || book.title}
                  style={{ width: 64, height: 84, borderRadius: 14, objectFit: "cover", flexShrink: 0, background: "rgba(255,255,255,0.1)" }}
                />
              ) : (
                <div style={{ width: 64, height: 84, borderRadius: 14, flexShrink: 0, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookMarked size={26} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff", lineHeight: 1.25 }}>{book.title}</h1>
                  <span style={statusBadgeStyle(book.status)}>{statusBadgeLabel(book.status, t)}</span>
                </div>
                {(book.bookTitle || book.bookAuthor) && (
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    {book.bookTitle}{book.bookAuthor ? ` · ${book.bookAuthor}` : ""}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 10, flexWrap: "wrap" }}>
                  <span>📚 {t("partsCount", { n: book.totalParts })}</span>
                  <span>💰 {book.price.toLocaleString("ru-RU")} ₸</span>
                  <span>🪙 {book.coinsReward}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Users2 size={12} /> {book.membersCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contents heading */}
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {t("contents")}
          </p>

          {parts.length === 0 ? (
            <div className="glass" style={{ padding: 40, textAlign: "center", borderRadius: 20 }}>
              <p style={{ margin: 0, fontSize: 36 }}>📖</p>
              <p style={{ margin: "12px 0 0", fontWeight: 900, fontSize: 15, color: "#ffffff" }}>{t("noContent")}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {parts.map((text, i) => (
                <div key={i} className="glass" style={{ padding: 20, borderRadius: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.16)", fontSize: 13, fontWeight: 900, color: "#ffffff" }}>
                      {i + 1}
                    </div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>
                      {book?.partTitles?.[i] || t("part", { n: i + 1 })}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", whiteSpace: "pre-wrap" }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

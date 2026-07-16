"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BookOpen, Award } from "lucide-react";
import { sessionsApi } from "@/lib/api/sessions";
import { useAuthStore } from "@/stores/auth-store";
import { CertificateModal } from "@/components/CertificateModal";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    title: "Моя библиотека",
    subtitle: "Книги, которые ты уже прочитал — заходи и перечитывай сколько хочешь",
    done: "Прочитано",
    emptyTitle: "Пока пусто",
    emptyText: "Здесь появятся книги, которые ты прочитаешь полностью",
    book: "Книга",
    loading: "Загрузка...",
    certificate: "Сертификат",
  },
  kk: {
    title: "Менің кітапханам",
    subtitle: "Сен оқып бітірген кітаптар — қалағаныңша қайта оқи бер",
    done: "Оқылды",
    emptyTitle: "Әзірге бос",
    emptyText: "Мұнда толық оқыған кітаптарың пайда болады",
    book: "Кітап",
    loading: "Жүктелуде...",
    certificate: "Сертификат",
  },
};

interface Enrollment {
  id: string;
  completedParts?: number;
  challenge?: {
    id: string;
    title: string;
    bookTitle?: string;
    bookAuthor?: string;
    coverImage?: string;
    totalParts: number;
  };
}

export default function LibraryPage() {
  const router = useRouter();
  const t = useT(dict);
  const user = useAuthStore((s) => s.user);
  const [certBook, setCertBook] = useState<string | null>(null);

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ["enrollments"],
    queryFn: sessionsApi.listEnrollments,
    refetchOnMount: "always",
  });

  // Прочитанные книги: все части завершены.
  const finishedBooks = (enrollments as Enrollment[]).filter((e) => {
    const total = e.challenge?.totalParts ?? 0;
    const done = e.completedParts ?? 0;
    return total > 0 && done >= total;
  });

  return (
    <main style={{ padding: "20px 20px 8px", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{t("title")}</h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
        {t("subtitle")}
      </p>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 92, borderRadius: 20, background: "rgba(255,255,255,0.1)", animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : finishedBooks.length === 0 ? (
        <div className="glass" style={{ padding: 40, textAlign: "center", borderRadius: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <BookOpen size={26} color="#ffffff" strokeWidth={2} />
          </div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#ffffff" }}>{t("emptyTitle")}</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>{t("emptyText")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {finishedBooks.map((e) => {
            const ch = e.challenge!;
            const bookTitle = ch.bookTitle || ch.title || t("book");
            return (
              <div
                key={e.id}
                className="glass"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 12,
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.1)",
                }}
              >
                <button
                  onClick={() => router.push(`/child/library/${e.id}`)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 14,
                      flexShrink: 0,
                      background: ch.coverImage
                        ? `url(${ch.coverImage}) center/cover`
                        : "linear-gradient(135deg, #4776e6, #8e54e9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!ch.coverImage && <span style={{ fontSize: 26 }}>📖</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color: "#aaffcc", background: "rgba(0,200,100,0.2)", padding: "3px 8px", borderRadius: 9999, marginBottom: 6 }}>
                      ✅ {t("done")}
                    </span>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {bookTitle}
                    </p>
                    {ch.bookAuthor && (
                      <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ch.bookAuthor}
                      </p>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setCertBook(bookTitle)}
                  aria-label={t("certificate")}
                  title={t("certificate")}
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    color: "#2ea36a",
                    fontFamily: "inherit",
                  }}
                >
                  <Award size={20} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {certBook !== null && (
        <CertificateModal
          childName={user?.name || ""}
          bookTitle={certBook}
          onClose={() => setCertBook(null)}
        />
      )}
    </main>
  );
}

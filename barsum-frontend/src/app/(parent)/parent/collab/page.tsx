"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PenLine, Users, ChevronRight } from "lucide-react";
import { collabApi, type CollabBook } from "@/lib/api/collab";
import { BackButton } from "@/components/BackButton";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    title: "Сочиняем вместе",
    subtitle: "Придумайте продолжение сказки голосом вместе с ребёнком — лучшие главы попадут в книгу!",
    empty: "Пока нет открытых книг",
    emptyHint: "Загляните позже — эксперты скоро откроют новые истории",
    chapters: "глав",
    writeChapter: "Идёт глава {n}",
    coAuthors: "соавторов",
  },
  kk: {
    title: "Бірге шығарамыз",
    subtitle: "Баламен бірге ертегінің жалғасын дауыспен ойлап табыңыз — үздік тараулар кітапқа енеді!",
    empty: "Әзірге ашық кітаптар жоқ",
    emptyHint: "Кейінірек кіріңіз — сарапшылар жаңа әңгімелер ашады",
    chapters: "тарау",
    writeChapter: "{n}-тарау жүріп жатыр",
    coAuthors: "авторлас",
  },
};

export default function ParentCollabListPage() {
  const t = useT(dict);
  const router = useRouter();
  const { data: books, isLoading } = useQuery<CollabBook[]>({
    queryKey: ["collab-open"],
    queryFn: collabApi.listOpen,
  });

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 32px", maxWidth: 512, margin: "0 auto" }}>
      <BackButton href="/parent/home" />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div className="glass-chip" style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PenLine size={22} color="#fff" strokeWidth={2.2} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: 0 }}>{t("title")}</h1>
      </div>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 0 20px", lineHeight: 1.5 }}>{t("subtitle")}</p>

      {isLoading ? (
        <div className="glass" style={{ padding: 24, borderRadius: 20, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>…</div>
      ) : !books?.length ? (
        <div className="glass" style={{ padding: 28, borderRadius: 20, textAlign: "center" }}>
          <p style={{ fontSize: 40, margin: "0 0 8px" }}>📚</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>{t("empty")}</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>{t("emptyHint")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {books.map((b) => (
            <button
              key={b.id}
              onClick={() => router.push(`/parent/collab/${b.id}`)}
              className="glass"
              style={{ padding: 16, borderRadius: 20, border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 14, width: "100%" }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, overflow: "hidden" }}>
                {b.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : "✨"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{b.bookTitle}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ffd27d" }}>{t("writeChapter", { n: b.currentRound })}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{(b.partTexts?.length ?? 0)} {t("chapters")}</span>
                  {!!b.coAuthors?.length && (
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Users size={12} /> {b.coAuthors.length} {t("coAuthors")}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

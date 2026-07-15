"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { sessionsApi } from "@/lib/api/sessions";
import { childPhotoUrl } from "@/lib/media";
import { BackButton } from "@/components/BackButton";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    back: "Назад",
    students: "Ученики",
    subtitle: "Дети, которых записали на ваши задания",
    noStudents: "Учеников пока нет",
    noStudentsHint: "Здесь появятся дети, которых родители запишут на ваши книги",
    yearsOld: "{n} лет",
    bookOne: "книга",
    bookMany: "книги",
    partsWord: "частей",
    lastActivity: "последняя активность",
  },
  kk: {
    back: "Артқа",
    students: "Оқушылар",
    subtitle: "Тапсырмаларыңызға жазылған балалар",
    noStudents: "Әзірге оқушылар жоқ",
    noStudentsHint: "Мұнда ата-аналар кітаптарыңызға жазатын балалар пайда болады",
    yearsOld: "{n} жаста",
    bookOne: "кітап",
    bookMany: "кітап",
    partsWord: "бөлім",
    lastActivity: "соңғы белсенділік",
  },
};

interface Student {
  childId: string;
  name: string;
  age: number;
  photoUrl?: string | null;
  streak: number;
  booksCount: number;
  completedParts: number;
  totalParts: number;
  lastActivityAt: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ExpertStudentsPage() {
  const router = useRouter();
  const t = useT(dict);

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["expert-students"],
    queryFn: sessionsApi.listStudents,
  });

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 40px", maxWidth: 520, margin: "0 auto" }}>
      <BackButton href="/expert/home" />

      <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{t("students")}</h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
        {t("subtitle")}
      </p>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass" style={{ height: 84, borderRadius: 18, animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="glass" style={{ padding: 40, textAlign: "center", borderRadius: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Users2 size={24} color="#ffffff" strokeWidth={2} />
          </div>
          <p style={{ margin: 0, fontWeight: 900, color: "#ffffff" }}>{t("noStudents")}</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
            {t("noStudentsHint")}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {students.map((s) => {
            const progress = s.totalParts > 0 ? Math.min((s.completedParts / s.totalParts) * 100, 100) : 0;
            return (
              <button
                key={s.childId}
                onClick={() => router.push(`/expert/students/${s.childId}`)}
                className="glass"
                style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, textAlign: "left", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontFamily: "inherit", borderRadius: 18 }}
              >
                {s.photoUrl ? (
                  <img src={childPhotoUrl({ id: s.childId, photoUrl: s.photoUrl })} alt={s.name} style={{ width: 52, height: 52, borderRadius: 16, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#ffffff", flexShrink: 0 }}>
                    {s.name[0]}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", fontSize: 15 }}>{s.name}</p>
                  <p style={{ margin: "2px 0 6px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    {t("yearsOld", { n: s.age })} · {s.booksCount} {s.booksCount === 1 ? t("bookOne") : t("bookMany")} · 🔥 {s.streak}
                  </p>
                  <div style={{ height: 5, borderRadius: 9999, background: "rgba(255,255,255,0.15)", overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "rgba(255,255,255,0.85)", borderRadius: 9999 }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                    {s.completedParts}/{s.totalParts} {t("partsWord")}
                    {s.lastActivityAt ? ` · ${t("lastActivity")} ${formatDate(s.lastActivityAt)}` : ""}
                  </p>
                </div>
                <ChevronRight size={18} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}

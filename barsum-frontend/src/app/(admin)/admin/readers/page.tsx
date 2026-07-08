"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { CoinIcon } from "@/components/CoinIcon";
import { childPhotoUrl } from "@/lib/media";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    panel: "Панель",
    title: "📖 Рейтинг читателей",
    subtitleEmpty: "Читатели платформы по объёму и качеству чтения",
    countAll: "{n} детей",
    countFiltered: "{shown} из {total} детей · {group}",
    searchPlaceholder: "Поиск по имени…",
    sortWords: "По словам",
    sortMinutes: "По минутам",
    sortTasks: "По заданиям",
    sortBooks: "По книгам",
    sortScore: "По баллу",
    sortStreak: "По серии",
    sortCoins: "По монетам",
    ageAll: "Все возрасты",
    age68: "6–8 лет",
    age911: "9–11 лет",
    age1214: "12–14 лет",
    noData: "Нет данных",
    noneFound: "Никто не найден по запросу",
    willAppear: "Читатели появятся, когда дети начнут читать",
    durHour: "ч",
    durMin: "м",
    lastNoActivity: "нет активности",
    lastToday: "сегодня",
    lastYesterday: "вчера",
    lastDaysAgo: "{n} дн назад",
    years: "лет",
    metricWords: "Слова",
    metricTime: "Время",
    metricBooks: "Книги",
    metricTasks: "Задания",
    metricScore: "Балл",
    metricAccuracy: "Точн.",
    metricStreak: "Серия",
    metricCoins: "Монеты",
  },
  kk: {
    panel: "Панель",
    title: "📖 Оқырмандар рейтингі",
    subtitleEmpty: "Платформа оқырмандары оқу көлемі мен сапасы бойынша",
    countAll: "{n} бала",
    countFiltered: "{total} ішінен {shown} бала · {group}",
    searchPlaceholder: "Аты бойынша іздеу…",
    sortWords: "Сөз бойынша",
    sortMinutes: "Минут бойынша",
    sortTasks: "Тапсырма бойынша",
    sortBooks: "Кітап бойынша",
    sortScore: "Балл бойынша",
    sortStreak: "Серия бойынша",
    sortCoins: "Монета бойынша",
    ageAll: "Барлық жас",
    age68: "6–8 жас",
    age911: "9–11 жас",
    age1214: "12–14 жас",
    noData: "Дерек жоқ",
    noneFound: "Сұраныс бойынша ешкім табылмады",
    willAppear: "Балалар оқи бастағанда оқырмандар пайда болады",
    durHour: "сағ",
    durMin: "мин",
    lastNoActivity: "белсенділік жоқ",
    lastToday: "бүгін",
    lastYesterday: "кеше",
    lastDaysAgo: "{n} күн бұрын",
    years: "жас",
    metricWords: "Сөздер",
    metricTime: "Уақыт",
    metricBooks: "Кітаптар",
    metricTasks: "Тапсырмалар",
    metricScore: "Балл",
    metricAccuracy: "Дәлдік",
    metricStreak: "Серия",
    metricCoins: "Монеталар",
  },
};

type Tr = (key: keyof (typeof dict)["ru"], vars?: Record<string, string | number>) => string;

interface ReaderRow {
  childId: string;
  name: string;
  age: number;
  photoUrl: string | null;
  streak: number;
  parentName: string | null;
  totalSessions: number;
  completedParts: number;
  booksCount: number;
  avgScore: number | null;
  avgAccuracy: number | null;
  totalWordsRead: number;
  totalReadingSec: number;
  readingMinutes: number;
  totalCoinsEarned: number;
  lastActivityAt: string | null;
}

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 18,
};

type SortKey =
  | "totalWordsRead"
  | "readingMinutes"
  | "completedParts"
  | "booksCount"
  | "avgScore"
  | "streak"
  | "totalCoinsEarned";

const buildSorts = (t: Tr): { key: SortKey; label: string }[] => [
  { key: "totalWordsRead", label: t("sortWords") },
  { key: "readingMinutes", label: t("sortMinutes") },
  { key: "completedParts", label: t("sortTasks") },
  { key: "booksCount", label: t("sortBooks") },
  { key: "avgScore", label: t("sortScore") },
  { key: "streak", label: t("sortStreak") },
  { key: "totalCoinsEarned", label: t("sortCoins") },
];

type AgeGroup = { key: string; label: string; min: number; max: number };

const buildAgeGroups = (t: Tr): AgeGroup[] => [
  { key: "all", label: t("ageAll"), min: 0, max: 200 },
  { key: "6-8", label: t("age68"), min: 6, max: 8 },
  { key: "9-11", label: t("age911"), min: 9, max: 11 },
  { key: "12-14", label: t("age1214"), min: 12, max: 14 },
];

const MEDALS = ["🥇", "🥈", "🥉"];

function formatDuration(sec: number, t: Tr): string {
  if (!sec) return `0${t("durMin")}`;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h > 0) return `${h}${t("durHour")} ${m}${t("durMin")}`;
  return `${m}${t("durMin")}`;
}

function formatWords(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${n}`;
}

function scoreColor(score: number | null): string {
  if (score == null) return "rgba(255,255,255,0.4)";
  if (score >= 8) return "#4ade80";
  if (score >= 5) return "#facc15";
  return "#f87171";
}

function lastActivity(iso: string | null, t: Tr): string {
  if (!iso) return t("lastNoActivity");
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return t("lastToday");
  if (days === 1) return t("lastYesterday");
  if (days < 30) return t("lastDaysAgo", { n: days });
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function Metric({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: color ?? "#ffffff" }}>{value}</p>
      <p style={{ margin: "1px 0 0", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{label}</p>
    </div>
  );
}

function ReaderCard({ row, rank }: { row: ReaderRow; rank: number }) {
  const t = useT(dict);
  const medal = rank <= 3 ? MEDALS[rank - 1] : null;
  return (
    <div style={{ ...GLASS, padding: "14px 16px", background: rank <= 3 ? "rgba(255,255,255,0.2)" : GLASS.background }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 30, textAlign: "center", fontSize: medal ? 22 : 15, fontWeight: 900, color: "rgba(255,255,255,0.75)", flexShrink: 0 }}>
          {medal ?? rank}
        </div>
        {row.photoUrl ? (
          <img src={childPhotoUrl({ id: row.childId, photoUrl: row.photoUrl })} alt={row.name} style={{ width: 44, height: 44, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#ffffff", flexShrink: 0 }}>
            {row.name[0]}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.age} {t("years")}{row.parentName ? ` · ${row.parentName}` : ""} · {lastActivity(row.lastActivityAt, t)}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 12 }}>
        <Metric label={t("metricWords")} value={formatWords(row.totalWordsRead)} />
        <Metric label={t("metricTime")} value={formatDuration(row.totalReadingSec, t)} />
        <Metric label={t("metricBooks")} value={row.booksCount} />
        <Metric label={t("metricTasks")} value={row.completedParts} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
        <Metric label={t("metricScore")} value={row.avgScore != null ? `${row.avgScore}` : "—"} color={scoreColor(row.avgScore)} />
        <Metric label={t("metricAccuracy")} value={row.avgAccuracy != null ? `${row.avgAccuracy}%` : "—"} />
        <Metric label={t("metricStreak")} value={`🔥${row.streak}`} />
        <Metric label={t("metricCoins")} value={<span><CoinIcon size={12} /> {row.totalCoinsEarned}</span>} />
      </div>
    </div>
  );
}

export default function AdminReadersPage() {
  const router = useRouter();
  const t = useT(dict);
  const SORTS = buildSorts(t);
  const AGE_GROUPS = buildAgeGroups(t);
  const [sortKey, setSortKey] = useState<SortKey>("totalWordsRead");
  const [search, setSearch] = useState("");
  const [ageGroup, setAgeGroup] = useState<string>("all");

  const { data: readers = [], isLoading } = useQuery<ReaderRow[]>({
    queryKey: ["admin-readers-rating"],
    queryFn: adminApi.readersRating,
  });

  const rows = useMemo(() => {
    const group = AGE_GROUPS.find((g) => g.key === ageGroup) ?? AGE_GROUPS[0];
    const q = search.trim().toLowerCase();
    const filtered = readers.filter(
      (r) =>
        r.age >= group.min &&
        r.age <= group.max &&
        (!q || r.name.toLowerCase().includes(q)),
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return (bv as number) - (av as number);
    });
  }, [readers, sortKey, search, ageGroup]);

  return (
    <main style={{ minHeight: "100dvh", padding: "0 0 32px" }}>
      <div className="glass-header" style={{ padding: "52px 20px 16px" }}>
        <button
          onClick={() => router.push("/admin")}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 12 }}
        >
          ← {t("panel")}
        </button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{t("title")}</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          {readers.length > 0
            ? ageGroup === "all"
              ? t("countAll", { n: rows.length })
              : t("countFiltered", { shown: rows.length, total: readers.length, group: AGE_GROUPS.find((g) => g.key === ageGroup)?.label ?? "" })
            : t("subtitleEmpty")}
        </p>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="glass-input"
          style={{ marginBottom: 12 }}
        />
        <div className="scrollbar-hide" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
          {AGE_GROUPS.map((g) => {
            const active = ageGroup === g.key;
            return (
              <button
                key={g.key}
                onClick={() => setAgeGroup(g.key)}
                style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 9999, border: active ? "none" : "1px solid rgba(255,255,255,0.22)", background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)", color: active ? "#4776e6" : "rgba(255,255,255,0.75)", fontWeight: active ? 900 : 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              >
                {g.label}
              </button>
            );
          })}
        </div>
        <div className="scrollbar-hide" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
          {SORTS.map((s) => {
            const active = sortKey === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSortKey(s.key)}
                style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 9999, border: active ? "none" : "1px solid rgba(255,255,255,0.22)", background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)", color: active ? "#4776e6" : "rgba(255,255,255,0.75)", fontWeight: active ? 900 : 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ ...GLASS, height: 110, animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ ...GLASS, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>📚</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#ffffff" }}>{t("noData")}</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
              {search ? t("noneFound") : t("willAppear")}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((row, i) => (
              <ReaderCard key={row.childId} row={row} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

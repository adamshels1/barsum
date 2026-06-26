"use client";

import { useQuery } from "@tanstack/react-query";
import { BookMarked, LogOut, Plus, TrendingUp, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { challengesApi } from "@/lib/api/challenges";
import { expertsApi } from "@/lib/api/experts";
import { useAuthStore } from "@/stores/auth-store";

interface Challenge {
  id: string; title: string; bookTitle: string; bookAuthor: string;
  days: number; price: number; coinsReward: number;
  ageMin: number; ageMax: number;
  status: "draft" | "moderation" | "published" | "rejected";
  membersCount: number;
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: "Черновик",      color: "rgba(255,255,255,0.6)",  bg: "rgba(255,255,255,0.1)" },
  moderation: { label: "На модерации",  color: "#ffffff",               bg: "rgba(255,255,255,0.2)" },
  published:  { label: "Опубликован",   color: "#4776e6",               bg: "rgba(255,255,255,0.85)" },
  rejected:   { label: "Отклонён",      color: "#ffffff",               bg: "rgba(200,0,0,0.35)" },
};

const stats_config = [
  { key: "challenges", label: "заданий",  Icon: BookMarked },
  { key: "students",   label: "учеников", Icon: Users2 },
  { key: "revenueTg",  label: "₸ доход",  Icon: TrendingUp, isCurrency: true },
];

export default function ExpertHomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: stats } = useQuery({ queryKey: ["expert-stats"], queryFn: expertsApi.stats });
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["challenges-list"],
    queryFn: () => challengesApi.list(),
  });

  const publishedChallenges = (challenges as Challenge[]).filter((c) => c.status === "published");

  return (
    <main style={{ minHeight: "100dvh", padding: "0 0 32px" }}>
      {/* Header */}
      <div
        className="glass-header"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 20px 20px" }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Панель эксперта
          </p>
          <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 900, color: "#ffffff" }}>
            {user?.name || "Эксперт"}
          </h1>
        </div>
        <button
          onClick={() => { clearAuth(); router.push("/auth/expert"); }}
          className="glass-chip"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 13 }}
        >
          <LogOut size={14} strokeWidth={2.5} />
          Выйти
        </button>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {stats_config.map(({ key, label, Icon, isCurrency }) => {
            const val = (stats as any)?.[key];
            return (
              <div key={key} className="glass" style={{ padding: "14px 10px", textAlign: "center", borderRadius: 16 }}>
                <Icon size={18} color="rgba(255,255,255,0.8)" style={{ display: "block", margin: "0 auto 6px" }} />
                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff" }}>
                  {val != null ? (isCurrency ? val.toLocaleString("ru-RU") : val) : "—"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{label}</p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => router.push("/expert/create")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              padding: "16px 8px",
              borderRadius: 9999,
              border: "none",
              background: "rgba(255,255,255,0.9)",
              color: "#4776e6",
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus size={16} strokeWidth={3} />
            Создать
          </button>
          <button
            onClick={() => router.push("/expert/books")}
            className="glass-chip"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              padding: "16px 8px",
              border: "1px solid rgba(255,255,255,0.28)",
              cursor: "pointer",
              fontFamily: "inherit",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <BookMarked size={16} strokeWidth={2.5} />
            Мои задания
          </button>
        </div>

        {/* Published list */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Опубликованные
            </p>
            {publishedChallenges.length > 0 && (
              <span className="glass-chip" style={{ padding: "3px 10px", fontSize: 12, fontWeight: 900, color: "#ffffff" }}>
                {publishedChallenges.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2].map((i) => (
                <div key={i} className="glass" style={{ height: 80, borderRadius: 16, animation: "pulse 2s infinite" }} />
              ))}
            </div>
          ) : publishedChallenges.length === 0 ? (
            <div className="glass" style={{ padding: 40, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <BookMarked size={24} color="#ffffff" strokeWidth={2} />
              </div>
              <p style={{ margin: 0, fontWeight: 900, color: "#ffffff" }}>Нет опубликованных</p>
              <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                Создайте первое задание для учеников
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {publishedChallenges.map((c) => {
                const s = STATUS[c.status] ?? STATUS.published;
                return (
                  <div key={c.id} className="glass" style={{ padding: 16, borderRadius: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.bookTitle} · {c.days} дней
                        </p>
                      </div>
                      <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 9999, fontWeight: 800, flexShrink: 0, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                        <Users2 size={12} /> {c.membersCount}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>🪙 {c.coinsReward}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#4776e6", background: "rgba(255,255,255,0.85)", borderRadius: 9999, padding: "3px 10px", marginLeft: "auto" }}>
                        {c.price.toLocaleString("ru-RU")} ₸
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

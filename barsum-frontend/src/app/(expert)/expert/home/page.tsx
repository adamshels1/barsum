"use client";

import { useQuery } from "@tanstack/react-query";
import { BookMarked, LogOut, Plus, TrendingUp, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { challengesApi } from "@/lib/api/challenges";
import { expertsApi } from "@/lib/api/experts";
import { useAuthStore } from "@/stores/auth-store";

interface Challenge {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  days: number;
  price: number;
  coinsReward: number;
  category: string;
  ageMin: number;
  ageMax: number;
  status: "draft" | "moderation" | "published" | "rejected";
  membersCount: number;
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Черновик", color: "#6B7280", bg: "#F3F4F6" },
  moderation: { label: "На модерации", color: "#D97706", bg: "#FEF3C7" },
  published: { label: "Опубликован", color: "#059669", bg: "#ECFDF5" },
  rejected: { label: "Отклонён", color: "#DC2626", bg: "#FEE2E2" },
};

export default function ExpertHomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: stats } = useQuery({
    queryKey: ["expert-stats"],
    queryFn: expertsApi.stats,
  });

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["challenges-list"],
    queryFn: () => challengesApi.list(),
  });

  const publishedChallenges = (challenges as Challenge[]).filter(
    (c) => c.status === "published"
  );

  return (
    <main className="min-h-screen pb-8" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-8"
        style={{
          background: "var(--orange)",
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          boxShadow: "0 6px 32px rgba(249,115,22,0.3)",
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white text-sm font-semibold opacity-80 mb-0.5">Панель эксперта</p>
            <h1 className="text-2xl font-black text-white leading-tight">
              {user?.name || "Эксперт"} 👋
            </h1>
          </div>
          <button
            onClick={() => { clearAuth(); router.push("/auth/expert"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-opacity active:opacity-70"
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
          >
            <LogOut size={14} strokeWidth={2.5} />
            Выйти
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <BookMarked size={20} color="#fff" className="mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{stats?.challenges ?? "—"}</p>
            <p className="text-xs text-white font-semibold" style={{ opacity: 0.8 }}>заданий</p>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Users2 size={20} color="#fff" className="mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{stats?.students ?? "—"}</p>
            <p className="text-xs text-white font-semibold" style={{ opacity: 0.8 }}>учеников</p>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <TrendingUp size={20} color="#fff" className="mx-auto mb-1" />
            <p className="text-xl font-black text-white leading-tight">
              {stats?.revenueTg != null ? `${stats.revenueTg.toLocaleString("ru-RU")}` : "—"}
            </p>
            <p className="text-xs text-white font-semibold" style={{ opacity: 0.8 }}>₸ доход</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/expert/create")}
            className="flex items-center gap-2 justify-center py-4 px-4 rounded-2xl font-black text-white transition-transform active:scale-95"
            style={{ background: "var(--purple)", boxShadow: "var(--shadow-purple)" }}
          >
            <Plus size={18} strokeWidth={3} />
            Создать задание
          </button>
          <button
            onClick={() => router.push("/expert/books")}
            className="flex items-center gap-2 justify-center py-4 px-4 rounded-2xl font-black transition-transform active:scale-95"
            style={{
              background: "#fff",
              color: "var(--orange)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <BookMarked size={18} strokeWidth={2.5} />
            Мои задания
          </button>
        </div>

        {/* Published challenges */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black" style={{ color: "var(--ink)" }}>
              Опубликованные
            </h2>
            {publishedChallenges.length > 0 && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-bold"
                style={{ background: "var(--green-light)", color: "var(--green-deep)" }}
              >
                {publishedChallenges.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl h-20 animate-pulse"
                  style={{ background: "#fff" }}
                />
              ))}
            </div>
          ) : publishedChallenges.length === 0 ? (
            <div
              className="rounded-3xl p-10 text-center"
              style={{ background: "#fff", boxShadow: "var(--shadow-sm)" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--orange-light)" }}
              >
                <BookMarked size={28} color="var(--orange)" strokeWidth={2} />
              </div>
              <p className="font-black text-base" style={{ color: "var(--ink)" }}>
                Нет опубликованных
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Создайте первое задание для учеников
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {publishedChallenges.map((c) => {
                const s = STATUS[c.status] ?? STATUS.published;
                return (
                  <div
                    key={c.id}
                    className="rounded-2xl p-4"
                    style={{ background: "#fff", boxShadow: "var(--shadow-sm)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate" style={{ color: "var(--ink)" }}>
                          {c.title}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                          {c.bookTitle} · {c.days} дней
                        </p>
                      </div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        <Users2 size={12} />
                        {c.membersCount}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        🪙 {c.coinsReward}
                      </span>
                      <span
                        className="text-sm font-black ml-auto"
                        style={{ color: "var(--green-deep)" }}
                      >
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

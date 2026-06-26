"use client";

import { useQuery } from "@tanstack/react-query";
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

const STATUS_LABEL: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Черновик", color: "var(--ink)", bg: "var(--line)" },
  moderation: {
    label: "На модерации",
    color: "var(--orange-deep)",
    bg: "var(--orange-light)",
  },
  published: {
    label: "Опубликован",
    color: "var(--green-deep)",
    bg: "var(--green-light)",
  },
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

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ["challenges-list"],
    queryFn: () => challengesApi.list(),
  });

  const publishedChallenges = (challenges as Challenge[]).filter(
    (c) => c.status === "published"
  );

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/expert");
  };

  return (
    <main
      className="min-h-screen p-6 max-w-lg mx-auto"
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-extrabold"
            style={{ color: "var(--ink)" }}
          >
            Привет, {user?.name || "Эксперт"} 👋
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Панель эксперта
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-2 rounded-xl font-semibold transition-opacity hover:opacity-70"
          style={{
            color: "var(--muted)",
            background: "var(--white)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          Выйти
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div
          className="rounded-2xl p-4 text-center"
          style={{
            background: "var(--purple)",
            boxShadow: "0 4px 0 var(--purple-deep)",
            color: "#fff",
          }}
        >
          <p className="text-2xl font-extrabold">
            {stats?.challenges ?? "—"}
          </p>
          <p className="text-xs opacity-80 mt-0.5">заданий 📚</p>
        </div>
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: "var(--white)", boxShadow: "var(--shadow-md)" }}
        >
          <p
            className="text-2xl font-extrabold"
            style={{ color: "var(--ink)" }}
          >
            {stats?.students ?? "—"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            учеников 👦
          </p>
        </div>
        <div
          className="rounded-2xl p-4 text-center"
          style={{
            background: "var(--green)",
            boxShadow: "0 4px 0 var(--green-deep)",
            color: "#fff",
          }}
        >
          <p className="text-xl font-extrabold leading-tight">
            {stats?.revenueTg != null
              ? `${stats.revenueTg.toLocaleString("ru-RU")} ₸`
              : "—"}
          </p>
          <p className="text-xs opacity-80 mt-0.5">доход 💰</p>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => router.push("/expert/create")}
          className="py-4 rounded-2xl font-bold text-white transition-opacity hover:opacity-90"
          style={{
            background: "var(--purple)",
            boxShadow: "0 5px 0 var(--purple-deep)",
          }}
        >
          + Создать задание
        </button>
        <button
          onClick={() => router.push("/expert/books")}
          className="py-4 rounded-2xl font-bold transition-opacity hover:opacity-90"
          style={{
            background: "var(--white)",
            color: "var(--purple)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          Мои задания 📋
        </button>
      </div>

      {/* Published challenges */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
          Опубликованные задания
        </h2>
        {publishedChallenges.length > 0 && (
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{
              background: "var(--green-light)",
              color: "var(--green-deep)",
            }}
          >
            {publishedChallenges.length}
          </span>
        )}
      </div>

      {challengesLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-4 h-20 animate-pulse"
              style={{ background: "var(--white)" }}
            />
          ))}
        </div>
      ) : publishedChallenges.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--white)", boxShadow: "var(--shadow-sm)" }}
        >
          <p className="text-4xl mb-3">📚</p>
          <p className="font-semibold" style={{ color: "var(--ink)" }}>
            Нет опубликованных заданий
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Создайте первое задание для учеников
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {publishedChallenges.map((challenge) => {
            const s = STATUS_LABEL[challenge.status] ?? STATUS_LABEL.published;
            return (
              <div
                key={challenge.id}
                className="rounded-2xl p-4"
                style={{
                  background: "var(--white)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold text-sm truncate"
                      style={{ color: "var(--ink)" }}
                    >
                      {challenge.title}
                    </p>
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: "var(--muted)" }}
                    >
                      {challenge.bookTitle} · {challenge.days} дней
                    </p>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    👥 {challenge.membersCount} учеников
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    🪙 {challenge.coinsReward} монет
                  </span>
                  <span
                    className="text-xs font-semibold ml-auto"
                    style={{ color: "var(--green-deep)" }}
                  >
                    {challenge.price.toLocaleString("ru-RU")} ₸
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

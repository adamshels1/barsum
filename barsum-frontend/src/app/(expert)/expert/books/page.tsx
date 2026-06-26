"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { challengesApi } from "@/lib/api/challenges";

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
  rejectedReason?: string;
  membersCount: number;
}

type FilterStatus = "all" | "draft" | "moderation" | "published" | "rejected";

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "draft", label: "Черновик" },
  { key: "moderation", label: "На модерации" },
  { key: "published", label: "Опубликован" },
  { key: "rejected", label: "Отклонён" },
];

const STATUS_BADGE: Record<
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

export default function ExpertBooksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>("all");

  const { data: allChallenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ["my-challenges"],
    queryFn: challengesApi.my,
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => challengesApi.submit(id),
    onSuccess: () => {
      toast.success("Задание отправлено на модерацию!");
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["challenges-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Ошибка отправки");
    },
  });

  const filtered =
    filter === "all"
      ? allChallenges
      : allChallenges.filter((c) => c.status === filter);

  return (
    <main
      className="min-h-screen p-6 max-w-lg mx-auto"
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm mb-1 flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: "var(--muted)" }}
          >
            ← Назад
          </button>
          <h1
            className="text-2xl font-extrabold"
            style={{ color: "var(--ink)" }}
          >
            Мои задания
          </h1>
        </div>
        <button
          onClick={() => router.push("/expert/create")}
          className="px-4 py-2.5 rounded-2xl font-bold text-white text-sm transition-opacity hover:opacity-90"
          style={{
            background: "var(--purple)",
            boxShadow: "0 4px 0 var(--purple-deep)",
          }}
        >
          + Создать
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          const count =
            f.key === "all"
              ? allChallenges.length
              : allChallenges.filter((c) => c.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: isActive ? "var(--purple)" : "var(--white)",
                color: isActive ? "#fff" : "var(--muted)",
                boxShadow: isActive
                  ? "0 3px 0 var(--purple-deep)"
                  : "var(--shadow-sm)",
              }}
            >
              {f.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs opacity-80">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl h-28 animate-pulse"
              style={{ background: "var(--white)" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--white)", boxShadow: "var(--shadow-sm)" }}
        >
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold" style={{ color: "var(--ink)" }}>
            {filter === "all" ? "Нет заданий" : "Нет заданий в этой категории"}
          </p>
          {filter === "all" && (
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Создайте первое задание
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((challenge) => {
            const badge = STATUS_BADGE[challenge.status] ?? STATUS_BADGE.draft;
            return (
              <div
                key={challenge.id}
                className="rounded-2xl p-4"
                style={{
                  background: "var(--white)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold truncate"
                      style={{ color: "var(--ink)" }}
                    >
                      {challenge.title}
                    </p>
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: "var(--muted)" }}
                    >
                      {challenge.bookTitle}
                      {challenge.bookAuthor ? ` · ${challenge.bookAuthor}` : ""}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Meta row */}
                <div
                  className="flex items-center gap-3 text-xs mb-3"
                  style={{ color: "var(--muted)" }}
                >
                  <span>📅 {challenge.days} дней</span>
                  <span>💰 {challenge.price.toLocaleString("ru-RU")} ₸</span>
                  <span>👥 {challenge.membersCount}</span>
                </div>

                {/* Rejected reason */}
                {challenge.status === "rejected" &&
                  challenge.rejectedReason && (
                    <div
                      className="rounded-xl p-3 mb-3 text-xs"
                      style={{ background: "#FEF2F2", color: "#B91C1C" }}
                    >
                      <span className="font-semibold">
                        Причина отклонения:{" "}
                      </span>
                      {challenge.rejectedReason}
                    </div>
                  )}

                {/* Action buttons */}
                {(challenge.status === "draft" ||
                  challenge.status === "rejected") && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() =>
                        router.push(`/expert/create?edit=${challenge.id}`)
                      }
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                      style={{
                        background: "var(--lav)",
                        color: "var(--purple)",
                      }}
                    >
                      Редактировать
                    </button>
                    {challenge.status === "draft" && (
                      <button
                        onClick={() => submitMutation.mutate(challenge.id)}
                        disabled={submitMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        style={{
                          background: "var(--green)",
                          boxShadow: "0 3px 0 var(--green-deep)",
                        }}
                      >
                        {submitMutation.isPending
                          ? "Отправка..."
                          : "На модерацию"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

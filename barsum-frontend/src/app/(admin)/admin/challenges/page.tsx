"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { apiClient } from "@/lib/api/client";

type ChallengeFilter = "moderation" | "published" | "rejected";

interface Challenge {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  description?: string;
  price: number;
  coinsReward: number;
  days: number;
  status: string;
  authorId: string;
  category?: string;
  ageMin?: number;
  ageMax?: number;
}

const TABS: { key: ChallengeFilter; label: string }[] = [
  { key: "moderation", label: "На модерации" },
  { key: "published", label: "Опубликованы" },
  { key: "rejected", label: "Отклонены" },
];

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> =
  {
    moderation: { label: "На модерации", bg: "#fef3c7", color: "#d97706" },
    published: { label: "Опубликовано", bg: "#dcfce7", color: "#16a34a" },
    rejected: { label: "Отклонено", bg: "#fee2e2", color: "#dc2626" },
  };

function SkeletonCard() {
  return (
    <div
      className="rounded-3xl p-5 animate-pulse"
      style={{
        background: "var(--card)",
        boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
      }}
    >
      <div
        className="h-5 rounded-xl mb-3"
        style={{ background: "var(--surface)", width: "65%" }}
      />
      <div
        className="h-4 rounded-xl mb-2"
        style={{ background: "var(--surface)", width: "50%" }}
      />
      <div
        className="h-16 rounded-xl"
        style={{ background: "var(--surface)" }}
      />
    </div>
  );
}

export default function AdminChallengesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ChallengeFilter>("moderation");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, isError } = useQuery<Challenge[]>({
    queryKey: ["admin-challenges", activeTab],
    queryFn: () => adminApi.challenges(activeTab),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/challenges/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient
        .post(`/challenges/${id}/reject`, { reason })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      setRejectingId(null);
      setRejectReason("");
    },
  });

  const handleRejectStart = (id: string) => {
    setRejectingId(id);
    setRejectReason("");
  };

  const handleRejectCancel = () => {
    setRejectingId(null);
    setRejectReason("");
  };

  const handleRejectConfirm = (id: string) => {
    rejectMutation.mutate({ id, reason: rejectReason });
  };

  const statusInfo = (status: string) =>
    STATUS_MAP[status] ?? {
      label: status,
      bg: "var(--surface)",
      color: "var(--muted)",
    };

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push("/admin")}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold transition-opacity hover:opacity-70"
          style={{ background: "var(--surface)", color: "var(--ink)" }}
          aria-label="Назад"
        >
          ←
        </button>
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
          Модерация заданий
        </h1>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-2xl"
        style={{ background: "var(--surface)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background:
                activeTab === tab.key ? "var(--purple)" : "transparent",
              color: activeTab === tab.key ? "#fff" : "var(--muted)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <div
          className="rounded-3xl p-5 text-center"
          style={{ background: "var(--card)", color: "#ef4444" }}
        >
          Ошибка загрузки. Попробуйте ещё раз.
        </div>
      ) : !data || data.length === 0 ? (
        <div
          className="rounded-3xl p-10 text-center"
          style={{
            background: "var(--card)",
            boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
          }}
        >
          <p className="text-4xl mb-3">📚</p>
          <p className="font-semibold" style={{ color: "var(--muted)" }}>
            Нет заданий
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((challenge) => {
            const si = statusInfo(challenge.status);
            return (
              <div
                key={challenge.id}
                className="rounded-3xl p-5"
                style={{
                  background: "var(--card)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
                }}
              >
                {/* Title row */}
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className="text-base font-extrabold leading-tight pr-2 flex-1"
                    style={{ color: "var(--ink)" }}
                  >
                    {challenge.title}
                  </h3>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full shrink-0"
                    style={{ background: si.bg, color: si.color }}
                  >
                    {si.label}
                  </span>
                </div>

                {/* Book info */}
                <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                  📖 {challenge.bookTitle}
                  {challenge.bookAuthor ? ` — ${challenge.bookAuthor}` : ""}
                </p>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {challenge.category && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        background: "var(--surface)",
                        color: "var(--ink)",
                      }}
                    >
                      {challenge.category}
                    </span>
                  )}
                  {(challenge.ageMin != null || challenge.ageMax != null) && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        background: "var(--surface)",
                        color: "var(--ink)",
                      }}
                    >
                      {challenge.ageMin ?? "?"}–{challenge.ageMax ?? "?"} лет
                    </span>
                  )}
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: "var(--surface)",
                      color: "var(--ink)",
                    }}
                  >
                    {challenge.days}{" "}
                    {challenge.days === 1
                      ? "день"
                      : challenge.days < 5
                        ? "дня"
                        : "дней"}
                  </span>
                </div>

                {/* Price / coins row */}
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Цена
                    </p>
                    <p
                      className="text-base font-extrabold"
                      style={{ color: "var(--purple)" }}
                    >
                      {challenge.price} ₸
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Награда
                    </p>
                    <p
                      className="text-base font-extrabold"
                      style={{ color: "var(--green)" }}
                    >
                      {challenge.coinsReward} 🪙
                    </p>
                  </div>
                </div>

                {/* Description */}
                {challenge.description && (
                  <p
                    className="text-sm leading-relaxed mb-3"
                    style={{ color: "var(--muted)" }}
                  >
                    {challenge.description.length > 200
                      ? challenge.description.slice(0, 200) + "…"
                      : challenge.description}
                  </p>
                )}

                {/* Actions for moderation */}
                {challenge.status === "moderation" &&
                  rejectingId !== challenge.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMutation.mutate(challenge.id)}
                        disabled={approveMutation.isPending}
                        className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{ background: "var(--green)" }}
                      >
                        Опубликовать
                      </button>
                      <button
                        onClick={() => handleRejectStart(challenge.id)}
                        className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-80"
                        style={{ background: "#ef4444" }}
                      >
                        Отклонить
                      </button>
                    </div>
                  )}

                {/* Reject inline form */}
                {challenge.status === "moderation" &&
                  rejectingId === challenge.id && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Причина отклонения (необязательно)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none border-2"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--surface)",
                          color: "var(--ink)",
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectConfirm(challenge.id)}
                          disabled={rejectMutation.isPending}
                          className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{ background: "#ef4444" }}
                        >
                          {rejectMutation.isPending
                            ? "Отклоняем..."
                            : "Подтвердить отклонение"}
                        </button>
                        <button
                          onClick={handleRejectCancel}
                          className="py-2.5 px-4 rounded-2xl text-sm font-bold transition-opacity hover:opacity-80"
                          style={{
                            background: "var(--surface)",
                            color: "var(--muted)",
                          }}
                        >
                          Отмена
                        </button>
                      </div>
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

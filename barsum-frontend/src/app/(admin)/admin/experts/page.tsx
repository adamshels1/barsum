"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api/admin";

type ExpertStatus = "review" | "approved" | "rejected";

interface Expert {
  id: string;
  userId: string;
  status: string;
  specialization?: string;
  bio?: string;
}

const TABS: { key: ExpertStatus; label: string }[] = [
  { key: "review", label: "На рассмотрении" },
  { key: "approved", label: "Одобрены" },
  { key: "rejected", label: "Отклонены" },
];

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> =
  {
    review: { label: "На рассмотрении", bg: "#fef3c7", color: "#d97706" },
    approved: { label: "Одобрен", bg: "#dcfce7", color: "#16a34a" },
    rejected: { label: "Отклонён", bg: "#fee2e2", color: "#dc2626" },
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
        className="h-4 rounded-xl mb-3"
        style={{ background: "var(--surface)", width: "55%" }}
      />
      <div
        className="h-4 rounded-xl mb-2"
        style={{ background: "var(--surface)", width: "40%" }}
      />
      <div
        className="h-12 rounded-xl"
        style={{ background: "var(--surface)" }}
      />
    </div>
  );
}

export default function AdminExpertsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ExpertStatus>("review");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, isError } = useQuery<Expert[]>({
    queryKey: ["admin-experts", activeTab],
    queryFn: () => adminApi.experts(activeTab),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveExpert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experts"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectExpert(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experts"] });
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
          Модерация экспертов
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
          <p className="text-4xl mb-3">🔎</p>
          <p className="font-semibold" style={{ color: "var(--muted)" }}>
            Нет заявок
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((expert) => {
            const si = statusInfo(expert.status);
            return (
              <div
                key={expert.id}
                className="rounded-3xl p-5"
                style={{
                  background: "var(--card)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p
                      className="text-xs font-medium mb-0.5"
                      style={{ color: "var(--muted)" }}
                    >
                      ID пользователя
                    </p>
                    <p
                      className="text-sm font-mono font-semibold truncate max-w-[180px]"
                      style={{ color: "var(--ink)" }}
                    >
                      {expert.userId}
                    </p>
                  </div>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: si.bg, color: si.color }}
                  >
                    {si.label}
                  </span>
                </div>

                {/* Specialization */}
                {expert.specialization && (
                  <div className="mb-2">
                    <p
                      className="text-xs font-medium mb-0.5"
                      style={{ color: "var(--muted)" }}
                    >
                      Специализация
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--ink)" }}
                    >
                      {expert.specialization}
                    </p>
                  </div>
                )}

                {/* Bio */}
                {expert.bio && (
                  <div className="mb-3">
                    <p
                      className="text-xs font-medium mb-0.5"
                      style={{ color: "var(--muted)" }}
                    >
                      О себе
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--ink)" }}
                    >
                      {expert.bio.length > 150
                        ? expert.bio.slice(0, 150) + "…"
                        : expert.bio}
                    </p>
                  </div>
                )}

                {/* Actions for review status */}
                {expert.status === "review" && rejectingId !== expert.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate(expert.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ background: "var(--green)" }}
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleRejectStart(expert.id)}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-80"
                      style={{ background: "#ef4444" }}
                    >
                      Отклонить
                    </button>
                  </div>
                )}

                {/* Reject inline form */}
                {expert.status === "review" && rejectingId === expert.id && (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Причина отклонения (необязательно)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none border-2 resize-none"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--surface)",
                        color: "var(--ink)",
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectConfirm(expert.id)}
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

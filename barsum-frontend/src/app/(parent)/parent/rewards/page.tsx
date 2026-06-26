"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { rewardsApi } from "@/lib/api/rewards";
import type { Reward, RewardRequest } from "@/types";

// ─── Review Queue types ────────────────────────────────────────────────
interface ReviewQueueItem {
  id: string;
  sessionId: string;
  childId: string;
  child?: { name: string };
  session?: {
    day: number;
    transcription?: string;
    aiScore?: number;
  };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// ─── Type badge ────────────────────────────────────────────────────────
const TYPE_LABELS: Record<
  string,
  { label: string; emoji: string; bg: string }
> = {
  snack: { label: "Перекус", emoji: "🍎", bg: "#FEF3C7" },
  time: { label: "Время", emoji: "⏱️", bg: "#EDE9FE" },
  experience: { label: "Активность", emoji: "🎉", bg: "#DCFCE7" },
};

function TypeBadge({ type }: { type: string }) {
  const t = TYPE_LABELS[type] ?? { label: type, emoji: "🎁", bg: "#F3F4F6" };
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
      style={{ background: t.bg, color: "var(--ink)" }}
    >
      {t.emoji} {t.label}
    </span>
  );
}

// ─── Create reward form (inline modal) ────────────────────────────────
function CreateRewardModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [type, setType] = useState<"snack" | "time" | "experience">("snack");

  const mutation = useMutation({
    mutationFn: () => rewardsApi.create({ name, cost: Number(cost), type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success("Награда создана!");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Ошибка при создании");
    },
  });

  return (
    <div
      className="fixed inset-0 flex items-end justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4">
        <h3 className="text-xl font-extrabold" style={{ color: "var(--ink)" }}>
          Новая награда
        </h3>

        <div className="space-y-3">
          <div>
            <label
              className="text-xs font-semibold uppercase mb-1 block"
              style={{ color: "var(--muted)" }}
            >
              Название
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Час игры"
              className="w-full px-4 py-3 rounded-xl border text-base outline-none"
              style={{ borderColor: "#E5E7EB", color: "var(--ink)" }}
            />
          </div>

          <div>
            <label
              className="text-xs font-semibold uppercase mb-1 block"
              style={{ color: "var(--muted)" }}
            >
              Стоимость (монеты)
            </label>
            <input
              type="number"
              min={1}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="50"
              className="w-full px-4 py-3 rounded-xl border text-base outline-none"
              style={{ borderColor: "#E5E7EB", color: "var(--ink)" }}
            />
          </div>

          <div>
            <label
              className="text-xs font-semibold uppercase mb-1 block"
              style={{ color: "var(--muted)" }}
            >
              Тип
            </label>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as "snack" | "time" | "experience")
              }
              className="w-full px-4 py-3 rounded-xl border text-base outline-none appearance-none"
              style={{
                borderColor: "#E5E7EB",
                color: "var(--ink)",
                background: "#fff",
              }}
            >
              <option value="snack">🍎 Перекус</option>
              <option value="time">⏱️ Время</option>
              <option value="experience">🎉 Активность</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            Отмена
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || !cost || mutation.isPending}
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-white"
            style={{
              background: !name.trim() || !cost ? "#C4B5FD" : "var(--purple)",
            }}
          >
            {mutation.isPending ? "Создаём..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reward card ───────────────────────────────────────────────────────
function RewardCard({ reward }: { reward: Reward }) {
  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: () => rewardsApi.deactivate(reward.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success("Награда деактивирована");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Ошибка");
    },
  });

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: "#EDE9FE" }}
      >
        {TYPE_LABELS[reward.type]?.emoji ?? "🎁"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate" style={{ color: "var(--ink)" }}>
          {reward.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--purple)" }}
          >
            🪙 {reward.cost}
          </span>
          <TypeBadge type={reward.type} />
        </div>
      </div>
      <button
        onClick={() => deactivateMutation.mutate()}
        disabled={deactivateMutation.isPending}
        className="text-xs font-semibold px-3 py-1.5 rounded-xl flex-shrink-0"
        style={{ background: "#FEE2E2", color: "#DC2626" }}
      >
        {deactivateMutation.isPending ? "..." : "Деакт."}
      </button>
    </div>
  );
}

// ─── Reward request card ───────────────────────────────────────────────
function RequestCard({ request }: { request: RewardRequest }) {
  const queryClient = useQueryClient();

  const deliverMutation = useMutation({
    mutationFn: () => rewardsApi.deliver(request.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reward-requests"] });
      toast.success("Выдано!");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Ошибка"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rewardsApi.reject(request.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reward-requests"] });
      toast.success("Отклонено");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Ошибка"),
  });

  const childName =
    (request as any).child?.name ?? `Ребёнок ${request.childId.slice(-4)}`;
  const rewardName =
    (request as any).reward?.name ?? `Награда ${request.rewardId.slice(-4)}`;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: "var(--surface)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold" style={{ color: "var(--ink)" }}>
            {childName}
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            хочет: <span className="font-semibold">{rewardName}</span>
          </p>
          <p
            className="text-sm font-semibold mt-0.5"
            style={{ color: "var(--purple)" }}
          >
            🪙 {request.coinsAmount}
          </p>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: "#FEF3C7", color: "#92400E" }}
        >
          ожидает
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => deliverMutation.mutate()}
          disabled={deliverMutation.isPending || rejectMutation.isPending}
          className="flex-1 py-2 rounded-xl font-semibold text-sm text-white"
          style={{ background: "var(--green)" }}
        >
          {deliverMutation.isPending ? "..." : "✅ Выдал"}
        </button>
        <button
          onClick={() => rejectMutation.mutate()}
          disabled={deliverMutation.isPending || rejectMutation.isPending}
          className="flex-1 py-2 rounded-xl font-semibold text-sm"
          style={{ background: "#FEE2E2", color: "#DC2626" }}
        >
          {rejectMutation.isPending ? "..." : "❌ Отклонить"}
        </button>
      </div>
    </div>
  );
}

// ─── Review queue card ─────────────────────────────────────────────────
function ReviewCard({ item }: { item: ReviewQueueItem }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => apiClient.post(`/review-queue/${item.id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      toast.success("Засчитано!");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Ошибка"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiClient.post(`/review-queue/${item.id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      toast.success("Не засчитано");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Ошибка"),
  });

  const childName = item.child?.name ?? `Ребёнок ${item.childId.slice(-4)}`;
  const session = item.session;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: "var(--surface)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold" style={{ color: "var(--ink)" }}>
            {childName}
          </p>
          {session && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              День {session.day}
              {session.aiScore != null && (
                <span
                  className="ml-2 font-semibold"
                  style={{ color: "var(--purple)" }}
                >
                  AI: {session.aiScore}/10
                </span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ background: "#EDE9FE", color: "var(--purple)" }}
        >
          {expanded ? "Скрыть" : "Детали"}
        </button>
      </div>

      {expanded && session?.transcription && (
        <div
          className="rounded-xl p-3 text-sm leading-relaxed"
          style={{ background: "#F3F4F6", color: "var(--ink)" }}
        >
          <p
            className="text-xs font-semibold uppercase mb-1"
            style={{ color: "var(--muted)" }}
          >
            Расшифровка
          </p>
          <p>{session.transcription}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isPending || rejectMutation.isPending}
          className="flex-1 py-2 rounded-xl font-semibold text-sm text-white"
          style={{ background: "var(--green)" }}
        >
          {approveMutation.isPending ? "..." : "✅ Засчитать"}
        </button>
        <button
          onClick={() => rejectMutation.mutate()}
          disabled={approveMutation.isPending || rejectMutation.isPending}
          className="flex-1 py-2 rounded-xl font-semibold text-sm"
          style={{ background: "#FEE2E2", color: "#DC2626" }}
        >
          {rejectMutation.isPending ? "..." : "❌ Не засчитывать"}
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────
function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: "var(--surface)" }}
    >
      <p className="text-3xl mb-2">{emoji}</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        {text}
      </p>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────
function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold" style={{ color: "var(--ink)" }}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────
export default function ParentRewardsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Rewards
  const { data: rewards = [], isLoading: loadingRewards } = useQuery<Reward[]>({
    queryKey: ["rewards"],
    queryFn: rewardsApi.list,
  });

  // Reward requests — filter pending only
  const { data: allRequests = [], isLoading: loadingRequests } = useQuery<
    RewardRequest[]
  >({
    queryKey: ["reward-requests"],
    queryFn: rewardsApi.listRequests,
  });
  const pendingRequests = allRequests.filter((r) => r.status === "pending");

  // Review queue
  const { data: reviewQueue = [], isLoading: loadingQueue } = useQuery<
    ReviewQueueItem[]
  >({
    queryKey: ["review-queue"],
    queryFn: () => apiClient.get("/review-queue").then((r) => r.data),
  });
  const pendingReview = reviewQueue.filter((r) => r.status === "pending");

  const activeRewards = rewards.filter((r) => r.isActive);

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
          Награды 🎁
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
          Управляйте наградами и запросами детей
        </p>
      </div>

      {/* Мои награды */}
      <Section
        title="Мои награды"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: "var(--purple)" }}
          >
            + Создать
          </button>
        }
      >
        {loadingRewards ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Загрузка...
          </p>
        ) : activeRewards.length === 0 ? (
          <EmptyState emoji="🎁" text="Наград пока нет. Создайте первую!" />
        ) : (
          <div className="space-y-3">
            {activeRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        )}
      </Section>

      {/* Запросы от детей */}
      <Section
        title={`Запросы от детей${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}`}
      >
        {loadingRequests ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Загрузка...
          </p>
        ) : pendingRequests.length === 0 ? (
          <EmptyState emoji="📭" text="Новых запросов нет" />
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </Section>

      {/* Очередь проверки */}
      <Section
        title={`Очередь проверки${pendingReview.length > 0 ? ` (${pendingReview.length})` : ""}`}
      >
        {loadingQueue ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Загрузка...
          </p>
        ) : pendingReview.length === 0 ? (
          <EmptyState emoji="✅" text="Нет сессий для проверки" />
        ) : (
          <div className="space-y-3">
            {pendingReview.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>

      {/* Create reward modal */}
      {showCreateModal && (
        <CreateRewardModal onClose={() => setShowCreateModal(false)} />
      )}
    </main>
  );
}

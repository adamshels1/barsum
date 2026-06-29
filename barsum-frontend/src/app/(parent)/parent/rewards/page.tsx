"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { rewardsApi } from "@/lib/api/rewards";
import type { Reward, RewardRequest } from "@/types";

interface ReviewQueueItem {
  id: string;
  sessionId: string;
  childId: string;
  child?: { name: string };
  session?: { day: number; transcription?: string; aiScore?: number };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  snack: { label: "Перекус", emoji: "🍎" },
  time: { label: "Время", emoji: "⏱️" },
  experience: { label: "Активность", emoji: "🎉" },
};

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 18,
};

function TypeBadge({ type }: { type: string }) {
  const t = TYPE_LABELS[type] ?? { label: type, emoji: "🎁" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 9999, background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {t.emoji} {t.label}
    </span>
  );
}

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
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 400, background: "rgba(20,10,60,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 900, color: "#ffffff" }}>Новая награда</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 6 }}>Название</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Час игры" className="glass-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 6 }}>Стоимость (монеты)</label>
            <input type="number" min={1} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="50" className="glass-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 6 }}>Тип</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "snack" | "time" | "experience")}
              className="glass-input"
              style={{ appearance: "none" }}
            >
              <option value="snack">🍎 Перекус</option>
              <option value="time">⏱️ Время</option>
              <option value="experience">🎉 Активность</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
            Отмена
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || !cost || mutation.isPending}
            className="btn-white"
            style={{ flex: 1, color: "#4776e6", opacity: !name.trim() || !cost ? 0.6 : 1 }}
          >
            {mutation.isPending ? "Создаём..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RewardCard({ reward }: { reward: Reward }) {
  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: () => rewardsApi.deactivate(reward.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success("Награда деактивирована");
    },
    onError: (err: any) => { toast.error(err?.response?.data?.message || "Ошибка"); },
  });

  return (
    <div style={{ ...GLASS, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
        {TYPE_LABELS[reward.type]?.emoji ?? "🎁"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reward.name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>🪙 {reward.cost}</span>
          <TypeBadge type={reward.type} />
        </div>
      </div>
      <button
        onClick={() => deactivateMutation.mutate()}
        disabled={deactivateMutation.isPending}
        style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", background: deactivateMutation.isPending ? "rgba(255,255,255,0.2)" : "rgba(239,68,68,0.4)", color: "#ffffff", flexShrink: 0, transition: "background 0.15s" }}
      >
        {deactivateMutation.isPending ? "..." : "Убрать"}
      </button>
    </div>
  );
}

function RequestCard({ request }: { request: RewardRequest }) {
  const queryClient = useQueryClient();

  const deliverMutation = useMutation({
    mutationFn: () => rewardsApi.deliver(request.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["reward-requests"] }); toast.success("Выдано!"); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Ошибка"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rewardsApi.reject(request.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["reward-requests"] }); toast.success("Отклонено"); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Ошибка"),
  });

  const childName = (request as any).child?.name ?? `Ребёнок ${request.childId.slice(-4)}`;
  const rewardName = (request as any).reward?.name ?? `Награда ${request.rewardId.slice(-4)}`;

  return (
    <div style={{ ...GLASS, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, color: "#ffffff" }}>{childName}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
            хочет: <span style={{ fontWeight: 700 }}>{rewardName}</span>
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>🪙 {request.coinsAmount}</p>
        </div>
        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 9999, fontWeight: 800, background: "rgba(255,255,255,0.2)", color: "#ffffff" }}>ожидает</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => deliverMutation.mutate()}
          disabled={deliverMutation.isPending || rejectMutation.isPending}
          style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.7)", color: "#ffffff" }}
        >
          {deliverMutation.isPending ? "..." : "✅ Выдал"}
        </button>
        <button
          onClick={() => rejectMutation.mutate()}
          disabled={deliverMutation.isPending || rejectMutation.isPending}
          style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(239,68,68,0.4)", color: "#ffffff" }}
        >
          {rejectMutation.isPending ? "..." : "❌ Отклонить"}
        </button>
      </div>
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewQueueItem }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => apiClient.post(`/review-queue/${item.id}/approve`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["review-queue"] }); toast.success("Засчитано!"); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Ошибка"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiClient.post(`/review-queue/${item.id}/reject`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["review-queue"] }); toast.success("Не засчитано"); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Ошибка"),
  });

  const childName = item.child?.name ?? `Ребёнок ${item.childId.slice(-4)}`;
  const session = item.session;

  return (
    <div style={{ ...GLASS, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, color: "#ffffff" }}>{childName}</p>
          {session && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
              День {session.day}
              {session.aiScore != null && (
                <span style={{ marginLeft: 8, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>AI: {session.aiScore}/10</span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, background: "rgba(255,255,255,0.2)", color: "#ffffff" }}
        >
          {expanded ? "Скрыть" : "Детали"}
        </button>
      </div>

      {expanded && session?.transcription && (
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Расшифровка</p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{session.transcription}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isPending || rejectMutation.isPending}
          style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.7)", color: "#ffffff" }}
        >
          {approveMutation.isPending ? "..." : "✅ Засчитать"}
        </button>
        <button
          onClick={() => rejectMutation.mutate()}
          disabled={approveMutation.isPending || rejectMutation.isPending}
          style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(239,68,68,0.4)", color: "#ffffff" }}
        >
          {rejectMutation.isPending ? "..." : "❌ Не засчитывать"}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 18, padding: "24px 16px", textAlign: "center" }}>
      <p style={{ fontSize: 28, margin: "0 0 8px" }}>{emoji}</p>
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{text}</p>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#ffffff" }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ParentRewardsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: rewards = [], isLoading: loadingRewards } = useQuery<Reward[]>({
    queryKey: ["rewards"],
    queryFn: rewardsApi.list,
  });

  const { data: allRequests = [], isLoading: loadingRequests } = useQuery<RewardRequest[]>({
    queryKey: ["reward-requests"],
    queryFn: rewardsApi.listRequests,
  });
  const pendingRequests = allRequests.filter((r) => r.status === "pending");

  const { data: reviewQueue = [], isLoading: loadingQueue } = useQuery<ReviewQueueItem[]>({
    queryKey: ["review-queue"],
    queryFn: () => apiClient.get("/review-queue").then((r) => r.data),
  });
  const pendingReview = reviewQueue.filter((r) => r.status === "pending");

  const activeRewards = rewards.filter((r) => r.isActive);

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 48px", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 900, color: "#ffffff" }}>Награды 🎁</h1>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>Управляйте наградами и запросами детей</p>
      </div>

      <Section
        title="Мои награды"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ fontSize: 13, fontWeight: 700, padding: "7px 14px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit", background: "rgba(255,255,255,0.9)", color: "#4776e6" }}
          >
            + Создать
          </button>
        }
      >
        {loadingRewards ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Загрузка...</p>
        ) : activeRewards.length === 0 ? (
          <EmptyState emoji="🎁" text="Наград пока нет. Создайте первую!" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeRewards.map((reward) => <RewardCard key={reward.id} reward={reward} />)}
          </div>
        )}
      </Section>

      <Section title={`Запросы от детей${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}`}>
        {loadingRequests ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Загрузка...</p>
        ) : pendingRequests.length === 0 ? (
          <EmptyState emoji="📭" text="Новых запросов нет" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingRequests.map((req) => <RequestCard key={req.id} request={req} />)}
          </div>
        )}
      </Section>

      <Section title={`Очередь проверки${pendingReview.length > 0 ? ` (${pendingReview.length})` : ""}`}>
        {loadingQueue ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Загрузка...</p>
        ) : pendingReview.length === 0 ? (
          <EmptyState emoji="✅" text="Нет сессий для проверки" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingReview.map((item) => <ReviewCard key={item.id} item={item} />)}
          </div>
        )}
      </Section>

      {showCreateModal && <CreateRewardModal onClose={() => setShowCreateModal(false)} />}
    </main>
  );
}

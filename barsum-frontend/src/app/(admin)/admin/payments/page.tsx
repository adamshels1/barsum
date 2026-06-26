"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api/admin";

type PaymentStatus = "pending" | "confirmed" | "rejected";

interface Payment {
  id: string;
  parentId: string;
  childId: string;
  challengeId: string;
  challengePrice: number;
  coinsAmount: number;
  coinsTg: number;
  total: number;
  receiptUrl?: string;
  status: PaymentStatus;
  adminNote?: string;
  createdAt: string;
}

const TABS: { key: PaymentStatus; label: string }[] = [
  { key: "pending", label: "Ожидают" },
  { key: "confirmed", label: "Подтверждены" },
  { key: "rejected", label: "Отклонены" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
        style={{ background: "var(--surface)", width: "60%" }}
      />
      <div
        className="h-4 rounded-xl mb-2"
        style={{ background: "var(--surface)", width: "40%" }}
      />
      <div
        className="h-4 rounded-xl"
        style={{ background: "var(--surface)", width: "50%" }}
      />
    </div>
  );
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PaymentStatus>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data, isLoading, isError } = useQuery<Payment[]>({
    queryKey: ["admin-payments", activeTab],
    queryFn: () => adminApi.payments(activeTab),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => adminApi.confirmPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      adminApi.rejectPayment(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      setRejectingId(null);
      setRejectNote("");
    },
  });

  const handleRejectStart = (id: string) => {
    setRejectingId(id);
    setRejectNote("");
  };

  const handleRejectCancel = () => {
    setRejectingId(null);
    setRejectNote("");
  };

  const handleRejectConfirm = (id: string) => {
    rejectMutation.mutate({ id, note: rejectNote });
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
          Подтверждение платежей
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
          <p className="text-4xl mb-3">💳</p>
          <p className="font-semibold" style={{ color: "var(--muted)" }}>
            Нет платежей
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((payment) => (
            <div
              key={payment.id}
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
                    Родитель
                  </p>
                  <p
                    className="text-sm font-mono font-semibold truncate max-w-[160px]"
                    style={{ color: "var(--ink)" }}
                  >
                    {payment.parentId}
                  </p>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background:
                      payment.status === "confirmed"
                        ? "#dcfce7"
                        : payment.status === "rejected"
                          ? "#fee2e2"
                          : "#fef3c7",
                    color:
                      payment.status === "confirmed"
                        ? "#16a34a"
                        : payment.status === "rejected"
                          ? "#dc2626"
                          : "#d97706",
                  }}
                >
                  {payment.status === "confirmed"
                    ? "Подтверждён"
                    : payment.status === "rejected"
                      ? "Отклонён"
                      : "Ожидает"}
                </span>
              </div>

              <div className="mb-3">
                <p
                  className="text-xs font-medium mb-0.5"
                  style={{ color: "var(--muted)" }}
                >
                  Ребёнок
                </p>
                <p
                  className="text-sm font-mono font-semibold truncate max-w-[220px]"
                  style={{ color: "var(--ink)" }}
                >
                  {payment.childId}
                </p>
              </div>

              {/* Amount row */}
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Сумма
                  </p>
                  <p
                    className="text-lg font-extrabold"
                    style={{ color: "var(--purple)" }}
                  >
                    {payment.total} ₸
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Монеты
                  </p>
                  <p
                    className="text-lg font-extrabold"
                    style={{ color: "var(--green)" }}
                  >
                    {payment.coinsAmount} 🪙
                  </p>
                </div>
              </div>

              {/* Date */}
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
                {formatDate(payment.createdAt)}
              </p>

              {/* Admin note */}
              {payment.adminNote && (
                <p
                  className="text-xs rounded-xl px-3 py-2 mb-3"
                  style={{
                    background: "var(--surface)",
                    color: "var(--muted)",
                  }}
                >
                  Примечание: {payment.adminNote}
                </p>
              )}

              {/* Receipt */}
              {payment.receiptUrl && (
                <a
                  href={payment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mb-3"
                >
                  <img
                    src={payment.receiptUrl}
                    alt="Квитанция"
                    className="w-20 h-20 rounded-2xl object-cover border-2"
                    style={{ borderColor: "var(--surface)" }}
                  />
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--purple)" }}
                  >
                    Открыть квитанцию ↗
                  </p>
                </a>
              )}

              {/* Actions for pending */}
              {payment.status === "pending" && rejectingId !== payment.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmMutation.mutate(payment.id)}
                    disabled={confirmMutation.isPending}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ background: "var(--green)" }}
                  >
                    Подтвердить
                  </button>
                  <button
                    onClick={() => handleRejectStart(payment.id)}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-80"
                    style={{ background: "#ef4444" }}
                  >
                    Отклонить
                  </button>
                </div>
              )}

              {/* Reject inline form */}
              {payment.status === "pending" && rejectingId === payment.id && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Причина отклонения (необязательно)"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none border-2"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--surface)",
                      color: "var(--ink)",
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectConfirm(payment.id)}
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
          ))}
        </div>
      )}
    </main>
  );
}

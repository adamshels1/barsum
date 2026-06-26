"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminDashboardPage() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminApi.stats,
  });

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const statCards = [
    { label: "Пользователи", value: stats?.totalUsers, icon: "👥" },
    { label: "Дети", value: stats?.totalChildren, icon: "👶" },
    { label: "Платежи", value: stats?.totalPayments, icon: "💳" },
    {
      label: "Выручка",
      value: stats?.totalRevenueTg != null ? `${stats.totalRevenueTg} ₸` : "—",
      icon: "💰",
    },
    {
      label: "Ожид. платежи",
      value: stats?.pendingPayments,
      icon: "⏳",
      urgent: stats?.pendingPayments > 0,
    },
    {
      label: "Ожид. эксперты",
      value: stats?.pendingExperts,
      icon: "🔎",
      urgent: stats?.pendingExperts > 0,
    },
    {
      label: "Ожид. задания",
      value: stats?.pendingChallenges,
      icon: "📚",
      urgent: stats?.pendingChallenges > 0,
    },
  ];

  const navCards = [
    {
      label: "💳 Платежи",
      href: "/admin/payments",
      badge: stats?.pendingPayments,
    },
    {
      label: "🔎 Эксперты",
      href: "/admin/experts",
      badge: stats?.pendingExperts,
    },
    {
      label: "📚 Задания",
      href: "/admin/challenges",
      badge: stats?.pendingChallenges,
    },
  ];

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-extrabold"
            style={{ color: "var(--ink)" }}
          >
            Панель администратора
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Barsum Admin
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-2 rounded-xl"
          style={{ color: "var(--muted)", background: "var(--surface)" }}
        >
          Выйти
        </button>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 h-20 animate-pulse"
              style={{ background: "var(--surface)" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl p-4"
              style={{
                background: card.urgent ? "var(--purple)" : "var(--surface)",
                color: card.urgent ? "#fff" : "inherit",
              }}
            >
              <p className="text-2xl mb-1">{card.icon}</p>
              <p
                className="text-xl font-extrabold"
                style={{ color: card.urgent ? "#fff" : "var(--ink)" }}
              >
                {card.value ?? "—"}
              </p>
              <p
                className="text-xs"
                style={{
                  color: card.urgent ? "rgba(255,255,255,0.8)" : "var(--muted)",
                }}
              >
                {card.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Navigation cards */}
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink)" }}>
        Разделы
      </h2>
      <div className="space-y-3">
        {navCards.map((card) => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            className="w-full rounded-2xl p-4 flex items-center justify-between"
            style={{ background: "var(--surface)" }}
          >
            <span
              className="font-semibold text-base"
              style={{ color: "var(--ink)" }}
            >
              {card.label}
            </span>
            <div className="flex items-center gap-2">
              {card.badge > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: "var(--purple)" }}
                >
                  {card.badge}
                </span>
              )}
              <span style={{ color: "var(--muted)" }}>›</span>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}

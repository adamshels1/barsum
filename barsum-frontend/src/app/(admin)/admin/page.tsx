"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, CreditCard, LogOut, Search, Trophy, Users, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import { useAuthStore } from "@/stores/auth-store";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    panel: "Панель",
    logout: "Выйти",
    users: "Пользователи",
    children: "Дети",
    payments: "Платежи",
    revenue: "Выручка",
    pendingPayments: "Ожид. платежи",
    pendingExperts: "Ожид. эксперты",
    pendingChallenges: "Ожид. задания",
    go: "ПЕРЕЙТИ →",
    sections: "Разделы",
    readersRating: "Рейтинг читателей",
    experts: "Эксперты",
    challenges: "Задания",
  },
  kk: {
    panel: "Панель",
    logout: "Шығу",
    users: "Пайдаланушылар",
    children: "Балалар",
    payments: "Төлемдер",
    revenue: "Түсім",
    pendingPayments: "Күтудегі төлемдер",
    pendingExperts: "Күтудегі сарапшылар",
    pendingChallenges: "Күтудегі тапсырмалар",
    go: "ӨТУ →",
    sections: "Бөлімдер",
    readersRating: "Оқырмандар рейтингі",
    experts: "Сарапшылар",
    challenges: "Тапсырмалар",
  },
};

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 20,
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const t = useT(dict);
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
    { label: t("users"), value: stats?.totalUsers, Icon: Users },
    { label: t("children"), value: stats?.totalChildren, Icon: Users2 },
    { label: t("payments"), value: stats?.totalPayments, Icon: CreditCard },
    {
      label: t("revenue"),
      value: stats?.totalRevenueTg != null ? `${stats.totalRevenueTg} ₸` : "—",
      Icon: CreditCard,
    },
    {
      label: t("pendingPayments"),
      value: stats?.pendingPayments,
      Icon: CreditCard,
      urgent: stats?.pendingPayments > 0,
      href: "/admin/payments",
    },
    {
      label: t("pendingExperts"),
      value: stats?.pendingExperts,
      Icon: Search,
      urgent: stats?.pendingExperts > 0,
      href: "/admin/experts",
    },
    {
      label: t("pendingChallenges"),
      value: stats?.pendingChallenges,
      Icon: BookOpen,
      urgent: stats?.pendingChallenges > 0,
      href: "/admin/challenges",
    },
  ];

  const navCards = [
    { label: t("readersRating"), Icon: Trophy, href: "/admin/readers", badge: undefined },
    { label: t("payments"), Icon: CreditCard, href: "/admin/payments", badge: stats?.pendingPayments },
    { label: t("experts"), Icon: Search, href: "/admin/experts", badge: stats?.pendingExperts },
    { label: t("challenges"), Icon: BookOpen, href: "/admin/challenges", badge: stats?.pendingChallenges },
  ];

  return (
    <main style={{ minHeight: "100dvh", padding: "0 0 32px" }}>
      {/* Header */}
      <div
        className="glass-header"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 20px 20px" }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Barsum Admin
          </p>
          <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 900, color: "#ffffff" }}>
            {t("panel")}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LanguageSwitcher />
          <button
            onClick={handleLogout}
            className="glass-chip"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 13 }}
          >
            <LogOut size={14} strokeWidth={2.5} />
            {t("logout")}
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {/* Stats grid */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ ...GLASS, height: 80, animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {statCards.map((card) => {
              const Tag = card.href ? "button" : "div";
              return (
                <Tag
                  key={card.label}
                  onClick={card.href ? () => router.push(card.href!) : undefined}
                  style={{
                    ...GLASS,
                    padding: "14px 14px",
                    background: card.urgent ? "rgba(255,80,80,0.25)" : GLASS.background,
                    ...(card.href ? { cursor: "pointer", fontFamily: "inherit", border: "1px solid rgba(255,255,255,0.2)", textAlign: "left" } : {}),
                  }}
                >
                  <card.Icon size={18} color="rgba(255,255,255,0.8)" style={{ display: "block", marginBottom: 6 }} />
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff" }}>
                    {card.value ?? "—"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                    {card.label}
                  </p>
                  {card.urgent && card.href && (
                    <p style={{ margin: "4px 0 0", fontSize: 10, fontWeight: 700, color: "rgba(255,160,160,0.9)", letterSpacing: "0.04em" }}>
                      {t("go")}
                    </p>
                  )}
                </Tag>
              );
            })}
          </div>
        )}

        {/* Navigation cards */}
        <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {t("sections")}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {navCards.map((card) => (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              style={{
                ...GLASS,
                width: "100%",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <card.Icon size={18} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
                <span style={{ fontWeight: 700, fontSize: 15, color: "#ffffff" }}>{card.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {card.badge > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 900, padding: "3px 10px", borderRadius: 9999, background: "rgba(255,100,100,0.4)", color: "#ffffff" }}>
                    {card.badge}
                  </span>
                )}
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 20 }}>›</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

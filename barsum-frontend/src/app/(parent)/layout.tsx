"use client";

import { BookOpen, Gift, Home } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { rewardsApi } from "@/lib/api/rewards";
import type { RewardRequest } from "@/types";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    catalog: "Каталог",
    rewards: "Награды",
    cabinet: "Кабинет",
  },
  kk: {
    catalog: "Каталог",
    rewards: "Сыйлықтар",
    cabinet: "Кабинет",
  },
};

const BG = "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)";

const tabs = [
  { key: "cabinet", Icon: Home, href: "/parent/cabinet", match: (p: string) => p.startsWith("/parent/cabinet") || p.startsWith("/parent/child") },
  { key: "catalog", Icon: BookOpen, href: "/parent/home", match: (p: string) => p === "/parent/home" },
  { key: "rewards", Icon: Gift, href: "/parent/rewards", match: (p: string) => p.startsWith("/parent/rewards") },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const t = useT(dict);

  // Онбординг — отдельный флоу без нижнего меню
  const hideNav = pathname.startsWith("/parent/onboarding");

  // Живой счётчик запросов детей — питает бейдж и почти-реалтайм появление (задача 9)
  const { data: requests = [] } = useQuery<RewardRequest[]>({
    queryKey: ["reward-requests"],
    queryFn: rewardsApi.listRequests,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    enabled: !hideNav,
  });
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div style={{ minHeight: "100dvh", background: BG, position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, background: BG, zIndex: 0 }} />
      <div style={{ position: "fixed", top: "-15%", right: "-8%", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.12)", filter: "blur(70px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-8%", width: 200, height: 200, borderRadius: "50%", background: "rgba(0,0,0,0.15)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, paddingBottom: hideNav ? 0 : 92 }}>{children}</div>

      {!hideNav && (
        <div
          className="glass-nav"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "12px 8px",
            paddingBottom: `max(16px, env(safe-area-inset-bottom))`,
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.match(pathname);
            const { Icon } = tab;
            const showBadge = tab.href === "/parent/rewards" && pendingCount > 0;
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 72, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                aria-label={t(tab.key)}
              >
                <div style={{ position: "relative", width: 56, height: 32, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? "rgba(255,255,255,0.22)" : "transparent", transition: "all 0.15s" }}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "#ffffff" : "rgba(255,255,255,0.5)"} />
                  {showBadge && (
                    <span style={{ position: "absolute", top: -2, right: 6, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9999, background: "#ef4444", color: "#ffffff", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px rgba(70,60,150,0.6)" }}>
                      {pendingCount}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: isActive ? 800 : 600, color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)", transition: "all 0.15s" }}>
                  {t(tab.key)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

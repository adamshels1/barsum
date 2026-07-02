"use client";

import { BookOpen, ShoppingBag } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import { coinsApi } from "@/lib/api/coins";
import { CoinIcon } from "@/components/CoinIcon";

const BG = "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)";

const tabs = [
  { label: "Задания", Icon: BookOpen, href: "/child/home", match: "/child/home" },
  { label: "Магазин", Icon: ShoppingBag, href: "/child/shop", match: "/child/shop" },
];

function ChildLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSession = pathname?.includes("/child/session");

  const { data: balanceData } = useQuery({
    queryKey: ["child-balance", user?.id],
    queryFn: () => coinsApi.childBalance(user?.id),
    enabled: !!user?.id,
  });

  const balance: number = balanceData?.balance ?? 0;

  const activeTab =
    pathname === "/child/home" ? 0 : pathname?.startsWith("/child/shop") ? 1 : -1;

  return (
    <div style={{ minHeight: "100dvh", background: BG, position: "relative" }}>
      {/* Fixed bg layer for mobile */}
      <div style={{ position: "fixed", inset: 0, background: BG, zIndex: 0 }} />

      {/* Blobs */}
      <div style={{ position: "fixed", top: "-10%", right: "-5%", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.15)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "15%", left: "-8%", width: 160, height: 160, borderRadius: "50%", background: "rgba(0,0,0,0.1)", filter: "blur(50px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      {!isSession && (
        <div
          className="glass-header"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            background: "rgba(0,0,0,0.55)",
          }}
        >
          <p style={{ fontWeight: 900, fontSize: 16, color: "#ffffff", margin: 0 }}>
            {user?.name?.split(" ")[0] || "Читатель"} 👋
          </p>
          <div className="glass-chip" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px" }}>
            <CoinIcon size={16} />
            <span style={{ fontWeight: 900, fontSize: 14, color: "#ffffff" }}>{balance.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, paddingBottom: isSession ? 0 : 96 }}>
        {children}
      </div>

      {/* Bottom nav */}
      {!isSession && (
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
          {tabs.map((tab, i) => {
            const isActive = i === activeTab;
            const { Icon } = tab;

            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  minWidth: 72,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
                aria-label={tab.label}
              >
                <div
                  style={{
                    width: 56,
                    height: 32,
                    borderRadius: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive ? "rgba(255,255,255,0.22)" : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "#ffffff" : "rgba(255,255,255,0.5)"} />
                </div>
                <span style={{ fontSize: 11, fontWeight: isActive ? 800 : 600, color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)", transition: "all 0.15s" }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)" }} />}>
      <ChildLayoutInner>{children}</ChildLayoutInner>
    </Suspense>
  );
}

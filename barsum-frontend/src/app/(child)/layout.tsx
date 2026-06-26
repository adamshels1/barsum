"use client";

import { BookOpen, Flame, ShoppingBag, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";

const tabs = [
  { label: "Задания", Icon: BookOpen, href: "/child/home", match: "/child/home" },
  { label: "Магазин", Icon: ShoppingBag, href: "/child/shop", match: "/child/shop" },
  { label: "Мечта", Icon: Sparkles, href: "/child/shop?tab=dream", match: "", badge: false },
];

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSession = pathname?.includes("/child/session");

  const { data: balanceData } = useQuery({
    queryKey: ["child-balance", user?.id],
    queryFn: () => coinsApi.childBalance(user?.id),
    enabled: !!user?.id,
  });

  const { data: dream } = useQuery({
    queryKey: ["dream-my"],
    queryFn: dreamsApi.my,
    enabled: !isSession,
  });

  const balance: number = balanceData?.balance ?? 0;
  const streak: number = (user as any)?.streak ?? 0;
  const hasDreamBadge = dream?.status === "pending_approval";

  const activeTab =
    pathname === "/child/home" ? 0 : pathname?.startsWith("/child/shop") ? 1 : -1;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {!isSession && (
        <div
          className="sticky top-0 z-40 flex items-center justify-between px-5 py-3"
          style={{
            background: "rgba(255,248,240,0.96)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <p className="font-black text-base" style={{ color: "var(--ink)" }}>
            {user?.name?.split(" ")[0] || "Читатель"} 👋
          </p>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "#FFF7ED",
                border: "1.5px solid #FDEBD0",
              }}
            >
              <Flame size={14} color="#EA580C" strokeWidth={2.5} />
              <span className="font-black text-sm" style={{ color: "#EA580C" }}>
                {streak}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "var(--purple-light)",
                border: "1.5px solid #ddd6ff",
              }}
            >
              <span className="text-sm leading-none">🪙</span>
              <span className="font-black text-sm" style={{ color: "var(--purple)" }}>
                {balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={!isSession ? "pb-24" : ""}>{children}</div>

      {!isSession && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 pt-3"
          style={{
            background: "#fff",
            boxShadow: "0 -2px 20px rgba(0,0,0,0.08)",
            borderTop: "1.5px solid var(--line)",
            paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          }}
        >
          {tabs.map((tab, i) => {
            const isActive = i === activeTab;
            const { Icon } = tab;
            const showBadge = i === 2 && hasDreamBadge;

            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className="flex flex-col items-center gap-1 relative min-w-[72px] transition-transform active:scale-90"
                aria-label={tab.label}
              >
                <div
                  className="flex items-center justify-center w-14 h-8 rounded-full transition-all duration-200"
                  style={{
                    background: isActive ? "var(--purple-light)" : "transparent",
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    color={isActive ? "var(--purple)" : "var(--muted)"}
                  />
                </div>
                <span
                  className="text-xs font-bold transition-colors"
                  style={{ color: isActive ? "var(--purple)" : "var(--muted)" }}
                >
                  {tab.label}
                </span>
                {showBadge && (
                  <span
                    className="absolute top-0 right-3 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: "var(--orange)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

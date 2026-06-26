"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";

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

  const tabs = [
    { label: "Задания", icon: "📚", href: "/child/home" },
    { label: "Магазин", icon: "🛍️", href: "/child/shop" },
    { label: "Мечта", icon: "💫", href: "/child/shop?tab=dream", badge: hasDreamBadge },
  ];

  const activeTab =
    pathname === "/child/home" ? 0 : pathname?.startsWith("/child/shop") ? 1 : -1;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {!isSession && (
        <div
          className="sticky top-0 z-40 flex items-center justify-between px-5 py-3"
          style={{ background: "var(--background)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="font-extrabold text-base" style={{ color: "var(--ink)" }}>
            {user?.name || "Читатель"} 👋
          </p>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "#FFF7ED" }}
            >
              <span>🔥</span>
              <span className="font-extrabold text-sm" style={{ color: "#EA580C" }}>
                {streak}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "var(--lav)" }}
            >
              <span>🪙</span>
              <span className="font-extrabold text-sm" style={{ color: "var(--purple)" }}>
                {balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={!isSession ? "pb-24" : ""}>{children}</div>

      {!isSession && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-4 pt-2 pb-5"
          style={{
            background: "#fff",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {tabs.map((tab, i) => {
            const isActive = i === activeTab;
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className="flex flex-col items-center gap-1 relative min-w-[60px]"
              >
                <span className="text-2xl leading-none">{tab.icon}</span>
                <span
                  className="text-xs font-bold"
                  style={{ color: isActive ? "var(--purple)" : "var(--muted)" }}
                >
                  {tab.label}
                </span>
                {tab.badge && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: "#F97316" }}
                  />
                )}
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "var(--purple)" }}
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

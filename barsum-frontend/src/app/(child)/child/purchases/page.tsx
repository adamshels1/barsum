"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { rewardsApi } from "@/lib/api/rewards";
import { CoinIcon } from "@/components/CoinIcon";
import { rewardPhotoUrl } from "@/lib/media";

interface RewardRequest {
  id: string;
  coinsAmount: number;
  status: "pending" | "delivered" | "rejected";
  createdAt: string;
  reward?: { id: string; name: string; type: string; photoUrl?: string | null };
}

const TYPE_EMOJI: Record<string, string> = {
  snack: "🍕",
  time: "⏰",
  experience: "🎉",
};

const STATUS_LABEL: Record<RewardRequest["status"], string> = {
  pending: "Ждёт родителя",
  delivered: "Получено",
  rejected: "Отклонено",
};

const STATUS_COLOR: Record<RewardRequest["status"], string> = {
  pending: "rgba(255,200,0,0.25)",
  delivered: "rgba(34,197,94,0.3)",
  rejected: "rgba(239,68,68,0.35)",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ChildPurchasesPage() {
  const router = useRouter();

  const { data: requests = [], isLoading } = useQuery<RewardRequest[]>({
    queryKey: ["reward-requests-my"],
    queryFn: rewardsApi.listMyRequests,
  });

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 40px", maxWidth: 512, margin: "0 auto" }}>
      {/* Back */}
      <button
        onClick={() => router.push("/child/home")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 700, fontFamily: "inherit", marginBottom: 20, padding: 0 }}
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
        Назад
      </button>

      <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 900, color: "#ffffff" }}>История покупок</h1>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass" style={{ height: 68, borderRadius: 16, animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="glass" style={{ padding: 40, textAlign: "center" }}>
          <ShoppingBag size={32} color="rgba(255,255,255,0.5)" strokeWidth={1.5} style={{ margin: "0 auto 12px" }} />
          <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#ffffff" }}>Покупок пока нет</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Здесь появятся награды, которые ты возьмёшь в магазине</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((req) => (
            <div key={req.id} className="glass" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                {req.reward?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={rewardPhotoUrl(req.reward)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  TYPE_EMOJI[req.reward?.type ?? ""] ?? "🎁"
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {req.reward?.name || "Награда"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>
                  {formatDate(req.createdAt)}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 900, color: "#ffffff", fontSize: 14 }}>
                  −{req.coinsAmount.toLocaleString()} <CoinIcon size={13} />
                </p>
                <span style={{ display: "inline-block", marginTop: 4, fontSize: 10.5, padding: "3px 8px", borderRadius: 9999, fontWeight: 800, background: STATUS_COLOR[req.status], color: "#ffffff" }}>
                  {STATUS_LABEL[req.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

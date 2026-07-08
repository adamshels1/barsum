"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rewardsApi } from "@/lib/api/rewards";
import type { RewardRequest } from "@/types";
import { CoinIcon } from "@/components/CoinIcon";
import { rewardPhotoUrl } from "@/lib/media";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    justNow: "только что",
    minAgo: "{n} мин назад",
    hrsAgo: "{n} ч назад",
    rewardGiven: "Награда выдана! 🎉",
    error: "Ошибка",
    requestRejected: "Запрос отклонён, монеты возвращены",
    childFallback: "Ребёнок {id}",
    rewardFallback: "Награда {id}",
    wants: "хочет:",
    pending: "ожидает",
    confirm: "✅ Подтвердить",
    reject: "❌ Отклонить",
  },
  kk: {
    justNow: "жаңа ғана",
    minAgo: "{n} мин бұрын",
    hrsAgo: "{n} сағ бұрын",
    rewardGiven: "Сыйлық берілді! 🎉",
    error: "Қате",
    requestRejected: "Сұраныс қабылданбады, монеталар қайтарылды",
    childFallback: "Бала {id}",
    rewardFallback: "Сыйлық {id}",
    wants: "қалайды:",
    pending: "күтуде",
    confirm: "✅ Растау",
    reject: "❌ Қабылдамау",
  },
};

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 18,
};

/** Карточка запроса награды от ребёнка с кнопками «Подтвердить» / «Отклонить». */
export function RewardRequestCard({ request, highlight }: { request: RewardRequest; highlight?: boolean }) {
  const queryClient = useQueryClient();
  const t = useT(dict);

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return t("justNow");
    if (min < 60) return t("minAgo", { n: min });
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return t("hrsAgo", { n: hrs });
    return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reward-requests"] });
    queryClient.invalidateQueries({ queryKey: ["parent-pending-requests"] });
  };

  const deliverMutation = useMutation({
    mutationFn: () => rewardsApi.deliver(request.id),
    onSuccess: () => { invalidate(); toast.success(t("rewardGiven")); },
    onError: (err: any) => toast.error(err?.response?.data?.message || t("error")),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rewardsApi.reject(request.id),
    onSuccess: () => { invalidate(); toast.success(t("requestRejected")); },
    onError: (err: any) => toast.error(err?.response?.data?.message || t("error")),
  });

  const busy = deliverMutation.isPending || rejectMutation.isPending;
  const childName = request.child?.name ?? t("childFallback", { id: request.childId.slice(-4) });
  const rewardName = request.reward?.name ?? t("rewardFallback", { id: request.rewardId.slice(-4) });
  const photoUrl = rewardPhotoUrl(request.reward);

  return (
    <div style={{ ...GLASS, padding: "14px 16px", background: highlight ? "rgba(255,255,255,0.22)" : GLASS.background }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, overflow: "hidden" }}>
          {photoUrl ? <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎁"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", fontSize: 15 }}>{childName}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            {t("wants")} <span style={{ fontWeight: 700, color: "#ffffff" }}>{rewardName}</span>
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
            <CoinIcon size={13} /> {request.coinsAmount} · <span style={{ fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>{timeAgo(request.createdAt)}</span>
          </p>
        </div>
        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 9999, fontWeight: 800, background: "rgba(255,200,0,0.3)", color: "#ffffff", flexShrink: 0 }}>{t("pending")}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => deliverMutation.mutate()}
          disabled={busy}
          style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: busy ? "default" : "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 13.5, background: "rgba(34,197,94,0.85)", color: "#ffffff", opacity: busy ? 0.6 : 1 }}
        >
          {deliverMutation.isPending ? "..." : t("confirm")}
        </button>
        <button
          onClick={() => rejectMutation.mutate()}
          disabled={busy}
          style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: busy ? "default" : "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 13.5, background: "rgba(239,68,68,0.5)", color: "#ffffff", opacity: busy ? 0.6 : 1 }}
        >
          {rejectMutation.isPending ? "..." : t("reject")}
        </button>
      </div>
    </div>
  );
}

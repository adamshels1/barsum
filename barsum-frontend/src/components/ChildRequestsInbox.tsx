"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { rewardsApi } from "@/lib/api/rewards";
import { dreamsApi } from "@/lib/api/dreams";
import { RewardRequestCard } from "@/components/RewardRequestCard";
import { CoinIcon } from "@/components/CoinIcon";
import { dreamPhotoUrl } from "@/lib/media";
import type { RewardRequest } from "@/types";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    title: "Запросы от детей",
    rewardRequests: "🎁 Награды",
    cancel: "Отмена",
    error: "Ошибка",
    dreamApproved: "Мечта одобрена!",
    dreamRejected: "Мечта отклонена",
    dreamsToApprove: "💫 Мечты на одобрение",
    dreamsToFulfill: "🎉 Собранные мечты",
    collectedBadge: "Собрана",
    fulfillBtn: "Исполнено ✓",
    dreamFulfilled: "Мечта отмечена исполненной!",
    childPrefix: "Ребёнок: {name}",
    waitingApproval: "Ждёт одобрения",
    setCoinPrice: "Установите стоимость в монетах:",
    coinsPlaceholder: "Например: 1000",
    approveBtn: "✅ Одобрить",
    rejectReasonLabel: "Причина отказа:",
    ownReasonPlaceholder: "Или своя причина...",
    rejectBtn: "❌ Отклонить",
    reason1: "Слишком дорого",
    reason2: "Подумай ещё раз",
    reason3: "Сначала нужно заслужить",
    reason4: "Выбери что-то другое",
  },
  kk: {
    title: "Балалардың сұраныстары",
    rewardRequests: "🎁 Сыйлықтар",
    cancel: "Бас тарту",
    error: "Қате",
    dreamApproved: "Арман мақұлданды!",
    dreamRejected: "Арман қабылданбады",
    dreamsToApprove: "💫 Мақұлдауға арналған армандар",
    dreamsToFulfill: "🎉 Жиналған армандар",
    collectedBadge: "Жиналды",
    fulfillBtn: "Орындалды ✓",
    dreamFulfilled: "Арман орындалды деп белгіленді!",
    childPrefix: "Бала: {name}",
    waitingApproval: "Мақұлдауды күтуде",
    setCoinPrice: "Монетамен құнын белгілеңіз:",
    coinsPlaceholder: "Мысалы: 1000",
    approveBtn: "✅ Мақұлдау",
    rejectReasonLabel: "Бас тарту себебі:",
    ownReasonPlaceholder: "Немесе өз себебіңіз...",
    rejectBtn: "❌ Қабылдамау",
    reason1: "Тым қымбат",
    reason2: "Тағы бір ойлан",
    reason3: "Алдымен еңбекпен табу керек",
    reason4: "Басқа нәрсе таңда",
  },
};

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 20,
};

/**
 * Единый блок запросов от детей для главной страницы родителя:
 * запросы наград + мечты на одобрение + собранные мечты (исполнить).
 * queryKeys общие с остальными экранами, поэтому кэш и действия синхронны.
 */
export function ChildRequestsInbox() {
  const t = useT(dict);
  const queryClient = useQueryClient();

  const REJECT_REASONS = [t("reason1"), t("reason2"), t("reason3"), t("reason4")];
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [targetCoins, setTargetCoins] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const { data: requests = [] } = useQuery<RewardRequest[]>({
    queryKey: ["reward-requests"],
    queryFn: rewardsApi.listRequests,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const { data: pendingDreams = [] } = useQuery<any[]>({
    queryKey: ["dreams-pending"],
    queryFn: dreamsApi.parentPending,
    refetchInterval: 15000,
  });

  const { data: completedDreams = [] } = useQuery<any[]>({
    queryKey: ["dreams-completed"],
    queryFn: dreamsApi.parentCompleted,
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, coins }: { id: string; coins: number }) => dreamsApi.approve(id, coins),
    onSuccess: () => { toast.success(t("dreamApproved")); setApprovingId(null); setTargetCoins(""); queryClient.invalidateQueries({ queryKey: ["dreams-pending"] }); },
    onError: () => toast.error(t("error")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => dreamsApi.reject(id, reason),
    onSuccess: () => { toast.success(t("dreamRejected")); setRejectingId(null); setRejectReason(""); setCustomReason(""); queryClient.invalidateQueries({ queryKey: ["dreams-pending"] }); },
    onError: () => toast.error(t("error")),
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: string) => dreamsApi.fulfill(id),
    onSuccess: () => { toast.success(t("dreamFulfilled")); queryClient.invalidateQueries({ queryKey: ["dreams-completed"] }); },
    onError: () => toast.error(t("error")),
  });

  const total = pendingRequests.length + pendingDreams.length + completedDreams.length;
  if (total === 0) return null;

  return (
    <div style={{ padding: "16px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#ffffff" }}>{t("title")}</h2>
        <span style={{ fontSize: 12, fontWeight: 900, padding: "2px 9px", borderRadius: 9999, background: "#ef4444", color: "#ffffff" }}>{total}</span>
      </div>

      {/* Запросы наград */}
      {pendingRequests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: pendingDreams.length || completedDreams.length ? 16 : 0 }}>
          {pendingRequests.map((req) => (
            <RewardRequestCard key={req.id} request={req} highlight />
          ))}
        </div>
      )}

      {/* Мечты на одобрение */}
      {pendingDreams.length > 0 && (
        <div style={{ marginBottom: completedDreams.length ? 16 : 0 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.75)" }}>{t("dreamsToApprove")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingDreams.map((dream: any) => (
              <div key={dream.id} style={{ ...GLASS, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  {dream.photoUrl ? (
                    <img src={dreamPhotoUrl(dream)} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>💫</div>
                  )}
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, color: "#ffffff" }}>{dream.name}</p>
                    <p style={{ margin: "2px 0 4px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{t("childPrefix", { name: dream.child?.name ?? "" })}</p>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 9999, fontWeight: 800, background: "rgba(255,255,255,0.2)", color: "#ffffff" }}>{t("waitingApproval")}</span>
                  </div>
                </div>

                {approvingId === dream.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{t("setCoinPrice")}</p>
                    <input type="number" min={1} value={targetCoins} onChange={(e) => setTargetCoins(e.target.value)} placeholder={t("coinsPlaceholder")} className="glass-input" />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setApprovingId(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>{t("cancel")}</button>
                      <button onClick={() => approveMutation.mutate({ id: dream.id, coins: Number(targetCoins) })} disabled={!targetCoins || Number(targetCoins) < 1 || approveMutation.isPending} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.7)", color: "#ffffff", opacity: !targetCoins || Number(targetCoins) < 1 ? 0.5 : 1 }}>
                        {approveMutation.isPending ? "..." : t("approveBtn")}
                      </button>
                    </div>
                  </div>
                ) : rejectingId === dream.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{t("rejectReasonLabel")}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {REJECT_REASONS.map((r) => (
                        <button key={r} onClick={() => setRejectReason(r)} style={{ padding: "6px 10px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: rejectReason === r ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.15)", color: "#ffffff" }}>
                          {r}
                        </button>
                      ))}
                    </div>
                    <input type="text" value={customReason} onChange={(e) => { setCustomReason(e.target.value); setRejectReason(""); }} placeholder={t("ownReasonPlaceholder")} className="glass-input" />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setRejectingId(null); setRejectReason(""); setCustomReason(""); }} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>{t("cancel")}</button>
                      <button onClick={() => rejectMutation.mutate({ id: dream.id, reason: customReason || rejectReason })} disabled={(!rejectReason && !customReason) || rejectMutation.isPending} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(239,68,68,0.7)", color: "#ffffff", opacity: !rejectReason && !customReason ? 0.5 : 1 }}>
                        {rejectMutation.isPending ? "..." : t("rejectBtn")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setApprovingId(dream.id)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.7)", color: "#ffffff" }}>{t("approveBtn")}</button>
                    <button onClick={() => setRejectingId(dream.id)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(239,68,68,0.5)", color: "#ffffff" }}>{t("rejectBtn")}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Собранные мечты — исполнить */}
      {completedDreams.length > 0 && (
        <div>
          <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.75)" }}>{t("dreamsToFulfill")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {completedDreams.map((dream: any) => (
              <div key={dream.id} style={{ ...GLASS, padding: "14px 16px", border: "1px solid rgba(0,220,120,0.4)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  {dream.photoUrl ? (
                    <img src={dreamPhotoUrl(dream)} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🎉</div>
                  )}
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, color: "#ffffff" }}>{dream.name}</p>
                    <p style={{ margin: "2px 0 4px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{t("childPrefix", { name: dream.child?.name ?? "" })}</p>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 9999, fontWeight: 800, background: "rgba(0,220,120,0.3)", color: "#aaffcc" }}>
                      {t("collectedBadge")} · <CoinIcon size={11} /> {dream.savedCoins?.toLocaleString?.() ?? dream.savedCoins}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => fulfillMutation.mutate(dream.id)}
                  disabled={fulfillMutation.isPending}
                  style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.75)", color: "#ffffff", opacity: fulfillMutation.isPending ? 0.6 : 1 }}
                >
                  {fulfillMutation.isPending ? "..." : t("fulfillBtn")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

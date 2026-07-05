"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { challengesApi } from "@/lib/api/challenges";
import { childrenApi } from "@/lib/api/children";
import { paymentsApi } from "@/lib/api/payments";
import { rewardsApi } from "@/lib/api/rewards";
import type { Challenge, Child, Payment, RewardRequest } from "@/types/index";
import { CoinIcon } from "@/components/CoinIcon";
import { RewardRequestCard } from "@/components/RewardRequestCard";

const COIN_MAX = 50_000;
const COIN_STEP = 1_000;
const COMMISSION = 0.15;

const AGE_FILTERS = [
  { label: "Все", value: "", min: 0, max: 99 },
  { label: "6–8", value: "6-8", min: 6, max: 8 },
  { label: "9–11", value: "9-11", min: 9, max: 11 },
  { label: "12–14", value: "12-14", min: 12, max: 14 },
  { label: "14+", value: "14+", min: 14, max: 99 },
];

const CARD_GRADS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f7971e, #ffd200)",
  "linear-gradient(135deg, #fc4a1a, #f7b733)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #0f9b8e, #38ef7d)",
];

function ChallengeCard({
  challenge,
  onBuy,
}: {
  challenge: Challenge & { author?: { name?: string } };
  onBuy: () => void;
}) {
  const colorIdx = challenge.title.charCodeAt(0) % CARD_GRADS.length;
  const grad = CARD_GRADS[colorIdx];

  return (
    <div
      className="glass-card"
      style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <div style={{ ...(challenge.coverImage ? { aspectRatio: "1 / 1" } : { height: 120 }), background: challenge.coverImage ? `url(${challenge.coverImage}) center/cover` : grad, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 12, position: "relative" }}>
        {!challenge.coverImage && (
          <>
            <p style={{ color: "#ffffff", fontWeight: 900, textAlign: "center", fontSize: 12, lineHeight: 1.3, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.25)", WebkitLineClamp: 3, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
              {challenge.bookTitle || challenge.title}
            </p>
            {challenge.bookAuthor && (
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, margin: "4px 0 0", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                {challenge.bookAuthor}
              </p>
            )}
          </>
        )}
        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 9999, background: "rgba(0,0,0,0.25)", color: "#ffffff" }}>
          {challenge.totalParts} частей
        </span>
        {challenge.membersCount > 0 && (
          <span style={{ position: "absolute", top: 8, right: 8, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 9999, background: "rgba(0,0,0,0.25)", color: "#ffffff" }}>
            👥 {challenge.membersCount}
          </span>
        )}
      </div>
      <div style={{ padding: "12px 12px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 13, color: "#ffffff", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {challenge.title}
        </p>
        {challenge.author?.name && (
          <p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            👤 {challenge.author.name}
          </p>
        )}
        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#ffffff" }}>
              {challenge.price.toLocaleString()} ₸
            </p>
            <button
              onClick={onBuy}
              style={{ padding: "7px 14px", borderRadius: 9999, border: "none", background: "rgba(255,255,255,0.88)", color: "#4776e6", fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              Купить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KaspiQrStep({
  total, onBack, onConfirm, isPending,
}: {
  total: number;
  onBack: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div style={{ padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.65)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, alignSelf: "flex-start" }}
      >
        ← Назад
      </button>

      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 2px", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>К оплате</p>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 30, color: "#ffffff" }}>{total.toLocaleString()} ₸</p>
      </div>

      <div style={{ background: "#ffffff", borderRadius: 20, padding: 12, alignSelf: "center" }}>
        <img
          src="/payments/kaspi-qr.png"
          alt="Kaspi QR"
          style={{ width: 220, height: "auto", display: "block", borderRadius: 12 }}
        />
      </div>

      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.5 }}>
        Откройте приложение Kaspi.kz, отсканируйте QR и оплатите {total.toLocaleString()} ₸. После оплаты нажмите кнопку ниже.
      </p>

      <button
        onClick={onConfirm}
        disabled={isPending}
        style={{
          padding: "16px 20px",
          borderRadius: 16,
          border: "none",
          background: "rgba(255,255,255,0.9)",
          color: "#4776e6",
          fontWeight: 900,
          fontSize: 15,
          cursor: "pointer",
          fontFamily: "inherit",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Оформление..." : "✅ Я оплатил(а), подтвердить"}
      </button>
    </div>
  );
}

function PurchaseModal({
  challenge, children, onClose, onSuccess,
}: {
  challenge: Challenge & { author?: { name?: string } };
  children: Child[];
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}) {
  const [childId, setChildId] = useState("");
  const [coinsAmount, setCoinsAmount] = useState(0);
  const [step, setStep] = useState<"form" | "qr">("form");

  const coinsTg = Math.round(coinsAmount / 10);
  const total = challenge.price + coinsTg;

  const createMutation = useMutation({
    mutationFn: () => paymentsApi.create({ childId, challengeId: challenge.id, coinsAmount }),
    onSuccess: (payment: Payment) => onSuccess(payment),
    onError: (err: any) => { toast.error(err?.response?.data?.message || "Ошибка оформления"); },
  });

  const colorIdx = challenge.title.charCodeAt(0) % CARD_GRADS.length;
  const grad = CARD_GRADS[colorIdx];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "92dvh",
          overflowY: "auto",
          background: "rgba(30,20,80,0.92)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: "28px 28px 0 0",
        }}
      >
        {/* Cover */}
        <div style={{ height: 120, background: challenge.coverImage ? `url(${challenge.coverImage}) center/cover` : grad, position: "relative", borderRadius: "28px 28px 0 0", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end", padding: "16px 20px" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.3)", border: "none", color: "#ffffff", fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff", lineHeight: 1.2 }}>{challenge.bookTitle || challenge.title}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            {challenge.ageMin}–{challenge.ageMax} лет · {challenge.totalParts} частей
          </p>
        </div>

        {step === "qr" ? (
          <KaspiQrStep
            total={total}
            onBack={() => setStep("form")}
            onConfirm={() => createMutation.mutate()}
            isPending={createMutation.isPending}
          />
        ) : (
        <div style={{ padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Child selector */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Для кого покупаем?
            </label>
            {children.length === 0 ? (
              <p style={{ fontSize: 14, textAlign: "center", padding: "12px 0", color: "rgba(255,255,255,0.55)" }}>
                Нет детей. Добавьте в кабинете.
              </p>
            ) : (
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="glass-input"
                style={{ appearance: "none", cursor: "pointer", border: !childId ? "1px solid rgba(255,200,0,0.6)" : undefined }}
              >
                <option value="" style={{ background: "#2a1a60" }}>— выберите ребёнка —</option>
                {children.map((ch) => (
                  <option key={ch.id} value={ch.id} style={{ background: "#2a1a60" }}>
                    {ch.name}, {ch.age} лет
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Price */}
          <div className="glass-sm" style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#ffffff" }}>{challenge.title}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Цена задания</p>
            </div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 22, color: "#ffffff" }}>{challenge.price.toLocaleString()} ₸</p>
          </div>

          {/* Coins slider */}
          <div className="glass-sm" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#ffffff" }}>Монеты для ребёнка <CoinIcon size={13} /></p>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 18, color: "#ffd200" }}>{coinsAmount.toLocaleString()}</p>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>+ {coinsTg.toLocaleString()} ₸</p>
            <input
              type="range"
              min={0}
              max={COIN_MAX}
              step={COIN_STEP}
              value={coinsAmount}
              onChange={(e) => setCoinsAmount(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#ffd200" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              <span>0</span>
              <span>50 000 монет</span>
            </div>
          </div>

          {/* Total + buy */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Итого</p>
              <p style={{ margin: "2px 0 0", fontWeight: 900, fontSize: 26, color: "#ffffff" }}>{total.toLocaleString()} ₸</p>
            </div>
            <button
              onClick={() => setStep("qr")}
              disabled={!childId}
              style={{
                padding: "16px 20px",
                borderRadius: 16,
                border: "none",
                background: "rgba(255,255,255,0.9)",
                color: "#4776e6",
                fontWeight: 900,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit",
                opacity: !childId ? 0.45 : 1,
                transition: "opacity 0.15s",
              }}
            >
              Оплатить 🚀
            </button>
          </div>
          {!childId && children.length > 0 && (
            <p style={{ margin: "-8px 0 0", fontSize: 12.5, fontWeight: 700, color: "#ffd200", textAlign: "right" }}>
              ⚠️ Сначала выберите ребёнка, для которого покупаете
            </p>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div
        className="glass"
        style={{ width: "100%", maxWidth: 340, padding: 40, textAlign: "center" }}
      >
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#ffffff" }}>Покупка оформлена!</h2>
        <p style={{ margin: "10px 0 28px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
          Ребёнок уже получил доступ к заданию!
        </p>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "15px 0", borderRadius: 9999, border: "none", background: "rgba(255,255,255,0.9)", color: "#4776e6", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
        >
          Отлично!
        </button>
      </div>
    </div>
  );
}

export default function ParentHomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [ageFilter, setAgeFilter] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<(Challenge & { author?: { name?: string } }) | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: challenges = [], isLoading: loadingChallenges } = useQuery<Challenge[]>({
    queryKey: ["challenges"],
    queryFn: () => challengesApi.list(),
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: childrenApi.list,
  });

  const { data: requests = [] } = useQuery<RewardRequest[]>({
    queryKey: ["reward-requests"],
    queryFn: rewardsApi.listRequests,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const ageConfig = AGE_FILTERS.find((f) => f.value === ageFilter);
  const filteredChallenges = (challenges as any[]).filter((c) => {
    if (c.status !== "published") return false;
    if (ageConfig && ageConfig.value !== "") {
      if (c.ageMax < ageConfig.min || c.ageMin > ageConfig.max) return false;
    }
    return true;
  });

  const handlePurchaseSuccess = () => {
    setSelectedChallenge(null);
    setShowSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["payments"] });
  };

  return (
    <main style={{ minHeight: "100dvh", paddingBottom: 24 }}>
      {/* Header */}
      <div
        className="glass-header"
        style={{ padding: "52px 20px 16px", position: "sticky", top: 0, zIndex: 10 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#ffffff" }}>Каталог заданий</h1>
          <button
            onClick={() => router.push("/parent/cabinet")}
            className="glass-chip"
            style={{ padding: "8px 14px", border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 9999, color: "#ffffff", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}
          >
            ← Кабинет
          </button>
        </div>

        {/* Age filters */}
        <div className="scrollbar-hide" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {AGE_FILTERS.map((f) => {
            const active = ageFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setAgeFilter(f.value)}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: 9999,
                  border: active ? "none" : "1px solid rgba(255,255,255,0.22)",
                  background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)",
                  color: active ? "#4776e6" : "rgba(255,255,255,0.75)",
                  fontWeight: active ? 900 : 600,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Запросы детей — самый важный сценарий, вынесен на самый верх (задачи 9, 10) */}
      {pendingRequests.length > 0 && (
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#ffffff" }}>🔔 Запросы детей</h2>
            <span style={{ fontSize: 12, fontWeight: 900, padding: "2px 9px", borderRadius: 9999, background: "#ef4444", color: "#ffffff" }}>{pendingRequests.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingRequests.map((req) => (
              <RewardRequestCard key={req.id} request={req} highlight />
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "16px 20px 0" }}>
        {loadingChallenges ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card" style={{ height: 220, animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="glass" style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 56, margin: "0 0 16px" }}>📚</p>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 18, color: "#ffffff" }}>Нет заданий</p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
              Попробуйте изменить фильтр возраста
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filteredChallenges.map((c: any) => (
              <ChallengeCard key={c.id} challenge={c} onBuy={() => setSelectedChallenge(c)} />
            ))}
          </div>
        )}
      </div>

      {selectedChallenge && (
        <PurchaseModal
          challenge={selectedChallenge}
          children={children}
          onClose={() => setSelectedChallenge(null)}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {showSuccess && <SuccessModal onClose={() => { setShowSuccess(false); router.push("/parent/cabinet"); }} />}
    </main>
  );
}

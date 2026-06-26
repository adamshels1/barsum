"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { challengesApi } from "@/lib/api/challenges";
import { childrenApi } from "@/lib/api/children";
import { paymentsApi } from "@/lib/api/payments";
import type { Challenge, Child, Payment } from "@/types/index";

const COIN_MAX = 50_000;
const COIN_STEP = 1_000;
const COMMISSION = 0.15;

const AGE_FILTERS = [
  { label: "Все", value: "", min: 0, max: 99 },
  { label: "👶 6–8", value: "6-8", min: 6, max: 8 },
  { label: "🧒 9–11", value: "9-11", min: 9, max: 11 },
  { label: "👦 12–14", value: "12-14", min: 12, max: 14 },
  { label: "🧑 14+", value: "14+", min: 14, max: 99 },
];

const CARD_COLORS = ["#7B61FF", "#1FA463", "#EA8C2D", "#E879A0", "#38BDF8"];

function ChallengeGridCard({
  challenge,
  onBuy,
}: {
  challenge: Challenge & { author?: { name?: string } };
  onBuy: () => void;
}) {
  const colorIdx = challenge.title.charCodeAt(0) % CARD_COLORS.length;
  const bg = CARD_COLORS[colorIdx];

  return (
    <div
      className="rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: "var(--card)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1.5px solid rgba(0,0,0,0.04)",
      }}
    >
      {/* Cover — книжная типографика */}
      <div
        className="h-36 flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: bg }}
      >
        <p
          className="text-white font-extrabold text-center leading-tight line-clamp-3 text-sm"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}
        >
          {challenge.bookTitle || challenge.title}
        </p>
        {challenge.bookAuthor && (
          <p className="text-white text-xs mt-1 opacity-80 text-center line-clamp-1">
            {challenge.bookAuthor}
          </p>
        )}
        <span
          className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full"
          style={{ background: "rgba(0,0,0,0.25)", color: "#fff" }}
        >
          📅 {challenge.days} дн
        </span>
        {challenge.membersCount > 0 && (
          <span
            className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: "rgba(0,0,0,0.25)", color: "#fff" }}
          >
            👥 {challenge.membersCount}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <p
          className="font-extrabold text-sm leading-tight mb-0.5 line-clamp-2"
          style={{ color: "var(--ink)" }}
        >
          {challenge.title}
        </p>
        <p className="text-xs mb-1 line-clamp-1" style={{ color: "var(--muted)" }}>
          {challenge.bookTitle}
        </p>
        {challenge.author?.name && (
          <p className="text-xs mb-2 flex items-center gap-1" style={{ color: "var(--purple)" }}>
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white font-bold flex-shrink-0"
              style={{ background: bg, fontSize: 9 }}
            >
              {challenge.author.name[0]}
            </span>
            {challenge.author.name}
          </p>
        )}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(31,164,99,0.1)", color: "var(--green)" }}
            >
              🎂 {challenge.ageMin}–{challenge.ageMax} лет
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="font-extrabold text-base" style={{ color: "var(--ink)" }}>
              {challenge.price.toLocaleString()} ₸
            </p>
            <button
              onClick={onBuy}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white transition-opacity active:opacity-70 flex-shrink-0"
              style={{ background: "var(--purple)" }}
            >
              Купить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseModal({
  challenge,
  children,
  onClose,
  onSuccess,
}: {
  challenge: Challenge & { author?: { name?: string } };
  children: Child[];
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}) {
  const [childId, setChildId] = useState("");
  const [coinsAmount, setCoinsAmount] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const coinsTg = Math.round(coinsAmount / 10);
  const expert = Math.round(challenge.price * COMMISSION);
  const platform = challenge.price - expert;
  const total = challenge.price + coinsTg;

  const totalW = challenge.price + Math.max(coinsTg, 1);
  const expPct = (expert / totalW) * 100;
  const platPct = (platform / totalW) * 100;
  const coinPct = (Math.max(coinsTg, 1) / totalW) * 100;

  const colorIdx = challenge.title.charCodeAt(0) % CARD_COLORS.length;
  const bg = CARD_COLORS[colorIdx];

  const createMutation = useMutation({
    mutationFn: () =>
      paymentsApi.create({ childId, challengeId: challenge.id, coinsAmount }),
    onSuccess: (payment: Payment) => onSuccess(payment),
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Ошибка оформления");
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: "#fff", maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* Challenge header with book typography */}
        <div
          className="p-5 relative"
          style={{ background: bg, minHeight: 100 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: "rgba(0,0,0,0.2)", color: "#fff" }}
          >
            ✕
          </button>
          <span
            className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3"
            style={{ background: "rgba(0,0,0,0.2)", color: "#fff" }}
          >
            📖 Чтение
          </span>
          <h2 className="text-xl font-extrabold leading-tight text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
            {challenge.bookTitle || challenge.title}
          </h2>
          {challenge.bookAuthor && (
            <p className="text-sm mt-1 text-white opacity-80">
              {challenge.bookAuthor}
            </p>
          )}
          <div className="flex gap-3 mt-3">
            <span className="text-xs text-white opacity-70">
              🎂 {challenge.ageMin}–{challenge.ageMax} лет
            </span>
            <span className="text-xs text-white opacity-70">
              📅 {challenge.days} дней
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Expert */}
          {challenge.author?.name && (
            <div
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{ border: "1px solid var(--line)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: bg }}
              >
                {challenge.author.name[0]}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--ink)" }}>
                  {challenge.author.name}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Автор челленджа
                </p>
              </div>
            </div>
          )}

          {/* Child selector */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
              Для кого покупаем?
            </label>
            {children.length === 0 ? (
              <p className="text-sm py-3 text-center rounded-xl" style={{ background: "var(--soft)", color: "var(--muted)" }}>
                Нет детей. Добавьте в кабинете.
              </p>
            ) : (
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-base outline-none appearance-none"
                style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--soft)" }}
              >
                <option value="">— выберите ребёнка —</option>
                {children.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}, {ch.age} лет
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Challenge price (fixed) */}
          <div
            className="rounded-2xl p-4 flex items-center justify-between"
            style={{ border: "1px solid var(--line)" }}
          >
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--ink)" }}>
                {challenge.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Цену задаёт автор
              </p>
            </div>
            <p className="text-xl font-extrabold" style={{ color: "var(--ink)" }}>
              {challenge.price.toLocaleString()} ₸
            </p>
          </div>

          {/* Coins for child */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                Монеты для ребёнка 🪙
              </p>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Сколько получит
              </span>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, #f4f1ff, #efeaff)", border: "1px solid #e6dffb" }}
            >
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-2xl font-extrabold" style={{ color: "var(--green)" }}>
                  {coinsAmount.toLocaleString()}{" "}
                  <span className="text-base font-bold">монет</span>
                </p>
                <p className="text-lg font-extrabold" style={{ color: "var(--ink)" }}>
                  {coinsTg.toLocaleString()} ₸
                </p>
              </div>
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3"
                style={{ background: "#fff", border: "1px solid #e6dffb", color: "var(--purple)" }}
              >
                Курс: 1 ₸ = 10 монет
              </span>
              <input
                type="range"
                min={0}
                max={COIN_MAX}
                step={COIN_STEP}
                value={coinsAmount}
                onChange={(e) => setCoinsAmount(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "var(--green)" }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: "var(--muted)" }}>
                <span>0</span>
                <span>50 000 монет</span>
              </div>
              {coinsTg > 0 && (
                <p className="text-xs text-center mt-2 font-semibold" style={{ color: "var(--green)" }}>
                  + {coinsTg.toLocaleString()} ₸ доп. оплата за монеты
                </p>
              )}
            </div>
          </div>

          {/* Breakdown — collapsible */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full p-4 flex items-center justify-between text-left"
              style={{ background: "var(--soft)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Детали оплаты
              </p>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>
                {showBreakdown ? "▲" : "▼"}
              </span>
            </button>
            {showBreakdown && (
              <div className="p-4 pt-0" style={{ background: "var(--soft)" }}>
                <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3 mt-3">
                  <div style={{ flex: expPct, background: "var(--purple)", borderRadius: 4 }} />
                  <div style={{ flex: platPct, background: "var(--orange)", borderRadius: 4 }} />
                  {coinsTg > 0 && <div style={{ flex: coinPct, background: "var(--green)", borderRadius: 4 }} />}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2" style={{ color: "#4a4658" }}>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "var(--purple)" }} />
                      Эксперт (15%)
                    </span>
                    <span className="font-bold" style={{ color: "var(--ink)" }}>{expert.toLocaleString()} ₸</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2" style={{ color: "#4a4658" }}>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "var(--orange)" }} />
                      Платформа Barsum (85%)
                    </span>
                    <span className="font-bold" style={{ color: "var(--ink)" }}>{platform.toLocaleString()} ₸</span>
                  </div>
                  {coinsTg > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2" style={{ color: "#4a4658" }}>
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "var(--green)" }} />
                        Монеты ребёнку
                      </span>
                      <span className="font-bold" style={{ color: "var(--ink)" }}>{coinsTg.toLocaleString()} ₸</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Total + buy */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Итого к оплате</p>
              <p className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
                {total.toLocaleString()} ₸
              </p>
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!childId || createMutation.isPending}
              className="px-5 py-4 rounded-2xl font-bold text-white text-sm transition-opacity disabled:opacity-40"
              style={{
                background: "var(--purple)",
                boxShadow: "0 8px 20px -6px rgba(123,97,255,0.6)",
              }}
            >
              {createMutation.isPending ? "Оформление..." : `Купить за ${total.toLocaleString()} ₸ 🚀`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div className="w-full max-w-sm rounded-3xl p-8 text-center" style={{ background: "#fff" }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5"
          style={{ background: "#DCFCE7", boxShadow: "0 4px 0 #bbf7d0" }}
        >
          ✅
        </div>
        <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--ink)" }}>
          Покупка оформлена!
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Ребёнок получит доступ к челленджу после подтверждения оплаты.
        </p>
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold text-white"
          style={{ background: "var(--green)", boxShadow: "0 4px 0 var(--green-deep)" }}
        >
          Перейти к покупкам
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

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.push("/parent/cabinet");
  };

  return (
    <main className="min-h-screen pb-16" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-3"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
            Каталог челленджей
          </h1>
          <button
            onClick={() => router.push("/parent/cabinet")}
            className="text-sm font-semibold px-3 py-2 rounded-xl"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            ← Кабинет
          </button>
        </div>

        {/* Age filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {AGE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setAgeFilter(f.value)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={
                ageFilter === f.value
                  ? { background: "var(--purple)", color: "#fff" }
                  : { background: "var(--card)", color: "var(--muted)", border: "1.5px solid rgba(124,58,237,0.15)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5">
        {loadingChallenges ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-3xl h-56 animate-pulse" style={{ background: "var(--card)" }} />
            ))}
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="rounded-3xl p-12 text-center" style={{ background: "var(--card)" }}>
            <p className="text-6xl mb-4">📚</p>
            <p className="font-extrabold text-lg" style={{ color: "var(--ink)" }}>Нет челленджей</p>
            <p className="text-sm mt-2 max-w-xs mx-auto" style={{ color: "var(--muted)" }}>
              Попробуйте изменить фильтр возраста или зайдите позже
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredChallenges.map((c: any) => (
              <ChallengeGridCard
                key={c.id}
                challenge={c}
                onBuy={() => setSelectedChallenge(c)}
              />
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

      {showSuccess && <SuccessModal onClose={handleSuccessClose} />}
    </main>
  );
}

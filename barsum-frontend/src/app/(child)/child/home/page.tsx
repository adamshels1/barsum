"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, LogOut, Rocket, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";
import { sessionsApi } from "@/lib/api/sessions";
import { useAuthStore } from "@/stores/auth-store";

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const CARD_COLORS = ["#7B61FF", "#10B981", "#F97316", "#F472B6", "#38BDF8"];

function StreakRow({ streak }: { streak: number }) {
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{ background: "#fff", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Серия дней
        </p>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: "#FFF7ED" }}
        >
          <span className="text-sm">🔥</span>
          <span className="font-black text-sm" style={{ color: "#EA580C" }}>
            {streak} дней
          </span>
        </div>
      </div>
      <div className="flex gap-1.5">
        {DAY_LABELS.map((day, i) => {
          const daysAgo = todayIdx - i;
          const isFilled = daysAgo >= 0 && daysAgo < streak;
          const isToday = i === todayIdx;

          return (
            <div key={day} className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-full aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all"
                style={{
                  background: isFilled
                    ? isToday ? "#EA580C" : "#FED7AA"
                    : isToday ? "var(--purple-light)" : "#F3F4F6",
                  color: isFilled
                    ? isToday ? "#fff" : "#EA580C"
                    : isToday ? "var(--purple)" : "var(--muted)",
                  border: isToday ? `2px solid ${isFilled ? "#EA580C" : "var(--purple)"}` : "2px solid transparent",
                }}
              >
                {isFilled ? "✓" : "·"}
              </div>
              <span className="text-xs font-bold" style={{ color: "var(--muted)", fontSize: 9 }}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DreamCard({
  dream,
  currentBalance,
  onSend,
  isSending,
}: {
  dream: any;
  currentBalance: number;
  onSend: (amount: number) => void;
  isSending: boolean;
}) {
  const [sendAmount, setSendAmount] = useState("");
  const progress =
    dream.status === "active" && dream.targetCoins > 0
      ? Math.min((dream.savedCoins / dream.targetCoins) * 100, 100)
      : 0;

  if (dream.status === "pending_approval") {
    return (
      <div
        className="rounded-2xl p-4 mb-4 flex items-center gap-3"
        style={{ background: "#FEF3C7", border: "1.5px solid #FDE68A" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: "#FDE68A" }}>
          ⏳
        </div>
        <div>
          <p className="font-black text-sm" style={{ color: "#78350F" }}>{dream.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#92400E" }}>Ждёт одобрения родителя</p>
        </div>
      </div>
    );
  }

  if (dream.status === "rejected") {
    return (
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: "#FEE2E2", border: "1.5px solid #FECACA" }}
      >
        <p className="font-black text-sm mb-1" style={{ color: "#7F1D1D" }}>{dream.name}</p>
        <p className="text-xs" style={{ color: "#B91C1C" }}>Мечта отклонена</p>
        {dream.rejectedReason && (
          <p className="text-xs mt-1" style={{ color: "#B91C1C" }}>
            Причина: {dream.rejectedReason}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl mb-4 overflow-hidden relative"
      style={{
        minHeight: 140,
        background: dream.photoUrl
          ? `url(${dream.photoUrl}) center/cover`
          : "linear-gradient(135deg, var(--purple-light), #ddd6ff)",
        border: "1.5px solid #ddd6ff",
      }}
    >
      {dream.photoUrl && (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.65))" }}
        />
      )}
      <div className="relative p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p
              className="text-xs font-black uppercase tracking-wide"
              style={{ color: dream.photoUrl ? "rgba(255,255,255,0.85)" : "var(--purple)" }}
            >
              Моя мечта 💫
            </p>
            <p
              className="font-black text-base"
              style={{ color: dream.photoUrl ? "#fff" : "var(--ink)" }}
            >
              {dream.name}
            </p>
          </div>
          <span
            className="text-sm font-black px-3 py-1 rounded-full"
            style={{
              background: dream.photoUrl ? "rgba(255,255,255,0.25)" : "var(--purple)",
              color: "#fff",
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>
        <div
          className="w-full h-2.5 rounded-full overflow-hidden mb-2"
          style={{ background: dream.photoUrl ? "rgba(255,255,255,0.3)" : "#ddd6ff" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: dream.photoUrl ? "#fff" : "var(--purple)",
            }}
          />
        </div>
        <div
          className="flex justify-between text-xs mb-3 font-semibold"
          style={{ color: dream.photoUrl ? "rgba(255,255,255,0.75)" : "var(--muted)" }}
        >
          <span>🪙 {dream.savedCoins.toLocaleString()} накоплено</span>
          <span>цель: {dream.targetCoins.toLocaleString()}</span>
        </div>
        {currentBalance > 0 && (
          <div className="flex gap-2">
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="Монет в мечту..."
              className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold outline-none"
              style={{
                background: dream.photoUrl ? "rgba(255,255,255,0.2)" : "#fff",
                color: dream.photoUrl ? "#fff" : "var(--ink)",
                border: dream.photoUrl ? "1px solid rgba(255,255,255,0.4)" : "1.5px solid #ddd6ff",
              }}
            />
            <button
              onClick={() => {
                const amt = Number(sendAmount);
                if (amt > 0 && amt <= currentBalance) {
                  onSend(amt);
                  setSendAmount("");
                }
              }}
              disabled={!sendAmount || Number(sendAmount) < 1 || Number(sendAmount) > currentBalance || isSending}
              className="px-3 py-2 rounded-xl text-sm font-black flex-shrink-0 disabled:opacity-50 transition-opacity"
              style={{ background: "var(--purple)", color: "#fff" }}
            >
              Внести
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChildHomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  const startSession = useMutation({
    mutationFn: (enrollmentId: string) => sessionsApi.create(enrollmentId),
    onSuccess: (session) => router.push(`/child/session/${session.id}`),
  });

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: sessionsApi.listEnrollments,
  });

  const { data: balance_data } = useQuery({
    queryKey: ["child-balance", user?.id],
    queryFn: () => coinsApi.childBalance(user?.id),
    enabled: !!user?.id,
  });

  const { data: dream } = useQuery({
    queryKey: ["dream-my"],
    queryFn: dreamsApi.my,
  });

  const currentBalance: number = balance_data?.balance ?? 0;
  const streak: number = (user as any)?.streak ?? 0;

  const sendMutation = useMutation({
    mutationFn: (amount: number) => dreamsApi.send(amount, currentBalance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dream-my"] });
      queryClient.invalidateQueries({ queryKey: ["child-balance", user?.id] });
      toast.success("Монеты добавлены к мечте!");
    },
    onError: () => toast.error("Ошибка"),
  });

  const totalCoinsToEarn = (enrollments as any[]).reduce(
    (sum: number, e: any) => sum + (e.challenge?.coinsReward ?? 0),
    0
  );

  return (
    <main className="min-h-screen p-5 max-w-lg mx-auto">
      <StreakRow streak={streak} />

      {totalCoinsToEarn > 0 && (
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-3"
          style={{ background: "#fff", boxShadow: "var(--shadow-sm)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--green-light)" }}
          >
            <Rocket size={20} color="var(--green)" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "var(--muted)" }}>
              Ещё заработаю за все курсы
            </p>
            <p className="font-black text-lg" style={{ color: "var(--green)" }}>
              +{totalCoinsToEarn.toLocaleString()} монет
            </p>
          </div>
        </div>
      )}

      {dream ? (
        <DreamCard
          dream={dream}
          currentBalance={currentBalance}
          onSend={(amt) => sendMutation.mutate(amt)}
          isSending={sendMutation.isPending}
        />
      ) : (
        <button
          onClick={() => router.push("/child/shop?tab=dream")}
          className="w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left transition-transform active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, var(--purple-light), #ddd6ff)",
            border: "1.5px solid #ddd6ff",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--purple)", boxShadow: "0 3px 0 var(--purple-deep)" }}
          >
            <Star size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm" style={{ color: "var(--purple)" }}>
              Добавь свою мечту!
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--muted)" }}>
              Родители помогут её осуществить
            </p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      <h2 className="text-lg font-black mb-3" style={{ color: "var(--ink)" }}>
        Мои книги
      </h2>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl h-44 w-52 flex-shrink-0 animate-pulse"
              style={{ background: "#fff" }}
            />
          ))}
        </div>
      ) : (enrollments as any[]).length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "#fff", boxShadow: "var(--shadow-sm)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--purple-light)" }}
          >
            <BookOpen size={28} color="var(--purple)" strokeWidth={2} />
          </div>
          <p className="font-black text-base" style={{ color: "var(--ink)" }}>
            Нет активных заданий
          </p>
          <p className="text-sm mt-1 font-semibold" style={{ color: "var(--muted)" }}>
            Попроси родителей записать тебя на курс
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {(enrollments as any[]).map((enrollment, idx) => {
            const ch = enrollment.challenge;
            const colorIdx = (ch?.title ? ch.title.charCodeAt(0) % CARD_COLORS.length : idx % CARD_COLORS.length);
            const cardColor = CARD_COLORS[colorIdx];
            const startDate = new Date(enrollment.startedAt || enrollment.createdAt);
            const daysElapsed = Math.max(
              1,
              Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
            );
            const currentDay = Math.min(daysElapsed, ch?.days ?? 1);
            const progress = ch?.days ? (currentDay / ch.days) * 100 : 0;

            return (
              <button
                key={enrollment.id}
                onClick={() => startSession.mutate(enrollment.id)}
                disabled={startSession.isPending}
                className="flex-shrink-0 w-52 rounded-2xl overflow-hidden text-left transition-transform active:scale-95 disabled:opacity-70"
                style={{ boxShadow: "var(--shadow-md)" }}
              >
                {/* Cover */}
                <div
                  className="h-28 flex flex-col items-center justify-center p-3 relative"
                  style={{ background: cardColor }}
                >
                  <p
                    className="text-white font-black text-center leading-tight line-clamp-2 text-xs"
                    style={{ textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
                  >
                    {ch?.bookTitle || ch?.title || "Задание"}
                  </p>
                  {ch?.bookAuthor && (
                    <p className="text-white text-xs mt-1 opacity-80 text-center">
                      {ch.bookAuthor}
                    </p>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 bg-white">
                  <p className="font-black text-sm line-clamp-1 mb-1" style={{ color: "var(--ink)" }}>
                    {ch?.title || "Задание"}
                  </p>
                  <div className="w-full h-2 rounded-full overflow-hidden mb-1.5" style={{ background: "#F3F4F6" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${progress}%`, background: cardColor }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                      День {currentDay}/{ch?.days}
                    </span>
                    <span
                      className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ background: "var(--green-light)", color: "var(--green-deep)" }}
                    >
                      🪙 +{(ch?.coinsReward ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => { clearAuth(); router.push("/auth/child"); }}
        className="w-full mt-8 flex items-center justify-center gap-2 text-xs font-semibold"
        style={{ color: "var(--muted)" }}
      >
        <LogOut size={12} />
        Выйти из аккаунта
      </button>
    </main>
  );
}

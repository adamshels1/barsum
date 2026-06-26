"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";
import { sessionsApi } from "@/lib/api/sessions";
import { useAuthStore } from "@/stores/auth-store";

function StreakCalendar({ streak }: { streak: number }) {
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <div className="flex gap-1.5 justify-between mb-5">
      {days.map((day, i) => {
        const daysAgo = todayIdx - i;
        const isFilled = daysAgo >= 0 && daysAgo < streak;
        const isToday = i === todayIdx;

        return (
          <div key={day} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full aspect-square rounded-xl flex items-center justify-center font-bold transition-all"
              style={{
                background: isFilled
                  ? isToday
                    ? "#EA580C"
                    : "#FED7AA"
                  : isToday
                  ? "var(--lav)"
                  : "var(--surface)",
                color: isFilled ? (isToday ? "#fff" : "#EA580C") : "var(--muted)",
                border: isToday
                  ? `2px solid ${isFilled ? "#EA580C" : "var(--purple)"}`
                  : "none",
                fontSize: isFilled ? 14 : 16,
              }}
            >
              {isFilled ? "🔥" : "·"}
            </div>
            <span style={{ color: "var(--muted)", fontSize: 10 }}>{day}</span>
          </div>
        );
      })}
    </div>
  );
}

function DreamMotivation({ progress, dreamName }: { progress: number; dreamName: string }) {
  let text = "";
  if (progress === 0) text = "Начни копить монеты! Читай каждый день 🚀";
  else if (progress < 10) text = "Только начинаем! Читай каждый день 🚀";
  else if (progress < 50) text = `Уже ${Math.round(progress)}%! Продолжай читать 💪`;
  else if (progress < 90) text = `Больше половины! «${dreamName}» уже близко ✨`;
  else if (progress < 100) text = `Почти! Ещё чуть-чуть и «${dreamName}» твой! 🔥`;
  else text = `Мечта «${dreamName}» достигнута! 🎉`;

  return (
    <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--purple)", opacity: 0.8 }}>
      {text}
    </p>
  );
}

export default function ChildHomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [sendAmount, setSendAmount] = useState("");
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
      setSendAmount("");
      toast.success("Монеты добавлены к мечте!");
    },
    onError: () => toast.error("Ошибка"),
  });

  const totalCoinsToEarn = (enrollments as any[]).reduce(
    (sum: number, e: any) => sum + (e.challenge?.coinsReward ?? 0),
    0
  );

  const dreamProgress =
    dream && dream.status === "active" && dream.targetCoins > 0
      ? Math.min((dream.savedCoins / dream.targetCoins) * 100, 100)
      : 0;

  return (
    <main className="min-h-screen p-5 max-w-lg mx-auto">
      <StreakCalendar streak={streak} />

      {totalCoinsToEarn > 0 && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-center gap-3"
          style={{ background: "var(--surface)" }}
        >
          <span className="text-2xl">🚀</span>
          <div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Ещё заработаю за все курсы
            </p>
            <p className="font-extrabold text-lg" style={{ color: "var(--green)" }}>
              +{totalCoinsToEarn.toLocaleString()} монет
            </p>
          </div>
        </div>
      )}

      {dream && dream.status === "active" && (
        <div
          className="rounded-2xl mb-4 overflow-hidden relative"
          style={{
            minHeight: 140,
            background: dream.photoUrl
              ? `url(${dream.photoUrl}) center/cover`
              : "linear-gradient(135deg, #f4f1ff, #efeaff)",
            border: "1.5px solid #e6dffb",
          }}
        >
          {dream.photoUrl && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.6))",
              }}
            />
          )}
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: dream.photoUrl ? "rgba(255,255,255,0.8)" : "var(--purple)" }}
                >
                  Моя мечта 💫
                </p>
                <p
                  className="font-extrabold text-base"
                  style={{ color: dream.photoUrl ? "#fff" : "var(--ink)" }}
                >
                  {dream.name}
                </p>
              </div>
              <p
                className="text-sm font-extrabold"
                style={{ color: dream.photoUrl ? "#fff" : "var(--purple)" }}
              >
                {Math.round(dreamProgress)}%
              </p>
            </div>
            <div
              className="w-full h-3 rounded-full overflow-hidden mb-1"
              style={{ background: dream.photoUrl ? "rgba(255,255,255,0.3)" : "#e0d9f9" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${dreamProgress}%`,
                  background: dream.photoUrl ? "#fff" : "var(--purple)",
                }}
              />
            </div>
            <div
              className="flex justify-between text-xs mb-3"
              style={{ color: dream.photoUrl ? "rgba(255,255,255,0.7)" : "var(--muted)" }}
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
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: dream.photoUrl ? "rgba(255,255,255,0.2)" : "#fff",
                    color: dream.photoUrl ? "#fff" : "var(--ink)",
                    border: dream.photoUrl
                      ? "1px solid rgba(255,255,255,0.4)"
                      : "1px solid #e6dffb",
                  }}
                />
                <button
                  onClick={() => {
                    const amt = Number(sendAmount);
                    if (amt > 0 && amt <= currentBalance) sendMutation.mutate(amt);
                  }}
                  disabled={
                    !sendAmount ||
                    Number(sendAmount) < 1 ||
                    Number(sendAmount) > currentBalance ||
                    sendMutation.isPending
                  }
                  className="px-3 py-2 rounded-xl text-sm font-bold flex-shrink-0"
                  style={{
                    background: "var(--purple)",
                    color: "#fff",
                    opacity:
                      !sendAmount ||
                      Number(sendAmount) < 1 ||
                      Number(sendAmount) > currentBalance
                        ? 0.5
                        : 1,
                  }}
                >
                  ⬆️ Внести
                </button>
              </div>
            )}
            {!dream.photoUrl && (
              <DreamMotivation progress={dreamProgress} dreamName={dream.name} />
            )}
          </div>
        </div>
      )}

      {dream && dream.status === "pending_approval" && (
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: "#FEF3C7", border: "1.5px solid #FDE68A" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wide mb-1"
            style={{ color: "#92400E" }}
          >
            Мечта ждёт одобрения ⏳
          </p>
          <p className="font-bold" style={{ color: "#78350F" }}>
            {dream.name}
          </p>
          <p className="text-xs mt-1" style={{ color: "#92400E" }}>
            Родитель скоро установит стоимость
          </p>
        </div>
      )}

      {dream && dream.status === "rejected" && (
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: "#FEE2E2", border: "1.5px solid #FECACA" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wide mb-1"
            style={{ color: "#B91C1C" }}
          >
            Мечта отклонена ❌
          </p>
          <p className="font-bold" style={{ color: "#7F1D1D" }}>
            {dream.name}
          </p>
          {dream.rejectedReason && (
            <p className="text-xs mt-1" style={{ color: "#B91C1C" }}>
              Причина: {dream.rejectedReason}
            </p>
          )}
          <button
            onClick={() => router.push("/child/shop?tab=dream")}
            className="mt-2 text-xs font-bold underline"
            style={{ color: "#DC2626" }}
          >
            Создать новую мечту →
          </button>
        </div>
      )}

      {!dream && (
        <button
          onClick={() => router.push("/child/shop?tab=dream")}
          className="w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left"
          style={{
            background: "linear-gradient(135deg, #f4f1ff, #efeaff)",
            border: "1.5px solid #e6dffb",
          }}
        >
          <span className="text-3xl">💫</span>
          <div>
            <p className="font-extrabold text-sm" style={{ color: "var(--purple)" }}>
              Добавь свою мечту!
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Родители помогут её осуществить
            </p>
          </div>
          <span className="ml-auto" style={{ color: "var(--purple)" }}>
            →
          </span>
        </button>
      )}

      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink)" }}>
        Мои книги
      </h2>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl h-44 w-56 flex-shrink-0 animate-pulse"
              style={{ background: "var(--surface)" }}
            />
          ))}
        </div>
      ) : (enrollments as any[]).length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--surface)" }}
        >
          <p className="text-5xl mb-3">📚</p>
          <p className="font-extrabold text-base" style={{ color: "var(--ink)" }}>
            Нет активных заданий
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Попроси родителей записать тебя на курс
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {(enrollments as any[]).map((enrollment) => {
            const ch = enrollment.challenge;
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
                className="flex-shrink-0 w-56 rounded-2xl p-4 text-left"
                style={{ background: "var(--surface)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                  style={{ background: "var(--lav)" }}
                >
                  📖
                </div>
                <p
                  className="font-bold text-sm line-clamp-2 leading-tight mb-1"
                  style={{ color: "var(--ink)" }}
                >
                  {ch?.title || "Задание"}
                </p>
                <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                  {ch?.bookAuthor}
                </p>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden mb-1"
                  style={{ background: "#E5E7EB" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progress}%`, background: "var(--purple)" }}
                  />
                </div>
                <div
                  className="flex justify-between text-xs mb-2"
                  style={{ color: "var(--muted)" }}
                >
                  <span>День {currentDay}</span>
                  <span>из {ch?.days}</span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(31,164,99,0.12)", color: "var(--green)" }}
                >
                  🪙 +{(ch?.coinsReward ?? 0).toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => {
          clearAuth();
          router.push("/auth/child");
        }}
        className="w-full mt-8 text-xs text-center"
        style={{ color: "var(--muted)" }}
      >
        Выйти из аккаунта
      </button>
    </main>
  );
}

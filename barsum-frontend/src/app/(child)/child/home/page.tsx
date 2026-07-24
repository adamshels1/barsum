"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, History, LogOut, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";
import { sessionsApi } from "@/lib/api/sessions";
import { useAuthStore } from "@/stores/auth-store";
import { CoinIcon } from "@/components/CoinIcon";
import { dreamPhotoUrl } from "@/lib/media";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT, type Dict } from "@/i18n/useT";
import { useLocaleStore } from "@/stores/locale-store";

const dict: Dict = {
  ru: {
    greeting: "Привет, {name}! 👋",
    coinsOnAccount: "монет на счету",
    purchaseHistory: "История покупок",
    days: "дней",
    awaitingApproval: "Ждёт одобрения родителя",
    dreamRejected: "Мечта отклонена",
    dreamCollected: "«{name}» собрана! 🎉",
    waitingParentFulfill: "Ждём, пока родитель исполнит мечту",
    myDream: "Моя мечта",
    saved: "накоплено",
    goal: "цель:",
    coinsToDream: "Монет в мечту...",
    deposit: "Внести",
    insufficient: "Не хватает монет — доступно {n}",
    coinsAdded: "Монеты добавлены к мечте!",
    sendFailed: "Не удалось отправить монеты",
    reader: "Читатель",
    addDream: "Добавь свою мечту!",
    addAnotherDream: "Добавить ещё мечту",
    parentsHelp: "Родители помогут её осуществить",
    collabCard: "Сочиняем вместе",
    collabCardHint: "Придумай продолжение сказки своим голосом",
    booksCard: "Каталог книг",
    booksCardHint: "Выбери книгу и попроси родителя купить её",
    myTasks: "Мои задания",
    noActiveTasks: "Нет активных заданий",
    askParents: "Попроси родителей записать тебя на курс",
    task: "Задание",
    parts: "частей",
    logout: "Выйти из аккаунта",
  },
  kk: {
    greeting: "Сәлем, {name}! 👋",
    coinsOnAccount: "шоттағы монета",
    purchaseHistory: "Сатып алулар тарихы",
    days: "күн",
    awaitingApproval: "Ата-ананың мақұлдауын күтуде",
    dreamRejected: "Арман қабылданбады",
    dreamCollected: "«{name}» жиналды! 🎉",
    waitingParentFulfill: "Ата-ана арманды орындағанын күтеміз",
    myDream: "Менің арманым",
    saved: "жиналды",
    goal: "мақсат:",
    coinsToDream: "Арманға монета...",
    deposit: "Салу",
    insufficient: "Монета жетпейді — қолжетімді {n}",
    coinsAdded: "Монеталар арманға қосылды!",
    sendFailed: "Монеталарды жіберу мүмкін болмады",
    reader: "Оқырман",
    addDream: "Арманыңды қос!",
    addAnotherDream: "Тағы арман қосу",
    parentsHelp: "Ата-анаң оны орындауға көмектеседі",
    collabCard: "Бірге шығарамыз",
    collabCardHint: "Ертегінің жалғасын өз дауысыңмен ойлап тап",
    booksCard: "Кітаптар каталогы",
    booksCardHint: "Кітап таңдап, ата-анаңнан сатып алуын сұра",
    myTasks: "Менің тапсырмаларым",
    noActiveTasks: "Белсенді тапсырмалар жоқ",
    askParents: "Ата-анаңнан курсқа жазуын өтін",
    task: "Тапсырма",
    parts: "бөлім",
    logout: "Аккаунттан шығу",
  },
};

const CARD_COLORS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f7971e, #ffd200)",
  "linear-gradient(135deg, #fc4a1a, #f7b733)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #0f9b8e, #38ef7d)",
];

function HeroCard({ name, balance, streak, onHistory }: { name: string; balance: number; streak: number; onHistory: () => void }) {
  const t = useT(dict);
  return (
    <div className="glass" style={{ padding: "18px 20px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{t("greeting", { name })}</p>
        <p style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
          <CoinIcon size={30} /> {balance.toLocaleString("ru-RU")}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{t("coinsOnAccount")}</p>
        <button
          onClick={onHistory}
          style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700 }}
        >
          <History size={13} strokeWidth={2.5} />
          {t("purchaseHistory")}
        </button>
      </div>
      {streak > 0 && (
        <div className="glass-chip" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 14px" }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <span style={{ fontWeight: 900, fontSize: 16, color: "#ffd200", lineHeight: 1 }}>{streak}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{t("days")}</span>
        </div>
      )}
    </div>
  );
}

function DreamCard({ dream, currentBalance, onSend, isSending }: {
  dream: any; currentBalance: number;
  onSend: (amount: number, dreamId: string) => void; isSending: boolean;
}) {
  const t = useT(dict);
  const [sendAmount, setSendAmount] = useState("");
  const progress = dream.status === "active" && dream.targetCoins > 0
    ? Math.min((dream.savedCoins / dream.targetCoins) * 100, 100) : 0;

  if (dream.status === "pending_approval") {
    return (
      <div className="glass" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,210,0,0.4)" }}>
        <span style={{ fontSize: 28 }}>⏳</span>
        <div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>{dream.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#ffd200" }}>{t("awaitingApproval")}</p>
        </div>
      </div>
    );
  }
  if (dream.status === "rejected") {
    return (
      <div className="glass" style={{ padding: 16, marginBottom: 12, border: "1px solid rgba(255,120,100,0.4)" }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>{dream.name}</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#ffb3b3" }}>
          {t("dreamRejected")}{dream.rejectedReason ? `: ${dream.rejectedReason}` : ""}
        </p>
      </div>
    );
  }
  if (dream.status === "completed") {
    return (
      <div className="glass" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(0,220,120,0.45)" }}>
        <span style={{ fontSize: 28 }}>🎉</span>
        <div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>{t("dreamCollected", { name: dream.name })}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#aaffcc" }}>{t("waitingParentFulfill")}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass"
      style={{
        marginBottom: 12,
        overflow: "hidden",
        position: "relative",
        minHeight: 140,
        ...(dream.photoUrl ? {
          backgroundImage: `url(${dreamPhotoUrl(dream)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {}),
      }}
    >
      {dream.photoUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", borderRadius: 20 }} />}
      <div style={{ position: "relative", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("myDream")}</p>
            <p style={{ margin: "4px 0 0", fontWeight: 900, fontSize: 16, color: "#ffffff" }}>{dream.name}</p>
          </div>
          <span className="glass-chip" style={{ padding: "4px 10px", fontSize: 13, fontWeight: 900, color: "#ffffff" }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "rgba(255,255,255,0.9)", borderRadius: 9999, transition: "width 0.7s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          <span><CoinIcon size={13} /> {dream.savedCoins.toLocaleString()} {t("saved")}</span>
          <span>{t("goal")} {dream.targetCoins.toLocaleString()}</span>
        </div>
        {currentBalance > 0 && (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                min={1}
                max={currentBalance}
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder={t("coinsToDream")}
                className="glass-input"
                style={{ flex: 1, padding: "10px 14px", fontSize: 14, borderRadius: 12 }}
              />
              <button
                onClick={() => {
                  const amt = Number(sendAmount);
                  if (amt > 0 && amt <= currentBalance) { onSend(amt, dream.id); setSendAmount(""); }
                }}
                disabled={!sendAmount || Number(sendAmount) < 1 || Number(sendAmount) > currentBalance || isSending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: "rgba(255,255,255,0.9)",
                  color: "#0a7a62",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: "pointer",
                  flexShrink: 0,
                  fontFamily: "inherit",
                  opacity: (!sendAmount || Number(sendAmount) < 1 || Number(sendAmount) > currentBalance || isSending) ? 0.4 : 1,
                }}
              >
                {t("deposit")}
              </button>
            </div>
            {sendAmount !== "" && Number(sendAmount) > currentBalance && (
              <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 700, color: "#ffd0d0" }}>
                {t("insufficient", { n: currentBalance.toLocaleString() })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ChildHomePage() {
  const router = useRouter();
  const t = useT(dict);
  const locale = useLocaleStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  // Поллинг + рефетч при возврате в приложение: купленная родителем книга
  // появляется сама, без перезахода (актуально для свёрнутой PWA).
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: sessionsApi.listEnrollments,
    refetchOnMount: "always",
    refetchInterval: 15000,
    refetchOnWindowFocus: "always",
  });

  const { data: balance_data } = useQuery({
    queryKey: ["child-balance", user?.id],
    queryFn: () => coinsApi.childBalance(user?.id),
    enabled: !!user?.id,
  });

  const { data: dreams = [] } = useQuery<any[]>({
    queryKey: ["dream-my-all"],
    queryFn: dreamsApi.myAll,
  });

  // Текущие мечты (несколько): на одобрении, активные, собранные. Исполненные — в магазине (история).
  const currentDreams = (dreams as any[]).filter(
    (d) => d.status === "pending_approval" || d.status === "active" || d.status === "completed",
  );

  const currentBalance: number = balance_data?.balance ?? 0;
  const streak: number = (user as any)?.streak ?? 0;

  // «Мои задания» — только незавершённые книги. Прочитанные полностью книги
  // уезжают в «Библиотеку» (/child/library), где их можно перечитать.
  const activeEnrollments = (enrollments as any[]).filter((e) => {
    const total = e.challenge?.totalParts ?? 0;
    const done = e.completedParts ?? 0;
    return !(total > 0 && done >= total);
  });

  const sendMutation = useMutation({
    mutationFn: ({ amount, dreamId }: { amount: number; dreamId: string }) => dreamsApi.send(amount, dreamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dream-my-all"] });
      queryClient.invalidateQueries({ queryKey: ["dream-my"] });
      queryClient.invalidateQueries({ queryKey: ["child-balance", user?.id] });
      toast.success(t("coinsAdded"));
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || t("sendFailed")),
  });

  return (
    <main style={{ padding: "20px 20px 8px", maxWidth: 480, margin: "0 auto" }}>
      <HeroCard name={user?.name || t("reader")} balance={currentBalance} streak={streak} onHistory={() => router.push("/child/purchases")} />

      {currentDreams.length > 0 && currentDreams.map((d) => (
        <DreamCard key={d.id} dream={d} currentBalance={currentBalance} onSend={(amt, dreamId) => sendMutation.mutate({ amount: amt, dreamId })} isSending={sendMutation.isPending} />
      ))}

      <button
        onClick={() => router.push("/child/shop?tab=dream")}
        className="glass"
        style={{ width: "100%", marginBottom: 12, padding: 16, display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, background: "rgba(255,255,255,0.08)" }}
      >
        <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={22} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>{currentDreams.length > 0 ? t("addAnotherDream") : t("addDream")}</p>
          <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>{t("parentsHelp")}</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <button
        onClick={() => router.push("/child/books")}
        className="glass"
        style={{ width: "100%", marginBottom: 12, padding: 16, display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", border: "1px solid rgba(120,200,255,0.35)", borderRadius: 20, background: "rgba(80,160,255,0.12)" }}
      >
        <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BookOpen size={22} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>{t("booksCard")} 📚</p>
          <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{t("booksCardHint")}</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <button
        onClick={() => router.push("/child/collab")}
        aria-label={t("collabCard")}
        style={{ width: "100%", marginBottom: 12, padding: 0, border: "none", background: "transparent", cursor: "pointer", borderRadius: 20, overflow: "hidden", display: "block", lineHeight: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={locale === "kk" ? "/banners/collab-kk.jpg" : "/banners/collab-ru.jpg"}
          alt={t("collabCard")}
          style={{ width: "100%", height: "auto", display: "block", borderRadius: 20 }}
        />
      </button>

      <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{t("myTasks")}</p>

      {isLoading ? (
        <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ width: 176, height: 200, borderRadius: 20, flexShrink: 0, background: "rgba(255,255,255,0.1)", animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : activeEnrollments.length === 0 ? (
        <div className="glass" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <BookOpen size={26} color="#ffffff" strokeWidth={2} />
          </div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#ffffff" }}>{t("noActiveTasks")}</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>{t("askParents")}</p>
        </div>
      ) : (
        <div className="scrollbar-hide" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, marginLeft: -4, paddingLeft: 4 }}>
          {activeEnrollments.map((enrollment, idx) => {
            const ch = enrollment.challenge;
            const colorIdx = ch?.title ? ch.title.charCodeAt(0) % CARD_COLORS.length : idx % CARD_COLORS.length;
            const cardGrad = CARD_COLORS[colorIdx];
            const completedParts: number = enrollment.completedParts ?? 0;
            const totalParts: number = ch?.totalParts ?? 1;
            const progress = totalParts > 0 ? (completedParts / totalParts) * 100 : 0;

            return (
              <button
                key={enrollment.id}
                onClick={() => router.push(`/child/book/${enrollment.id}`)}
                style={{
                  flexShrink: 0,
                  width: 176,
                  borderRadius: 20,
                  overflow: "hidden",
                  textAlign: "left",
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  padding: 0,
                  transition: "transform 0.15s",
                }}
              >
                <div
                  style={{
                    ...(ch?.coverImage ? { aspectRatio: "1 / 1" } : { height: 96 }),
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    padding: 12,
                    background: ch?.coverImage ? `url(${ch.coverImage}) center/cover` : cardGrad,
                  }}
                >
                  {!ch?.coverImage && (
                    <>
                      <p style={{ color: "#ffffff", fontWeight: 900, textAlign: "center", lineHeight: 1.3, fontSize: 12, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.6)", WebkitLineClamp: 3, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
                        {ch?.bookTitle || ch?.title || t("task")}
                      </p>
                      {ch?.bookAuthor && (
                        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 10, margin: "4px 0 0", textAlign: "center", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{ch.bookAuthor}</p>
                      )}
                    </>
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <p style={{ fontWeight: 900, fontSize: 13, color: "#ffffff", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch?.title || t("task")}</p>
                  <div style={{ height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "rgba(255,255,255,0.85)", borderRadius: 9999 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                      {completedParts}/{totalParts} {t("parts")}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 900, color: "#ffd200" }}><CoinIcon size={12} /> +{((enrollment.coinsPerPart ?? 0) * (ch?.totalParts ?? 0)).toLocaleString()}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
        <LanguageSwitcher />
      </div>

      <button
        onClick={() => { clearAuth(); router.push("/auth/child"); }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, width: "100%", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.35)", fontFamily: "inherit" }}
      >
        <LogOut size={12} />
        {t("logout")}
      </button>
    </main>
  );
}

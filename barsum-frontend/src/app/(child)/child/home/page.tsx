"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, LogOut, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";
import { sessionsApi } from "@/lib/api/sessions";
import { useAuthStore } from "@/stores/auth-store";

const CARD_COLORS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f7971e, #ffd200)",
  "linear-gradient(135deg, #fc4a1a, #f7b733)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #0f9b8e, #38ef7d)",
];

function HeroCard({ name, balance, streak }: { name: string; balance: number; streak: number }) {
  return (
    <div className="glass" style={{ padding: "18px 20px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Привет, {name}! 👋</p>
        <p style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
          🪙 {balance.toLocaleString("ru-RU")}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>монет на счету</p>
      </div>
      {streak > 0 && (
        <div className="glass-chip" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 14px" }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <span style={{ fontWeight: 900, fontSize: 16, color: "#ffd200", lineHeight: 1 }}>{streak}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>дней</span>
        </div>
      )}
    </div>
  );
}

function DreamCard({ dream, currentBalance, onSend, isSending }: {
  dream: any; currentBalance: number;
  onSend: (amount: number) => void; isSending: boolean;
}) {
  const [sendAmount, setSendAmount] = useState("");
  const progress = dream.status === "active" && dream.targetCoins > 0
    ? Math.min((dream.savedCoins / dream.targetCoins) * 100, 100) : 0;

  if (dream.status === "pending_approval") {
    return (
      <div className="glass" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,210,0,0.4)" }}>
        <span style={{ fontSize: 28 }}>⏳</span>
        <div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>{dream.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#ffd200" }}>Ждёт одобрения родителя</p>
        </div>
      </div>
    );
  }
  if (dream.status === "rejected") {
    return (
      <div className="glass" style={{ padding: 16, marginBottom: 12, border: "1px solid rgba(255,120,100,0.4)" }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>{dream.name}</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#ffb3b3" }}>
          Мечта отклонена{dream.rejectedReason ? `: ${dream.rejectedReason}` : ""}
        </p>
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
          backgroundImage: `url(${dream.photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {}),
      }}
    >
      {dream.photoUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", borderRadius: 20 }} />}
      <div style={{ position: "relative", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Моя мечта</p>
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
          <span>🪙 {dream.savedCoins.toLocaleString()} накоплено</span>
          <span>цель: {dream.targetCoins.toLocaleString()}</span>
        </div>
        {currentBalance > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="Монет в мечту..."
              className="glass-input"
              style={{ flex: 1, padding: "10px 14px", fontSize: 14, borderRadius: 12 }}
            />
            <button
              onClick={() => {
                const amt = Number(sendAmount);
                if (amt > 0 && amt <= currentBalance) { onSend(amt); setSendAmount(""); }
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

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: sessionsApi.listEnrollments,
    refetchOnMount: "always",
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

  return (
    <main style={{ padding: "20px 20px 8px", maxWidth: 480, margin: "0 auto" }}>
      <HeroCard name={user?.name || "Читатель"} balance={currentBalance} streak={streak} />

      {dream ? (
        <DreamCard dream={dream} currentBalance={currentBalance} onSend={(amt) => sendMutation.mutate(amt)} isSending={sendMutation.isPending} />
      ) : (
        <button
          onClick={() => router.push("/child/shop?tab=dream")}
          className="glass"
          style={{ width: "100%", marginBottom: 12, padding: 16, display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, background: "rgba(255,255,255,0.08)" }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={22} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>Добавь свою мечту!</p>
            <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Родители помогут её осуществить</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Мои книги</p>

      {isLoading ? (
        <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ width: 176, height: 200, borderRadius: 20, flexShrink: 0, background: "rgba(255,255,255,0.1)", animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : (enrollments as any[]).length === 0 ? (
        <div className="glass" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <BookOpen size={26} color="#ffffff" strokeWidth={2} />
          </div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#ffffff" }}>Нет активных заданий</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Попроси родителей записать тебя на курс</p>
        </div>
      ) : (
        <div className="scrollbar-hide" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, marginLeft: -4, paddingLeft: 4 }}>
          {(enrollments as any[]).map((enrollment, idx) => {
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
                <div style={{ height: 96, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 12, background: cardGrad }}>
                  <p style={{ color: "#ffffff", fontWeight: 900, textAlign: "center", lineHeight: 1.3, fontSize: 12, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.3)", WebkitLineClamp: 3, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
                    {ch?.bookTitle || ch?.title || "Задание"}
                  </p>
                  {ch?.bookAuthor && (
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, margin: "4px 0 0", textAlign: "center" }}>{ch.bookAuthor}</p>
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <p style={{ fontWeight: 900, fontSize: 13, color: "#ffffff", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch?.title || "Задание"}</p>
                  <div style={{ height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "rgba(255,255,255,0.85)", borderRadius: 9999 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                      {completedParts}/{totalParts} частей
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 900, color: "#ffd200" }}>🪙 +{(ch?.coinsReward ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => { clearAuth(); router.push("/auth/child"); }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 32, width: "100%", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.35)", fontFamily: "inherit" }}
      >
        <LogOut size={12} />
        Выйти из аккаунта
      </button>
    </main>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { apiClient } from "@/lib/api/client";
import { CoinIcon } from "@/components/CoinIcon";

type ChallengeFilter = "moderation" | "published" | "rejected";

interface Challenge {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  description?: string;
  price: number;
  coinsReward: number;
  totalParts: number;
  status: string;
  authorId: string;
  category?: string;
  ageMin?: number;
  ageMax?: number;
}

const TABS: { key: ChallengeFilter; label: string }[] = [
  { key: "moderation", label: "На модерации" },
  { key: "published", label: "Опубликованы" },
  { key: "rejected", label: "Отклонены" },
];

function statusBadgeStyle(status: string): React.CSSProperties {
  if (status === "moderation") return { background: "rgba(255,180,0,0.25)", color: "#ffd200", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 700 };
  if (status === "published") return { background: "rgba(0,200,100,0.25)", color: "#aaffcc", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 700 };
  return { background: "rgba(220,0,0,0.25)", color: "#ffaaaa", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 700 };
}

function statusLabel(status: string): string {
  if (status === "moderation") return "На модерации";
  if (status === "published") return "Опубликовано";
  if (status === "rejected") return "Отклонено";
  return status;
}

function SkeletonCard() {
  return (
    <div className="glass" style={{ padding: 20, opacity: 0.5, animation: "pulse 2s infinite" }}>
      <div style={{ height: 20, borderRadius: 10, background: "rgba(255,255,255,0.15)", width: "65%", marginBottom: 12 }} />
      <div style={{ height: 16, borderRadius: 10, background: "rgba(255,255,255,0.1)", width: "50%", marginBottom: 8 }} />
      <div style={{ height: 64, borderRadius: 12, background: "rgba(255,255,255,0.1)" }} />
    </div>
  );
}

export default function AdminChallengesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ChallengeFilter>("moderation");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, isError } = useQuery<Challenge[]>({
    queryKey: ["admin-challenges", activeTab],
    queryFn: () => adminApi.challenges(activeTab),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/challenges/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/challenges/${id}/reject`, { reason }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      setRejectingId(null);
      setRejectReason("");
    },
  });

  return (
    <main style={{ minHeight: "100dvh", padding: "0 0 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "52px 20px 20px" }}>
        <button
          onClick={() => router.push("/admin")}
          className="glass-chip"
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 14 }}
          aria-label="Назад"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          Назад
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#ffffff" }}>
          Модерация заданий
        </h1>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(0,0,0,0.2)", borderRadius: 9999, padding: 4 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "inherit",
                background: activeTab === tab.key ? "rgba(255,255,255,0.22)" : "transparent",
                color: activeTab === tab.key ? "#ffffff" : "rgba(255,255,255,0.5)",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : isError ? (
          <div className="glass" style={{ padding: 20, textAlign: "center", color: "#ffaaaa" }}>
            Ошибка загрузки. Попробуйте ещё раз.
          </div>
        ) : !data || data.length === 0 ? (
          <div className="glass" style={{ padding: 40, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <BookOpen size={28} color="#ffffff" strokeWidth={2} />
            </div>
            <p style={{ margin: 0, fontWeight: 900, color: "#ffffff" }}>Нет заданий</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.map((challenge) => (
              <div key={challenge.id} className="glass" style={{ padding: 18 }}>
                {/* Title row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#ffffff", flex: 1, paddingRight: 8, lineHeight: 1.3 }}>
                    {challenge.title}
                  </h3>
                  <span style={statusBadgeStyle(challenge.status)}>{statusLabel(challenge.status)}</span>
                </div>

                {/* Book info */}
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                  📖 {challenge.bookTitle}{challenge.bookAuthor ? ` — ${challenge.bookAuthor}` : ""}
                </p>

                {/* Meta chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {challenge.category && (
                    <span className="glass-chip" style={{ padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "#ffffff" }}>
                      {challenge.category}
                    </span>
                  )}
                  {(challenge.ageMin != null || challenge.ageMax != null) && (
                    <span className="glass-chip" style={{ padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "#ffffff" }}>
                      {challenge.ageMin ?? "?"}–{challenge.ageMax ?? "?"} лет
                    </span>
                  )}
                  <span className="glass-chip" style={{ padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "#ffffff" }}>
                    {challenge.totalParts} частей
                  </span>
                </div>

                {/* Price / coins row */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Цена</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#ffffff" }}>{challenge.price} ₸</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Награда</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "rgba(255,255,255,0.85)" }}>{challenge.coinsReward} <CoinIcon size={13} /></p>
                  </div>
                </div>

                {/* Description */}
                {challenge.description && (
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                    {challenge.description.length > 200 ? challenge.description.slice(0, 200) + "…" : challenge.description}
                  </p>
                )}

                {/* Actions for moderation */}
                {challenge.status === "moderation" && rejectingId !== challenge.id && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => approveMutation.mutate(challenge.id)}
                      disabled={approveMutation.isPending}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "1px solid rgba(100,255,150,0.35)", background: "rgba(0,200,100,0.25)", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: approveMutation.isPending ? 0.5 : 1 }}
                    >
                      Опубликовать
                    </button>
                    <button
                      onClick={() => { setRejectingId(challenge.id); setRejectReason(""); }}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "1px solid rgba(255,100,100,0.35)", background: "rgba(220,0,0,0.25)", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Отклонить
                    </button>
                  </div>
                )}

                {/* Reject inline form */}
                {challenge.status === "moderation" && rejectingId === challenge.id && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Причина отклонения (необязательно)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="glass-input"
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => rejectMutation.mutate({ id: challenge.id, reason: rejectReason })}
                        disabled={rejectMutation.isPending}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "1px solid rgba(255,100,100,0.35)", background: "rgba(220,0,0,0.25)", color: "#ffffff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: rejectMutation.isPending ? 0.5 : 1 }}
                      >
                        {rejectMutation.isPending ? "Отклоняем..." : "Подтвердить отклонение"}
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(""); }}
                        className="glass-chip"
                        style={{ padding: "10px 16px", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 13 }}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

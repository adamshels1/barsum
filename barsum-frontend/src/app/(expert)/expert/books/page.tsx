"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, ChevronLeft, Plus, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { challengesApi } from "@/lib/api/challenges";

interface Challenge {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  totalParts: number;
  price: number;
  coinsReward: number;
  category: string;
  ageMin: number;
  ageMax: number;
  status: "draft" | "moderation" | "published" | "rejected";
  rejectedReason?: string;
  membersCount: number;
}

type FilterStatus = "all" | "draft" | "moderation" | "published" | "rejected";

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "draft", label: "Черновик" },
  { key: "moderation", label: "На модерации" },
  { key: "published", label: "Опубликован" },
  { key: "rejected", label: "Отклонён" },
];

function statusBadgeStyle(status: string): React.CSSProperties {
  if (status === "moderation") return { background: "rgba(255,180,0,0.25)", color: "#ffd200", borderRadius: 9999, padding: "4px 10px", fontSize: 11, fontWeight: 700 };
  if (status === "published") return { background: "rgba(0,200,100,0.25)", color: "#aaffcc", borderRadius: 9999, padding: "4px 10px", fontSize: 11, fontWeight: 700 };
  if (status === "rejected") return { background: "rgba(220,0,0,0.25)", color: "#ffaaaa", borderRadius: 9999, padding: "4px 10px", fontSize: 11, fontWeight: 700 };
  return { background: "rgba(255,255,255,0.16)", color: "#ffffff", borderRadius: 9999, padding: "4px 10px", fontSize: 11, fontWeight: 700, border: "1px solid rgba(255,255,255,0.26)" };
}

function statusBadgeLabel(status: string): string {
  if (status === "draft") return "Черновик";
  if (status === "moderation") return "На модерации";
  if (status === "published") return "Опубликован";
  if (status === "rejected") return "Отклонён";
  return status;
}

export default function ExpertBooksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>("all");

  const { data: allChallenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ["my-challenges"],
    queryFn: challengesApi.my,
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => challengesApi.submit(id),
    onSuccess: () => {
      toast.success("Задание отправлено на модерацию!");
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["challenges-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Ошибка отправки");
    },
  });

  const filtered =
    filter === "all" ? allChallenges : allChallenges.filter((c) => c.status === filter);

  return (
    <main style={{ minHeight: "100dvh", padding: "0 0 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            className="glass-chip"
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 14 }}
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
            Назад
          </button>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#ffffff" }}>Мои задания</h1>
        </div>
        <button
          onClick={() => router.push("/expert/create")}
          className="btn-white"
          style={{ color: "#4776e6", padding: "10px 18px", width: "auto", fontSize: 14, gap: 6, display: "flex", alignItems: "center" }}
        >
          <Plus size={16} strokeWidth={3} />
          Создать
        </button>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            const count = f.key === "all" ? allChallenges.length : allChallenges.filter((c) => c.status === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: 9999,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: "inherit",
                  background: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.16)",
                  color: isActive ? "#4776e6" : "#ffffff",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
                {count > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass" style={{ height: 112, animation: "pulse 2s infinite", opacity: 0.5 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass" style={{ padding: 40, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <BookMarked size={28} color="#ffffff" strokeWidth={2} />
            </div>
            <p style={{ margin: 0, fontWeight: 900, color: "#ffffff" }}>
              {filter === "all" ? "Нет заданий" : "Нет заданий в этой категории"}
            </p>
            {filter === "all" && (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Создайте первое задание</p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((challenge) => (
              <div key={challenge.id} className="glass" style={{ padding: 16 }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {challenge.title}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {challenge.bookTitle}{challenge.bookAuthor ? ` · ${challenge.bookAuthor}` : ""}
                    </p>
                  </div>
                  <span style={statusBadgeStyle(challenge.status)}>{statusBadgeLabel(challenge.status)}</span>
                </div>

                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>
                  <span>📚 {challenge.totalParts} частей</span>
                  <span>💰 {challenge.price.toLocaleString("ru-RU")} ₸</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Users2 size={12} /> {challenge.membersCount}
                  </span>
                </div>

                {/* Rejected reason */}
                {challenge.status === "rejected" && challenge.rejectedReason && (
                  <div style={{ background: "rgba(220,0,0,0.2)", color: "rgba(255,160,160,0.9)", borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontSize: 12 }}>
                    <span style={{ fontWeight: 700 }}>Причина отклонения: </span>
                    {challenge.rejectedReason}
                  </div>
                )}

                {/* Action buttons */}
                {(challenge.status === "draft" || challenge.status === "rejected") && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => router.push(`/expert/create?edit=${challenge.id}`)}
                      className="glass-chip"
                      style={{ flex: 1, padding: "10px 0", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 13 }}
                    >
                      Редактировать
                    </button>
                    {challenge.status === "draft" && (
                      <button
                        onClick={() => submitMutation.mutate(challenge.id)}
                        disabled={submitMutation.isPending}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "1px solid rgba(100,255,150,0.35)", background: "rgba(0,200,100,0.25)", color: "#ffffff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: submitMutation.isPending ? 0.6 : 1 }}
                      >
                        {submitMutation.isPending ? "Отправка..." : "На модерацию"}
                      </button>
                    )}
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

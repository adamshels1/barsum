"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Lock } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { sessionsApi } from "@/lib/api/sessions";

interface Session {
  id: string;
  partNumber: number;
  phase: string;
  status: "pending" | "completed" | "failed";
}

interface Enrollment {
  id: string;
  completedParts: number;
  challenge: {
    id: string;
    title: string;
    bookTitle: string;
    bookAuthor: string;
    totalParts: number;
    pagesPerPart: number;
    coinsReward: number;
  };
}

function isSessionDone(s: Session) {
  return s.status === "completed" || s.phase === "done";
}

function PartState({ sessions, partNumber }: {
  sessions: Session[];
  partNumber: number;
}) {
  const session = sessions.find((s) => s.partNumber === partNumber);
  if (session?.status === "completed") return "completed";
  if (session && isSessionDone(session)) return "completed";
  if (session && !isSessionDone(session)) return "current";
  // No session yet — check if previous part is done to unlock
  if (partNumber === 1) return "unlocked";
  const prevSession = sessions.find((s) => s.partNumber === partNumber - 1);
  if (prevSession && isSessionDone(prevSession)) return "unlocked";
  return "locked";
}

export default function BookPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: enrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["enrollments"],
    queryFn: sessionsApi.listEnrollments,
  });

  const enrollment = (enrollments as Enrollment[]).find((e) => e.id === enrollmentId);
  const ch = enrollment?.challenge;

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["sessions-by-enrollment", enrollmentId],
    queryFn: () => sessionsApi.listByEnrollment(enrollmentId),
    enabled: !!enrollmentId,
  });

  const createSession = useMutation({
    mutationFn: () => sessionsApi.create(enrollmentId),
    onSuccess: (session: any) => {
      queryClient.invalidateQueries({ queryKey: ["sessions-by-enrollment", enrollmentId] });
      router.push(`/child/session/${session.id}`);
    },
  });

  const goToSession = (sessionId: string) => {
    router.push(`/child/session/${sessionId}`);
  };

  const totalParts = ch?.totalParts ?? 0;
  const pagesPerPart = ch?.pagesPerPart ?? 0;
  const completedParts = (sessions as Session[]).filter((s) => s.status === "completed").length;
  const allDone = completedParts >= totalParts && totalParts > 0;

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 40px", maxWidth: 512, margin: "0 auto" }}>
      {/* Back */}
      <button
        onClick={() => router.push("/child/home")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 700, fontFamily: "inherit", marginBottom: 20, padding: 0 }}
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
        Назад
      </button>

      {/* Book header */}
      <div className="glass" style={{ padding: 20, borderRadius: 20, marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          📖 Книга
        </p>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#ffffff", lineHeight: 1.2 }}>
          {ch?.bookTitle || ch?.title || "Загрузка..."}
        </h1>
        {ch?.bookAuthor && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{ch.bookAuthor}</p>
        )}

        {/* Progress bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>
            <span>Прогресс</span>
            <span>{completedParts} из {totalParts} частей</span>
          </div>
          <div style={{ height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: totalParts > 0 ? `${(completedParts / totalParts) * 100}%` : "0%",
                background: "rgba(255,255,255,0.9)",
                borderRadius: 9999,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>
      </div>

      {allDone && (
        <div className="glass" style={{ padding: 20, borderRadius: 20, marginBottom: 20, textAlign: "center", background: "rgba(0,200,100,0.15)", border: "1px solid rgba(100,255,150,0.3)" }}>
          <p style={{ margin: 0, fontSize: 32 }}>🏆</p>
          <p style={{ margin: "8px 0 0", fontWeight: 900, fontSize: 18, color: "#ffffff" }}>Книга прочитана!</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>Ты молодец — прочитал все части</p>
        </div>
      )}

      {/* Parts list */}
      <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Части книги
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: totalParts }, (_, i) => {
          const partNum = i + 1;
          const state = PartState({ sessions: sessions as Session[], partNumber: partNum });
          const session = (sessions as Session[]).find((s) => s.partNumber === partNum);
          const startPage = (partNum - 1) * pagesPerPart + 1;
          const endPage = partNum * pagesPerPart;

          const isCompleted = state === "completed";
          const isCurrent = state === "current";
          const isUnlocked = state === "unlocked";
          const isLocked = state === "locked";

          return (
            <button
              key={partNum}
              disabled={isLocked || createSession.isPending}
              onClick={() => {
                if (isCompleted && session) { goToSession(session.id); return; }
                if (isCurrent && session) { goToSession(session.id); return; }
                if (isUnlocked) { createSession.mutate(); }
              }}
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: 16,
                border: isLocked
                  ? "1px solid rgba(255,255,255,0.08)"
                  : isCurrent
                    ? "1px solid rgba(255,255,255,0.45)"
                    : isCompleted
                      ? "1px solid rgba(100,255,150,0.3)"
                      : "1px solid rgba(255,255,255,0.25)",
                background: isLocked
                  ? "rgba(255,255,255,0.04)"
                  : isCurrent
                    ? "rgba(255,255,255,0.18)"
                    : isCompleted
                      ? "rgba(0,200,100,0.12)"
                      : "rgba(255,255,255,0.1)",
                cursor: isLocked ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16,
                textAlign: "left",
                fontFamily: "inherit",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                opacity: isLocked ? 0.5 : 1,
                transition: "all 0.2s",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isCompleted
                    ? "rgba(100,255,150,0.25)"
                    : isCurrent
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.1)",
                  fontSize: 20,
                }}
              >
                {isCompleted ? "✅" : isCurrent ? "▶" : isLocked ? <Lock size={18} color="rgba(255,255,255,0.4)" /> : "📖"}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: isLocked ? "rgba(255,255,255,0.4)" : "#ffffff" }}>
                  Часть {partNum}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
                  {pagesPerPart > 0 ? `стр. ${startPage}–${endPage}` : `Часть ${partNum} из ${totalParts}`}
                </p>
              </div>

              {/* Status / CTA */}
              <div style={{ flexShrink: 0 }}>
                {isCompleted && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#aaffcc", background: "rgba(0,200,100,0.2)", padding: "4px 10px", borderRadius: 9999 }}>
                    Готово
                  </span>
                )}
                {isCurrent && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#ffffff", background: "rgba(255,255,255,0.25)", padding: "4px 10px", borderRadius: 9999 }}>
                    Продолжить
                  </span>
                )}
                {isUnlocked && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#4776e6", background: "rgba(255,255,255,0.9)", padding: "4px 10px", borderRadius: 9999 }}>
                    Читать
                  </span>
                )}
                {isLocked && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.3)", padding: "4px 10px" }}>
                    🔒
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {totalParts === 0 && (
        <div className="glass" style={{ padding: 40, textAlign: "center", borderRadius: 20 }}>
          <p style={{ margin: 0, fontSize: 36 }}>📚</p>
          <p style={{ margin: "12px 0 0", fontWeight: 900, fontSize: 16, color: "#ffffff" }}>Загружаем книгу...</p>
        </div>
      )}
    </main>
  );
}

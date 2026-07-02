"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { sessionsApi } from "@/lib/api/sessions";

interface StudentSession {
  id: string;
  partNumber: number;
  status: "pending" | "completed" | "failed";
  aiScore: number | null;
  createdAt: string;
}

interface StudentBook {
  enrollmentId: string;
  challengeId: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string | null;
  totalParts: number;
  completedParts: number;
  sessions: StudentSession[];
}

interface StudentDetail {
  child: { id: string; name: string; age: number; photoUrl?: string | null; streak: number };
  books: StudentBook[];
}

const STATUS_CONFIG = {
  completed: { icon: "✅", label: "Прочитано", bg: "rgba(34,197,94,0.3)", color: "#ffffff" },
  pending: { icon: "⏳", label: "В процессе", bg: "rgba(255,200,0,0.25)", color: "#ffffff" },
  failed: { icon: "❌", label: "Не сдано", bg: "rgba(239,68,68,0.35)", color: "#ffffff" },
} satisfies Record<StudentSession["status"], { icon: string; label: string; bg: string; color: string }>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function BookCard({ book }: { book: StudentBook }) {
  const [open, setOpen] = useState(false);
  const progress = book.totalParts > 0 ? Math.min((book.completedParts / book.totalParts) * 100, 100) : 0;
  const sortedSessions = [...book.sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="glass" style={{ borderRadius: 18, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", padding: 16, display: "flex", alignItems: "center", gap: 14, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
      >
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.bookTitle} style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📖</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.bookTitle}</p>
          <div style={{ height: 5, borderRadius: 9999, background: "rgba(255,255,255,0.15)", overflow: "hidden", margin: "6px 0 4px" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "rgba(255,255,255,0.85)", borderRadius: 9999 }} />
          </div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
            {book.completedParts}/{book.totalParts} частей
          </p>
        </div>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          {sortedSessions.length === 0 ? (
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Активности пока нет</p>
          ) : (
            sortedSessions.map((s) => {
              const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pending;
              return (
                <div key={s.id} style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 12px" }}>
                  <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#ffffff" }}>Часть {s.partNumber}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{formatDate(s.createdAt)}</p>
                  </div>
                  {s.aiScore != null && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#ffd200" }}>{Math.round(Number(s.aiScore))}%</span>
                  )}
                  <span style={{ fontSize: 10.5, padding: "3px 8px", borderRadius: 9999, fontWeight: 800, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function ExpertStudentDetailPage() {
  const router = useRouter();
  const { childId } = useParams<{ childId: string }>();

  const { data, isLoading } = useQuery<StudentDetail>({
    queryKey: ["expert-student", childId],
    queryFn: () => sessionsApi.getStudent(childId),
    enabled: !!childId,
  });

  const totalCompleted = data?.books.reduce((sum, b) => sum + b.completedParts, 0) ?? 0;
  const totalParts = data?.books.reduce((sum, b) => sum + b.totalParts, 0) ?? 0;

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 40px", maxWidth: 520, margin: "0 auto" }}>
      <button
        onClick={() => router.push("/expert/students")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 700, fontFamily: "inherit", marginBottom: 20, padding: 0 }}
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
        Назад
      </button>

      {isLoading || !data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: 18, background: "rgba(255,255,255,0.1)", animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            {data.child.photoUrl ? (
              <img src={data.child.photoUrl} alt={data.child.name} style={{ width: 64, height: 64, borderRadius: 20, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#ffffff", flexShrink: 0 }}>
                {data.child.name[0]}
              </div>
            )}
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{data.child.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{data.child.age} лет</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>🔥 {data.child.streak} дней</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            <div className="glass" style={{ padding: "14px 12px", textAlign: "center", borderRadius: 16 }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff" }}>{data.books.length}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>книг у вас</p>
            </div>
            <div className="glass" style={{ padding: "14px 12px", textAlign: "center", borderRadius: 16 }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff" }}>{totalCompleted}/{totalParts}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>частей прочитано</p>
            </div>
          </div>

          <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 900, color: "#ffffff" }}>Прогресс по книгам</h2>
          {data.books.length === 0 ? (
            <div className="glass" style={{ padding: 32, textAlign: "center", borderRadius: 18 }}>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Нет активных книг</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.books.map((b) => <BookCard key={b.enrollmentId} book={b} />)}
            </div>
          )}
        </>
      )}
    </main>
  );
}

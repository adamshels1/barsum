"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { sessionsApi } from "@/lib/api/sessions";

interface Session {
  id: string;
  enrollmentId: string;
  childId: string;
  day: number;
  phase: "read" | "recording" | "transcribing" | "analyzing" | "done";
  audioUrl?: string;
  transcription?: string;
  aiScore?: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

function PulsingDots() {
  return (
    <div className="flex justify-center gap-2 my-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full"
          style={{
            background: "var(--purple)",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1}}`}</style>
    </div>
  );
}

// ─── Phase: read + record together ────────────────────────────────────────────
function PhaseRead({
  session,
  dayText,
  onUploaded,
}: {
  session: Session;
  dayText: string | null;
  onUploaded: () => void;
}) {
  const [stage, setStage] = useState<"before" | "recording" | "recorded">("before");
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pagesPerDay = 10;
  const startPage = (session.day - 1) * pagesPerDay + 1;
  const endPage = session.day * pagesPerDay;

  const startRecording = async () => {
    try {
      setError(null);
      setRecordingTime(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setStage("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setStage("recording");
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 179) { stopRecording(); return 180; }
          return t + 1;
        });
      }, 1000);
    } catch {
      setError("Нет доступа к микрофону");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleUpload = async () => {
    if (!audioBlob) return;
    setUploading(true);
    setError(null);
    try {
      const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      await sessionsApi.uploadAudio(session.id, file);
      onUploaded();
    } catch {
      setError("Ошибка загрузки. Попробуй ещё раз.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Text block */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--surface)" }}
      >
        <p
          className="text-xs font-semibold uppercase mb-3"
          style={{ color: "var(--muted)" }}
        >
          День {session.day} · Страницы {startPage}–{endPage}
        </p>
        {dayText ? (
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--ink)", fontFamily: "Georgia, serif" }}
          >
            {dayText}
          </p>
        ) : (
          <p className="text-sm italic" style={{ color: "var(--muted)" }}>
            Прочитай страницы {startPage}–{endPage} из книги
          </p>
        )}
      </div>

      {/* Recording controls */}
      {stage === "before" && (
        <button
          onClick={startRecording}
          className="w-full py-4 rounded-2xl font-extrabold text-white text-lg"
          style={{ background: "var(--green)" }}
        >
          🎙️ Начать читать вслух
        </button>
      )}

      {stage === "recording" && (
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-full rounded-2xl p-4 flex items-center justify-center gap-3"
            style={{ background: "#FEE2E2" }}
          >
            <span
              className="text-2xl font-extrabold tabular-nums"
              style={{ color: "#DC2626" }}
            >
              ● {formatTime(recordingTime)}
            </span>
            <span className="text-sm" style={{ color: "#DC2626" }}>
              Читаю вслух...
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="w-full py-4 rounded-2xl font-extrabold text-white text-lg"
            style={{ background: "#DC2626" }}
          >
            ⏹ Закончил читать
          </button>
        </div>
      )}

      {stage === "recorded" && (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: "var(--surface)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>
              ✅ Запись готова! ({formatTime(recordingTime)})
            </p>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-4 rounded-2xl font-extrabold text-white text-lg"
            style={{ background: uploading ? "#A78BFA" : "var(--purple)" }}
          >
            {uploading ? "Отправляем..." : "⬆️ Отправить запись"}
          </button>
          <button
            onClick={() => { setAudioBlob(null); setStage("before"); setRecordingTime(0); }}
            className="w-full py-3 rounded-2xl font-semibold text-sm"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            Прочитать заново
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm font-semibold text-center" style={{ color: "#DC2626" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Phase: processing (transcribing / analyzing) ─────────────────────────────
function PhaseProcessing() {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-6xl">🤖</div>
      <div className="text-center">
        <h2 className="text-2xl font-extrabold mb-1" style={{ color: "var(--ink)" }}>
          AI проверяет...
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Обрабатываем запись, подожди немного
        </p>
      </div>
      <PulsingDots />
    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#7B61FF", "#1FA463", "#EA8C2D", "#E879A0", "#38BDF8", "#F59E0B"];

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${5 + (i * 47) % 90}%`,
            top: "-10px",
            width: 10,
            height: 10,
            borderRadius: i % 3 === 0 ? "50%" : 2,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animation: `confettiFall ${1.5 + (i % 5) * 0.3}s ease-in ${(i % 8) * 0.15}s both`,
            transform: `rotate(${i * 30}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes coinPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes streakPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

// ─── Phase: done ──────────────────────────────────────────────────────────────
function PhaseDone({ session }: { session: Session }) {
  const router = useRouter();
  const isCompleted = session.status === "completed";

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      {isCompleted && <Confetti />}
      {isCompleted ? (
        <>
          <div className="text-7xl" style={{ animation: "coinPop 0.5s ease both" }}>🏆</div>
          <div>
            <h2 className="text-2xl font-extrabold mb-1" style={{ color: "var(--ink)" }}>
              Отлично!
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Ты прочитал сегодня — молодец!
            </p>
          </div>
          <div className="w-full rounded-2xl p-6 space-y-2" style={{ background: "var(--surface)" }}>
            <p className="text-4xl" style={{ animation: "streakPulse 0.8s ease 0.5s both" }}>🔥</p>
            <div style={{ animation: "coinPop 0.6s ease 0.3s both" }}>
              <p className="text-2xl font-extrabold" style={{ color: "var(--green)" }}>
                +500 монет начислено!
              </p>
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Серия продолжается — так держать!
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="text-7xl">📋</div>
          <div>
            <h2 className="text-2xl font-extrabold mb-1" style={{ color: "var(--ink)" }}>
              Почти готово!
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Результат отправлен на проверку родителю
            </p>
          </div>
          <div className="w-full rounded-2xl p-4" style={{ background: "#FEF3C7" }}>
            <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
              👨‍👩‍👧 Родитель проверит и начислит монеты
            </p>
          </div>
        </>
      )}
      <button
        onClick={() => router.push("/child/home")}
        className="w-full py-4 rounded-2xl font-extrabold text-white text-lg"
        style={{ background: "var(--purple)" }}
      >
        🏠 На главную
      </button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const isPolling = (data: Session | undefined) =>
    data?.phase === "transcribing" || data?.phase === "analyzing";

  const { data: session, isLoading } = useQuery<Session>({
    queryKey: ["session", id],
    queryFn: () => sessionsApi.get(id),
    refetchInterval: (query) => (isPolling(query.state.data) ? 3000 : false),
  });

  const { data: dayTextData } = useQuery<{ text: string | null; day: number }>({
    queryKey: ["session-text", id],
    queryFn: () => sessionsApi.getDayText(id),
    enabled: !!session && (session.phase === "read" || session.phase === "recording"),
  });

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: ["session", id] });

  if (isLoading || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <PulsingDots />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-extrabold text-white flex-shrink-0"
          style={{ background: "var(--purple)" }}
        >
          {session.day}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>
            День {session.day}
          </p>
          <p className="font-extrabold text-sm" style={{ color: "var(--ink)" }}>
            Ежедневное чтение
          </p>
        </div>
      </div>

      {/* Phase content */}
      {(session.phase === "read" || session.phase === "recording") && (
        <PhaseRead
          session={session}
          dayText={dayTextData?.text ?? null}
          onUploaded={refetch}
        />
      )}
      {(session.phase === "transcribing" || session.phase === "analyzing") && (
        <PhaseProcessing />
      )}
      {session.phase === "done" && <PhaseDone session={session} />}
    </main>
  );
}

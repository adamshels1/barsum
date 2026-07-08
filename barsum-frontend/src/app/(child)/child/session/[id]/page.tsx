"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Home, Mic, MicOff, Send, RotateCcw, Bot } from "lucide-react";
import { useRef, useState } from "react";
import { sessionsApi } from "@/lib/api/sessions";
import { CoinIcon } from "@/components/CoinIcon";

interface Session {
  id: string;
  enrollmentId: string;
  childId: string;
  partNumber: number;
  phase: "read" | "recording" | "transcribing" | "analyzing" | "done";
  audioUrl?: string;
  transcription?: string;
  aiScore?: number;
  status: "pending" | "completed" | "failed";
  coinsPerPart: number;
  createdAt: string;
  lastError?: string | null;
  aiFeedback?: string | null;
}

function PulsingDots() {
  return (
    <div className="flex justify-center gap-2 my-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full"
          style={{
            background: "rgba(255,255,255,0.85)",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1}}`}</style>
    </div>
  );
}

// Разбивает текст части на читаемые абзацы (как в книге):
// уважает переносы строк из данных и выносит каждую реплику диалога («— …»)
// на отдельную строку, чтобы не было сплошной «стены текста».
function toReadingParagraphs(raw: string): { text: string; isDialogue: boolean }[] {
  let t = raw.replace(/\r\n/g, "\n").trim();
  // Новую реплику диалога («— Реплика») выносим на отдельную строку, но только
  // если после тире идёт заглавная буква (начало реплики). Строчная буква после
  // тире — это ремарка автора («— спросила она»), её оставляем на той же строке.
  t = t.replace(/([.!?…»"])\s+(—|–|-)\s+([А-ЯЁA-Z«])/g, "$1\n$2 $3");
  const lines = t
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.map((text) => ({
    text,
    isDialogue: /^(—|–|-)\s/.test(text),
  }));
}

const MAX_RECORDING_SECONDS = 600; // 10 минут

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
  const mimeRef = useRef<string>("audio/webm");

  // Выбираем кодек, который реально поддерживает браузер. Chrome — webm/opus,
  // Safari webm НЕ поддерживает и без этого обрывает запись досрочно → mp4.
  const pickMimeType = () => {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
      for (const c of candidates) if (MediaRecorder.isTypeSupported(c)) return c;
    }
    return "";
  };

  const extForMime = (mime: string) => {
    if (mime.includes("mp4") || mime.includes("mpeg") || mime.includes("m4a")) return "mp4";
    if (mime.includes("ogg")) return "ogg";
    return "webm";
  };

  const startRecording = async () => {
    try {
      setError(null);
      setRecordingTime(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = pickMimeType();
      const mr = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);
      // фактический тип, как его выставил рекордер (Safari может подставить свой)
      mimeRef.current = (mr.mimeType || preferred || "audio/webm").split(";")[0];
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onerror = () => { setError("Сбой записи. Попробуй ещё раз."); stopRecording(); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        setAudioBlob(blob);
        setStage("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };
      // если ОС/браузер оборвёт микрофонный трек сам — корректно завершаем запись
      stream.getAudioTracks().forEach((t) => {
        t.onended = () => { if (mr.state === "recording") stopRecording(); };
      });
      mr.start(1000); // timeslice: сбрасывать данные каждую секунду — критично для Safari
      mediaRecorderRef.current = mr;
      setStage("recording");
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= MAX_RECORDING_SECONDS - 1) { stopRecording(); return MAX_RECORDING_SECONDS; }
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
      const type = mimeRef.current || "audio/webm";
      const file = new File([audioBlob], `recording.${extForMime(type)}`, { type });
      await sessionsApi.uploadAudio(session.id, file, recordingTime);
      onUploaded();
    } catch {
      setError("Ошибка загрузки. Попробуй ещё раз.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Recording controls — наверху экрана, чтобы не листать до кнопки */}
      {stage === "before" && (
        <>
          {session.lastError && (
            <div
              className="glass"
              style={{ padding: 14, borderRadius: 16, background: "rgba(255,120,60,0.18)", border: "1px solid rgba(255,150,80,0.35)" }}
            >
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#ffe0c2" }}>{session.lastError}</p>
            </div>
          )}
          <button
            onClick={startRecording}
            style={{
              width: "100%",
              padding: "18px 0",
              borderRadius: 9999,
              background: "rgba(255,255,255,0.9)",
              color: "#4776e6",
              fontWeight: 900,
              fontSize: 16,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <Mic size={20} strokeWidth={2.5} />
            Начать читать вслух
          </button>
        </>
      )}

      {stage === "recording" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            className="glass"
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              background: "rgba(220,0,0,0.2)",
              border: "1px solid rgba(255,100,100,0.35)",
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: "#ffaaaa" }}>
              ● {formatTime(recordingTime)}
            </span>
            <span style={{ fontSize: 14, color: "#ffbbbb" }}>Читаю вслух...</span>
          </div>
          <button
            onClick={stopRecording}
            style={{
              width: "100%",
              padding: "18px 0",
              borderRadius: 9999,
              background: "rgba(220,0,0,0.3)",
              border: "1px solid rgba(255,100,100,0.4)",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: 16,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <MicOff size={20} strokeWidth={2.5} />
            Закончил читать
          </button>
        </div>
      )}

      {stage === "recorded" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            className="glass"
            style={{ padding: 16, borderRadius: 20, textAlign: "center", background: "rgba(0,200,100,0.2)", border: "1px solid rgba(100,255,150,0.3)" }}
          >
            <p style={{ fontSize: 14, fontWeight: 700, color: "#aaffcc", margin: 0 }}>
              Запись готова! ({formatTime(recordingTime)})
            </p>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              width: "100%",
              padding: "18px 0",
              borderRadius: 9999,
              background: uploading ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)",
              color: "#4776e6",
              fontWeight: 900,
              fontSize: 16,
              border: "none",
              cursor: uploading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <Send size={18} strokeWidth={2.5} />
            {uploading ? "Отправляем..." : "Отправить запись"}
          </button>
          <button
            onClick={() => { setAudioBlob(null); setStage("before"); setRecordingTime(0); }}
            className="glass-chip"
            style={{
              width: "100%",
              padding: "14px 0",
              border: "1px solid rgba(255,255,255,0.25)",
              cursor: "pointer",
              fontFamily: "inherit",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <RotateCcw size={15} strokeWidth={2.5} />
            Прочитать заново
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 14, fontWeight: 700, textAlign: "center", color: "#ffd6d6", margin: 0 }}>
          {error}
        </p>
      )}

      {/* Text block */}
      <div className="glass" style={{ padding: 20, borderRadius: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, margin: "0 0 12px" }}>
          Часть {session.partNumber}
        </p>
        {dayText ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {toReadingParagraphs(dayText).map((p, i) => (
              <p
                key={i}
                style={{
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.9)",
                  fontFamily: "Georgia, serif",
                  fontStyle: p.isDialogue ? "italic" : "normal",
                  paddingLeft: p.isDialogue ? 12 : 0,
                  margin: 0,
                }}
              >
                {p.text}
              </p>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 14, fontStyle: "italic", color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Читай вслух эту часть книги
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Phase: processing (transcribing / analyzing) ─────────────────────────────
function PhaseProcessing() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "16px 0" }}>
      <div className="glass" style={{ width: 80, height: 80, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Bot size={36} color="#ffffff" strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", margin: "0 0 6px" }}>
          AI проверяет...
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: 0 }}>
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
function PhaseDone({ session, coinsPerPart }: { session: Session; coinsPerPart: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isCompleted = session.status === "completed";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "16px 0", textAlign: "center" }}>
      {isCompleted && <Confetti />}
      {isCompleted ? (
        <>
          <div style={{ fontSize: 72, animation: "coinPop 0.5s ease both" }}>🏆</div>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", margin: "0 0 6px" }}>Отлично!</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: 0 }}>
              Часть прочитана — молодец!
            </p>
          </div>
          <div className="glass" style={{ width: "100%", padding: 24, borderRadius: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            <p style={{ fontSize: 48, margin: 0, animation: "streakPulse 0.8s ease 0.5s both" }}>🔥</p>
            <div style={{ animation: "coinPop 0.6s ease 0.3s both" }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", margin: 0 }}>
                {coinsPerPart > 0 ? <>+{coinsPerPart} монет начислено! <CoinIcon size={20} /></> : "Часть засчитана! 🎉"}
              </p>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0 }}>
              Серия продолжается — так держать!
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="glass" style={{ width: 80, height: 80, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 40 }}>📋</span>
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", margin: "0 0 6px" }}>Почти готово!</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: 0 }}>
              Результат отправлен на проверку родителю
            </p>
          </div>
          <div
            className="glass"
            style={{ width: "100%", padding: 16, borderRadius: 16, background: "rgba(255,180,0,0.15)", border: "1px solid rgba(255,200,0,0.25)" }}
          >
            <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,220,100,0.9)", margin: 0 }}>
              Эксперт проверит и начислит монеты
            </p>
          </div>
        </>
      )}
      <button
        onClick={() => {
          queryClient.invalidateQueries({ queryKey: ["enrollments"] });
          queryClient.invalidateQueries({ queryKey: ["sessions-by-enrollment"] });
          router.push("/child/home");
        }}
        className="btn-white"
        style={{ color: "#4776e6", display: "flex", alignItems: "center", gap: 10 }}
      >
        <Home size={18} strokeWidth={2.5} />
        На главную
      </button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isPolling = (data: Session | undefined) =>
    data?.phase === "transcribing" || data?.phase === "analyzing";

  const { data: session, isLoading } = useQuery<Session>({
    queryKey: ["session", id],
    queryFn: () => sessionsApi.get(id),
    refetchInterval: (query) => (isPolling(query.state.data) ? 3000 : false),
  });

  const { data: partText } = useQuery<{ text: string | null; imageUrl: string | null; partNumber: number }>({
    queryKey: ["session-text", id],
    queryFn: () => sessionsApi.getPartText(id),
    enabled: !!session && (session.phase === "read" || session.phase === "recording"),
  });
  const dayTextData = partText;

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: ["session", id] });

  if (isLoading || !session) {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PulsingDots />
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 32px", maxWidth: 512, margin: "0 auto" }}>
      {/* Back */}
      {(session.phase === "read" || session.phase === "recording") && (
        <button
          onClick={() => router.push(`/child/book/${session.enrollmentId}`)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 700, fontFamily: "inherit", marginBottom: 20, padding: 0 }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          Назад
        </button>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div
          className="glass-chip"
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 900,
            color: "#ffffff",
            flexShrink: 0,
          }}
        >
          {session.partNumber}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Часть {session.partNumber}
          </p>
          <p style={{ fontWeight: 900, fontSize: 16, color: "#ffffff", margin: "2px 0 0" }}>
            Чтение вслух
          </p>
        </div>
        {session.coinsPerPart > 0 && (
          <div className="glass-chip" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", flexShrink: 0 }}>
            <CoinIcon size={16} />
            <span style={{ fontWeight: 900, fontSize: 14, color: "#ffd200" }}>+{session.coinsPerPart}</span>
          </div>
        )}
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
      {session.phase === "done" && <PhaseDone session={session} coinsPerPart={session.coinsPerPart ?? 0} />}
    </main>
  );
}

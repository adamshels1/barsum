"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Home, Mic, MicOff, Send, RotateCcw, Bot } from "lucide-react";
import { useRef, useState } from "react";
import { sessionsApi } from "@/lib/api/sessions";
import { CoinIcon } from "@/components/CoinIcon";
import { BackButton } from "@/components/BackButton";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    recordFail: "Сбой записи. Попробуй ещё раз.",
    noMic: "Нет доступа к микрофону",
    uploadFail: "Ошибка загрузки. Попробуй ещё раз.",
    startReading: "Начать читать вслух",
    readingNow: "Читаю вслух...",
    doneReading: "Закончил читать",
    recordReady: "Запись готова! ({time})",
    sending: "Отправляем...",
    sendRecording: "Отправить запись",
    readAgain: "Прочитать заново",
    part: "Часть {n}",
    readThisPart: "Читай вслух эту часть книги",
    aiChecking: "AI проверяет...",
    processing: "Обрабатываем запись, подожди немного",
    great: "Отлично!",
    partReadDone: "Часть прочитана — молодец!",
    coinsAdded: "+{coins} монет начислено!",
    partCounted: "Часть засчитана! 🎉",
    streakGoes: "Серия продолжается — так держать!",
    almostDone: "Почти готово!",
    sentToParent: "Результат отправлен на проверку родителю",
    expertWillCheck: "Эксперт проверит и начислит монеты",
    toHome: "На главную",
    back: "Назад",
    readingAloud: "Чтение вслух",
    ownBook: "Своя книжка",
    ownBookRead: "Читай свою книгу вслух",
    ownBookHint: "Таймер идёт — читай до 10 минут. Чем дольше читаешь, тем больше монет!",
    perMin: "/мин",
    retellHeader: "Пересказ",
    retellTitle: "Расскажи своими словами!",
    retellSubtitle: "Закрой книгу и расскажи, о чём ты только что прочитал 🎤",
    retellPromptsTitle: "Можешь ответить на это:",
    retellPrompt1: "Кто главный герой?",
    retellPrompt2: "Что случилось?",
    retellPrompt3: "Чем всё закончилось?",
    retellStart: "Начать рассказ",
    retellNow: "Рассказываю...",
    retellStop: "Закончил рассказ",
    retellSend: "Отправить пересказ",
    retellAgain: "Рассказать заново",
    retellListening: "Слушаем твой пересказ...",
    retellScoreLabel: "Пересказ: {score}/10",
    readScoreLabel: "Чтение: {score}/10",
  },
  kk: {
    recordFail: "Жазу қатесі. Қайта байқап көр.",
    noMic: "Микрофонға рұқсат жоқ",
    uploadFail: "Жүктеу қатесі. Қайта байқап көр.",
    startReading: "Дауыстап оқуды бастау",
    readingNow: "Дауыстап оқып жатырмын...",
    doneReading: "Оқып болдым",
    recordReady: "Жазба дайын! ({time})",
    sending: "Жіберілуде...",
    sendRecording: "Жазбаны жіберу",
    readAgain: "Қайта оқу",
    part: "{n}-бөлім",
    readThisPart: "Кітаптың осы бөлімін дауыстап оқы",
    aiChecking: "AI тексеруде...",
    processing: "Жазба өңделуде, сәл күте тұр",
    great: "Керемет!",
    partReadDone: "Бөлім оқылды — жарайсың!",
    coinsAdded: "+{coins} монета есептелді!",
    partCounted: "Бөлім есептелді! 🎉",
    streakGoes: "Серия жалғасуда — осылай ұста!",
    almostDone: "Дерлік дайын!",
    sentToParent: "Нәтиже ата-ананың тексеруіне жіберілді",
    expertWillCheck: "Сарапшы тексеріп, монета есептейді",
    toHome: "Басты бетке",
    back: "Артқа",
    readingAloud: "Дауыстап оқу",
    ownBook: "Өз кітабы",
    ownBookRead: "Өз кітабыңды дауыстап оқы",
    ownBookHint: "Таймер жүріп жатыр — 10 минутқа дейін оқы. Неғұрлым ұзақ оқысаң, соғұрлым көп монета!",
    perMin: "/мин",
    retellHeader: "Пересказ",
    retellTitle: "Өз сөзіңмен айтып бер!",
    retellSubtitle: "Кітапты жауып, жаңа не оқығаныңды айтып бер 🎤",
    retellPromptsTitle: "Мынаған жауап бере аласың:",
    retellPrompt1: "Басты кейіпкер кім?",
    retellPrompt2: "Не болды?",
    retellPrompt3: "Немен аяқталды?",
    retellStart: "Айтуды бастау",
    retellNow: "Айтып жатырмын...",
    retellStop: "Айтып болдым",
    retellSend: "Пересказды жіберу",
    retellAgain: "Қайта айту",
    retellListening: "Пересказыңды тыңдап жатырмыз...",
    retellScoreLabel: "Пересказ: {score}/10",
    readScoreLabel: "Оқу: {score}/10",
  },
};

interface Session {
  id: string;
  enrollmentId: string;
  childId: string;
  partNumber: number;
  phase: "read" | "recording" | "transcribing" | "analyzing" | "retell" | "retell_transcribing" | "retell_analyzing" | "done";
  audioUrl?: string;
  transcription?: string;
  aiScore?: number;
  status: "pending" | "completed" | "failed";
  coinsPerPart: number;
  coinsPerMinute?: number;
  category?: string;
  bookTitle?: string;
  createdAt: string;
  lastError?: string | null;
  aiFeedback?: string | null;
  retellRequired?: boolean;
  retellScore?: number | null;
  retellFeedback?: string | null;
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
const MAX_RETELL_SECONDS = 120; // пересказ короткий — до 2 минут

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Голосовая запись через MediaRecorder — общий хук (для пересказа).
function useAudioRecorder(maxSeconds: number, msgs: { recordFail: string; noMic: string }) {
  const [stage, setStage] = useState<"before" | "recording" | "recorded">("before");
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef<string>("audio/webm");

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

  const stop = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const start = async () => {
    try {
      setError(null);
      setRecordingTime(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = pickMimeType();
      const mr = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);
      mimeRef.current = (mr.mimeType || preferred || "audio/webm").split(";")[0];
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onerror = () => { setError(msgs.recordFail); stop(); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        setAudioBlob(blob);
        setStage("recorded");
        stream.getTracks().forEach((tr) => tr.stop());
      };
      stream.getAudioTracks().forEach((tr) => {
        tr.onended = () => { if (mr.state === "recording") stop(); };
      });
      mr.start(1000);
      mediaRecorderRef.current = mr;
      setStage("recording");
      timerRef.current = setInterval(() => {
        setRecordingTime((v) => {
          if (v >= maxSeconds - 1) { stop(); return maxSeconds; }
          return v + 1;
        });
      }, 1000);
    } catch {
      setError(msgs.noMic);
    }
  };

  const reset = () => { setAudioBlob(null); setStage("before"); setRecordingTime(0); };

  return { stage, recordingTime, audioBlob, error, mimeRef, extForMime, start, stop, reset };
}

// ─── Phase: read + record together ────────────────────────────────────────────
function PhaseRead({
  session,
  dayText,
  pageImage,
  partTitle,
  ownBook,
  onUploaded,
}: {
  session: Session;
  dayText: string | null;
  pageImage: string | null;
  partTitle: string | null;
  ownBook: boolean;
  onUploaded: () => void;
}) {
  const t = useT(dict);
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
      mr.onerror = () => { setError(t("recordFail")); stopRecording(); };
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
      setError(t("noMic"));
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
      setError(t("uploadFail"));
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
            {t("startReading")}
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
            <span style={{ fontSize: 14, color: "#ffbbbb" }}>{t("readingNow")}</span>
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
            {t("doneReading")}
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
              {t("recordReady", { time: formatTime(recordingTime) })}
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
            {uploading ? t("sending") : t("sendRecording")}
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
            {t("readAgain")}
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 14, fontWeight: 700, textAlign: "center", color: "#ffd6d6", margin: 0 }}>
          {error}
        </p>
      )}

      {/* Own-book: своя бумажная книга — вместо текста показываем инструкцию */}
      {ownBook ? (
        <div className="glass" style={{ padding: 24, borderRadius: 20, textAlign: "center" }}>
          <p style={{ fontSize: 44, margin: "0 0 10px" }}>📖</p>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", margin: "0 0 8px" }}>
            {session.bookTitle && session.bookTitle !== "Своя книга" ? session.bookTitle : t("ownBookRead")}
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.5 }}>
            {t("ownBookHint")}
          </p>
        </div>
      ) : pageImage ? (
      /* Картиночная книга: показываем страницу-иллюстрацию в стиле издательства
         (текст вшит в картинку, ребёнок читает его с иллюстрации). */
      <div className="glass" style={{ padding: 12, borderRadius: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", paddingLeft: 4 }}>
          {t("part", { n: session.partNumber })}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pageImage}
          alt=""
          style={{ width: "100%", borderRadius: 14, display: "block", background: "#fff" }}
        />
      </div>
      ) : (
      /* Text block */
      <div className="glass" style={{ padding: 20, borderRadius: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: partTitle ? 4 : 12, margin: partTitle ? "0 0 4px" : "0 0 12px" }}>
          {t("part", { n: session.partNumber })}
        </p>
        {partTitle && (
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: "0 0 14px", lineHeight: 1.25 }}>
            {partTitle}
          </h2>
        )}
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
            {t("readThisPart")}
          </p>
        )}
      </div>
      )}
    </div>
  );
}

// ─── Phase: retell (расскажи своими словами) ──────────────────────────────────
function PhaseRetell({ session, onUploaded }: { session: Session; onUploaded: () => void }) {
  const t = useT(dict);
  const rec = useAudioRecorder(MAX_RETELL_SECONDS, { recordFail: t("recordFail"), noMic: t("noMic") });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!rec.audioBlob) return;
    setUploading(true);
    setUploadError(null);
    try {
      const type = rec.mimeRef.current || "audio/webm";
      const file = new File([rec.audioBlob], `retell.${rec.extForMime(type)}`, { type });
      await sessionsApi.uploadRetell(session.id, file, rec.recordingTime);
      onUploaded();
    } catch {
      setUploadError(t("uploadFail"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Intro / prompts */}
      <div className="glass" style={{ padding: 22, borderRadius: 20, textAlign: "center" }}>
        <p style={{ fontSize: 44, margin: "0 0 8px" }}>🗣️</p>
        <p style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: "0 0 6px" }}>{t("retellTitle")}</p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.5 }}>{t("retellSubtitle")}</p>
      </div>

      {/* Recorder */}
      {rec.stage === "before" && (
        <button
          onClick={rec.start}
          style={{ width: "100%", padding: "18px 0", borderRadius: 9999, background: "rgba(255,255,255,0.9)", color: "#4776e6", fontWeight: 900, fontSize: 16, border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          <Mic size={20} strokeWidth={2.5} />
          {t("retellStart")}
        </button>
      )}

      {rec.stage === "recording" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="glass" style={{ width: "100%", padding: 16, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(220,0,0,0.2)", border: "1px solid rgba(255,100,100,0.35)" }}>
            <span style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: "#ffaaaa" }}>● {fmtTime(rec.recordingTime)}</span>
            <span style={{ fontSize: 14, color: "#ffbbbb" }}>{t("retellNow")}</span>
          </div>
          <button
            onClick={rec.stop}
            style={{ width: "100%", padding: "18px 0", borderRadius: 9999, background: "rgba(220,0,0,0.3)", border: "1px solid rgba(255,100,100,0.4)", color: "#ffffff", fontWeight: 900, fontSize: 16, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            <MicOff size={20} strokeWidth={2.5} />
            {t("retellStop")}
          </button>
        </div>
      )}

      {rec.stage === "recorded" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="glass" style={{ padding: 16, borderRadius: 20, textAlign: "center", background: "rgba(0,200,100,0.2)", border: "1px solid rgba(100,255,150,0.3)" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#aaffcc", margin: 0 }}>{t("recordReady", { time: fmtTime(rec.recordingTime) })}</p>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{ width: "100%", padding: "18px 0", borderRadius: 9999, background: uploading ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)", color: "#4776e6", fontWeight: 900, fontSize: 16, border: "none", cursor: uploading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}
          >
            <Send size={18} strokeWidth={2.5} />
            {uploading ? t("sending") : t("retellSend")}
          </button>
          <button
            onClick={rec.reset}
            className="glass-chip"
            style={{ width: "100%", padding: "14px 0", border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <RotateCcw size={15} strokeWidth={2.5} />
            {t("retellAgain")}
          </button>
        </div>
      )}

      {(rec.error || uploadError) && (
        <p style={{ fontSize: 14, fontWeight: 700, textAlign: "center", color: "#ffd6d6", margin: 0 }}>{rec.error || uploadError}</p>
      )}

      {/* Guiding prompts */}
      <div className="glass" style={{ padding: 20, borderRadius: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>{t("retellPromptsTitle")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[t("retellPrompt1"), t("retellPrompt2"), t("retellPrompt3")].map((q, i) => (
            <p key={i} style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", margin: 0, display: "flex", gap: 8 }}>
              <span>{["🦸", "❓", "🏁"][i]}</span>
              <span>{q}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Phase: processing (transcribing / analyzing) ─────────────────────────────
function PhaseProcessing() {
  const t = useT(dict);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "16px 0" }}>
      <div className="glass" style={{ width: 80, height: 80, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Bot size={36} color="#ffffff" strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", margin: "0 0 6px" }}>
          {t("aiChecking")}
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: 0 }}>
          {t("processing")}
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
function PhaseDone({ session, coinsPerPart, ownBook }: { session: Session; coinsPerPart: number; ownBook: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useT(dict);
  const isCompleted = session.status === "completed";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "16px 0", textAlign: "center" }}>
      {isCompleted && <Confetti />}
      {isCompleted ? (
        <>
          <div style={{ fontSize: 72, animation: "coinPop 0.5s ease both" }}>🏆</div>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", margin: "0 0 6px" }}>{t("great")}</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: 0 }}>
              {t("partReadDone")}
            </p>
          </div>
          <div className="glass" style={{ width: "100%", padding: 24, borderRadius: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            <p style={{ fontSize: 48, margin: 0, animation: "streakPulse 0.8s ease 0.5s both" }}>🔥</p>
            <div style={{ animation: "coinPop 0.6s ease 0.3s both" }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", margin: 0 }}>
                {ownBook
                  ? t("partCounted")
                  : coinsPerPart > 0
                    ? <>{t("coinsAdded", { coins: coinsPerPart })} <CoinIcon size={20} /></>
                    : t("partCounted")}
              </p>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0 }}>
              {t("streakGoes")}
            </p>
          </div>
          {ownBook && (session.aiScore != null || session.aiFeedback) && (
            <div className="glass" style={{ width: "100%", padding: 16, borderRadius: 16, background: "rgba(120,97,255,0.18)", border: "1px solid rgba(150,130,255,0.3)", textAlign: "left" }}>
              {session.aiScore != null && (
                <p style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", margin: 0 }}>🤖 {t("readScoreLabel", { score: Math.round(Number(session.aiScore)) })}</p>
              )}
              {session.aiFeedback && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: session.aiScore != null ? "6px 0 0" : 0, lineHeight: 1.4 }}>{session.aiFeedback}</p>
              )}
            </div>
          )}
          {session.retellScore != null && (
            <div className="glass" style={{ width: "100%", padding: 16, borderRadius: 16, background: "rgba(120,97,255,0.18)", border: "1px solid rgba(150,130,255,0.3)" }}>
              <p style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", margin: 0 }}>🗣️ {t("retellScoreLabel", { score: Math.round(Number(session.retellScore)) })}</p>
              {session.retellFeedback && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "6px 0 0", lineHeight: 1.4 }}>{session.retellFeedback}</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="glass" style={{ width: 80, height: 80, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 40 }}>📋</span>
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", margin: "0 0 6px" }}>{t("almostDone")}</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: 0 }}>
              {t("sentToParent")}
            </p>
          </div>
          <div
            className="glass"
            style={{ width: "100%", padding: 16, borderRadius: 16, background: "rgba(255,180,0,0.15)", border: "1px solid rgba(255,200,0,0.25)" }}
          >
            <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,220,100,0.9)", margin: 0 }}>
              {t("expertWillCheck")}
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
        {t("toHome")}
      </button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useT(dict);

  const isPolling = (data: Session | undefined) =>
    data?.phase === "transcribing" ||
    data?.phase === "analyzing" ||
    data?.phase === "retell_transcribing" ||
    data?.phase === "retell_analyzing";

  const { data: session, isLoading } = useQuery<Session>({
    queryKey: ["session", id],
    queryFn: () => sessionsApi.get(id),
    refetchInterval: (query) => (isPolling(query.state.data) ? 3000 : false),
  });

  const { data: partText } = useQuery<{ text: string | null; imageUrl: string | null; title: string | null; partNumber: number }>({
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

  const ownBook = session.category === "own_book";

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 32px", maxWidth: 512, margin: "0 auto" }}>
      {/* Back */}
      {(session.phase === "read" || session.phase === "recording") && (
        <BackButton href={`/child/book/${session.enrollmentId}`} />
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
            {ownBook ? t("ownBook") : t("part", { n: session.partNumber })}
          </p>
          <p style={{ fontWeight: 900, fontSize: 16, color: "#ffffff", margin: "2px 0 0" }}>
            {session.phase === "retell" || session.phase === "retell_transcribing" || session.phase === "retell_analyzing"
              ? t("retellHeader")
              : t("readingAloud")}
          </p>
        </div>
        {ownBook && (session.coinsPerMinute ?? 0) > 0 ? (
          <div className="glass-chip" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", flexShrink: 0 }}>
            <CoinIcon size={16} />
            <span style={{ fontWeight: 900, fontSize: 14, color: "#ffd200" }}>+{session.coinsPerMinute}{t("perMin")}</span>
          </div>
        ) : session.coinsPerPart > 0 ? (
          <div className="glass-chip" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", flexShrink: 0 }}>
            <CoinIcon size={16} />
            <span style={{ fontWeight: 900, fontSize: 14, color: "#ffd200" }}>+{session.coinsPerPart}</span>
          </div>
        ) : null}
      </div>

      {/* Phase content */}
      {(session.phase === "read" || session.phase === "recording") && (
        <PhaseRead
          session={session}
          dayText={dayTextData?.text ?? null}
          pageImage={dayTextData?.imageUrl ?? null}
          partTitle={dayTextData?.title ?? null}
          ownBook={ownBook}
          onUploaded={refetch}
        />
      )}
      {(session.phase === "transcribing" ||
        session.phase === "analyzing" ||
        session.phase === "retell_transcribing" ||
        session.phase === "retell_analyzing") && <PhaseProcessing />}
      {session.phase === "retell" && <PhaseRetell session={session} onUploaded={refetch} />}
      {session.phase === "done" && <PhaseDone session={session} coinsPerPart={session.coinsPerPart ?? 0} ownBook={ownBook} />}
    </main>
  );
}

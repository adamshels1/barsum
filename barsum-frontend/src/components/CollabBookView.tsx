"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Send, RotateCcw, Trophy, Clock, PenLine, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { collabApi, loseMessage, type CollabBook, type Contribution } from "@/lib/api/collab";
import { shareParticipation } from "@/lib/shareCard";
import { CoinIcon } from "@/components/CoinIcon";
import { BackButton } from "@/components/BackButton";
import { PartAudioPlayer } from "@/components/PartAudioPlayer";
import { useT, type Dict } from "@/i18n/useT";
import { useLocaleStore } from "@/stores/locale-store";

const dict: Dict = {
  ru: {
    subtitle: "Сочиняем вместе",
    chapter: "Глава {n}",
    listen: "Послушай главу",
    yourTurn: "Придумай продолжение!",
    yourTurnHint: "Расскажи своим голосом, что было дальше (до 1 минуты) 🎤",
    yourTurnParent: "Придумайте продолжение вместе с ребёнком (до 1 минуты) 🎤",
    start: "Придумать продолжение",
    recording: "Рассказываю...",
    stop: "Закончил",
    ready: "Запись готова! ({time})",
    send: "Отправить продолжение",
    again: "Записать заново",
    sending: "Отправляем...",
    sent: "Продолжение отправлено! 🎉",
    sentHint: "Эксперт послушает и выберет лучшие. Загляни сюда позже!",
    noMic: "Нет доступа к микрофону",
    recordFail: "Сбой записи. Попробуй ещё раз.",
    uploadFail: "Ошибка загрузки. Попробуй ещё раз.",
    mine: "Мои продолжения",
    pending: "На рассмотрении",
    selected: "Выбрали! Ты соавтор ✍️",
    selectedParent: "Выбрали! Вы соавтор ✍️",
    notSelected: "В этот раз не выбрали",
    winCoins: "+{n} монет",
    partCoins: "+{n} монет за участие",
    winBadge: "Соавтор книги ✍️",
    closed: "Приём продолжений закрыт",
    winTitle: "🎉 Ура! Твоё продолжение выбрали!",
    winTitleParent: "🎉 Ваше продолжение выбрали!",
    winBody: "Теперь ты соавтор этой книги. Так держать, писатель!",
    winBodyParent: "Теперь вы соавтор этой книги.",
    coAuthors: "Соавторы книги",
    shareBtn: "Поделиться в соцсетях",
    shareHint: "Расскажи друзьям, что создаёшь книгу — пусть тоже присоединятся!",
    shareCaption: "Я участвую в создании этой книги!",
    shareCaptionParent: "Мы создаём эту книгу вместе!",
    shareText: "Я участвую в создании книги «{title}» на Barsum! 📖✨ Присоединяйся — вместе сочиняем настоящие книги. barsum.app",
    shareTextParent: "Мы с ребёнком создаём книгу «{title}» на Barsum! 📖✨ Присоединяйтесь — вместе сочиняем настоящие книги. barsum.app",
    shareDownloaded: "Картинка сохранена — выложи в Instagram или TikTok! 📲",
    shareFail: "Не удалось поделиться",
  },
  kk: {
    subtitle: "Бірге шығарамыз",
    chapter: "{n}-тарау",
    listen: "Тарауды тыңда",
    yourTurn: "Жалғасын ойлап тап!",
    yourTurnHint: "Әрі қарай не болғанын өз дауысыңмен айт (1 минутқа дейін) 🎤",
    yourTurnParent: "Баламен бірге жалғасын ойлап табыңыз (1 минутқа дейін) 🎤",
    start: "Жалғасын ойлап табу",
    recording: "Айтып жатырмын...",
    stop: "Айтып болдым",
    ready: "Жазба дайын! ({time})",
    send: "Жалғасын жіберу",
    again: "Қайта жазу",
    sending: "Жіберілуде...",
    sent: "Жалғасы жіберілді! 🎉",
    sentHint: "Сарапшы тыңдап, үздіктерін таңдайды. Кейінірек кіріп көр!",
    noMic: "Микрофонға рұқсат жоқ",
    recordFail: "Жазу қатесі. Қайта байқап көр.",
    uploadFail: "Жүктеу қатесі. Қайта байқап көр.",
    mine: "Менің жалғастарым",
    pending: "Қаралуда",
    selected: "Таңдалды! Сен авторласың ✍️",
    selectedParent: "Таңдалды! Сіз авторласыз ✍️",
    notSelected: "Бұл жолы таңдалмады",
    winCoins: "+{n} монета",
    partCoins: "қатысқаны үшін +{n} монета",
    winBadge: "Кітап авторласы ✍️",
    closed: "Жалғас қабылдау жабық",
    winTitle: "🎉 Тамаша! Сенің жалғасың таңдалды!",
    winTitleParent: "🎉 Сіздің жалғасыңыз таңдалды!",
    winBody: "Енді сен осы кітаптың авторласысың. Жарайсың, жазушы!",
    winBodyParent: "Енді сіз осы кітаптың авторласысыз.",
    coAuthors: "Кітап авторластары",
    shareBtn: "Әлеуметтік желіде бөлісу",
    shareHint: "Кітап жасап жатқаныңды достарыңа айт — олар да қосылсын!",
    shareCaption: "Мен осы кітапты жасауға қатысып жатырмын!",
    shareCaptionParent: "Біз бұл кітапты бірге жасап жатырмыз!",
    shareText: "Мен «{title}» кітабын жасауға қатысып жатырмын — Barsum-да! 📖✨ Қосыл — бірге нағыз кітап шығарамыз. barsum.app",
    shareTextParent: "Біз баламызбен «{title}» кітабын жасап жатырмыз — Barsum-да! 📖✨ Қосылыңыз — бірге нағыз кітап шығарамыз. barsum.app",
    shareDownloaded: "Сурет сақталды — Instagram немесе TikTok-қа жүктеп сал! 📲",
    shareFail: "Бөлісу мүмкін болмады",
  },
};

const MAX_SECONDS = 60;
function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function Recorder({ challengeId, hint, onSent }: { challengeId: string; hint: string; onSent: () => void }) {
  const t = useT(dict);
  const [stage, setStage] = useState<"before" | "recording" | "recorded">("before");
  const [time, setTime] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef("audio/webm");

  const pickMime = () => {
    const cands = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported)
      for (const c of cands) if (MediaRecorder.isTypeSupported(c)) return c;
    return "";
  };
  const ext = (m: string) => (m.includes("mp4") || m.includes("mpeg") ? "mp4" : m.includes("ogg") ? "ogg" : "webm");

  const stop = () => {
    mrRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const start = async () => {
    try {
      setError(null);
      setTime(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pref = pickMime();
      const mr = pref ? new MediaRecorder(stream, { mimeType: pref }) : new MediaRecorder(stream);
      mimeRef.current = (mr.mimeType || pref || "audio/webm").split(";")[0];
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onerror = () => { setError(t("recordFail")); stop(); };
      mr.onstop = () => {
        setBlob(new Blob(chunksRef.current, { type: mimeRef.current }));
        setStage("recorded");
        stream.getTracks().forEach((tr) => tr.stop());
      };
      stream.getAudioTracks().forEach((tr) => { tr.onended = () => { if (mr.state === "recording") stop(); }; });
      mr.start(1000);
      mrRef.current = mr;
      setStage("recording");
      timerRef.current = setInterval(() => setTime((v) => { if (v >= MAX_SECONDS - 1) { stop(); return MAX_SECONDS; } return v + 1; }), 1000);
    } catch { setError(t("noMic")); }
  };

  const upload = async () => {
    if (!blob) return;
    setUploading(true);
    setError(null);
    try {
      const type = mimeRef.current || "audio/webm";
      const file = new File([blob], `continuation.${ext(type)}`, { type });
      await collabApi.contribute(challengeId, file, time);
      onSent();
    } catch { setError(t("uploadFail")); } finally { setUploading(false); }
  };

  const btn = (bg: string, color: string): React.CSSProperties => ({
    width: "100%", padding: "16px 0", borderRadius: 9999, background: bg, color, fontWeight: 900, fontSize: 16,
    border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  });

  return (
    <div className="glass" style={{ padding: 20, borderRadius: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 6px" }}>🎨</p>
        <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{t("yourTurn")}</p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.5 }}>{hint}</p>
      </div>

      {stage === "before" && (
        <button onClick={start} style={btn("rgba(255,255,255,0.9)", "#4776e6")}>
          <Mic size={20} strokeWidth={2.5} /> {t("start")}
        </button>
      )}
      {stage === "recording" && (
        <>
          <div className="glass" style={{ padding: 14, borderRadius: 16, display: "flex", justifyContent: "center", gap: 10, background: "rgba(220,0,0,0.2)", border: "1px solid rgba(255,100,100,0.35)" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#ffaaaa", fontVariantNumeric: "tabular-nums" }}>● {fmt(time)}</span>
            <span style={{ fontSize: 14, color: "#ffbbbb" }}>{t("recording")}</span>
          </div>
          <button onClick={stop} style={btn("rgba(220,0,0,0.3)", "#fff")}>
            <MicOff size={20} strokeWidth={2.5} /> {t("stop")}
          </button>
        </>
      )}
      {stage === "recorded" && (
        <>
          <div className="glass" style={{ padding: 14, borderRadius: 16, textAlign: "center", background: "rgba(0,200,100,0.2)", border: "1px solid rgba(100,255,150,0.3)" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#aaffcc", margin: 0 }}>{t("ready", { time: fmt(time) })}</p>
          </div>
          <button onClick={upload} disabled={uploading} style={btn(uploading ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)", "#4776e6")}>
            <Send size={18} strokeWidth={2.5} /> {uploading ? t("sending") : t("send")}
          </button>
          <button onClick={() => { setBlob(null); setStage("before"); setTime(0); }} className="glass-chip" style={{ ...btn("transparent", "#fff"), border: "1px solid rgba(255,255,255,0.25)", fontSize: 14, padding: "12px 0" }}>
            <RotateCcw size={15} strokeWidth={2.5} /> {t("again")}
          </button>
        </>
      )}
      {error && <p style={{ fontSize: 14, fontWeight: 700, textAlign: "center", color: "#ffd6d6", margin: 0 }}>{error}</p>}
    </div>
  );
}

function toParagraphs(raw: string): string[] {
  return raw.replace(/\r\n/g, "\n").split(/\n+/).map((s) => s.trim()).filter(Boolean);
}

export function CollabBookView({ challengeId, role }: { challengeId: string; role: "child" | "parent" }) {
  const t = useT(dict);
  const lang = useLocaleStore((s) => s.locale);
  const qc = useQueryClient();

  const { data: book } = useQuery<CollabBook>({ queryKey: ["collab-book", challengeId], queryFn: () => collabApi.getBook(challengeId) });
  const { data: mine } = useQuery<Contribution[]>({
    queryKey: ["collab-mine", challengeId],
    queryFn: () => collabApi.mine(challengeId),
    refetchInterval: (q) => (q.state.data?.some((c) => c.status === "pending") ? 4000 : false),
  });

  const [sharing, setSharing] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["collab-mine", challengeId] });
    qc.invalidateQueries({ queryKey: ["collab-book", challengeId] });
  };

  const doShare = async () => {
    if (!book) return;
    setSharing(true);
    try {
      const res = await shareParticipation({
        coverUrl: book.coverImage || book.partImages?.[0] || "",
        caption: t(role === "parent" ? "shareCaptionParent" : "shareCaption"),
        shareText: t(role === "parent" ? "shareTextParent" : "shareText", { title: book.bookTitle }),
      });
      if (res.method === "download") toast.success(t("shareDownloaded"));
    } catch (e) {
      if ((e as { name?: string })?.name !== "AbortError") toast.error(t("shareFail"));
    } finally {
      setSharing(false);
    }
  };

  if (!book) {
    return <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>…</main>;
  }

  const chapters = book.partTexts ?? [];
  const titles = book.partTitles ?? [];
  const images = book.partImages ?? [];
  const audios = book.partAudios ?? [];
  const contributedThisRound = mine?.some((c) => c.roundNumber === book.currentRound);
  const justWon = mine?.find((c) => c.status === "selected" && c.roundNumber === book.currentRound - 1);
  const isParent = role === "parent";

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 40px", maxWidth: 512, margin: "0 auto" }}>
      <BackButton href={isParent ? "/parent/collab" : "/child/collab"} />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        {book.coverImage && (
          <div style={{ width: 72, height: 72, borderRadius: 16, overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={book.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>{book.bookTitle}</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0 }}>{book.bookAuthor}</p>
        </div>
      </div>

      {justWon && (
        <div className="glass" style={{ padding: 18, borderRadius: 20, marginBottom: 16, background: "rgba(255,200,0,0.18)", border: "1px solid rgba(255,220,80,0.4)" }}>
          <p style={{ fontSize: 16, fontWeight: 900, color: "#ffe9a8", margin: "0 0 4px" }}>{t(isParent ? "winTitleParent" : "winTitle")}</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0 }}>{t(isParent ? "winBodyParent" : "winBody")}</p>
        </div>
      )}

      {!!mine?.length && (
        <button
          onClick={doShare}
          disabled={sharing}
          style={{
            width: "100%",
            marginBottom: 20,
            padding: "16px 18px",
            borderRadius: 20,
            border: "none",
            cursor: sharing ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "linear-gradient(135deg,#4776e6,#7c5cff)",
            opacity: sharing ? 0.7 : 1,
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Share2 size={22} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>{t("shareBtn")} 📲</p>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.35 }}>{t("shareHint")}</p>
          </div>
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {chapters.map((text, i) => (
          <div key={i} className="glass" style={{ padding: 18, borderRadius: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
              {titles[i] || t("chapter", { n: i + 1 })}
            </p>
            {images[i] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[i]} alt="" style={{ width: "100%", borderRadius: 14, display: "block", marginBottom: 12 }} />
            )}
            {audios[i] && (
              <div style={{ marginBottom: 12 }}>
                <PartAudioPlayer src={audios[i]} title={t("listen")} />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {toParagraphs(text).map((p, j) => (
                <p key={j} style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", fontFamily: "Georgia, serif", margin: 0 }}>{p}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!book.collabOpen ? (
        <div className="glass" style={{ padding: 18, borderRadius: 20, textAlign: "center", color: "rgba(255,255,255,0.7)" }}>{t("closed")}</div>
      ) : contributedThisRound ? (
        <div className="glass" style={{ padding: 22, borderRadius: 20, textAlign: "center", background: "rgba(120,97,255,0.18)", border: "1px solid rgba(150,130,255,0.3)" }}>
          <p style={{ fontSize: 40, margin: "0 0 8px" }}>⏳</p>
          <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>{t("sent")}</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 }}>{t("sentHint")}</p>
        </div>
      ) : (
        <Recorder challengeId={challengeId} hint={t(isParent ? "yourTurnParent" : "yourTurnHint")} onSent={refresh} />
      )}

      {!!mine?.length && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px" }}>
            <PenLine size={16} color="rgba(255,255,255,0.7)" />
            <h2 style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>{t("mine")}</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mine.map((c) => (
              <div key={c.id} className="glass" style={{ padding: 14, borderRadius: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{t("chapter", { n: c.roundNumber })}</span>
                  {c.status === "pending" && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#ffd27d", display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={13} /> {t("pending")}</span>
                  )}
                  {c.status === "selected" && (
                    <span style={{ fontSize: 12, fontWeight: 900, color: "#8effc0", display: "inline-flex", alignItems: "center", gap: 4 }}><Trophy size={13} /> {t(isParent ? "selectedParent" : "selected")}</span>
                  )}
                  {c.status === "not_selected" && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>{t("notSelected")}</span>
                  )}
                </div>
                {c.transcription && (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>«{c.transcription}»</p>
                )}
                {c.status === "selected" && (
                  isParent ? (
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#8effc0", margin: "8px 0 0" }}>🏅 {t("winBadge")}</p>
                  ) : !!c.coinsAwarded && (
                    <p style={{ fontSize: 13, fontWeight: 900, color: "#ffd200", margin: "8px 0 0", display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <CoinIcon size={15} /> {t("winCoins", { n: c.coinsAwarded })}
                    </p>
                  )
                )}
                {c.status === "not_selected" && (
                  <div style={{ marginTop: 8, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.5 }}>{loseMessage(lang, c.id)}</p>
                    {!isParent && !!c.coinsAwarded && (
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#ffd200", margin: "6px 0 0", display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <CoinIcon size={13} /> {t("partCoins", { n: c.coinsAwarded })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!!book.coAuthors?.length && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: "0 0 10px" }}>{t("coAuthors")}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {book.coAuthors.map((a, i) => (
              <span key={i} className="glass-chip" style={{ padding: "6px 12px", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {a.type === "parent" ? "👤" : "🧒"} {a.name || "—"}
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

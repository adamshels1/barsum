"use client";

import { useT, type Dict } from "@/i18n/useT";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3012";

// Общий блок результата сессии: запись чтения + пересказ + отчёт о чтении.
// Используется одинаково у родителя и эксперта, чтобы вид совпадал.
export interface SessionResultData {
  id: string;
  audioUrl?: string | null;
  aiScore?: number | null;
  aiFeedback?: string | null;
  readingAccuracy?: number | null;
  readingCompleteness?: number | null;
  readingSpeedWpm?: number | null;
  errorWords?: string[] | null;
  expertReport?: string | null;
  retellAudioUrl?: string | null;
  retellScore?: number | null;
  retellFeedback?: string | null;
  status?: string;
}

const dict: Dict = {
  ru: {
    recordingTitle: "Запись чтения",
    recordingUnavailable: "Запись недоступна",
    retellTitle: "Пересказ ребёнка",
    retellScoreLabel: "Оценка пересказа: {score}/10",
    readingScore: "Оценка чтения",
    metricAccuracy: "Точность",
    metricSpeed: "Скорость",
    metricCompleteness: "Полнота",
    metricRetell: "Пересказ",
    metricComprehension: "Понимание",
    wpmUnit: "{n}/мин",
    overallExcellent: "Отлично",
    overallGood: "Хорошо",
    overallRetry: "Ещё потренируйся",
    stumbled: "Споткнулся: {words}",
    expertPrefix: "Эксперт:",
    expertReport: "Отчёт эксперта",
    aiReport: "AI-отчёт",
    waitingExpert: "Ждём проверку эксперта",
    reportPreparing: "Отчёт готовится",
  },
  kk: {
    recordingTitle: "Оқу жазбасы",
    recordingUnavailable: "Жазба қолжетімсіз",
    retellTitle: "Баланың пересказы",
    retellScoreLabel: "Пересказ бағасы: {score}/10",
    readingScore: "Оқу бағасы",
    metricAccuracy: "Дәлдік",
    metricSpeed: "Жылдамдық",
    metricCompleteness: "Толықтық",
    metricRetell: "Пересказ",
    metricComprehension: "Түсіну",
    wpmUnit: "{n}/мин",
    overallExcellent: "Тамаша",
    overallGood: "Жақсы",
    overallRetry: "Тағы жаттық",
    stumbled: "Сүрінді: {words}",
    expertPrefix: "Сарапшы:",
    expertReport: "Сарапшы есебі",
    aiReport: "AI-есеп",
    waitingExpert: "Сарапшы тексеруін күтеміз",
    reportPreparing: "Есеп дайындалуда",
  },
};

type Light = "green" | "yellow" | "red" | "gray";
const LIGHT_COLOR: Record<Light, string> = { green: "#4ade80", yellow: "#facc15", red: "#f87171", gray: "rgba(255,255,255,0.35)" };
const LIGHT_DOT: Record<Light, string> = { green: "🟢", yellow: "🟡", red: "🔴", gray: "⚪️" };

function lightFor(value: number | null | undefined, green: number, yellow: number): Light {
  if (value == null) return "gray";
  if (value >= green) return "green";
  if (value >= yellow) return "yellow";
  return "red";
}

function MetricBar({ label, light, fillPct, valueText }: { label: string; light: Light; fillPct: number; valueText: string }) {
  const color = LIGHT_COLOR[light];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
      <span style={{ width: 74, flexShrink: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{label}</span>
      <div style={{ flex: 1, height: 8, borderRadius: 9999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, fillPct))}%`, background: color, borderRadius: 9999, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ width: 58, flexShrink: 0, textAlign: "right", fontSize: 12, fontWeight: 800, color: "#ffffff" }}>{valueText}</span>
      <span style={{ fontSize: 11 }}>{LIGHT_DOT[light]}</span>
    </div>
  );
}

function ReadingReport({ session, t }: { session: SessionResultData; t: (k: string, v?: Record<string, string | number>) => string }) {
  const score = session.aiScore != null ? Math.round(Number(session.aiScore)) : null;
  const acc = session.readingAccuracy;
  const comp = session.readingCompleteness;
  const wpm = session.readingSpeedWpm;
  const errors = session.errorWords ?? [];
  const overallLight = lightFor(score, 8, 5);
  const overallLabel = score == null ? "—" : score >= 8 ? t("overallExcellent") : score >= 5 ? t("overallGood") : t("overallRetry");
  // «Своя книга»: эталонного текста нет, поэтому точность/скорость/полноту не считаем.
  // Показываем полоску общей AI-оценки (понимание) — чтобы вид совпадал с обычными книгами.
  const hasReadingMetrics = acc != null || comp != null || wpm != null;

  return (
    <div style={{ margin: "10px 0 0" }}>
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{t("readingScore")}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{LIGHT_DOT[overallLight]}</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "#ffffff" }}>{overallLabel}</span>
        {score != null && <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 900, color: LIGHT_COLOR[overallLight] }}>{score} / 10</span>}
      </div>
      {hasReadingMetrics && (
        <>
          <MetricBar label={t("metricAccuracy")} light={lightFor(acc, 85, 70)} fillPct={acc ?? 0} valueText={acc != null ? `${acc}%` : "—"} />
          <MetricBar label={t("metricSpeed")} light={lightFor(wpm, 90, 60)} fillPct={wpm != null ? (wpm / 150) * 100 : 0} valueText={wpm != null ? t("wpmUnit", { n: wpm }) : "—"} />
          <MetricBar label={t("metricCompleteness")} light={lightFor(comp, 75, 40)} fillPct={comp ?? 0} valueText={comp != null ? `${comp}%` : "—"} />
        </>
      )}
      {!hasReadingMetrics && score != null && (
        <MetricBar label={t("metricComprehension")} light={overallLight} fillPct={score * 10} valueText={`${score}/10`} />
      )}
      {session.retellScore != null && (() => {
        const rs = Math.round(Number(session.retellScore));
        return <MetricBar label={t("metricRetell")} light={lightFor(rs, 8, 5)} fillPct={rs * 10} valueText={`${rs}/10`} />;
      })()}
      {errors.length > 0 && (
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>{t("stumbled", { words: errors.map((w) => `«${w}»`).join(", ") })}</p>
      )}
      {session.aiFeedback && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>{session.aiFeedback}</p>}
      {session.expertReport && (
        <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>
          <span style={{ fontWeight: 800 }}>{t("expertPrefix")}</span> {session.expertReport}
        </p>
      )}
    </div>
  );
}

export function SessionResult({ session }: { session: SessionResultData }) {
  const t = useT(dict);
  return (
    <div>
      {/* Запись чтения */}
      {session.audioUrl ? (
        <div style={{ margin: "10px 0" }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{t("recordingTitle")}</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={`${API_BASE}/sessions/${session.id}/audio`} style={{ width: "100%", height: 36 }} />
        </div>
      ) : (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{t("recordingUnavailable")}</p>
      )}

      {/* Пересказ */}
      {session.retellAudioUrl && (
        <div style={{ margin: "10px 0" }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "rgba(180,160,255,0.85)", textTransform: "uppercase" }}>
            {t("retellTitle")}
          </p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={`${API_BASE}/sessions/${session.id}/retell-audio`} style={{ width: "100%", height: 36 }} />
          {session.retellFeedback && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>{session.retellFeedback}</p>}
        </div>
      )}

      {/* Отчёт о чтении / фолбэки. Полоски-оценки показываем и для своей книги
          (там только AI-оценка aiScore, без метрик чтения). */}
      {session.readingAccuracy != null || session.aiScore != null || session.retellScore != null ? (
        <ReadingReport session={session} t={t} />
      ) : session.expertReport ? (
        <div>
          <p style={{ margin: "10px 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{t("expertReport")}</p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px" }}>{session.expertReport}</p>
        </div>
      ) : session.aiFeedback ? (
        <div>
          <p style={{ margin: "10px 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{t("aiReport")}</p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px" }}>{session.aiFeedback}</p>
        </div>
      ) : (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {session.status === "pending" ? t("waitingExpert") : t("reportPreparing")}
        </p>
      )}
    </div>
  );
}

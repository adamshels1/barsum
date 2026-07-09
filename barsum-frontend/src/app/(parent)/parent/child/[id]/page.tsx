"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Copy, Eye, EyeOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { childrenApi } from "@/lib/api/children";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";
import { rewardsApi } from "@/lib/api/rewards";
import { sessionsApi } from "@/lib/api/sessions";
import type { Child, ChildStats, RewardRequest, Session } from "@/types";
import { CoinIcon } from "@/components/CoinIcon";
import { childPhotoUrl, dreamPhotoUrl, rewardPhotoUrl } from "@/lib/media";
import { useT, type Dict } from "@/i18n/useT";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3012";

const dict: Dict = {
  ru: {
    back: "← Назад",
    notFound: "Ребёнок не найден",
    backToCabinet: "Вернуться в кабинет",
    ageYears: "{age} лет",
    streakDays: "🔥 {n} дней",
    statStreak: "Дней подряд",
    statSessions: "Сессий",
    statCoinsEarned: "Монет заработано",
    statActiveCourses: "Активных курсов",
    loading: "Загрузка...",
    noSessions: "Сессий пока нет",
    noSessionsHint: "Начните первый курс, чтобы увидеть прогресс",
    statusCompleted: "Выполнено",
    statusPending: "В процессе",
    statusFailed: "Не выполнено",
    book: "Книга",
    partN: "часть {n}",
    recordingTitle: "Запись чтения",
    recordingUnavailable: "Запись недоступна",
    expertReport: "Отчёт эксперта",
    aiReport: "AI-отчёт",
    waitingExpert: "Аудио записано — ждёт проверки эксперта",
    reportPreparing: "Отчёт готовится...",
    readingScore: "Оценка чтения",
    overallExcellent: "Отлично",
    overallGood: "Хорошо",
    overallRetry: "Стоит повторить",
    metricAccuracy: "Точность",
    metricSpeed: "Скорость",
    metricCompleteness: "Полнота",
    wpmUnit: "{n}/мин",
    stumbled: "🔴 Споткнулся: {words}",
    expertPrefix: "Эксперт:",
    credentialsTitle: "🔑 Логин и пароль ребёнка",
    loginLabel: "Логин",
    passwordLabel: "Пароль",
    copiedX: "{label} скопирован",
    copyFailed: "Не удалось скопировать",
    copyLoginAria: "Скопировать логин",
    showPasswordAria: "Показать пароль",
    hidePasswordAria: "Скрыть пароль",
    copyPasswordAria: "Скопировать пароль",
    passwordLegacy: "Пароль задан до обновления и недоступен для просмотра — задайте новый ниже",
    profileUpdated: "Профиль обновлён!",
    saveError: "Ошибка сохранения",
    editProfileBtn: "✏️ Редактировать профиль",
    editProfileTitle: "Редактировать профиль",
    namePlaceholder: "Имя",
    agePlaceholder: "Возраст",
    cancel: "Отмена",
    saving: "Сохранение...",
    save: "Сохранить",
    passwordChanged: "Пароль изменён!",
    passwordChangeError: "Ошибка смены пароля",
    changePasswordBtn: "🔑 Изменить пароль ребёнка",
    changePasswordTitle: "Изменить пароль",
    newPasswordPlaceholder: "Новый пароль (мин. 4 символа)",
    repeatPasswordPlaceholder: "Повторите пароль",
    passwordsMismatch: "Пароли не совпадают",
    dreamApproved: "Мечта одобрена!",
    error: "Ошибка",
    dreamRejected: "Мечта отклонена",
    dreamsToApprove: "💫 Мечты на одобрение",
    dreamsToFulfill: "🎉 Собранные мечты",
    collectedBadge: "Собрана",
    fulfillBtn: "Исполнено ✓",
    dreamFulfilled: "Мечта отмечена исполненной!",
    childPrefix: "Ребёнок: {name}",
    waitingApproval: "Ждёт одобрения",
    setCoinPrice: "Установите стоимость в монетах:",
    coinsPlaceholder: "Например: 1000",
    approveBtn: "✅ Одобрить",
    rejectReasonLabel: "Причина отказа:",
    ownReasonPlaceholder: "Или своя причина...",
    rejectBtn: "❌ Отклонить",
    reason1: "Слишком дорого",
    reason2: "Подумай ещё раз",
    reason3: "Сначала нужно заслужить",
    reason4: "Выбери что-то другое",
    spendPending: "Запрошено",
    spendDelivered: "Получено",
    spendRejected: "Отклонено",
    spendingHistory: "История расходов",
    writtenOff: "Списано:",
    noSpending: "Ребёнок ещё не тратил монеты на награды",
    rewardFallback: "Награда",
    tabOverview: "Обзор",
    tabExpenses: "Расходы",
    tabSessions: "Сессии",
  },
  kk: {
    back: "← Артқа",
    notFound: "Бала табылмады",
    backToCabinet: "Кабинетке оралу",
    ageYears: "{age} жаста",
    streakDays: "🔥 {n} күн",
    statStreak: "Қатарынан күн",
    statSessions: "Сессиялар",
    statCoinsEarned: "Жиналған монета",
    statActiveCourses: "Белсенді курстар",
    loading: "Жүктелуде...",
    noSessions: "Әзірге сессиялар жоқ",
    noSessionsHint: "Прогресті көру үшін алғашқы курсты бастаңыз",
    statusCompleted: "Орындалды",
    statusPending: "Орындалуда",
    statusFailed: "Орындалмады",
    book: "Кітап",
    partN: "{n}-бөлім",
    recordingTitle: "Оқу жазбасы",
    recordingUnavailable: "Жазба қолжетімсіз",
    expertReport: "Сарапшы есебі",
    aiReport: "AI-есеп",
    waitingExpert: "Аудио жазылды — сарапшы тексеруін күтуде",
    reportPreparing: "Есеп дайындалуда...",
    readingScore: "Оқу бағасы",
    overallExcellent: "Өте жақсы",
    overallGood: "Жақсы",
    overallRetry: "Қайталаған жөн",
    metricAccuracy: "Дәлдік",
    metricSpeed: "Жылдамдық",
    metricCompleteness: "Толықтық",
    wpmUnit: "{n}/мин",
    stumbled: "🔴 Мүдірген сөздер: {words}",
    expertPrefix: "Сарапшы:",
    credentialsTitle: "🔑 Баланың логині мен құпиясөзі",
    loginLabel: "Логин",
    passwordLabel: "Құпиясөз",
    copiedX: "{label} көшірілді",
    copyFailed: "Көшіру мүмкін болмады",
    copyLoginAria: "Логинді көшіру",
    showPasswordAria: "Құпиясөзді көрсету",
    hidePasswordAria: "Құпиясөзді жасыру",
    copyPasswordAria: "Құпиясөзді көшіру",
    passwordLegacy: "Құпиясөз жаңартуға дейін орнатылған және көру мүмкін емес — төменде жаңасын орнатыңыз",
    profileUpdated: "Профиль жаңартылды!",
    saveError: "Сақтау қатесі",
    editProfileBtn: "✏️ Профильді өңдеу",
    editProfileTitle: "Профильді өңдеу",
    namePlaceholder: "Аты",
    agePlaceholder: "Жасы",
    cancel: "Бас тарту",
    saving: "Сақталуда...",
    save: "Сақтау",
    passwordChanged: "Құпиясөз өзгертілді!",
    passwordChangeError: "Құпиясөзді ауыстыру қатесі",
    changePasswordBtn: "🔑 Баланың құпиясөзін өзгерту",
    changePasswordTitle: "Құпиясөзді өзгерту",
    newPasswordPlaceholder: "Жаңа құпиясөз (кемінде 4 таңба)",
    repeatPasswordPlaceholder: "Құпиясөзді қайталаңыз",
    passwordsMismatch: "Құпиясөздер сәйкес келмейді",
    dreamApproved: "Арман мақұлданды!",
    error: "Қате",
    dreamRejected: "Арман қабылданбады",
    dreamsToApprove: "💫 Мақұлдауға арналған армандар",
    dreamsToFulfill: "🎉 Жиналған армандар",
    collectedBadge: "Жиналды",
    fulfillBtn: "Орындалды ✓",
    dreamFulfilled: "Арман орындалды деп белгіленді!",
    childPrefix: "Бала: {name}",
    waitingApproval: "Мақұлдауды күтуде",
    setCoinPrice: "Монетамен құнын белгілеңіз:",
    coinsPlaceholder: "Мысалы: 1000",
    approveBtn: "✅ Мақұлдау",
    rejectReasonLabel: "Бас тарту себебі:",
    ownReasonPlaceholder: "Немесе өз себебіңіз...",
    rejectBtn: "❌ Қабылдамау",
    reason1: "Тым қымбат",
    reason2: "Тағы бір ойлан",
    reason3: "Алдымен еңбекпен табу керек",
    reason4: "Басқа нәрсе таңда",
    spendPending: "Сұралды",
    spendDelivered: "Алынды",
    spendRejected: "Қабылданбады",
    spendingHistory: "Шығыстар тарихы",
    writtenOff: "Есептен шығарылды:",
    noSpending: "Бала әлі сыйлықтарға монета жұмсаған жоқ",
    rewardFallback: "Сыйлық",
    tabOverview: "Шолу",
    tabExpenses: "Шығыстар",
    tabSessions: "Сессиялар",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_CONFIG = {
  completed: { icon: "✅", bg: "rgba(34,197,94,0.3)", color: "#ffffff" },
  pending: { icon: "⏳", bg: "rgba(255,200,0,0.25)", color: "#ffffff" },
  failed: { icon: "❌", bg: "rgba(239,68,68,0.35)", color: "#ffffff" },
} satisfies Record<Session["status"], { icon: string; bg: string; color: string }>;

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 18,
};

function StatCard({ emoji, value, label, highlight }: { emoji: React.ReactNode; value: string | number; label: string; highlight?: boolean }) {
  return (
    <div style={{ ...GLASS, padding: "14px 12px", textAlign: "center", background: highlight ? "rgba(255,255,255,0.25)" : GLASS.background }}>
      <p style={{ fontSize: 24, margin: "0 0 4px" }}>{emoji}</p>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff" }}>{value}</p>
      <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{label}</p>
    </div>
  );
}

type Light = "green" | "yellow" | "red" | "gray";
const LIGHT_COLOR: Record<Light, string> = {
  green: "#4ade80",
  yellow: "#facc15",
  red: "#f87171",
  gray: "rgba(255,255,255,0.35)",
};
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

function ReadingReport({ session }: { session: Session }) {
  const t = useT(dict);
  const score = session.aiScore != null ? Math.round(Number(session.aiScore)) : null;
  const acc = session.readingAccuracy;
  const comp = session.readingCompleteness;
  const wpm = session.readingSpeedWpm;
  const errors = session.errorWords ?? [];

  const overallLight = lightFor(score, 8, 5);
  const overallLabel = score == null ? "—" : score >= 8 ? t("overallExcellent") : score >= 5 ? t("overallGood") : t("overallRetry");

  return (
    <div style={{ margin: "10px 0 0" }}>
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{t("readingScore")}</p>
      {/* Итоговый светофор */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{LIGHT_DOT[overallLight]}</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "#ffffff" }}>{overallLabel}</span>
        {score != null && (
          <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 900, color: LIGHT_COLOR[overallLight] }}>{score} / 10</span>
        )}
      </div>
      {/* Полоски-индикаторы */}
      <MetricBar label={t("metricAccuracy")} light={lightFor(acc, 85, 70)} fillPct={acc ?? 0} valueText={acc != null ? `${acc}%` : "—"} />
      <MetricBar label={t("metricSpeed")} light={lightFor(wpm, 90, 60)} fillPct={wpm != null ? (wpm / 150) * 100 : 0} valueText={wpm != null ? t("wpmUnit", { n: wpm }) : "—"} />
      <MetricBar label={t("metricCompleteness")} light={lightFor(comp, 75, 40)} fillPct={comp ?? 0} valueText={comp != null ? `${comp}%` : "—"} />
      {errors.length > 0 && (
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>
          {t("stumbled", { words: errors.map((w) => `«${w}»`).join(", ") })}
        </p>
      )}
      {session.aiFeedback && (
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>{session.aiFeedback}</p>
      )}
      {session.expertReport && (
        <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>
          <span style={{ fontWeight: 800 }}>{t("expertPrefix")}</span> {session.expertReport}
        </p>
      )}
    </div>
  );
}

function SessionRow({ session, defaultOpen }: { session: Session; defaultOpen?: boolean }) {
  const t = useT(dict);
  const [open, setOpen] = useState(!!defaultOpen);
  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;
  const statusLabel = { completed: t("statusCompleted"), pending: t("statusPending"), failed: t("statusFailed") }[session.status];

  return (
    <div style={{ ...GLASS, overflow: "hidden" }}>
      <button style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }} onClick={() => setOpen((v) => !v)}>
        <span style={{ fontSize: 18 }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.enrollment?.challenge?.bookTitle ?? t("book")} · {t("partN", { n: session.partNumber })}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{formatDate(session.createdAt)}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 9999, fontWeight: 800, background: cfg.bg, color: cfg.color }}>{statusLabel}</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          {session.audioUrl ? (
            <div style={{ margin: "10px 0" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{t("recordingTitle")}</p>
              {/* Через backend-прокси (https), а не прямую http-ссылку MinIO — иначе mixed-content на проде */}
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={`${API_BASE}/sessions/${session.id}/audio`} style={{ width: "100%", height: 36 }} />
            </div>
          ) : (
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{t("recordingUnavailable")}</p>
          )}
          {session.readingAccuracy != null ? (
            <ReadingReport session={session} />
          ) : session.expertReport ? (
            <div>
              <p style={{ margin: "10px 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{t("expertReport")}</p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px" }}>
                {session.expertReport}
              </p>
            </div>
          ) : session.aiFeedback ? (
            <div>
              <p style={{ margin: "10px 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{t("aiReport")}</p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px" }}>
                {session.aiFeedback}
              </p>
            </div>
          ) : (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              {session.status === "pending" ? t("waitingExpert") : t("reportPreparing")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  border: "none",
  background: "rgba(255,255,255,0.15)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

/** Логин и пароль ребёнка — родитель может посмотреть и скопировать их в любой момент (задача 8). */
function CredentialsSection({ child }: { child: Child }) {
  const t = useT(dict);
  const [showPassword, setShowPassword] = useState(false);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("copiedX", { label }));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <div style={{ ...GLASS, padding: "14px 16px", marginBottom: 12 }}>
      <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14, color: "#ffffff" }}>{t("credentialsTitle")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", width: 52, flexShrink: 0 }}>{t("loginLabel")}</span>
          <span style={{ flex: 1, fontFamily: "monospace", fontSize: 14, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{child.login}</span>
          <button onClick={() => copy(child.login, t("loginLabel"))} style={iconButtonStyle} aria-label={t("copyLoginAria")}>
            <Copy size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", width: 52, flexShrink: 0 }}>{t("passwordLabel")}</span>
          {child.password ? (
            <>
              <span style={{ flex: 1, fontFamily: "monospace", fontSize: 14, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {showPassword ? child.password : "•".repeat(Math.max(child.password.length, 6))}
              </span>
              <button onClick={() => setShowPassword((v) => !v)} style={iconButtonStyle} aria-label={showPassword ? t("hidePasswordAria") : t("showPasswordAria")}>
                {showPassword ? <EyeOff size={14} strokeWidth={2.5} /> : <Eye size={14} strokeWidth={2.5} />}
              </button>
              <button onClick={() => copy(child.password!, t("passwordLabel"))} style={iconButtonStyle} aria-label={t("copyPasswordAria")}>
                <Copy size={14} strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <span style={{ flex: 1, fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>
              {t("passwordLegacy")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EditProfileSection({ child }: { child: Child }) {
  const t = useT(dict);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(child.name);
  const [age, setAge] = useState(String(child.age));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      await childrenApi.update(child.id, { name: name.trim(), age: Number(age) });
      if (photoFile) await childrenApi.uploadPhoto(child.id, photoFile);
    },
    onSuccess: () => {
      toast.success(t("profileUpdated"));
      queryClient.invalidateQueries({ queryKey: ["child", child.id] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
      setOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    },
    onError: () => toast.error(t("saveError")),
  });

  const valid = name.trim().length >= 2 && Number(age) >= 4 && Number(age) <= 16;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ width: "100%", ...GLASS, padding: "13px 16px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.7)" }}
      >
        {t("editProfileBtn")}
      </button>
    );
  }

  return (
    <div style={{ ...GLASS, padding: "16px 16px" }}>
      <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14, color: "#ffffff" }}>{t("editProfileTitle")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handlePhotoChange} style={{ display: "none" }} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            alignSelf: "center",
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "2px dashed rgba(255,255,255,0.35)",
            background: photoPreview
              ? `url(${photoPreview}) center/cover`
              : child.photoUrl
              ? `url(${childPhotoUrl(child)}) center/cover`
              : "rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {!photoPreview && !child.photoUrl && <Camera size={20} color="rgba(255,255,255,0.6)" strokeWidth={2} />}
        </button>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} className="glass-input" />
        <input type="number" min={4} max={16} value={age} onChange={(e) => setAge(e.target.value)} placeholder={t("agePlaceholder")} className="glass-input" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setOpen(false); setName(child.name); setAge(String(child.age)); setPhotoFile(null); setPhotoPreview(null); }} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>{t("cancel")}</button>
          <button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 13, background: "rgba(255,255,255,0.9)", color: "#4776e6", opacity: !valid ? 0.5 : 1 }}>
            {mutation.isPending ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordSection({ childId }: { childId: string; parentId: string }) {
  const t = useT(dict);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => childrenApi.update(childId, { password: newPassword }),
    onSuccess: () => {
      toast.success(t("passwordChanged"));
      setNewPassword("");
      setConfirm("");
      setOpen(false);
    },
    onError: () => toast.error(t("passwordChangeError")),
  });

  const valid = newPassword.length >= 4 && newPassword === confirm;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ width: "100%", ...GLASS, padding: "13px 16px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.7)" }}
      >
        {t("changePasswordBtn")}
      </button>
    );
  }

  return (
    <div style={{ ...GLASS, padding: "16px 16px" }}>
      <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14, color: "#ffffff" }}>{t("changePasswordTitle")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("newPasswordPlaceholder")} className="glass-input" />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t("repeatPasswordPlaceholder")} className="glass-input" style={confirm && confirm !== newPassword ? { borderColor: "rgba(239,68,68,0.6)" } : {}} />
        {confirm && confirm !== newPassword && <p style={{ margin: 0, fontSize: 12, color: "#ffd6d6" }}>{t("passwordsMismatch")}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setOpen(false); setNewPassword(""); setConfirm(""); }} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>{t("cancel")}</button>
          <button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 13, background: "rgba(255,255,255,0.9)", color: "#4776e6", opacity: !valid ? 0.5 : 1 }}>
            {mutation.isPending ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DreamApprovalSection() {
  const t = useT(dict);
  const REJECT_REASONS = [t("reason1"), t("reason2"), t("reason3"), t("reason4")];
  const queryClient = useQueryClient();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [targetCoins, setTargetCoins] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const { data: pendingDreams = [] } = useQuery<any[]>({
    queryKey: ["dreams-pending"],
    queryFn: dreamsApi.parentPending,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, coins }: { id: string; coins: number }) => dreamsApi.approve(id, coins),
    onSuccess: () => { toast.success(t("dreamApproved")); setApprovingId(null); setTargetCoins(""); queryClient.invalidateQueries({ queryKey: ["dreams-pending"] }); },
    onError: () => toast.error(t("error")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => dreamsApi.reject(id, reason),
    onSuccess: () => { toast.success(t("dreamRejected")); setRejectingId(null); setRejectReason(""); setCustomReason(""); queryClient.invalidateQueries({ queryKey: ["dreams-pending"] }); },
    onError: () => toast.error(t("error")),
  });

  if (pendingDreams.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 900, color: "#ffffff" }}>{t("dreamsToApprove")}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pendingDreams.map((dream: any) => (
          <div key={dream.id} style={{ ...GLASS, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              {dream.photoUrl ? (
                <img src={dreamPhotoUrl(dream)} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>💫</div>
              )}
              <div>
                <p style={{ margin: 0, fontWeight: 800, color: "#ffffff" }}>{dream.name}</p>
                <p style={{ margin: "2px 0 4px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{t("childPrefix", { name: dream.child?.name ?? "" })}</p>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 9999, fontWeight: 800, background: "rgba(255,255,255,0.2)", color: "#ffffff" }}>{t("waitingApproval")}</span>
              </div>
            </div>

            {approvingId === dream.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{t("setCoinPrice")}</p>
                <input type="number" min={1} value={targetCoins} onChange={(e) => setTargetCoins(e.target.value)} placeholder={t("coinsPlaceholder")} className="glass-input" />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setApprovingId(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>{t("cancel")}</button>
                  <button onClick={() => approveMutation.mutate({ id: dream.id, coins: Number(targetCoins) })} disabled={!targetCoins || Number(targetCoins) < 1 || approveMutation.isPending} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.7)", color: "#ffffff", opacity: !targetCoins || Number(targetCoins) < 1 ? 0.5 : 1 }}>
                    {approveMutation.isPending ? "..." : t("approveBtn")}
                  </button>
                </div>
              </div>
            ) : rejectingId === dream.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{t("rejectReasonLabel")}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {REJECT_REASONS.map((r) => (
                    <button key={r} onClick={() => setRejectReason(r)} style={{ padding: "6px 10px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: rejectReason === r ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.15)", color: "#ffffff" }}>
                      {r}
                    </button>
                  ))}
                </div>
                <input type="text" value={customReason} onChange={(e) => { setCustomReason(e.target.value); setRejectReason(""); }} placeholder={t("ownReasonPlaceholder")} className="glass-input" />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setRejectingId(null); setRejectReason(""); setCustomReason(""); }} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>{t("cancel")}</button>
                  <button onClick={() => rejectMutation.mutate({ id: dream.id, reason: customReason || rejectReason })} disabled={(!rejectReason && !customReason) || rejectMutation.isPending} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(239,68,68,0.7)", color: "#ffffff", opacity: !rejectReason && !customReason ? 0.5 : 1 }}>
                    {rejectMutation.isPending ? "..." : t("rejectBtn")}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setApprovingId(dream.id)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.7)", color: "#ffffff" }}>{t("approveBtn")}</button>
                <button onClick={() => setRejectingId(dream.id)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(239,68,68,0.5)", color: "#ffffff" }}>{t("rejectBtn")}</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Собранные детьми мечты, ожидающие исполнения родителем: кнопка «Исполнено». */
function DreamFulfillSection() {
  const t = useT(dict);
  const queryClient = useQueryClient();

  const { data: completedDreams = [] } = useQuery<any[]>({
    queryKey: ["dreams-completed"],
    queryFn: dreamsApi.parentCompleted,
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: string) => dreamsApi.fulfill(id),
    onSuccess: () => {
      toast.success(t("dreamFulfilled"));
      queryClient.invalidateQueries({ queryKey: ["dreams-completed"] });
    },
    onError: () => toast.error(t("error")),
  });

  if (completedDreams.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 900, color: "#ffffff" }}>{t("dreamsToFulfill")}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {completedDreams.map((dream: any) => (
          <div key={dream.id} style={{ ...GLASS, padding: "14px 16px", border: "1px solid rgba(0,220,120,0.4)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              {dream.photoUrl ? (
                <img src={dreamPhotoUrl(dream)} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🎉</div>
              )}
              <div>
                <p style={{ margin: 0, fontWeight: 800, color: "#ffffff" }}>{dream.name}</p>
                <p style={{ margin: "2px 0 4px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{t("childPrefix", { name: dream.child?.name ?? "" })}</p>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 9999, fontWeight: 800, background: "rgba(0,220,120,0.3)", color: "#aaffcc" }}>
                  {t("collectedBadge")} · <CoinIcon size={11} /> {dream.savedCoins?.toLocaleString?.() ?? dream.savedCoins}
                </span>
              </div>
            </div>
            <button
              onClick={() => fulfillMutation.mutate(dream.id)}
              disabled={fulfillMutation.isPending}
              style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.75)", color: "#ffffff", opacity: fulfillMutation.isPending ? 0.6 : 1 }}
            >
              {fulfillMutation.isPending ? "..." : t("fulfillBtn")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const SPEND_STATUS: Record<RewardRequest["status"], { bg: string }> = {
  pending: { bg: "rgba(255,200,0,0.28)" },
  delivered: { bg: "rgba(34,197,94,0.32)" },
  rejected: { bg: "rgba(239,68,68,0.32)" },
};

/** История расходов монет ребёнка: на что потрачено, сколько, дата, статус (задача 12). */
function SpendingHistory({ childId }: { childId: string }) {
  const t = useT(dict);
  const { data: allRequests = [], isLoading } = useQuery<RewardRequest[]>({
    queryKey: ["reward-requests"],
    queryFn: rewardsApi.listRequests,
  });
  const requests = allRequests
    .filter((r) => r.childId === childId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalSpent = requests
    .filter((r) => r.status !== "rejected")
    .reduce((sum, r) => sum + r.coinsAmount, 0);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#ffffff" }}>{t("spendingHistory")}</h2>
        {requests.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
            {t("writtenOff")} <CoinIcon size={12} /> {totalSpent}
          </span>
        )}
      </div>
      {isLoading ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{t("loading")}</p>
      ) : requests.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 18, padding: "24px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>🪙</p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{t("noSpending")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((req) => {
            const cfg = SPEND_STATUS[req.status];
            const spendLabel = { pending: t("spendPending"), delivered: t("spendDelivered"), rejected: t("spendRejected") }[req.status];
            const rewardName = req.reward?.name ?? t("rewardFallback");
            return (
              <div key={req.id} style={{ ...GLASS, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                  {req.reward?.photoUrl ? <img src={rewardPhotoUrl(req.reward)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎁"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rewardName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>{formatDate(req.createdAt)}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontWeight: 900, color: "#ffffff", fontSize: 15 }}>−{req.coinsAmount} <CoinIcon size={13} /></p>
                  <span style={{ display: "inline-block", marginTop: 4, fontSize: 10.5, padding: "3px 8px", borderRadius: 9999, fontWeight: 800, background: cfg.bg, color: "#ffffff" }}>{spendLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { key: "overview" },
  { key: "expenses" },
  { key: "sessions" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/** Вкладки, чтобы не скроллить всю страницу ради истории расходов/сессий (задача 4). */
function TabBar({ active, onChange }: { active: TabKey; onChange: (key: TabKey) => void }) {
  const t = useT(dict);
  const tabLabels = { overview: t("tabOverview"), expenses: t("tabExpenses"), sessions: t("tabSessions") };
  return (
    <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: 9999, padding: 4, marginBottom: 20 }}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 9999,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "inherit",
              background: isActive ? "rgba(255,255,255,0.9)" : "transparent",
              color: isActive ? "#4776e6" : "rgba(255,255,255,0.62)",
              transition: "all 0.18s",
            }}
          >
            {tabLabels[tab.key]}
          </button>
        );
      })}
    </div>
  );
}

export default function ParentChildProgressPage() {
  const t = useT(dict);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const childId = params.id;
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const { data: child, isLoading: loadingChild } = useQuery<Child>({
    queryKey: ["child", childId],
    queryFn: () => childrenApi.get(childId),
    enabled: !!childId,
  });

  const { data: stats, isLoading: loadingStats } = useQuery<ChildStats>({
    queryKey: ["child-stats", childId],
    queryFn: () => childrenApi.getStats(childId),
    enabled: !!childId,
  });

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["child-balance", childId],
    queryFn: () => coinsApi.childBalance(childId),
    enabled: !!childId,
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery<Session[]>({
    queryKey: ["sessions", childId],
    queryFn: () => sessionsApi.list({ childId }),
    enabled: !!childId,
  });

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const isLoading = loadingChild || loadingStats;

  return (
    <main style={{ minHeight: "100dvh", padding: "20px 20px 48px", maxWidth: 520, margin: "0 auto" }}>
      <button
        onClick={() => router.push("/parent/cabinet")}
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.75)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 20, padding: 0 }}
      >
        {t("back")}
      </button>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: 18, background: "rgba(255,255,255,0.1)", animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : !child ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <p style={{ fontSize: 40, margin: "0 0 12px" }}>🔍</p>
          <p style={{ margin: "0 0 16px", fontWeight: 700, color: "#ffffff" }}>{t("notFound")}</p>
          <button onClick={() => router.push("/parent/cabinet")} style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.75)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {t("backToCabinet")}
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            {child.photoUrl ? (
              <img src={childPhotoUrl(child)} alt={child.name} style={{ width: 64, height: 64, borderRadius: 20, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#ffffff", flexShrink: 0 }}>
                {child.name[0]}
              </div>
            )}
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{child.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{t("ageYears", { age: child.age })}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{t("streakDays", { n: child.streak })}</span>
                {balance != null && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}><CoinIcon size={13} /> {balance.balance ?? 0}</span>
                )}
              </div>
            </div>
          </div>

          <DreamApprovalSection />

          <DreamFulfillSection />

          <TabBar active={activeTab} onChange={setActiveTab} />

          {activeTab === "overview" && (
            <>
              <CredentialsSection child={child} />

              <div style={{ marginBottom: 12 }}>
                <EditProfileSection child={child} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <ChangePasswordSection childId={childId} parentId={child.parentId} />
              </div>

              {stats && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <StatCard emoji="🔥" value={stats.streak} label={t("statStreak")} highlight />
                  <StatCard emoji="📚" value={stats.totalSessions} label={t("statSessions")} />
                  <StatCard emoji={<CoinIcon size={22} />} value={stats.totalCoinsEarned} label={t("statCoinsEarned")} />
                  <StatCard emoji="📖" value={stats.activeEnrollments} label={t("statActiveCourses")} />
                </div>
              )}
            </>
          )}

          {activeTab === "expenses" && <SpendingHistory childId={childId} />}

          {activeTab === "sessions" && (
            <div>
              {loadingSessions ? (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{t("loading")}</p>
              ) : sortedSessions.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 18, padding: "32px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: 40, margin: "0 0 8px" }}>📭</p>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#ffffff" }}>{t("noSessions")}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{t("noSessionsHint")}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sortedSessions.map((session, idx) => (
                    <SessionRow key={session.id} session={session} defaultOpen={idx === 0} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}

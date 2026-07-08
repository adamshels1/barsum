"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, CheckCircle, LogOut, Plus, TrendingUp, Users2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { challengesApi } from "@/lib/api/challenges";
import { expertsApi } from "@/lib/api/experts";
import { sessionsApi } from "@/lib/api/sessions";
import { useAuthStore } from "@/stores/auth-store";
import { CoinIcon } from "@/components/CoinIcon";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT, type Dict } from "@/i18n/useT";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3012";

const dict: Dict = {
  ru: {
    statusDraft: "Черновик",
    statusModeration: "На модерации",
    statusPublished: "Опубликован",
    statusRejected: "Отклонён",
    statChallenges: "заданий",
    statStudents: "учеников",
    statRevenue: "₸ всего",
    reasonLowScore: "Слабое чтение — нужно решение",
    reasonNoSpeech: "Речь не распозналась",
    reasonAiError: "AI не смог обработать",
    childFallback: "Ребёнок",
    bookFallback: "Книга",
    part: "Часть",
    readingRecord: "Запись чтения",
    parentReport: "Отчёт родителю",
    reportPlaceholder: "Короткий отчёт для родителя...",
    approve: "Засчитать",
    reject: "Не засчитать",
    approvedToast: "Засчитано! Монеты начислены",
    rejectedToast: "Не засчитано",
    expertPanel: "Панель эксперта",
    expertFallback: "Эксперт",
    logout: "Выйти",
    create: "Создать",
    myTasks: "Мои задания",
    inReview: "На проверке",
    published: "Опубликованные",
    noPublished: "Нет опубликованных",
    createFirst: "Создайте первое задание для учеников",
    partsCount: "{n} частей",
  },
  kk: {
    statusDraft: "Қаралама",
    statusModeration: "Модерацияда",
    statusPublished: "Жарияланды",
    statusRejected: "Қабылданбады",
    statChallenges: "тапсырма",
    statStudents: "оқушы",
    statRevenue: "₸ барлығы",
    reasonLowScore: "Оқу нашар — шешім қажет",
    reasonNoSpeech: "Сөйлеу танылмады",
    reasonAiError: "AI өңдей алмады",
    childFallback: "Бала",
    bookFallback: "Кітап",
    part: "Бөлім",
    readingRecord: "Оқу жазбасы",
    parentReport: "Ата-анаға есеп",
    reportPlaceholder: "Ата-анаға қысқаша есеп...",
    approve: "Есептеу",
    reject: "Есептемеу",
    approvedToast: "Есептелді! Монеталар қосылды",
    rejectedToast: "Есептелмеді",
    expertPanel: "Сарапшы панелі",
    expertFallback: "Сарапшы",
    logout: "Шығу",
    create: "Құру",
    myTasks: "Менің тапсырмаларым",
    inReview: "Тексеруде",
    published: "Жарияланғандар",
    noPublished: "Жарияланғандар жоқ",
    createFirst: "Оқушыларға арналған алғашқы тапсырманы құрыңыз",
    partsCount: "{n} бөлім",
  },
};

interface Challenge {
  id: string; title: string; bookTitle: string; bookAuthor: string;
  totalParts: number; price: number; coinsReward: number;
  ageMin: number; ageMax: number;
  status: "draft" | "moderation" | "published" | "rejected";
  membersCount: number;
}

const STATUS: Record<string, { labelKey: string; color: string; bg: string }> = {
  draft:      { labelKey: "statusDraft",      color: "rgba(255,255,255,0.6)",  bg: "rgba(255,255,255,0.1)" },
  moderation: { labelKey: "statusModeration", color: "#ffffff",               bg: "rgba(255,255,255,0.2)" },
  published:  { labelKey: "statusPublished",  color: "#4776e6",               bg: "rgba(255,255,255,0.85)" },
  rejected:   { labelKey: "statusRejected",   color: "#ffffff",               bg: "rgba(200,0,0,0.35)" },
};

const stats_config = [
  { key: "challenges", labelKey: "statChallenges", Icon: BookMarked },
  { key: "students",   labelKey: "statStudents",   Icon: Users2 },
  { key: "revenueTg",  labelKey: "statRevenue",    Icon: TrendingUp, isCurrency: true },
];

function ReviewCard({ item, busy, onApprove, onReject }: {
  item: any;
  busy: boolean;
  onApprove: (report: string) => void;
  onReject: (report: string) => void;
}) {
  const t = useT(dict);
  const s = item.session;
  const child = s?.child;
  const ch = s?.enrollment?.challenge;
  const reasonLabel: Record<string, string> = {
    low_score: t("reasonLowScore"),
    no_speech: t("reasonNoSpeech"),
    ai_error: t("reasonAiError"),
  };
  // Поле предзаполнено AI-черновиком — эксперту остаётся поправить и подтвердить.
  const [report, setReport] = useState<string>(s?.expertReportDraft ?? "");

  return (
    <div className="glass" style={{ padding: 16, borderRadius: 16, border: "1px solid rgba(255,150,100,0.3)" }}>
      <div style={{ marginBottom: 10 }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: "#ffffff" }}>
          {child?.name || t("childFallback")} · {ch?.bookTitle || t("bookFallback")}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
          {t("part")} {s?.partNumber} · {new Date(item.createdAt).toLocaleDateString("ru-RU")}
          {s?.reviewReason ? ` · ${reasonLabel[s.reviewReason] ?? ""}` : ""}
        </p>
      </div>

      {/* Аудио — эксперт слушает сам */}
      {s?.id && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: "0 0 5px", fontSize: 10.5, fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>{t("readingRecord")}</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={`${API_BASE}/sessions/${s.id}/audio`} style={{ width: "100%", height: 34 }} />
        </div>
      )}

      {/* Краткий отчёт для родителя (предзаполнен AI) */}
      <p style={{ margin: "0 0 5px", fontSize: 10.5, fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>{t("parentReport")}</p>
      <textarea
        value={report}
        onChange={(e) => setReport(e.target.value)}
        rows={3}
        placeholder={t("reportPlaceholder")}
        style={{ width: "100%", resize: "vertical", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: "8px 10px", color: "#ffffff", fontSize: 12.5, fontFamily: "inherit", lineHeight: 1.5, marginBottom: 10, boxSizing: "border-box" }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onApprove(report)}
          disabled={busy}
          style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "rgba(0,200,100,0.3)", color: "#aaffcc", fontWeight: 900, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <CheckCircle size={15} strokeWidth={2.5} />
          {t("approve")}
        </button>
        <button
          onClick={() => onReject(report)}
          disabled={busy}
          style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "rgba(255,80,80,0.25)", color: "#ffaaaa", fontWeight: 900, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <XCircle size={15} strokeWidth={2.5} />
          {t("reject")}
        </button>
      </div>
    </div>
  );
}

export default function ExpertHomePage() {
  const router = useRouter();
  const t = useT(dict);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const queryClient = useQueryClient();
  const { data: stats } = useQuery({ queryKey: ["expert-stats"], queryFn: expertsApi.stats });
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["challenges-list"],
    queryFn: () => challengesApi.list(),
  });
  const { data: reviewQueue = [] } = useQuery({
    queryKey: ["review-queue"],
    queryFn: sessionsApi.reviewQueue,
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, report }: { id: string; report: string }) => sessionsApi.approveReview(id, report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      toast.success(t("approvedToast"));
    },
  });
  const rejectMutation = useMutation({
    mutationFn: ({ id, report }: { id: string; report: string }) => sessionsApi.rejectReview(id, report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      toast.success(t("rejectedToast"));
    },
  });

  const publishedChallenges = (challenges as Challenge[]).filter((c) => c.status === "published");

  return (
    <main style={{ minHeight: "100dvh", padding: "0 0 32px" }}>
      {/* Header */}
      <div
        className="glass-header"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 20px 20px" }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {t("expertPanel")}
          </p>
          <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 900, color: "#ffffff" }}>
            {user?.name || t("expertFallback")}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LanguageSwitcher />
          <button
            onClick={() => { clearAuth(); router.push("/auth/expert"); }}
            className="glass-chip"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 13 }}
          >
            <LogOut size={14} strokeWidth={2.5} />
            {t("logout")}
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {stats_config.map(({ key, labelKey, Icon, isCurrency }) => {
            const val = (stats as any)?.[key];
            const clickable = key === "students";
            const Tag = clickable ? "button" : "div";
            return (
              <Tag
                key={key}
                className="glass"
                onClick={clickable ? () => router.push("/expert/students") : undefined}
                style={{
                  padding: "14px 10px",
                  textAlign: "center",
                  borderRadius: 16,
                  border: "none",
                  fontFamily: "inherit",
                  cursor: clickable ? "pointer" : "default",
                }}
              >
                <Icon size={18} color="rgba(255,255,255,0.8)" style={{ display: "block", margin: "0 auto 6px" }} />
                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff" }}>
                  {val != null ? (isCurrency ? val.toLocaleString("ru-RU") : val) : "—"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{t(labelKey)}</p>
              </Tag>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => router.push("/expert/create")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              padding: "16px 8px",
              borderRadius: 9999,
              border: "none",
              background: "rgba(255,255,255,0.9)",
              color: "#4776e6",
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus size={16} strokeWidth={3} />
            {t("create")}
          </button>
          <button
            onClick={() => router.push("/expert/books")}
            className="glass-chip"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              padding: "16px 8px",
              border: "1px solid rgba(255,255,255,0.28)",
              cursor: "pointer",
              fontFamily: "inherit",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <BookMarked size={16} strokeWidth={2.5} />
            {t("myTasks")}
          </button>
        </div>

        {/* Review Queue */}
        {(reviewQueue as any[]).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {t("inReview")}
              </p>
              <span style={{ padding: "3px 10px", fontSize: 12, fontWeight: 900, color: "#ffffff", background: "rgba(255,80,80,0.4)", borderRadius: 9999 }}>
                {(reviewQueue as any[]).length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(reviewQueue as any[]).map((item: any) => (
                <ReviewCard
                  key={item.id}
                  item={item}
                  busy={approveMutation.isPending || rejectMutation.isPending}
                  onApprove={(report) => approveMutation.mutate({ id: item.id, report })}
                  onReject={(report) => rejectMutation.mutate({ id: item.id, report })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Published list */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {t("published")}
            </p>
            {publishedChallenges.length > 0 && (
              <span className="glass-chip" style={{ padding: "3px 10px", fontSize: 12, fontWeight: 900, color: "#ffffff" }}>
                {publishedChallenges.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2].map((i) => (
                <div key={i} className="glass" style={{ height: 80, borderRadius: 16, animation: "pulse 2s infinite" }} />
              ))}
            </div>
          ) : publishedChallenges.length === 0 ? (
            <div className="glass" style={{ padding: 40, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <BookMarked size={24} color="#ffffff" strokeWidth={2} />
              </div>
              <p style={{ margin: 0, fontWeight: 900, color: "#ffffff" }}>{t("noPublished")}</p>
              <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                {t("createFirst")}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {publishedChallenges.map((c) => {
                const s = STATUS[c.status] ?? STATUS.published;
                return (
                  <div key={c.id} className="glass" style={{ padding: 16, borderRadius: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.bookTitle} · {t("partsCount", { n: c.totalParts })}
                        </p>
                      </div>
                      <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 9999, fontWeight: 800, flexShrink: 0, background: s.bg, color: s.color }}>
                        {t(s.labelKey)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                        <Users2 size={12} /> {c.membersCount}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}><CoinIcon size={12} /> {c.coinsReward}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#4776e6", background: "rgba(255,255,255,0.85)", borderRadius: 9999, padding: "3px 10px", marginLeft: "auto" }}>
                        {c.price.toLocaleString("ru-RU")} ₸
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

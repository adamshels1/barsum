"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { childrenApi } from "@/lib/api/children";
import { sessionsApi } from "@/lib/api/sessions";
import type { Child } from "@/types/index";
import { useT, type Dict } from "@/i18n/useT";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3012";

const dict: Dict = {
  ru: {
    ownBookConfirmTitle: "📖 Подтвердите чтение",
    ownBookTitle: "Книга",
    ownBookConfirmDesc: "«{book}» · сессия {part}{minutes}",
    ownBookMinutesRead: " · прочитано ~{n} мин",
    ownBookReasonTooShort: "Запись слишком короткая — послушайте и подтвердите, что ребёнок читал",
    ownBookReasonNoSpeech: "Не распознали речь — послушайте и решите сами",
    expertConfirmDesc: "«{book}» · часть {part} · оценка {score}/10",
    expertReasonReview: "Чтение на проверке эксперта — можете засчитать сами",
    recordingTitle: "Запись чтения",
    recordingUnavailable: "Запись недоступна",
    ownBookApprove: "✅ Засчитать",
    ownBookReject: "Отклонить",
    ownBookApproved: "Чтение засчитано!",
    ownBookRejected: "Сессия отклонена",
    ownBookConfirmError: "Ошибка. Попробуйте ещё раз",
  },
  kk: {
    ownBookConfirmTitle: "📖 Оқуды растаңыз",
    ownBookTitle: "Кітап",
    ownBookConfirmDesc: "«{book}» · сессия {part}{minutes}",
    ownBookMinutesRead: " · ~{n} мин оқыды",
    ownBookReasonTooShort: "Жазба тым қысқа — тыңдап, баланың оқығанын растаңыз",
    ownBookReasonNoSpeech: "Сөз танылмады — тыңдап, өзіңіз шешіңіз",
    expertConfirmDesc: "«{book}» · {part}-бөлім · баға {score}/10",
    expertReasonReview: "Оқу сарапшы тексеруінде — өзіңіз де есептей аласыз",
    recordingTitle: "Оқу жазбасы",
    recordingUnavailable: "Жазба қолжетімсіз",
    ownBookApprove: "✅ Есептеу",
    ownBookReject: "Қабылдамау",
    ownBookApproved: "Оқу есептелді!",
    ownBookRejected: "Сессия қабылданбады",
    ownBookConfirmError: "Қате. Қайталап көріңіз",
  },
};

function OwnBookConfirmCard({ session, childName }: { session: any; childName?: string }) {
  const t = useT(dict);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (approve: boolean) => sessionsApi.parentConfirm(session.id, approve),
    onSuccess: (_data, approve) => {
      toast.success(approve ? t("ownBookApproved") : t("ownBookRejected"));
      queryClient.invalidateQueries({ queryKey: ["own-book-pending"] });
      queryClient.invalidateQueries({ queryKey: ["parent-balance"] });
    },
    onError: () => toast.error(t("ownBookConfirmError")),
  });

  const isOwnBook = session.enrollment?.challenge?.category === "own_book";
  const book = session.enrollment?.challenge?.bookTitle || session.enrollment?.challenge?.title || t("ownBookTitle");
  const minutesSec = session.audioDurationSec ?? 0;
  const minutes = minutesSec > 0 ? Math.max(1, Math.round(minutesSec / 60)) : 0;
  const minutesLabel = minutes > 0 ? t("ownBookMinutesRead", { n: minutes }) : "";
  const desc = isOwnBook
    ? t("ownBookConfirmDesc", { book, part: session.partNumber, minutes: minutesLabel })
    : t("expertConfirmDesc", { book, part: session.partNumber, score: session.aiScore ?? "—" });
  const reason = isOwnBook
    ? (session.reviewReason === "no_speech" ? t("ownBookReasonNoSpeech") : t("ownBookReasonTooShort"))
    : t("expertReasonReview");

  return (
    <div className="glass-card" style={{ padding: "14px 16px", border: "1px solid rgba(255,210,0,0.4)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>{childName || "—"}</p>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>📖</span>
      </div>
      <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{desc}</p>
      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{reason}</p>

      {/* Аудиозапись чтения ребёнка — родитель слушает перед решением.
          Через backend-прокси (https), а не прямую http-ссылку MinIO — иначе mixed-content на проде. */}
      {session.audioUrl ? (
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("recordingTitle")}</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={`${API_BASE}/sessions/${session.id}/audio`} style={{ width: "100%", height: 36 }} />
        </div>
      ) : (
        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>{t("recordingUnavailable")}</p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => mutation.mutate(false)}
          disabled={mutation.isPending}
          style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13.5, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}
        >
          {t("ownBookReject")}
        </button>
        <button
          onClick={() => mutation.mutate(true)}
          disabled={mutation.isPending}
          style={{ flex: 1.4, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 900, fontSize: 13.5, background: "rgba(255,255,255,0.92)", color: "#4776e6" }}
        >
          {t("ownBookApprove")}
        </button>
      </div>
    </div>
  );
}

/**
 * Инбокс подтверждения чтения для родителя (спорные/экспертские сессии).
 * Показывается на главной (кабинет), а не в каталоге — чтобы родитель сразу видел,
 * что ребёнок прочитал, слушал аудиозапись и решал: засчитать или отклонить.
 */
export function OwnBookConfirmInbox() {
  const t = useT(dict);

  const { data: pending = [] } = useQuery<any[]>({
    queryKey: ["own-book-pending"],
    queryFn: sessionsApi.parentPending,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: childrenApi.list,
  });

  if (pending.length === 0) return null;

  return (
    <div style={{ padding: "16px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#ffffff" }}>{t("ownBookConfirmTitle")}</h2>
        <span style={{ fontSize: 12, fontWeight: 900, padding: "2px 9px", borderRadius: 9999, background: "#ef4444", color: "#ffffff" }}>{pending.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pending.map((s) => (
          <OwnBookConfirmCard key={s.id} session={s} childName={children.find((c) => c.id === s.childId)?.name} />
        ))}
      </div>
    </div>
  );
}

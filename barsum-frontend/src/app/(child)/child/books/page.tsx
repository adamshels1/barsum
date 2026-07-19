"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { challengesApi } from "@/lib/api/challenges";
import { bookRequestsApi } from "@/lib/api/book-requests";
import { sessionsApi } from "@/lib/api/sessions";
import type { BookRequest, Challenge } from "@/types";
import { BackButton } from "@/components/BackButton";
import { Portal } from "@/components/Portal";
import { useT, type Dict } from "@/i18n/useT";
import { useState } from "react";

const dict: Dict = {
  ru: {
    title: "Каталог книг",
    subtitle: "Выбери книгу — родитель сможет купить её для тебя",
    parts: "{n} частей",
    askBtn: "Попросить",
    requested: "Попросили ⏳",
    owned: "Уже у тебя ✅",
    requestSent: "Запрос отправлен родителю! 🎉",
    requestError: "Не получилось отправить запрос",
    empty: "Книг пока нет",
    emptyHint: "Загляни сюда позже",
    confirmTitle: "Попросить эту книгу?",
    confirmHint: "Родитель получит твой запрос и сможет купить её для тебя",
    confirmYes: "Да, попросить",
    confirmNo: "Отмена",
    sending: "Отправляем...",
  },
  kk: {
    title: "Кітаптар каталогы",
    subtitle: "Кітап таңда — ата-анаң оны саған сатып ала алады",
    parts: "{n} бөлім",
    askBtn: "Сұрау",
    requested: "Сұралды ⏳",
    owned: "Сенде бар ✅",
    requestSent: "Сұрау ата-анаңа жіберілді! 🎉",
    requestError: "Сұрауды жіберу мүмкін болмады",
    empty: "Әзірге кітаптар жоқ",
    emptyHint: "Кейінірек қайта кел",
    confirmTitle: "Осы кітапты сұрайсың ба?",
    confirmHint: "Ата-анаң сұрауыңды алып, оны саған сатып ала алады",
    confirmYes: "Иә, сұраймын",
    confirmNo: "Бас тарту",
    sending: "Жіберілуде...",
  },
};

const CARD_GRADS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f7971e, #ffd200)",
  "linear-gradient(135deg, #fc4a1a, #f7b733)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #0f9b8e, #38ef7d)",
];

function BookCard({
  challenge,
  enrollmentId,
  requested,
  onAsk,
}: {
  challenge: Challenge & { author?: { name?: string } };
  enrollmentId?: string;
  requested: boolean;
  onAsk: () => void;
}) {
  const t = useT(dict);
  const router = useRouter();
  const grad = CARD_GRADS[challenge.title.charCodeAt(0) % CARD_GRADS.length];

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          ...(challenge.coverImage ? { aspectRatio: "1 / 1" } : { height: 120 }),
          background: challenge.coverImage ? `url(${challenge.coverImage}) center/cover` : grad,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
          position: "relative",
        }}
      >
        {!challenge.coverImage && (
          <>
            <p style={{ color: "#ffffff", fontWeight: 900, textAlign: "center", fontSize: 12, lineHeight: 1.3, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.25)", WebkitLineClamp: 3, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
              {challenge.bookTitle || challenge.title}
            </p>
            {challenge.bookAuthor && (
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, margin: "4px 0 0", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                {challenge.bookAuthor}
              </p>
            )}
          </>
        )}
        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 9999, background: "rgba(0,0,0,0.25)", color: "#ffffff" }}>
          {t("parts", { n: challenge.totalParts })}
        </span>
      </div>
      <div style={{ padding: "12px 12px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 13, color: "#ffffff", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {challenge.title}
        </p>
        {challenge.author?.name && (
          <p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            👤 {challenge.author.name}
          </p>
        )}
        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          {enrollmentId ? (
            <button
              onClick={() => router.push(`/child/book/${enrollmentId}`)}
              style={{ width: "100%", padding: "9px 0", borderRadius: 9999, border: "none", background: "rgba(34,197,94,0.35)", color: "#ffffff", fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              {t("owned")}
            </button>
          ) : requested ? (
            <span style={{ display: "block", width: "100%", padding: "9px 0", borderRadius: 9999, textAlign: "center", background: "rgba(255,200,0,0.25)", color: "#ffd200", fontWeight: 900, fontSize: 12 }}>
              {t("requested")}
            </span>
          ) : (
            <button
              onClick={onAsk}
              style={{ width: "100%", padding: "9px 0", borderRadius: 9999, border: "none", background: "rgba(255,255,255,0.88)", color: "#4776e6", fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              {t("askBtn")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Подтверждение «точно попросить?» — чтобы запрос не улетал родителю с одного случайного тапа.
function ConfirmAskModal({
  challenge, onConfirm, onClose, sending,
}: {
  challenge: Challenge;
  onConfirm: () => void;
  onClose: () => void;
  sending: boolean;
}) {
  const t = useT(dict);
  const grad = CARD_GRADS[challenge.title.charCodeAt(0) % CARD_GRADS.length];
  return (
    <Portal>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        onClick={(e) => { if (e.target === e.currentTarget && !sending) onClose(); }}
      >
        <div className="glass" style={{ width: "100%", maxWidth: 340, padding: "28px 24px", textAlign: "center", background: "rgba(30,20,80,0.92)" }}>
          <div
            style={{ width: 96, height: 96, borderRadius: 20, margin: "0 auto 14px", background: challenge.coverImage ? `url(${challenge.coverImage}) center/cover` : grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}
          >
            {!challenge.coverImage && "📖"}
          </div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: "#ffffff", lineHeight: 1.25 }}>{t("confirmTitle")}</h2>
          <p style={{ margin: "8px 0 4px", fontWeight: 800, fontSize: 14.5, color: "#ffd200" }}>
            «{challenge.bookTitle || challenge.title}»
          </p>
          <p style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>
            {t("confirmHint")}
          </p>
          <button
            onClick={onConfirm}
            disabled={sending}
            style={{ width: "100%", padding: "14px 0", borderRadius: 9999, border: "none", background: "rgba(255,255,255,0.92)", color: "#4776e6", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "inherit", opacity: sending ? 0.6 : 1 }}
          >
            {sending ? t("sending") : t("confirmYes")}
          </button>
          <button
            onClick={onClose}
            disabled={sending}
            style={{ width: "100%", marginTop: 10, padding: "12px 0", borderRadius: 9999, border: "none", background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.75)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
          >
            {t("confirmNo")}
          </button>
        </div>
      </div>
    </Portal>
  );
}

export default function ChildBooksPage() {
  const t = useT(dict);
  const queryClient = useQueryClient();
  // Книга, ожидающая подтверждения «точно попросить?».
  const [confirmBook, setConfirmBook] = useState<Challenge | null>(null);

  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ["challenges"],
    queryFn: () => challengesApi.list(),
  });

  // Поллинг: как только родитель купил/отклонил — статусы карточек обновляются сами.
  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["enrollments"],
    queryFn: sessionsApi.listEnrollments,
    refetchInterval: 15000,
    refetchOnWindowFocus: "always",
  });

  const { data: myRequests = [] } = useQuery<BookRequest[]>({
    queryKey: ["book-requests-my"],
    queryFn: bookRequestsApi.my,
    refetchInterval: 15000,
    refetchOnWindowFocus: "always",
  });

  const askMutation = useMutation({
    mutationFn: (challengeId: string) => bookRequestsApi.request(challengeId),
    onSuccess: () => {
      toast.success(t("requestSent"));
      setConfirmBook(null);
      queryClient.invalidateQueries({ queryKey: ["book-requests-my"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t("requestError")),
  });

  // Обычные опубликованные книги; незавершённое соавторство живёт в /child/collab.
  const books = (challenges as any[]).filter(
    (c) => c.status === "published" && !(c.collaborative && !c.collabCompleted),
  );

  const enrollmentByChallenge = new Map<string, string>(
    (enrollments as any[]).map((e) => [e.challengeId, e.id]),
  );
  const pendingRequested = new Set(
    myRequests.filter((r) => r.status === "pending").map((r) => r.challengeId),
  );

  return (
    <main style={{ minHeight: "100dvh", padding: "20px 20px 48px", maxWidth: 480, margin: "0 auto" }}>
      <BackButton href="/child/home" />

      <h1 style={{ margin: "16px 0 4px", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>📚 {t("title")}</h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{t("subtitle")}</p>

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card" style={{ height: 220, animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="glass" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 56, margin: "0 0 16px" }}>📚</p>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 18, color: "#ffffff" }}>{t("empty")}</p>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.55)" }}>{t("emptyHint")}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {books.map((c: any) => (
            <BookCard
              key={c.id}
              challenge={c}
              enrollmentId={enrollmentByChallenge.get(c.id)}
              requested={pendingRequested.has(c.id)}
              onAsk={() => setConfirmBook(c)}
            />
          ))}
        </div>
      )}

      {confirmBook && (
        <ConfirmAskModal
          challenge={confirmBook}
          sending={askMutation.isPending}
          onConfirm={() => askMutation.mutate(confirmBook.id)}
          onClose={() => setConfirmBook(null)}
        />
      )}
    </main>
  );
}

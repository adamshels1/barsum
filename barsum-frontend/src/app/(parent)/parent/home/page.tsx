"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { challengesApi } from "@/lib/api/challenges";
import { childrenApi } from "@/lib/api/children";
import { paymentsApi } from "@/lib/api/payments";
import { rewardsApi } from "@/lib/api/rewards";
import { bookRequestsApi } from "@/lib/api/book-requests";
import type { BookRequest, Challenge, Child, Payment, RewardRequest } from "@/types/index";
import { CoinIcon } from "@/components/CoinIcon";
import { RewardRequestCard } from "@/components/RewardRequestCard";
import { Portal } from "@/components/Portal";
import { BackButton } from "@/components/BackButton";
import { useT, type Dict } from "@/i18n/useT";
import { useLocaleStore } from "@/stores/locale-store";

const dict: Dict = {
  ru: {
    parts: "{n} частей",
    buyBtn: "Купить",
    back: "← Назад",
    toPay: "К оплате",
    qrInstructions: "Откройте приложение Kaspi.kz, отсканируйте QR и оплатите {total} ₸. После оплаты нажмите кнопку ниже.",
    payOnline: "💳 Оплатить через Kaspi",
    payHint: "Нажмите «Оплатить через Kaspi», оплатите и вернитесь сюда.",
    confirmLocked: "Кнопка активируется после нажатия «Оплатить через Kaspi»",
    processing: "Оформление...",
    confirmPaid: "✅ Я оплатил(а), подтвердить",
    orderError: "Ошибка оформления",
    ageParts: "{min}–{max} лет · {parts} частей",
    forWhom: "Для кого покупаем?",
    noChildren: "Нет детей. Добавьте в кабинете.",
    selectChild: "— выберите ребёнка —",
    childOption: "{name}, {age} лет",
    challengePrice: "Цена задания",
    coinsForChild: "Монеты для ребёнка",
    coinsForChildHint: "Начислим монеты на сумму книги",
    maxCoins: "50 000 монет",
    total: "Итого",
    payBtn: "Оплатить 🚀",
    selectChildWarn: "⚠️ Сначала выберите ребёнка, для которого покупаете",
    purchaseDone: "Покупка оформлена!",
    childGotAccess: "Ребёнок уже получил доступ к заданию!",
    great: "Отлично!",
    catalogTitle: "Каталог заданий",
    collabCard: "Сочиняем вместе",
    collabCardHint: "Придумайте продолжение сказки голосом вместе с ребёнком",
    cabinet: "← Кабинет",
    allAges: "Все",
    childRequests: "🔔 Запросы детей",
    bookRequests: "📚 Просят книгу",
    bookReqText: "{name} просит книгу",
    bookReqBuy: "Купить",
    bookReqReject: "Отклонить",
    bookReqRejected: "Запрос отклонён",
    bookReqError: "Ошибка",
    ownBookConfirmTitle: "📖 Подтвердите чтение",
    ownBookConfirmDesc: "«{book}» · сессия {part}{minutes}",
    ownBookMinutesRead: " · прочитано ~{n} мин",
    ownBookReasonTooShort: "Запись слишком короткая — подтвердите, что ребёнок читал",
    ownBookReasonNoSpeech: "Не распознали речь — послушайте и решите сами",
    expertConfirmDesc: "«{book}» · часть {part} · оценка {score}/10",
    expertReasonReview: "Чтение на проверке эксперта — можете засчитать сами",
    ownBookApprove: "✅ Засчитать",
    ownBookReject: "Отклонить",
    ownBookApproved: "Чтение засчитано!",
    ownBookRejected: "Сессия отклонена",
    ownBookConfirmError: "Не удалось сохранить",
    noChallenges: "Нет заданий",
    tryChangeFilter: "Попробуйте изменить фильтр возраста",
    ownBookTitle: "Своя книжка",
    ownBookSubtitle: "Ребёнок читает свою бумажную книгу — по 10 минут за монеты",
    ownBookCta: "Оплатить чтение",
    ownBookModalTitle: "Своя книжка",
    bookNameLabel: "Какую книгу читаем?",
    bookNamePlaceholder: "Например: Гарри Поттер",
    amountLabel: "Сколько оплачиваем?",
    customAmount: "Своя сумма, ₸",
    ownBookPreview: "{minutes} минут · {sessions} сессий по 10 мин · до {coins} монет",
    ownBookHint: "1 час чтения = 1000 ₸. Ребёнок получает ~{perPart} монет за сессию.",
    minAmountWarn: "⚠️ Минимальная сумма — 1000 ₸",
  },
  kk: {
    parts: "{n} бөлім",
    buyBtn: "Сатып алу",
    back: "← Артқа",
    toPay: "Төлеуге",
    qrInstructions: "Kaspi.kz қосымшасын ашып, QR-кодты сканерлеп, {total} ₸ төлеңіз. Төлегеннен кейін төмендегі батырманы басыңыз.",
    payOnline: "💳 Kaspi арқылы төлеу",
    payHint: "«Kaspi арқылы төлеу» батырмасын басып, төлеңіз де, осында оралыңыз.",
    confirmLocked: "Батырма «Kaspi арқылы төлеу» басылғаннан кейін белсенді болады",
    processing: "Рәсімделуде...",
    confirmPaid: "✅ Төледім, растау",
    orderError: "Рәсімдеу қатесі",
    ageParts: "{min}–{max} жас · {parts} бөлім",
    forWhom: "Кімге сатып аламыз?",
    noChildren: "Балалар жоқ. Кабинетте қосыңыз.",
    selectChild: "— баланы таңдаңыз —",
    childOption: "{name}, {age} жас",
    challengePrice: "Тапсырма бағасы",
    coinsForChild: "Балаға монеталар",
    coinsForChildHint: "Кітап бағасына тең монета береміз",
    maxCoins: "50 000 монета",
    total: "Барлығы",
    payBtn: "Төлеу 🚀",
    selectChildWarn: "⚠️ Алдымен сатып алатын балаңызды таңдаңыз",
    purchaseDone: "Сатып алу рәсімделді!",
    childGotAccess: "Бала тапсырмаға қол жеткізді!",
    great: "Тамаша!",
    catalogTitle: "Тапсырмалар каталогы",
    collabCard: "Бірге шығарамыз",
    collabCardHint: "Баламен бірге ертегінің жалғасын дауыспен ойлап табыңыз",
    cabinet: "← Кабинет",
    allAges: "Барлығы",
    childRequests: "🔔 Балалардың сұраулары",
    bookRequests: "📚 Кітап сұрайды",
    bookReqText: "{name} кітап сұрайды",
    bookReqBuy: "Сатып алу",
    bookReqReject: "Бас тарту",
    bookReqRejected: "Сұрау қабылданбады",
    bookReqError: "Қате",
    ownBookConfirmTitle: "📖 Оқуды растаңыз",
    ownBookConfirmDesc: "«{book}» · сессия {part}{minutes}",
    ownBookMinutesRead: " · ~{n} мин оқыды",
    ownBookReasonTooShort: "Жазба тым қысқа — баланың оқығанын растаңыз",
    ownBookReasonNoSpeech: "Сөзді танымадық — тыңдап, өзіңіз шешіңіз",
    expertConfirmDesc: "«{book}» · {part}-бөлім · баға {score}/10",
    expertReasonReview: "Оқу сарапшы тексеруінде — өзіңіз де есептей аласыз",
    ownBookApprove: "✅ Есептеу",
    ownBookReject: "Бас тарту",
    ownBookApproved: "Оқу есептелді!",
    ownBookRejected: "Сессия қабылданбады",
    ownBookConfirmError: "Сақтау мүмкін болмады",
    noChallenges: "Тапсырмалар жоқ",
    tryChangeFilter: "Жас сүзгісін өзгертіп көріңіз",
    ownBookTitle: "Өз кітабы",
    ownBookSubtitle: "Бала өз қағаз кітабын оқиды — 10 минуттан монетаға",
    ownBookCta: "Оқуды төлеу",
    ownBookModalTitle: "Өз кітабы",
    bookNameLabel: "Қай кітапты оқимыз?",
    bookNamePlaceholder: "Мысалы: Гарри Поттер",
    amountLabel: "Қанша төлейміз?",
    customAmount: "Өз сомаң, ₸",
    ownBookPreview: "{minutes} минут · {sessions} сессия 10 минуттан · {coins} монетаға дейін",
    ownBookHint: "1 сағат оқу = 1000 ₸. Бала әр сессия үшін ~{perPart} монета алады.",
    minAmountWarn: "⚠️ Ең төменгі сома — 1000 ₸",
  },
};

// Экономика «своей книги» — зеркалит backend (payments.service.ts).
const OWN_BOOK_MIN_TG = 1000;
const OWN_BOOK_MINUTES_PER_1000 = 60;
const OWN_BOOK_SESSION_MIN = 10;
const OWN_BOOK_AMOUNTS = [1000, 2000, 3000];

// Экономика как на бэке (payments.service.ts): 1 монета = 1 ₸,
// фиксированная сумма за сессию = цена / кол-во сессий.
function ownBookCalc(amountTg: number) {
  const minutes = Math.round((amountTg / 1000) * OWN_BOOK_MINUTES_PER_1000);
  const sessions = Math.max(1, Math.round(minutes / OWN_BOOK_SESSION_MIN));
  const perPart = Math.round(amountTg / sessions);
  const coins = perPart * sessions;
  return { minutes, sessions, perPart, coins };
}

const COMMISSION = 0.15;

const AGE_FILTERS = [
  { label: "Все", value: "", min: 0, max: 99 },
  { label: "6–8", value: "6-8", min: 6, max: 8 },
  { label: "9–11", value: "9-11", min: 9, max: 11 },
  { label: "12–14", value: "12-14", min: 12, max: 14 },
  { label: "14+", value: "14+", min: 14, max: 99 },
];

const CARD_GRADS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f7971e, #ffd200)",
  "linear-gradient(135deg, #fc4a1a, #f7b733)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #0f9b8e, #38ef7d)",
];

function ChallengeCard({
  challenge,
  onBuy,
}: {
  challenge: Challenge & { author?: { name?: string } };
  onBuy: () => void;
}) {
  const t = useT(dict);
  const colorIdx = challenge.title.charCodeAt(0) % CARD_GRADS.length;
  const grad = CARD_GRADS[colorIdx];

  return (
    <div
      className="glass-card"
      style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <div style={{ ...(challenge.coverImage ? { aspectRatio: "1 / 1" } : { height: 120 }), background: challenge.coverImage ? `url(${challenge.coverImage}) center/cover` : grad, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 12, position: "relative" }}>
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
        {challenge.membersCount > 0 && (
          <span style={{ position: "absolute", top: 8, right: 8, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 9999, background: "rgba(0,0,0,0.25)", color: "#ffffff" }}>
            👥 {challenge.membersCount}
          </span>
        )}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#ffffff" }}>
              {challenge.price.toLocaleString()} ₸
            </p>
            <button
              onClick={onBuy}
              style={{ padding: "7px 14px", borderRadius: 9999, border: "none", background: "rgba(255,255,255,0.88)", color: "#4776e6", fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              {t("buyBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const KASPI_PAY_URL = "https://pay.kaspi.kz/pay/e50c7djs";

function KaspiQrStep({
  total, onBack, onConfirm, isPending, onPayClick,
}: {
  total: number;
  onBack: () => void;
  onConfirm: () => void;
  isPending: boolean;
  // Вызывается при клике «Оплатить через Kaspi» — тут создаётся черновик оплаты (intent),
  // чтобы незавершённая покупка не потерялась, если родитель забудет подтвердить.
  onPayClick?: () => void;
}) {
  const t = useT(dict);
  // «Я оплатил» разблокируется только после того, как родитель нажал «Оплатить онлайн».
  const [payClicked, setPayClicked] = useState(false);
  const confirmDisabled = isPending || !payClicked;
  return (
    <div style={{ padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
      <BackButton onClick={onBack} style={{ alignSelf: "flex-start" }} />

      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 2px", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{t("toPay")}</p>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 30, color: "#ffffff" }}>{total.toLocaleString()} ₸</p>
      </div>

      <a
        href={KASPI_PAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => { setPayClicked(true); onPayClick?.(); }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "18px 20px",
          borderRadius: 16,
          background: "linear-gradient(135deg, #ff5a5f 0%, #f01f2c 100%)",
          color: "#ffffff",
          fontWeight: 900,
          fontSize: 17,
          textDecoration: "none",
          boxShadow: "0 6px 18px rgba(240,31,44,0.35)",
        }}
      >
        {t("payOnline")}
      </a>

      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 1.5 }}>
        {t("payHint")}
      </p>

      <button
        onClick={onConfirm}
        disabled={confirmDisabled}
        style={{
          padding: "16px 20px",
          borderRadius: 16,
          border: "none",
          background: "rgba(255,255,255,0.9)",
          color: "#4776e6",
          fontWeight: 900,
          fontSize: 15,
          cursor: confirmDisabled ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          opacity: confirmDisabled ? 0.5 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {isPending ? t("processing") : t("confirmPaid")}
      </button>

      {!payClicked && (
        <p style={{ margin: "-6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.4 }}>
          {t("confirmLocked")}
        </p>
      )}
    </div>
  );
}

function PurchaseModal({
  challenge, children, onClose, onSuccess, initialChildId,
}: {
  challenge: Challenge & { author?: { name?: string } };
  children: Child[];
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
  // Предвыбранный ребёнок — при покупке из запроса «просит книгу».
  initialChildId?: string;
}) {
  const t = useT(dict);
  const [childId, setChildId] = useState(initialChildId ?? "");
  const [step, setStep] = useState<"form" | "qr">("form");
  // id черновика оплаты (intent), созданного при клике «Оплатить через Kaspi».
  const [intentId, setIntentId] = useState<string | null>(null);

  // Монеты для ребёнка равны цене книги (ползунок убран).
  const coinsAmount = challenge.price;
  const total = challenge.price;

  // Фаза 1: клик «Оплатить через Kaspi» → создаём незавершённый платёж (pending),
  // чтобы покупка не потерялась, если родитель забудет подтвердить.
  const intentMutation = useMutation({
    mutationFn: () => paymentsApi.createIntent({ childId, challengeId: challenge.id, coinsAmount }),
    onSuccess: (payment: Payment) => setIntentId(payment.id),
    // Тихо: даже если черновик не создался, «Я оплатил» ниже сработает через fallback.
    onError: () => {},
  });

  // Фаза 2: «Я оплатил» → подтверждаем черновик (pending → confirmed + доступ).
  const confirmMutation = useMutation({
    mutationFn: () => paymentsApi.confirmMine(intentId as string),
    onSuccess: (payment: Payment) => onSuccess(payment),
    onError: (err: any) => { toast.error(err?.response?.data?.message || t("orderError")); },
  });

  // Fallback: если черновик по какой-то причине не создался — создаём сразу confirmed
  // (старое поведение), чтобы кнопка «Я оплатил» не оказалась мёртвой.
  const createMutation = useMutation({
    mutationFn: () => paymentsApi.create({ childId, challengeId: challenge.id, coinsAmount }),
    onSuccess: (payment: Payment) => onSuccess(payment),
    onError: (err: any) => { toast.error(err?.response?.data?.message || t("orderError")); },
  });

  const handleConfirm = () => {
    if (intentId) confirmMutation.mutate();
    else createMutation.mutate();
  };
  const confirmPending = confirmMutation.isPending || createMutation.isPending;

  const colorIdx = challenge.title.charCodeAt(0) % CARD_GRADS.length;
  const grad = CARD_GRADS[colorIdx];

  return (
    <Portal>
    <div
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "92dvh",
          overflowY: "auto",
          background: "rgba(30,20,80,0.92)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: "28px 28px 0 0",
        }}
      >
        {/* Cover */}
        <div style={{ height: 120, background: challenge.coverImage ? `url(${challenge.coverImage}) center/cover` : grad, position: "relative", borderRadius: "28px 28px 0 0", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end", padding: "16px 20px" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.3)", border: "none", color: "#ffffff", fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff", lineHeight: 1.2 }}>{challenge.bookTitle || challenge.title}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            {t("ageParts", { min: challenge.ageMin, max: challenge.ageMax, parts: challenge.totalParts })}
          </p>
        </div>

        {step === "qr" ? (
          <KaspiQrStep
            total={total}
            onBack={() => setStep("form")}
            onPayClick={() => { if (!intentId) intentMutation.mutate(); }}
            onConfirm={handleConfirm}
            isPending={confirmPending}
          />
        ) : (
        <div style={{ padding: "20px 20px max(32px, env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Child selector */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("forWhom")}
            </label>
            {children.length === 0 ? (
              <p style={{ fontSize: 14, textAlign: "center", padding: "12px 0", color: "rgba(255,255,255,0.55)" }}>
                {t("noChildren")}
              </p>
            ) : (
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="glass-input"
                style={{ appearance: "none", cursor: "pointer", border: !childId ? "1px solid rgba(255,200,0,0.6)" : undefined }}
              >
                <option value="" style={{ background: "#2a1a60" }}>{t("selectChild")}</option>
                {children.map((ch) => (
                  <option key={ch.id} value={ch.id} style={{ background: "#2a1a60" }}>
                    {t("childOption", { name: ch.name, age: ch.age })}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Price */}
          <div className="glass-sm" style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#ffffff" }}>{challenge.title}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{t("challengePrice")}</p>
            </div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 22, color: "#ffffff" }}>{challenge.price.toLocaleString()} ₸</p>
          </div>

          {/* Монеты для ребёнка = цена книги (фиксировано, без ползунка) */}
          <div className="glass-sm" style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#ffffff" }}>{t("coinsForChild")}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{t("coinsForChildHint")}</p>
            </div>
            <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 5, fontWeight: 900, fontSize: 22, color: "#ffd200" }}>
              {coinsAmount.toLocaleString()} <CoinIcon size={18} />
            </p>
          </div>

          {/* Total + buy */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{t("total")}</p>
              <p style={{ margin: "2px 0 0", fontWeight: 900, fontSize: 26, color: "#ffffff" }}>{total.toLocaleString()} ₸</p>
            </div>
            <button
              onClick={() => setStep("qr")}
              disabled={!childId}
              style={{
                padding: "16px 20px",
                borderRadius: 16,
                border: "none",
                background: "rgba(255,255,255,0.9)",
                color: "#4776e6",
                fontWeight: 900,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit",
                opacity: !childId ? 0.45 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {t("payBtn")}
            </button>
          </div>
          {!childId && children.length > 0 && (
            <p style={{ margin: "-8px 0 0", fontSize: 12.5, fontWeight: 700, color: "#ffd200", textAlign: "right" }}>
              {t("selectChildWarn")}
            </p>
          )}
        </div>
        )}
      </div>
    </div>
    </Portal>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  const t = useT(dict);
  return (
    <Portal>
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div
        className="glass"
        style={{ width: "100%", maxWidth: 340, padding: 40, textAlign: "center" }}
      >
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{t("purchaseDone")}</h2>
        <p style={{ margin: "10px 0 28px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
          {t("childGotAccess")}
        </p>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "15px 0", borderRadius: 9999, border: "none", background: "rgba(255,255,255,0.9)", color: "#4776e6", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
        >
          {t("great")}
        </button>
      </div>
    </div>
    </Portal>
  );
}

function OwnBookModal({
  children, onClose, onSuccess,
}: {
  children: Child[];
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}) {
  const t = useT(dict);
  const [childId, setChildId] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [amountTg, setAmountTg] = useState(OWN_BOOK_AMOUNTS[0]);
  const [step, setStep] = useState<"form" | "qr">("form");

  const { minutes, sessions, perPart, coins } = ownBookCalc(amountTg);
  const canPay = !!childId && amountTg >= OWN_BOOK_MIN_TG;

  const createMutation = useMutation({
    mutationFn: () => paymentsApi.createOwnBook({ childId, bookTitle, amountTg }),
    onSuccess: (res: any) => onSuccess(res?.payment ?? res),
    onError: (err: any) => { toast.error(err?.response?.data?.message || t("orderError")); },
  });

  return (
    <Portal>
    <div
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 480, maxHeight: "92dvh", overflowY: "auto", background: "rgba(30,20,80,0.92)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "28px 28px 0 0" }}>
        {/* Hero cover */}
        <div style={{ height: 150, background: `url(/books/own-book.jpg) center/cover`, position: "relative", borderRadius: "28px 28px 0 0", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end", padding: "16px 20px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "28px 28px 0 0", background: "linear-gradient(to top, rgba(30,20,80,0.85), rgba(30,20,80,0) 60%)" }} />
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.35)", border: "none", color: "#ffffff", fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}
          >
            ✕
          </button>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#ffffff", lineHeight: 1.2, position: "relative" }}>📖 {t("ownBookModalTitle")}</h2>
        </div>

        {step === "qr" ? (
          <KaspiQrStep
            total={amountTg}
            onBack={() => setStep("form")}
            onConfirm={() => createMutation.mutate()}
            isPending={createMutation.isPending}
          />
        ) : (
        <div style={{ padding: "20px 20px max(32px, env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Child selector */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("forWhom")}
            </label>
            {children.length === 0 ? (
              <p style={{ fontSize: 14, textAlign: "center", padding: "12px 0", color: "rgba(255,255,255,0.55)" }}>{t("noChildren")}</p>
            ) : (
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="glass-input"
                style={{ appearance: "none", cursor: "pointer", border: !childId ? "1px solid rgba(255,200,0,0.6)" : undefined }}
              >
                <option value="" style={{ background: "#2a1a60" }}>{t("selectChild")}</option>
                {children.map((ch) => (
                  <option key={ch.id} value={ch.id} style={{ background: "#2a1a60" }}>
                    {t("childOption", { name: ch.name, age: ch.age })}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Book title */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("bookNameLabel")}
            </label>
            <input
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder={t("bookNamePlaceholder")}
              className="glass-input"
            />
          </div>

          {/* Amount chips + custom */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("amountLabel")}
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {OWN_BOOK_AMOUNTS.map((a) => {
                const active = amountTg === a;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmountTg(a)}
                    style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: active ? "none" : "1px solid rgba(255,255,255,0.22)", background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)", color: active ? "#4776e6" : "rgba(255,255,255,0.85)", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  >
                    {a.toLocaleString()} ₸
                  </button>
                );
              })}
            </div>
            <input
              type="number"
              min={OWN_BOOK_MIN_TG}
              step={500}
              value={amountTg}
              onChange={(e) => setAmountTg(Math.max(0, Number(e.target.value) || 0))}
              placeholder={t("customAmount")}
              className="glass-input"
            />
          </div>

          {/* Preview */}
          <div className="glass-sm" style={{ padding: "14px 16px" }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#ffffff", display: "flex", alignItems: "center", gap: 6 }}>
              {t("ownBookPreview", { minutes, sessions, coins: coins.toLocaleString() })} <CoinIcon size={13} />
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
              {t("ownBookHint", { perPart })}
            </p>
          </div>

          {/* Total + pay */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{t("total")}</p>
              <p style={{ margin: "2px 0 0", fontWeight: 900, fontSize: 26, color: "#ffffff" }}>{amountTg.toLocaleString()} ₸</p>
            </div>
            <button
              onClick={() => setStep("qr")}
              disabled={!canPay}
              style={{ padding: "16px 20px", borderRadius: 16, border: "none", background: "rgba(255,255,255,0.9)", color: "#4776e6", fontWeight: 900, fontSize: 14, cursor: canPay ? "pointer" : "not-allowed", fontFamily: "inherit", opacity: canPay ? 1 : 0.45, transition: "opacity 0.15s" }}
            >
              {t("payBtn")}
            </button>
          </div>
          {!childId && children.length > 0 && (
            <p style={{ margin: "-8px 0 0", fontSize: 12.5, fontWeight: 700, color: "#ffd200", textAlign: "right" }}>{t("selectChildWarn")}</p>
          )}
          {childId && amountTg < OWN_BOOK_MIN_TG && (
            <p style={{ margin: "-8px 0 0", fontSize: 12.5, fontWeight: 700, color: "#ffd200", textAlign: "right" }}>{t("minAmountWarn")}</p>
          )}
        </div>
        )}
      </div>
    </div>
    </Portal>
  );
}

export default function ParentHomePage() {
  const t = useT(dict);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [ageFilter, setAgeFilter] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<(Challenge & { author?: { name?: string } }) | null>(null);
  // Ребёнок, для которого открыта покупка из запроса «просит книгу».
  const [purchaseChildId, setPurchaseChildId] = useState<string | undefined>(undefined);
  const [showOwnBook, setShowOwnBook] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: challenges = [], isLoading: loadingChallenges } = useQuery<Challenge[]>({
    queryKey: ["challenges"],
    queryFn: () => challengesApi.list(),
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: childrenApi.list,
  });

  const { data: requests = [] } = useQuery<RewardRequest[]>({
    queryKey: ["reward-requests"],
    queryFn: rewardsApi.listRequests,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const { data: bookRequests = [] } = useQuery<BookRequest[]>({
    queryKey: ["book-requests"],
    queryFn: bookRequestsApi.list,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const pendingBookRequests = bookRequests.filter((r) => r.status === "pending");

  const rejectBookReqMutation = useMutation({
    mutationFn: (id: string) => bookRequestsApi.reject(id),
    onSuccess: () => {
      toast.success(t("bookReqRejected"));
      queryClient.invalidateQueries({ queryKey: ["book-requests"] });
    },
    onError: () => toast.error(t("bookReqError")),
  });

  const ageConfig = AGE_FILTERS.find((f) => f.value === ageFilter);
  const filteredChallenges = (challenges as any[]).filter((c) => {
    if (c.status !== "published") return false;
    if (ageConfig && ageConfig.value !== "") {
      if (c.ageMax < ageConfig.min || c.ageMin > ageConfig.max) return false;
    }
    return true;
  });

  const handlePurchaseSuccess = () => {
    setSelectedChallenge(null);
    setPurchaseChildId(undefined);
    setShowSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["payments"] });
    queryClient.invalidateQueries({ queryKey: ["book-requests"] });
  };

  return (
    <main style={{ minHeight: "100dvh", paddingBottom: 24 }}>
      {/* Header */}
      <div
        className="glass-header"
        style={{ padding: "52px 20px 16px", position: "sticky", top: 0, zIndex: 10 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{t("catalogTitle")}</h1>
          <button
            onClick={() => router.push("/parent/cabinet")}
            className="glass-chip"
            style={{ padding: "8px 14px", border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 9999, color: "#ffffff", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}
          >
            {t("cabinet")}
          </button>
        </div>

        {/* Age filters */}
        <div className="scrollbar-hide" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {AGE_FILTERS.map((f) => {
            const active = ageFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setAgeFilter(f.value)}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: 9999,
                  border: active ? "none" : "1px solid rgba(255,255,255,0.22)",
                  background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)",
                  color: active ? "#4776e6" : "rgba(255,255,255,0.75)",
                  fontWeight: active ? 900 : 600,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {f.value === "" ? t("allAges") : f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Сочиняем вместе (соавторство) */}
      <div style={{ padding: "16px 20px 0" }}>
        <button
          onClick={() => router.push("/parent/collab")}
          aria-label={t("collabCard")}
          style={{ width: "100%", padding: 0, border: "none", background: "transparent", cursor: "pointer", borderRadius: 20, overflow: "hidden", display: "block", lineHeight: 0, fontFamily: "inherit" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={locale === "kk" ? "/banners/collab-kk.jpg" : "/banners/collab-ru.jpg"}
            alt={t("collabCard")}
            style={{ width: "100%", height: "auto", display: "block", borderRadius: 20 }}
          />
        </button>
      </div>

      {/* Подтверждение чтения перенесено на главную (кабинет) — см. OwnBookConfirmInbox */}

      {/* Запросы детей — самый важный сценарий, вынесен на самый верх (задачи 9, 10) */}
      {pendingRequests.length > 0 && (
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#ffffff" }}>{t("childRequests")}</h2>
            <span style={{ fontSize: 12, fontWeight: 900, padding: "2px 9px", borderRadius: 9999, background: "#ef4444", color: "#ffffff" }}>{pendingRequests.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingRequests.map((req) => (
              <RewardRequestCard key={req.id} request={req} highlight />
            ))}
          </div>
        </div>
      )}

      {/* Запросы книг от детей: «купи мне эту книгу» */}
      {pendingBookRequests.length > 0 && (
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#ffffff" }}>{t("bookRequests")}</h2>
            <span style={{ fontSize: 12, fontWeight: 900, padding: "2px 9px", borderRadius: 9999, background: "#ef4444", color: "#ffffff" }}>{pendingBookRequests.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingBookRequests.map((req) => {
              const ch = req.challenge;
              return (
                <div key={req.id} className="glass" style={{ padding: "14px 16px", border: "1px solid rgba(120,200,255,0.35)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: ch?.coverImage ? `url(${ch.coverImage}) center/cover` : "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                      {!ch?.coverImage && "📚"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{t("bookReqText", { name: req.child?.name ?? "" })}</p>
                      <p style={{ margin: "3px 0 0", fontWeight: 900, fontSize: 14.5, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        «{ch?.bookTitle || ch?.title}»
                      </p>
                    </div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#ffffff", flexShrink: 0 }}>{(ch?.price ?? 0).toLocaleString()} ₸</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => rejectBookReqMutation.mutate(req.id)}
                      disabled={rejectBookReqMutation.isPending}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
                    >
                      {t("bookReqReject")}
                    </button>
                    <button
                      onClick={() => { if (ch) { setPurchaseChildId(req.childId); setSelectedChallenge(ch as any); } }}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 900, fontSize: 13, background: "rgba(255,255,255,0.9)", color: "#4776e6" }}
                    >
                      {t("bookReqBuy")} 🚀
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Своя книжка — приоритетный сценарий, крупная карточка над каталогом */}
      <div style={{ padding: "16px 20px 0" }}>
        <button
          onClick={() => setShowOwnBook(true)}
          style={{ display: "block", width: "100%", padding: 0, border: "none", borderRadius: 24, overflow: "hidden", cursor: "pointer", fontFamily: "inherit", textAlign: "left", position: "relative", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
        >
          <div style={{ height: 360, background: `url(/books/own-book.jpg) center/cover`, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,12,55,0.94) 14%, rgba(20,12,55,0.1) 62%)" }} />
            <div style={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#ffffff", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>📖 {t("ownBookTitle")}</p>
              <p style={{ margin: "8px 0 14px", fontSize: 14.5, fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1.4, textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>{t("ownBookSubtitle")}</p>
              <span style={{ display: "inline-block", padding: "12px 22px", borderRadius: 9999, background: "rgba(255,255,255,0.95)", color: "#4776e6", fontWeight: 900, fontSize: 15 }}>{t("ownBookCta")} →</span>
            </div>
          </div>
        </button>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        {loadingChallenges ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card" style={{ height: 220, animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="glass" style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 56, margin: "0 0 16px" }}>📚</p>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 18, color: "#ffffff" }}>{t("noChallenges")}</p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
              {t("tryChangeFilter")}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filteredChallenges.map((c: any) => (
              <ChallengeCard key={c.id} challenge={c} onBuy={() => { setPurchaseChildId(undefined); setSelectedChallenge(c); }} />
            ))}
          </div>
        )}
      </div>

      {selectedChallenge && (
        <PurchaseModal
          key={`${selectedChallenge.id}-${purchaseChildId ?? ""}`}
          challenge={selectedChallenge}
          children={children}
          initialChildId={purchaseChildId}
          onClose={() => { setSelectedChallenge(null); setPurchaseChildId(undefined); }}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {showOwnBook && (
        <OwnBookModal
          children={children}
          onClose={() => setShowOwnBook(false)}
          onSuccess={() => { setShowOwnBook(false); setShowSuccess(true); queryClient.invalidateQueries({ queryKey: ["payments"] }); }}
        />
      )}

      {showSuccess && <SuccessModal onClose={() => { setShowSuccess(false); router.push("/parent/cabinet"); }} />}
    </main>
  );
}

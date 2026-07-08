"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { CoinIcon } from "@/components/CoinIcon";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    tabPending: "Ожидают",
    tabConfirmed: "Подтверждены",
    tabRejected: "Отклонены",
    statusConfirmed: "Подтверждён",
    statusRejected: "Отклонён",
    statusPending: "Ожидает",
    back: "Назад",
    title: "Подтверждение платежей",
    loadError: "Ошибка загрузки. Попробуйте ещё раз.",
    empty: "Нет платежей",
    parent: "Родитель",
    child: "Ребёнок",
    amount: "Сумма",
    coins: "Монеты",
    note: "Примечание: {text}",
    receiptAlt: "Квитанция",
    openReceipt: "Открыть квитанцию ↗",
    confirm: "Подтвердить",
    reject: "Отклонить",
    rejectPlaceholder: "Причина отклонения (необязательно)",
    rejecting: "Отклоняем...",
    confirmReject: "Подтвердить отклонение",
    cancel: "Отмена",
  },
  kk: {
    tabPending: "Күтуде",
    tabConfirmed: "Расталған",
    tabRejected: "Қабылданбаған",
    statusConfirmed: "Расталды",
    statusRejected: "Қабылданбады",
    statusPending: "Күтуде",
    back: "Артқа",
    title: "Төлемдерді растау",
    loadError: "Жүктеу қатесі. Қайта көріңіз.",
    empty: "Төлемдер жоқ",
    parent: "Ата-ана",
    child: "Бала",
    amount: "Сома",
    coins: "Монеталар",
    note: "Ескертпе: {text}",
    receiptAlt: "Түбіртек",
    openReceipt: "Түбіртекті ашу ↗",
    confirm: "Растау",
    reject: "Қабылдамау",
    rejectPlaceholder: "Қабылдамау себебі (міндетті емес)",
    rejecting: "Қабылданбауда...",
    confirmReject: "Қабылдамауды растау",
    cancel: "Бас тарту",
  },
};

type PaymentStatus = "pending" | "confirmed" | "rejected";

interface Payment {
  id: string;
  parentId: string;
  parent?: { name?: string; email?: string };
  childId: string;
  child?: { name?: string; login?: string };
  challengeId: string;
  challenge?: { title?: string };
  challengePrice: number;
  coinsAmount: number;
  coinsTg: number;
  total: number;
  receiptUrl?: string;
  status: PaymentStatus;
  adminNote?: string;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeStyle(status: string): React.CSSProperties {
  if (status === "confirmed") return { background: "rgba(0,200,100,0.25)", color: "#aaffcc", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 700 };
  if (status === "rejected") return { background: "rgba(220,0,0,0.25)", color: "#ffaaaa", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 700 };
  return { background: "rgba(255,180,0,0.25)", color: "#ffd200", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 700 };
}

function SkeletonCard() {
  return (
    <div className="glass" style={{ padding: 20, opacity: 0.5, animation: "pulse 2s infinite" }}>
      <div style={{ height: 16, borderRadius: 10, background: "rgba(255,255,255,0.15)", width: "60%", marginBottom: 12 }} />
      <div style={{ height: 16, borderRadius: 10, background: "rgba(255,255,255,0.1)", width: "40%", marginBottom: 8 }} />
      <div style={{ height: 16, borderRadius: 10, background: "rgba(255,255,255,0.1)", width: "50%" }} />
    </div>
  );
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const t = useT(dict);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PaymentStatus>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const TABS: { key: PaymentStatus; label: string }[] = [
    { key: "pending", label: t("tabPending") },
    { key: "confirmed", label: t("tabConfirmed") },
    { key: "rejected", label: t("tabRejected") },
  ];

  const statusLabel = (status: string): string => {
    if (status === "confirmed") return t("statusConfirmed");
    if (status === "rejected") return t("statusRejected");
    return t("statusPending");
  };

  const { data, isLoading, isError } = useQuery<Payment[]>({
    queryKey: ["admin-payments", activeTab],
    queryFn: () => adminApi.payments(activeTab),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => adminApi.confirmPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      adminApi.rejectPayment(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      setRejectingId(null);
      setRejectNote("");
    },
  });

  return (
    <main style={{ minHeight: "100dvh", padding: "0 0 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "52px 20px 20px" }}>
        <button
          onClick={() => router.push("/admin")}
          className="glass-chip"
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 14 }}
          aria-label={t("back")}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          {t("back")}
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#ffffff" }}>
          {t("title")}
        </h1>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(0,0,0,0.2)", borderRadius: 9999, padding: 4 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "inherit",
                background: activeTab === tab.key ? "rgba(255,255,255,0.22)" : "transparent",
                color: activeTab === tab.key ? "#ffffff" : "rgba(255,255,255,0.5)",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : isError ? (
          <div className="glass" style={{ padding: 20, textAlign: "center", color: "#ffaaaa" }}>
            {t("loadError")}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="glass" style={{ padding: 40, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CreditCard size={28} color="#ffffff" strokeWidth={2} />
            </div>
            <p style={{ margin: 0, fontWeight: 900, color: "#ffffff" }}>{t("empty")}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.map((payment) => (
              <div key={payment.id} className="glass" style={{ padding: 18 }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("parent")}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: "#ffffff", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {payment.parent?.name || payment.parent?.email || payment.parentId.slice(-8)}
                    </p>
                  </div>
                  <span style={statusBadgeStyle(payment.status)}>{statusLabel(payment.status)}</span>
                </div>

                {/* Child */}
                <div style={{ marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("child")}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: "#ffffff", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {payment.child?.name || payment.child?.login || payment.childId.slice(-8)}
                  </p>
                  {payment.challenge?.title && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                      📚 {payment.challenge.title}
                    </p>
                  )}
                </div>

                {/* Amount row */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{t("amount")}</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#ffffff" }}>{payment.total} ₸</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{t("coins")}</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "rgba(255,255,255,0.85)" }}>{payment.coinsAmount} <CoinIcon size={16} /></p>
                  </div>
                </div>

                {/* Date */}
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  {formatDate(payment.createdAt)}
                </p>

                {/* Admin note */}
                {payment.adminNote && (
                  <p style={{ margin: "0 0 10px", fontSize: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                    {t("note", { text: payment.adminNote })}
                  </p>
                )}

                {/* Receipt */}
                {payment.receiptUrl && (
                  <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginBottom: 12 }}>
                    <img
                      src={payment.receiptUrl}
                      alt={t("receiptAlt")}
                      style={{ width: 80, height: 80, borderRadius: 16, objectFit: "cover", border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>
                      {t("openReceipt")}
                    </p>
                  </a>
                )}

                {/* Actions for pending */}
                {payment.status === "pending" && rejectingId !== payment.id && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => confirmMutation.mutate(payment.id)}
                      disabled={confirmMutation.isPending}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "1px solid rgba(100,255,150,0.35)", background: "rgba(0,200,100,0.25)", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: confirmMutation.isPending ? 0.5 : 1 }}
                    >
                      {t("confirm")}
                    </button>
                    <button
                      onClick={() => { setRejectingId(payment.id); setRejectNote(""); }}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "1px solid rgba(255,100,100,0.35)", background: "rgba(220,0,0,0.25)", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {t("reject")}
                    </button>
                  </div>
                )}

                {/* Reject inline form */}
                {payment.status === "pending" && rejectingId === payment.id && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      type="text"
                      placeholder={t("rejectPlaceholder")}
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      className="glass-input"
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => rejectMutation.mutate({ id: payment.id, note: rejectNote })}
                        disabled={rejectMutation.isPending}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "1px solid rgba(255,100,100,0.35)", background: "rgba(220,0,0,0.25)", color: "#ffffff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: rejectMutation.isPending ? 0.5 : 1 }}
                      >
                        {rejectMutation.isPending ? t("rejecting") : t("confirmReject")}
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectNote(""); }}
                        className="glass-chip"
                        style={{ padding: "10px 16px", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 13 }}
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

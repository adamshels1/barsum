"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    tabReview: "На рассмотрении",
    tabApproved: "Одобрены",
    tabRejected: "Отклонены",
    statusReview: "На рассмотрении",
    statusApproved: "Одобрен",
    statusRejected: "Отклонён",
    back: "Назад",
    title: "Модерация экспертов",
    loadError: "Ошибка загрузки. Попробуйте ещё раз.",
    empty: "Нет заявок",
    userId: "ID пользователя",
    specialization: "Специализация",
    whatsapp: "WhatsApp",
    about: "О себе",
    approve: "Одобрить",
    reject: "Отклонить",
    rejectPlaceholder: "Причина отклонения (необязательно)",
    rejecting: "Отклоняем...",
    confirmReject: "Подтвердить отклонение",
    cancel: "Отмена",
  },
  kk: {
    tabReview: "Қаралуда",
    tabApproved: "Мақұлданған",
    tabRejected: "Қабылданбаған",
    statusReview: "Қаралуда",
    statusApproved: "Мақұлданды",
    statusRejected: "Қабылданбады",
    back: "Артқа",
    title: "Сарапшыларды модерациялау",
    loadError: "Жүктеу қатесі. Қайта көріңіз.",
    empty: "Өтінімдер жоқ",
    userId: "Пайдаланушы ID",
    specialization: "Мамандану",
    whatsapp: "WhatsApp",
    about: "Өзі туралы",
    approve: "Мақұлдау",
    reject: "Қабылдамау",
    rejectPlaceholder: "Қабылдамау себебі (міндетті емес)",
    rejecting: "Қабылданбауда...",
    confirmReject: "Қабылдамауды растау",
    cancel: "Бас тарту",
  },
};

type ExpertStatus = "review" | "approved" | "rejected";

interface Expert {
  id: string;
  userId: string;
  status: string;
  specialization?: string;
  whatsapp?: string;
  bio?: string;
}

function statusBadgeStyle(status: string): React.CSSProperties {
  if (status === "review") return { background: "rgba(255,180,0,0.25)", color: "#ffd200", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 700 };
  if (status === "approved") return { background: "rgba(0,200,100,0.25)", color: "#aaffcc", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 700 };
  return { background: "rgba(220,0,0,0.25)", color: "#ffaaaa", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontWeight: 700 };
}

function SkeletonCard() {
  return (
    <div className="glass" style={{ padding: 20, opacity: 0.5, animation: "pulse 2s infinite" }}>
      <div style={{ height: 16, borderRadius: 10, background: "rgba(255,255,255,0.15)", width: "55%", marginBottom: 12 }} />
      <div style={{ height: 16, borderRadius: 10, background: "rgba(255,255,255,0.1)", width: "40%", marginBottom: 8 }} />
      <div style={{ height: 48, borderRadius: 12, background: "rgba(255,255,255,0.1)" }} />
    </div>
  );
}

export default function AdminExpertsPage() {
  const router = useRouter();
  const t = useT(dict);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ExpertStatus>("review");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const TABS: { key: ExpertStatus; label: string }[] = [
    { key: "review", label: t("tabReview") },
    { key: "approved", label: t("tabApproved") },
    { key: "rejected", label: t("tabRejected") },
  ];

  const statusLabel = (status: string): string => {
    if (status === "review") return t("statusReview");
    if (status === "approved") return t("statusApproved");
    if (status === "rejected") return t("statusRejected");
    return status;
  };

  const { data, isLoading, isError } = useQuery<Expert[]>({
    queryKey: ["admin-experts", activeTab],
    queryFn: () => adminApi.experts(activeTab),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveExpert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experts"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectExpert(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experts"] });
      setRejectingId(null);
      setRejectReason("");
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
              <Search size={28} color="#ffffff" strokeWidth={2} />
            </div>
            <p style={{ margin: 0, fontWeight: 900, color: "#ffffff" }}>{t("empty")}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.map((expert) => (
              <div key={expert.id} className="glass" style={{ padding: 18 }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {t("userId")}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "#ffffff", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {expert.userId}
                    </p>
                  </div>
                  <span style={statusBadgeStyle(expert.status)}>{statusLabel(expert.status)}</span>
                </div>

                {/* Specialization */}
                {expert.specialization && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("specialization")}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#ffffff" }}>{expert.specialization}</p>
                  </div>
                )}

                {/* WhatsApp */}
                {expert.whatsapp && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("whatsapp")}</p>
                    <a
                      href={`https://wa.me/${expert.whatsapp.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#aaffcc", textDecoration: "none" }}
                    >
                      {expert.whatsapp}
                    </a>
                  </div>
                )}

                {/* Bio */}
                {expert.bio && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("about")}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                      {expert.bio.length > 150 ? expert.bio.slice(0, 150) + "…" : expert.bio}
                    </p>
                  </div>
                )}

                {/* Actions for review status */}
                {expert.status === "review" && rejectingId !== expert.id && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => approveMutation.mutate(expert.id)}
                      disabled={approveMutation.isPending}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "1px solid rgba(100,255,150,0.35)", background: "rgba(0,200,100,0.25)", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: approveMutation.isPending ? 0.5 : 1 }}
                    >
                      {t("approve")}
                    </button>
                    <button
                      onClick={() => { setRejectingId(expert.id); setRejectReason(""); }}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "1px solid rgba(255,100,100,0.35)", background: "rgba(220,0,0,0.25)", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {t("reject")}
                    </button>
                  </div>
                )}

                {/* Reject inline form */}
                {expert.status === "review" && rejectingId === expert.id && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <textarea
                      placeholder={t("rejectPlaceholder")}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="glass-input"
                      style={{ resize: "none" }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => rejectMutation.mutate({ id: expert.id, reason: rejectReason })}
                        disabled={rejectMutation.isPending}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "1px solid rgba(255,100,100,0.35)", background: "rgba(220,0,0,0.25)", color: "#ffffff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: rejectMutation.isPending ? 0.5 : 1 }}
                      >
                        {rejectMutation.isPending ? t("rejecting") : t("confirmReject")}
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(""); }}
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

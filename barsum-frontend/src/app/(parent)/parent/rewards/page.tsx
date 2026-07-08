"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { rewardsApi } from "@/lib/api/rewards";
import type { Reward, RewardRequest } from "@/types";
import { CoinIcon } from "@/components/CoinIcon";
import { RewardRequestCard } from "@/components/RewardRequestCard";
import { RewardTemplatePicker } from "@/components/RewardTemplatePicker";
import type { RewardTemplate } from "@/lib/rewardTemplates";
import { Portal } from "@/components/Portal";
import { rewardPhotoUrl } from "@/lib/media";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    typeSnack: "Перекус",
    typeTime: "Время",
    typeExperience: "Активность",
    rewardCreated: "Награда создана!",
    createError: "Ошибка при создании",
    newReward: "Новая награда",
    photoSelected: "Фото выбрано",
    photoHint: "Картинка награды (необязательно)",
    nameLabel: "Название",
    namePlaceholder: "Например: Час игры",
    costLabel: "Стоимость (монеты)",
    typeLabel: "Тип",
    optSnack: "🍎 Перекус",
    optTime: "⏱️ Время",
    optExperience: "🎉 Активность",
    cancel: "Отмена",
    creating: "Создаём...",
    create: "Создать",
    addedX: "«{name}» добавлена",
    addError: "Ошибка при добавлении",
    addReward: "Добавить награду",
    addRewardHint: "Выбери готовую — цену можно поправить, или создай свою",
    ownReward: "✏️ Своя награда",
    done: "Готово",
    deactivated: "Награда деактивирована",
    error: "Ошибка",
    remove: "Убрать",
    counted: "Засчитано!",
    notCounted: "Не засчитано",
    childFallback: "Ребёнок {id}",
    dayN: "День {n}",
    hide: "Скрыть",
    details: "Детали",
    transcription: "Расшифровка",
    countBtn: "✅ Засчитать",
    dontCountBtn: "❌ Не засчитывать",
    pageTitle: "Награды 🎁",
    pageSubtitle: "Управляйте наградами и запросами детей",
    requestsFromChildren: "🔔 Запросы от детей",
    loading: "Загрузка...",
    noNewRequests: "Новых запросов нет",
    myRewards: "Мои награды",
    createBtn: "+ Создать",
    noRewards: "Наград пока нет. Создайте первую!",
    reviewQueue: "Очередь проверки",
    noSessionsToReview: "Нет сессий для проверки",
  },
  kk: {
    typeSnack: "Тіскебасар",
    typeTime: "Уақыт",
    typeExperience: "Белсенділік",
    rewardCreated: "Сыйлық құрылды!",
    createError: "Құру кезінде қате",
    newReward: "Жаңа сыйлық",
    photoSelected: "Фото таңдалды",
    photoHint: "Сыйлық суреті (міндетті емес)",
    nameLabel: "Атауы",
    namePlaceholder: "Мысалы: Ойын сағаты",
    costLabel: "Құны (монета)",
    typeLabel: "Түрі",
    optSnack: "🍎 Тіскебасар",
    optTime: "⏱️ Уақыт",
    optExperience: "🎉 Белсенділік",
    cancel: "Бас тарту",
    creating: "Құрылуда...",
    create: "Құру",
    addedX: "«{name}» қосылды",
    addError: "Қосу кезінде қате",
    addReward: "Сыйлық қосу",
    addRewardHint: "Дайынын таңда — бағасын өзгертуге болады, немесе өзіңдікін құр",
    ownReward: "✏️ Өз сыйлығың",
    done: "Дайын",
    deactivated: "Сыйлық өшірілді",
    error: "Қате",
    remove: "Алып тастау",
    counted: "Есептелді!",
    notCounted: "Есептелмеді",
    childFallback: "Бала {id}",
    dayN: "{n}-күн",
    hide: "Жасыру",
    details: "Толығырақ",
    transcription: "Аудио мәтіні",
    countBtn: "✅ Есептеу",
    dontCountBtn: "❌ Есептемеу",
    pageTitle: "Сыйлықтар 🎁",
    pageSubtitle: "Сыйлықтар мен балалардың сұрауларын басқарыңыз",
    requestsFromChildren: "🔔 Балалардан сұраулар",
    loading: "Жүктелуде...",
    noNewRequests: "Жаңа сұраулар жоқ",
    myRewards: "Менің сыйлықтарым",
    createBtn: "+ Құру",
    noRewards: "Әзірге сыйлықтар жоқ. Алғашқысын құрыңыз!",
    reviewQueue: "Тексеру кезегі",
    noSessionsToReview: "Тексеруге сессиялар жоқ",
  },
};

interface ReviewQueueItem {
  id: string;
  sessionId: string;
  childId: string;
  child?: { name: string };
  session?: { day: number; transcription?: string; aiScore?: number };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const TYPE_EMOJI: Record<string, string> = {
  snack: "🍎",
  time: "⏱️",
  experience: "🎉",
};

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 18,
};

function TypeBadge({ type }: { type: string }) {
  const t = useT(dict);
  const labels: Record<string, string> = { snack: t("typeSnack"), time: t("typeTime"), experience: t("typeExperience") };
  const emoji = TYPE_EMOJI[type] ?? "🎁";
  const label = labels[type] ?? type;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 9999, background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {emoji} {label}
    </span>
  );
}

function CreateRewardModal({ onClose }: { onClose: () => void }) {
  const t = useT(dict);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [type, setType] = useState<"snack" | "time" | "experience">("snack");
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
      const created = await rewardsApi.create({ name, cost: Number(cost), type });
      if (photoFile) {
        await rewardsApi.uploadPhoto(created.id, photoFile);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success(t("rewardCreated"));
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t("createError"));
    },
  });

  return (
    <Portal>
    <div
      className="fixed inset-0 flex items-end justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", zIndex: 60 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 400, background: "rgba(20,10,60,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "28px 28px 0 0", padding: "28px 24px max(40px, env(safe-area-inset-bottom))" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 900, color: "#ffffff" }}>{t("newReward")}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handlePhotoChange} style={{ display: "none" }} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ alignSelf: "center", width: 72, height: 72, borderRadius: 20, border: "2px dashed rgba(255,255,255,0.35)", background: photoPreview ? `url(${photoPreview}) center/cover` : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            {!photoPreview && <Camera size={20} color="rgba(255,255,255,0.6)" strokeWidth={2} />}
          </button>
          <p style={{ margin: "-8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
            {photoPreview ? t("photoSelected") : t("photoHint")}
          </p>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 6 }}>{t("nameLabel")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} className="glass-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 6 }}>{t("costLabel")}</label>
            <input type="number" min={1} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="50" className="glass-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 6 }}>{t("typeLabel")}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "snack" | "time" | "experience")}
              className="glass-input"
              style={{ appearance: "none" }}
            >
              <option value="snack">{t("optSnack")}</option>
              <option value="time">{t("optTime")}</option>
              <option value="experience">{t("optExperience")}</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
            {t("cancel")}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || !cost || mutation.isPending}
            className="btn-white"
            style={{ flex: 1, color: "#4776e6", opacity: !name.trim() || !cost ? 0.6 : 1 }}
          >
            {mutation.isPending ? t("creating") : t("create")}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

function AddRewardModal({ onClose, onCustom }: { onClose: () => void; onCustom: () => void }) {
  const t = useT(dict);
  const queryClient = useQueryClient();
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());
  const [pendingName, setPendingName] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (template: RewardTemplate) => rewardsApi.create({ name: template.name, cost: template.cost, type: template.type, photoUrl: template.image }),
    onMutate: (template) => setPendingName(template.name),
    onSuccess: (_data, template) => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      setAddedNames((prev) => new Set(prev).add(template.name));
      toast.success(t("addedX", { name: template.name }));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t("addError")),
    onSettled: () => setPendingName(null),
  });

  return (
    <Portal>
    <div
      className="fixed inset-0 flex items-end justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", zIndex: 60 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 400, maxHeight: "85vh", overflowY: "auto", background: "rgba(20,10,60,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "28px 28px 0 0", padding: "28px 24px max(32px, env(safe-area-inset-bottom))" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#ffffff" }}>{t("addReward")}</h3>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{t("addRewardHint")}</p>

        <RewardTemplatePicker onAdd={(t) => addMutation.mutate(t)} addedNames={addedNames} pendingName={pendingName} />

        <button
          type="button"
          onClick={onCustom}
          style={{ width: "100%", marginTop: 16, padding: "13px 0", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.35)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
        >
          {t("ownReward")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-white"
          style={{ width: "100%", marginTop: 10, color: "#4776e6" }}
        >
          {t("done")}
        </button>
      </div>
    </div>
    </Portal>
  );
}

function RewardCard({ reward }: { reward: Reward }) {
  const t = useT(dict);
  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: () => rewardsApi.deactivate(reward.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success(t("deactivated"));
    },
    onError: (err: any) => { toast.error(err?.response?.data?.message || t("error")); },
  });

  return (
    <div style={{ ...GLASS, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 72, height: 72, borderRadius: 18, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0, overflow: "hidden" }}>
        {reward.photoUrl ? (
          <img src={rewardPhotoUrl(reward)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          TYPE_EMOJI[reward.type] ?? "🎁"
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reward.name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}><CoinIcon size={13} /> {reward.cost}</span>
          <TypeBadge type={reward.type} />
        </div>
      </div>
      <button
        onClick={() => deactivateMutation.mutate()}
        disabled={deactivateMutation.isPending}
        style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", background: deactivateMutation.isPending ? "rgba(255,255,255,0.2)" : "rgba(239,68,68,0.4)", color: "#ffffff", flexShrink: 0, transition: "background 0.15s" }}
      >
        {deactivateMutation.isPending ? "..." : t("remove")}
      </button>
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewQueueItem }) {
  const t = useT(dict);
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => apiClient.post(`/review-queue/${item.id}/approve`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["review-queue"] }); toast.success(t("counted")); },
    onError: (err: any) => toast.error(err?.response?.data?.message || t("error")),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiClient.post(`/review-queue/${item.id}/reject`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["review-queue"] }); toast.success(t("notCounted")); },
    onError: (err: any) => toast.error(err?.response?.data?.message || t("error")),
  });

  const childName = item.child?.name ?? t("childFallback", { id: item.childId.slice(-4) });
  const session = item.session;

  return (
    <div style={{ ...GLASS, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, color: "#ffffff" }}>{childName}</p>
          {session && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
              {t("dayN", { n: session.day })}
              {session.aiScore != null && (
                <span style={{ marginLeft: 8, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>AI: {session.aiScore}/10</span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, background: "rgba(255,255,255,0.2)", color: "#ffffff" }}
        >
          {expanded ? t("hide") : t("details")}
        </button>
      </div>

      {expanded && session?.transcription && (
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{t("transcription")}</p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{session.transcription}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isPending || rejectMutation.isPending}
          style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.7)", color: "#ffffff" }}
        >
          {approveMutation.isPending ? "..." : t("countBtn")}
        </button>
        <button
          onClick={() => rejectMutation.mutate()}
          disabled={approveMutation.isPending || rejectMutation.isPending}
          style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(239,68,68,0.4)", color: "#ffffff" }}
        >
          {rejectMutation.isPending ? "..." : t("dontCountBtn")}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 18, padding: "24px 16px", textAlign: "center" }}>
      <p style={{ fontSize: 28, margin: "0 0 8px" }}>{emoji}</p>
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{text}</p>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#ffffff" }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ParentRewardsPage() {
  const t = useT(dict);
  const [modalStep, setModalStep] = useState<"closed" | "catalog" | "custom">("closed");

  const { data: rewards = [], isLoading: loadingRewards } = useQuery<Reward[]>({
    queryKey: ["rewards"],
    queryFn: rewardsApi.list,
  });

  const { data: allRequests = [], isLoading: loadingRequests } = useQuery<RewardRequest[]>({
    queryKey: ["reward-requests"],
    queryFn: rewardsApi.listRequests,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const pendingRequests = allRequests.filter((r) => r.status === "pending");

  const { data: reviewQueue = [], isLoading: loadingQueue } = useQuery<ReviewQueueItem[]>({
    queryKey: ["review-queue"],
    queryFn: () => apiClient.get("/review-queue").then((r) => r.data),
  });
  const pendingReview = reviewQueue.filter((r) => r.status === "pending");

  const activeRewards = rewards.filter((r) => r.isActive);

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 48px", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 900, color: "#ffffff" }}>{t("pageTitle")}</h1>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{t("pageSubtitle")}</p>
      </div>

      {/* Запросы детей — самый приоритетный блок, вверху экрана (задача 10) */}
      <Section title={`${t("requestsFromChildren")}${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}`}>
        {loadingRequests ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{t("loading")}</p>
        ) : pendingRequests.length === 0 ? (
          <EmptyState emoji="📭" text={t("noNewRequests")} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingRequests.map((req) => <RewardRequestCard key={req.id} request={req} highlight />)}
          </div>
        )}
      </Section>

      <Section
        title={t("myRewards")}
        action={
          <button
            onClick={() => setModalStep("catalog")}
            style={{ fontSize: 13, fontWeight: 700, padding: "7px 14px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit", background: "rgba(255,255,255,0.9)", color: "#4776e6" }}
          >
            {t("createBtn")}
          </button>
        }
      >
        {loadingRewards ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{t("loading")}</p>
        ) : activeRewards.length === 0 ? (
          <EmptyState emoji="🎁" text={t("noRewards")} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeRewards.map((reward) => <RewardCard key={reward.id} reward={reward} />)}
          </div>
        )}
      </Section>

      <Section title={`${t("reviewQueue")}${pendingReview.length > 0 ? ` (${pendingReview.length})` : ""}`}>
        {loadingQueue ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{t("loading")}</p>
        ) : pendingReview.length === 0 ? (
          <EmptyState emoji="✅" text={t("noSessionsToReview")} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingReview.map((item) => <ReviewCard key={item.id} item={item} />)}
          </div>
        )}
      </Section>

      {modalStep === "catalog" && (
        <AddRewardModal onClose={() => setModalStep("closed")} onCustom={() => setModalStep("custom")} />
      )}
      {modalStep === "custom" && <CreateRewardModal onClose={() => setModalStep("closed")} />}
    </main>
  );
}

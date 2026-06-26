"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";
import { rewardsApi } from "@/lib/api/rewards";
import { useAuthStore } from "@/stores/auth-store";

interface Reward {
  id: string;
  name: string;
  cost: number;
  type: string;
  isActive: boolean;
}

interface Dream {
  id: string;
  name: string;
  targetCoins: number;
  savedCoins: number;
  status: "pending_approval" | "active" | "completed" | "rejected";
  photoUrl?: string;
  rejectedReason?: string;
}

const TYPE_EMOJI: Record<string, string> = {
  snack: "🍕",
  time: "⏰",
  experience: "🎉",
};

const TYPE_BG: Record<string, string> = {
  snack: "#FFF7ED",
  time: "#EFF6FF",
  experience: "#F0FDF4",
};

const TYPE_COLOR: Record<string, string> = {
  snack: "#EA8C2D",
  time: "#3B82F6",
  experience: "#16A34A",
};

const TYPE_LABEL: Record<string, string> = {
  snack: "🍕 Вкусняшки",
  time: "⏰ Время",
  experience: "🎡 Приключения",
};

const TYPE_ORDER = ["snack", "time", "experience"];

function ConfirmModal({
  reward,
  onConfirm,
  onClose,
  isPending,
  balanceBefore,
  balanceAfter,
}: {
  reward: Reward;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
  balanceBefore: number;
  balanceAfter: number;
}) {
  return (
    <div
      className="fixed inset-0 flex items-end justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
            style={{ background: TYPE_BG[reward.type] ?? "#F3F4F6" }}
          >
            {TYPE_EMOJI[reward.type] ?? "🎁"}
          </div>
          <h3 className="text-xl font-extrabold" style={{ color: "var(--ink)" }}>
            Запросить награду?
          </h3>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            «{reward.name}» за{" "}
            <span className="font-bold" style={{ color: "var(--purple)" }}>
              {reward.cost} монет
            </span>
          </p>
        </div>
        <div
          className="flex items-center justify-between py-2 px-3 rounded-xl text-sm"
          style={{ background: "var(--surface)" }}
        >
          <span style={{ color: "var(--muted)" }}>Баланс после:</span>
          <span>
            <span style={{ color: "var(--muted)" }}>{balanceBefore.toLocaleString()}</span>
            {" → "}
            <strong style={{ color: "var(--purple)" }}>{balanceAfter.toLocaleString()}</strong>
            {" 🪙"}
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-white"
            style={{ background: isPending ? "#A78BFA" : "var(--purple)" }}
          >
            {isPending ? "Отправляем..." : "✅ Подтвердить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RewardsTab({ childId }: { childId: string }) {
  const queryClient = useQueryClient();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const { data: rewards = [], isLoading: loadingRewards } = useQuery<Reward[]>({
    queryKey: ["rewards-for-child"],
    queryFn: rewardsApi.listForChild,
  });

  const { data: balanceData } = useQuery({
    queryKey: ["child-balance", childId],
    queryFn: () => coinsApi.childBalance(childId),
    enabled: !!childId,
  });

  const balance: number = balanceData?.balance ?? 0;

  const requestMutation = useMutation({
    mutationFn: (rewardId: string) => rewardsApi.request(rewardId),
    onSuccess: (_, rewardId) => {
      queryClient.invalidateQueries({ queryKey: ["child-balance", childId] });
      setSelectedReward(null);
      setSuccessId(rewardId);
      setTimeout(() => setSuccessId(null), 3000);
    },
  });

  const activeRewards = rewards.filter((r) => r.isActive);

  if (loadingRewards) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl h-40 animate-pulse"
            style={{ background: "var(--surface)" }}
          />
        ))}
      </div>
    );
  }

  if (activeRewards.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surface)" }}>
        <p className="text-5xl mb-3">🎁</p>
        <p className="font-extrabold" style={{ color: "var(--ink)" }}>
          Наград пока нет
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Попроси родителей добавить награды
        </p>
      </div>
    );
  }

  const grouped = TYPE_ORDER.reduce(
    (acc, type) => {
      const items = activeRewards.filter((r) => r.type === type);
      if (items.length) acc.push({ type, items });
      return acc;
    },
    [] as { type: string; items: Reward[] }[]
  );

  const ungrouped = activeRewards.filter(
    (r) => !TYPE_ORDER.includes(r.type)
  );
  if (ungrouped.length) grouped.push({ type: "other", items: ungrouped });

  return (
    <>
      <div
        className="rounded-2xl p-4 flex items-center justify-between mb-5"
        style={{ background: "var(--purple)" }}
      >
        <div>
          <p className="text-xs text-white opacity-70">Мой баланс</p>
          <p className="text-2xl font-extrabold text-white">
            {balance.toLocaleString()} 🪙
          </p>
        </div>
        <span className="text-4xl">💰</span>
      </div>

      {successId && (
        <div
          className="rounded-2xl p-3 mb-4 text-center text-sm font-semibold"
          style={{ background: "#DCFCE7", color: "#15803D" }}
        >
          ✅ Запрос отправлен родителю!
        </div>
      )}

      {grouped.map(({ type, items }) => (
        <div key={type} className="mb-6">
          <h3 className="text-sm font-extrabold mb-3" style={{ color: "var(--ink)" }}>
            {TYPE_LABEL[type] ?? "🎁 Другое"}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {items.map((reward) => {
              const canAfford = balance >= reward.cost;
              const diff = reward.cost - balance;
              const bg = TYPE_BG[reward.type] ?? "#F3F4F6";
              const color = TYPE_COLOR[reward.type] ?? "var(--purple)";

              return (
                <div
                  key={reward.id}
                  className="rounded-3xl overflow-hidden flex flex-col"
                  style={{
                    background: "var(--card)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                    border: "1.5px solid rgba(0,0,0,0.04)",
                    opacity: canAfford ? 1 : 0.7,
                  }}
                >
                  <div
                    className="h-28 flex items-center justify-center text-5xl relative"
                    style={{ background: bg }}
                  >
                    {TYPE_EMOJI[reward.type] ?? "🎁"}
                    {!canAfford && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.15)" }}
                      >
                        <span className="text-2xl">🔒</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <p
                      className="font-bold text-sm line-clamp-2 flex-1"
                      style={{ color: "var(--ink)" }}
                    >
                      {reward.name}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <span className="text-sm font-extrabold" style={{ color }}>
                        🪙 {reward.cost.toLocaleString()}
                      </span>
                      {canAfford ? (
                        <button
                          onClick={() => setSelectedReward(reward)}
                          className="text-xs px-3 py-1.5 rounded-xl font-bold text-white flex-shrink-0"
                          style={{ background: "var(--purple)" }}
                        >
                          Взять
                        </button>
                      ) : (
                        <span className="text-xs font-semibold" style={{ color: "#DC2626" }}>
                          −{diff}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {selectedReward && (
        <ConfirmModal
          reward={selectedReward}
          onConfirm={() => requestMutation.mutate(selectedReward.id)}
          onClose={() => setSelectedReward(null)}
          isPending={requestMutation.isPending}
          balanceBefore={balance}
          balanceAfter={balance - selectedReward.cost}
        />
      )}
    </>
  );
}

function DreamTab({ childId }: { childId: string }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [newName, setNewName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sendAmount, setSendAmount] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const { data: dream, isLoading: loadingDream } = useQuery<Dream | null>({
    queryKey: ["dream-my"],
    queryFn: dreamsApi.my,
  });

  const { data: balanceData } = useQuery({
    queryKey: ["child-balance", childId],
    queryFn: () => coinsApi.childBalance(childId),
    enabled: !!childId,
  });

  const balance: number = balanceData?.balance ?? 0;

  const createMutation = useMutation({
    mutationFn: async () => {
      const created = await dreamsApi.create({ name: newName });
      if (photoFile && created?.id) {
        await dreamsApi.uploadPhoto(created.id, photoFile);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dream-my"] });
      setNewName("");
      setPhotoFile(null);
      setPhotoPreview(null);
    },
    onError: () => toast.error("Ошибка создания мечты"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string } }) =>
      dreamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dream-my"] });
      setEditing(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (amount: number) => dreamsApi.send(amount, balance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dream-my"] });
      queryClient.invalidateQueries({ queryKey: ["child-balance", childId] });
      setSendAmount("");
    },
    onError: () => toast.error("Ошибка"),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  if (loadingDream) {
    return (
      <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>
        Загрузка...
      </p>
    );
  }

  if (!dream || dream.status === "rejected") {
    return (
      <div className="space-y-4">
        {dream?.status === "rejected" && (
          <div className="rounded-2xl p-4" style={{ background: "#FEE2E2" }}>
            <p className="font-bold text-sm" style={{ color: "#B91C1C" }}>
              Предыдущая мечта отклонена
            </p>
            {dream.rejectedReason && (
              <p className="text-xs mt-1" style={{ color: "#B91C1C" }}>
                Причина: {dream.rejectedReason}
              </p>
            )}
          </div>
        )}

        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--surface)" }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full h-44 flex flex-col items-center justify-center gap-2 transition-opacity hover:opacity-80"
            style={{
              background: photoPreview
                ? "transparent"
                : "linear-gradient(135deg, #f4f1ff, #efeaff)",
              position: "relative",
            }}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="" className="w-full h-44 object-cover" />
            ) : (
              <>
                <span className="text-5xl">📸</span>
                <span className="text-sm font-semibold" style={{ color: "var(--purple)" }}>
                  Сфотографируй свою мечту
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  или выбери из галереи
                </span>
              </>
            )}
            {photoPreview && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.3)" }}
              >
                <span className="text-white font-bold text-sm bg-black bg-opacity-40 px-3 py-1 rounded-full">
                  📸 Изменить фото
                </span>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="space-y-3">
          <div>
            <label
              className="text-xs font-semibold uppercase mb-1 block"
              style={{ color: "var(--muted)" }}
            >
              Что ты хочешь? ✨
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Например: Велосипед"
              className="w-full px-4 py-3 rounded-xl border text-base outline-none"
              style={{ borderColor: "#E5E7EB", color: "var(--ink)", background: "#fff" }}
            />
          </div>
          <p className="text-xs text-center px-4" style={{ color: "var(--muted)" }}>
            Родитель установит стоимость и одобрит мечту 🌟
          </p>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!newName.trim() || createMutation.isPending}
            className="w-full py-4 rounded-2xl font-extrabold text-white text-lg"
            style={{ background: !newName.trim() ? "#C4B5FD" : "var(--purple)" }}
          >
            {createMutation.isPending ? "Создаём..." : "✨ Отправить родителю"}
          </button>
        </div>
      </div>
    );
  }

  if (dream.status === "pending_approval") {
    return (
      <div className="space-y-4">
        {dream.photoUrl && (
          <div className="rounded-2xl overflow-hidden h-44">
            <img src={dream.photoUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="rounded-2xl p-5 text-center" style={{ background: "#FEF3C7" }}>
          <p className="text-4xl mb-3">⏳</p>
          <p className="font-extrabold text-lg" style={{ color: "#92400E" }}>
            {dream.name}
          </p>
          <p className="text-sm mt-2" style={{ color: "#B45309" }}>
            Ждём, пока родитель установит стоимость и одобрит мечту
          </p>
        </div>
      </div>
    );
  }

  const progress =
    dream.targetCoins > 0
      ? Math.min((dream.savedCoins / dream.targetCoins) * 100, 100)
      : 0;
  const isCompleted = dream.status === "completed";

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: dream.photoUrl
            ? `url(${dream.photoUrl}) center/cover`
            : "var(--card)",
          minHeight: dream.photoUrl ? 160 : "auto",
        }}
      >
        {dream.photoUrl && (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.65))",
            }}
          />
        )}
        <div className="relative p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            {editing ? (
              <div className="flex-1 flex gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border text-base outline-none"
                  style={{ borderColor: "#E5E7EB", color: "var(--ink)" }}
                  autoFocus
                />
                <button
                  onClick={() =>
                    updateMutation.mutate({ id: dream.id, data: { name: editName } })
                  }
                  disabled={!editName.trim() || updateMutation.isPending}
                  className="px-3 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: "var(--purple)" }}
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--surface)", color: "var(--muted)" }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p
                    className="text-xs font-semibold uppercase"
                    style={{ color: dream.photoUrl ? "rgba(255,255,255,0.7)" : "var(--muted)" }}
                  >
                    Моя мечта
                  </p>
                  <p
                    className="text-xl font-extrabold mt-0.5"
                    style={{ color: dream.photoUrl ? "#fff" : "var(--ink)" }}
                  >
                    {dream.name}
                  </p>
                </div>
                {!isCompleted && (
                  <button
                    onClick={() => {
                      setEditName(dream.name);
                      setEditing(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl font-semibold flex-shrink-0"
                    style={{ background: "#EDE9FE", color: "var(--purple)" }}
                  >
                    ✏️ Изменить
                  </button>
                )}
              </>
            )}
          </div>

          {isCompleted && (
            <div className="rounded-xl p-3 text-center" style={{ background: "#DCFCE7" }}>
              <p className="text-lg font-extrabold" style={{ color: "#15803D" }}>
                🎉 Мечта достигнута!
              </p>
            </div>
          )}

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span
                className="font-semibold"
                style={{ color: dream.photoUrl ? "#fff" : "var(--ink)" }}
              >
                🪙 {dream.savedCoins.toLocaleString()}
              </span>
              <span style={{ color: dream.photoUrl ? "rgba(255,255,255,0.7)" : "var(--muted)" }}>
                из {dream.targetCoins.toLocaleString()}
              </span>
            </div>
            <div
              className="w-full h-5 rounded-full overflow-hidden"
              style={{ background: dream.photoUrl ? "rgba(255,255,255,0.3)" : "#E5E7EB" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max(progress, 4)}%`,
                  background: isCompleted
                    ? "var(--green)"
                    : dream.photoUrl
                    ? "#fff"
                    : "var(--purple)",
                }}
              >
                {progress >= 15 && (
                  <span
                    className="text-xs font-bold"
                    style={{ color: dream.photoUrl ? "var(--purple)" : "#fff" }}
                  >
                    {Math.round(progress)}%
                  </span>
                )}
              </div>
            </div>
            {progress < 15 && (
              <p
                className="text-right text-xs mt-1 font-semibold"
                style={{ color: dream.photoUrl ? "rgba(255,255,255,0.7)" : "var(--muted)" }}
              >
                {Math.round(progress)}%
              </p>
            )}
          </div>
        </div>
      </div>

      {!isCompleted && balance > 0 && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--surface)" }}>
          <p className="font-bold" style={{ color: "var(--ink)" }}>
            Отправить монеты в мечту
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Доступно: 🪙 {balance.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={balance}
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="Сколько монет?"
              className="flex-1 px-4 py-3 rounded-xl border text-base outline-none"
              style={{ borderColor: "#E5E7EB", color: "var(--ink)" }}
            />
            <button
              onClick={() => sendMutation.mutate(Number(sendAmount))}
              disabled={
                !sendAmount ||
                Number(sendAmount) < 1 ||
                Number(sendAmount) > balance ||
                sendMutation.isPending
              }
              className="px-5 py-3 rounded-xl font-bold text-white text-sm flex-shrink-0"
              style={{
                background:
                  !sendAmount || Number(sendAmount) < 1 || Number(sendAmount) > balance
                    ? "#C4B5FD"
                    : "var(--purple)",
              }}
            >
              {sendMutation.isPending ? "..." : "⬆️ Внести"}
            </button>
          </div>
          {sendMutation.isSuccess && (
            <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>
              ✅ Монеты отправлены!
            </p>
          )}
        </div>
      )}

      {!isCompleted && balance === 0 && (
        <div className="rounded-2xl p-4 text-center" style={{ background: "var(--surface)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Заработай монеты, читая книги, чтобы приблизить мечту!
          </p>
        </div>
      )}
    </div>
  );
}

function ChildShopInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "dream" ? "dream" : "rewards";
  const [activeTab, setActiveTab] = useState<"rewards" | "dream">(initialTab);
  const user = useAuthStore((s) => s.user);
  const childId: string = user?.id ?? "";

  const { data: dream } = useQuery({
    queryKey: ["dream-my"],
    queryFn: dreamsApi.my,
  });

  const hasPendingDream = dream?.status === "pending_approval";
  const hasActiveDream = dream?.status === "active";

  return (
    <main className="min-h-screen max-w-lg mx-auto pb-6">
      <div className="p-5 pb-0">
        <h2 className="text-xl font-extrabold" style={{ color: "var(--ink)" }}>
          {activeTab === "rewards" ? "🎁 Магазин наград" : "💫 Моя мечта"}
        </h2>
      </div>

      {!dream || dream.status === "rejected" ? (
        <button
          onClick={() => setActiveTab("dream")}
          className="mx-5 mt-4 w-[calc(100%-2.5rem)] rounded-2xl p-4 flex items-center gap-3 text-left"
          style={{
            background: "linear-gradient(135deg, #f4f1ff, #efeaff)",
            border: "1.5px solid #e6dffb",
          }}
        >
          <span className="text-3xl">💫</span>
          <div>
            <p className="font-extrabold text-sm" style={{ color: "var(--purple)" }}>
              Добавь свою мечту!
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Родители помогут её осуществить
            </p>
          </div>
          <span className="ml-auto text-lg" style={{ color: "var(--purple)" }}>
            →
          </span>
        </button>
      ) : hasPendingDream ? (
        <button
          onClick={() => setActiveTab("dream")}
          className="mx-5 mt-4 w-[calc(100%-2.5rem)] rounded-2xl p-3 flex items-center gap-2 text-left"
          style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
        >
          <span className="text-xl">⏳</span>
          <p className="text-xs font-semibold" style={{ color: "#92400E" }}>
            Мечта «{dream.name}» ждёт одобрения родителя
          </p>
        </button>
      ) : hasActiveDream ? (
        <button
          onClick={() => setActiveTab("dream")}
          className="mx-5 mt-4 w-[calc(100%-2.5rem)] rounded-2xl p-3 flex items-center gap-3 text-left"
          style={{
            background: "linear-gradient(135deg, #f4f1ff, #efeaff)",
            border: "1px solid #e6dffb",
          }}
        >
          <span className="text-xl">💫</span>
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: "var(--purple)" }}>
              {dream.name}
            </p>
            <div
              className="w-full h-1.5 rounded-full mt-1 overflow-hidden"
              style={{ background: "#e0d9f9" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((dream.savedCoins / dream.targetCoins) * 100, 100)}%`,
                  background: "var(--purple)",
                }}
              />
            </div>
          </div>
          <span className="text-xs font-bold" style={{ color: "var(--purple)" }}>
            {Math.round(Math.min((dream.savedCoins / dream.targetCoins) * 100, 100))}%
          </span>
        </button>
      ) : null}

      <div
        className="flex mx-5 mt-4 rounded-2xl p-1 mb-5"
        style={{ background: "var(--surface)" }}
      >
        {(["rewards", "dream"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: activeTab === tab ? "var(--purple)" : "transparent",
              color: activeTab === tab ? "#fff" : "var(--muted)",
            }}
          >
            {tab === "rewards" ? "🎁 Награды" : "💫 Мечта"}
          </button>
        ))}
      </div>

      <div className="px-5">
        {activeTab === "rewards" ? (
          <RewardsTab childId={childId} />
        ) : (
          <DreamTab childId={childId} />
        )}
      </div>
    </main>
  );
}

export default function ChildShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--background)" }} />}>
      <ChildShopInner />
    </Suspense>
  );
}

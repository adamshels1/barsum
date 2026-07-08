"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, Pencil, Sparkles } from "lucide-react";
import { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";
import { rewardsApi } from "@/lib/api/rewards";
import { useAuthStore } from "@/stores/auth-store";
import { CoinIcon } from "@/components/CoinIcon";
import { Portal } from "@/components/Portal";
import { dreamPhotoUrl, rewardPhotoUrl } from "@/lib/media";

interface Reward {
  id: string;
  name: string;
  cost: number;
  type: string;
  isActive: boolean;
  photoUrl?: string | null;
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
    <Portal>
    <div
      className="fixed inset-0 flex items-end justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", zIndex: 60 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(20,10,60,0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "28px 28px 0 0",
          padding: "32px 24px max(40px, env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            className="glass-chip"
            style={{
              width: 88,
              height: 88,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              margin: "0 auto 16px",
              overflow: "hidden",
            }}
          >
            {reward.photoUrl ? (
              <img src={rewardPhotoUrl(reward)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              TYPE_EMOJI[reward.type] ?? "🎁"
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff" }}>
            Запросить награду?
          </h3>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
            «{reward.name}» за{" "}
            <span style={{ fontWeight: 800, color: "#ffffff" }}>
              {reward.cost} <CoinIcon size={13} />
            </span>
          </p>
        </div>

        <div
          className="glass-sm"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.65)" }}>Баланс после:</span>
          <span>
            <span style={{ color: "rgba(255,255,255,0.65)" }}>{balanceBefore.toLocaleString()}</span>
            {" → "}
            <strong style={{ color: "#ffffff" }}>{balanceAfter.toLocaleString()}</strong>
            {" "}<CoinIcon size={13} />
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            className="btn-glass"
            style={{ flex: 1 }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="btn-white"
            style={{ flex: 1, color: "#4776e6", opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? "Отправляем..." : "Подтвердить"}
          </button>
        </div>
      </div>
    </div>
    </Portal>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass"
            style={{ height: 160, borderRadius: 20, animation: "pulse 2s infinite" }}
          />
        ))}
      </div>
    );
  }

  if (activeRewards.length === 0) {
    return (
      <div className="glass" style={{ padding: 40, textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 12px" }}>🎁</p>
        <p style={{ margin: 0, fontWeight: 900, color: "#ffffff" }}>
          Наград пока нет
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
          Попроси родителей добавить награды
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Balance card */}
      <div
        className="glass"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Мой баланс
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>
            {balance.toLocaleString()} <CoinIcon size={20} />
          </p>
        </div>
      </div>

      {successId && (
        <div
          style={{
            background: "rgba(0,200,100,0.2)",
            borderRadius: 16,
            padding: "12px 16px",
            marginBottom: 20,
            textAlign: "center",
            fontSize: 14,
            fontWeight: 700,
            color: "#aaffcc",
          }}
        >
          <CheckCircle2 size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          Запрос отправлен родителю!
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {activeRewards.map((reward) => {
              const canAfford = balance >= reward.cost;
              const diff = reward.cost - balance;

              return (
                <div
                  key={reward.id}
                  className="glass"
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    opacity: canAfford ? 1 : 0.7,
                  }}
                >
                  <div
                    className="glass-sm"
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 42,
                      position: "relative",
                      borderRadius: 0,
                      overflow: "hidden",
                    }}
                  >
                    {reward.photoUrl ? (
                      <img src={rewardPhotoUrl(reward)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      TYPE_EMOJI[reward.type] ?? "🎁"
                    )}
                    {!canAfford && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(0,0,0,0.35)",
                        }}
                      >
                        <span style={{ fontSize: 24 }}>🔒</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 12, display: "flex", flexDirection: "column", flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#ffffff",
                        flex: 1,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {reward.name}
                    </p>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                        <CoinIcon size={13} /> {reward.cost.toLocaleString()}
                      </span>
                      {canAfford ? (
                        <button
                          onClick={() => setSelectedReward(reward)}
                          style={{
                            background: "rgba(255,255,255,0.9)",
                            color: "#4776e6",
                            borderRadius: 9999,
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 800,
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            flexShrink: 0,
                          }}
                        >
                          Взять
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,160,160,0.9)", textAlign: "right" }}>
                          ещё {diff} <CoinIcon size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
        })}
      </div>

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
      <p style={{ fontSize: 14, textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,0.65)" }}>
        Загрузка...
      </p>
    );
  }

  if (!dream || dream.status === "rejected") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {dream?.status === "rejected" && (
          <div
            style={{
              background: "rgba(220,0,0,0.15)",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "rgba(255,160,160,0.9)" }}>
              Предыдущая мечта отклонена
            </p>
            {dream.rejectedReason && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,160,160,0.75)" }}>
                Причина: {dream.rejectedReason}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="glass-sm"
          style={{
            borderRadius: 20,
            overflow: "hidden",
            height: 176,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            border: "none",
            position: "relative",
            width: "100%",
          }}
        >
          {photoPreview ? (
            <>
              <img src={photoPreview} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 14, background: "rgba(0,0,0,0.4)", padding: "6px 14px", borderRadius: 9999 }}>
                  📸 Изменить фото
                </span>
              </div>
            </>
          ) : (
            <>
              <Camera size={40} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#ffffff" }}>Сфотографируй свою мечту</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>или выбери из галереи</span>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handlePhotoChange}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Что ты хочешь? ✨
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Например: Велосипед"
              className="glass-input"
            />
          </div>
          <p style={{ margin: 0, fontSize: 12, textAlign: "center", color: "rgba(255,255,255,0.55)" }}>
            Родитель установит стоимость и одобрит мечту 🌟
          </p>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!newName.trim() || createMutation.isPending}
            className="btn-white"
            style={{ color: "#4776e6", opacity: !newName.trim() || createMutation.isPending ? 0.5 : 1 }}
          >
            {createMutation.isPending ? "Создаём..." : "✨ Отправить родителю"}
          </button>
        </div>
      </div>
    );
  }

  if (dream.status === "pending_approval") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {dream.photoUrl && (
          <div style={{ borderRadius: 16, overflow: "hidden", height: 176 }}>
            <img src={dreamPhotoUrl(dream)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div
          className="glass-sm"
          style={{ padding: 20, textAlign: "center" }}
        >
          <p style={{ fontSize: 36, margin: "0 0 12px" }}>⏳</p>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 18, color: "#ffffff" }}>
            {dream.name}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        className={dream.photoUrl ? undefined : "glass"}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          background: dream.photoUrl
            ? `url(${dreamPhotoUrl(dream)}) center/cover`
            : undefined,
          minHeight: dream.photoUrl ? 160 : "auto",
        }}
      >
        {dream.photoUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.65))",
            }}
          />
        )}
        <div style={{ position: "relative", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            {editing ? (
              <div style={{ flex: 1, display: "flex", gap: 8 }}>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="glass-input"
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button
                  onClick={() =>
                    updateMutation.mutate({ id: dream.id, data: { name: editName } })
                  }
                  disabled={!editName.trim() || updateMutation.isPending}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 9999,
                    background: "rgba(255,255,255,0.9)",
                    color: "#4776e6",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 9999,
                    background: "rgba(255,255,255,0.16)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Моя мечта
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: "#ffffff" }}>
                    {dream.name}
                  </p>
                </div>
                {!isCompleted && (
                  <button
                    onClick={() => {
                      setEditName(dream.name);
                      setEditing(true);
                    }}
                    className="glass-chip"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 12px",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    <Pencil size={12} strokeWidth={2.5} />
                    Изменить
                  </button>
                )}
              </>
            )}
          </div>

          {isCompleted && (
            <div
              className="glass-sm"
              style={{ background: "rgba(0,200,100,0.25)", borderRadius: 12, padding: 12, textAlign: "center" }}
            >
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#aaffcc" }}>
                🎉 Мечта достигнута!
              </p>
            </div>
          )}

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "#ffffff" }}><CoinIcon size={13} /> {dream.savedCoins.toLocaleString()}</span>
              <span style={{ color: "rgba(255,255,255,0.65)" }}>из {dream.targetCoins.toLocaleString()}</span>
            </div>
            <div
              style={{
                width: "100%",
                height: 20,
                borderRadius: 9999,
                overflow: "hidden",
                background: "rgba(255,255,255,0.25)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 9999,
                  transition: "width 0.5s ease",
                  width: `${progress === 0 ? 0 : Math.max(progress, 4)}%`,
                  background: isCompleted ? "rgba(0,220,120,0.8)" : "rgba(255,255,255,0.85)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 8,
                }}
              >
                {progress >= 15 && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: isCompleted ? "#ffffff" : "#4776e6" }}>
                    {Math.round(progress)}%
                  </span>
                )}
              </div>
            </div>
            {progress < 15 && (
              <p style={{ textAlign: "right", fontSize: 11, marginTop: 4, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>
                {Math.round(progress)}%
              </p>
            )}
          </div>
        </div>
      </div>

      {!isCompleted && balance > 0 && (
        <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#ffffff" }}>
            Отправить монеты в мечту
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            Доступно: <CoinIcon size={12} /> {balance.toLocaleString()}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              min={1}
              max={balance}
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="Сколько монет?"
              className="glass-input"
              style={{ flex: 1 }}
            />
            <button
              onClick={() => sendMutation.mutate(Number(sendAmount))}
              disabled={
                !sendAmount ||
                Number(sendAmount) < 1 ||
                Number(sendAmount) > balance ||
                sendMutation.isPending
              }
              className="btn-white"
              style={{
                color: "#4776e6",
                width: "auto",
                padding: "0 20px",
                flexShrink: 0,
                opacity:
                  !sendAmount || Number(sendAmount) < 1 || Number(sendAmount) > balance
                    ? 0.4
                    : 1,
              }}
            >
              {sendMutation.isPending ? "..." : "Внести"}
            </button>
          </div>
          {sendMutation.isSuccess && (
            <p style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#aaffcc" }}>
              ✅ Монеты отправлены!
            </p>
          )}
        </div>
      )}

      {!isCompleted && balance === 0 && (
        <div className="glass-sm" style={{ padding: 16, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
            Заработай монеты, читая книги, чтобы приблизить мечту!
          </p>
        </div>
      )}
    </div>
  );
}

function ChildShopInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "dream" ? "dream" : "rewards";
  const [activeTab, setActiveTab] = useState<"rewards" | "dream">(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab") === "dream" ? "dream" : "rewards";
    setActiveTab(tab);
  }, [searchParams]);
  const user = useAuthStore((s) => s.user);
  const childId: string = user?.id ?? "";

  const { data: dream } = useQuery({
    queryKey: ["dream-my"],
    queryFn: dreamsApi.my,
  });

  const hasPendingDream = dream?.status === "pending_approval";
  const hasActiveDream = dream?.status === "active";

  return (
    <main style={{ minHeight: "100dvh", paddingBottom: 24 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button
          onClick={() => router.push("/child/home")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 700, fontFamily: "inherit", marginBottom: 12, padding: 0 }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          Назад
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#ffffff" }}>
          {activeTab === "rewards" ? "🎁 Магазин наград" : "💫 Моя мечта"}
        </h2>
      </div>

      {!dream || dream.status === "rejected" ? (
        <button
          onClick={() => setActiveTab("dream")}
          className="glass-sm"
          style={{
            margin: "16px 20px 4px",
            borderRadius: 16,
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "calc(100% - 40px)",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          <Sparkles size={24} color="#ffffff" strokeWidth={2} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#ffffff" }}>
              Добавь свою мечту!
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              Родители помогут её осуществить
            </p>
          </div>
          <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
        </button>
      ) : hasPendingDream ? (
        <button
          onClick={() => setActiveTab("dream")}
          className="glass-chip"
          style={{
            margin: "12px 20px 0",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "calc(100% - 40px)",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 18 }}>⏳</span>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
            Мечта «{dream.name}» ждёт одобрения родителя
          </p>
        </button>
      ) : hasActiveDream ? (
        <button
          onClick={() => setActiveTab("dream")}
          className="glass-sm"
          style={{
            margin: "12px 20px 0",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "calc(100% - 40px)",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
            borderRadius: 16,
          }}
        >
          <span style={{ fontSize: 20 }}>💫</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
              {dream.name}
            </p>
            <div style={{ width: "100%", height: 6, borderRadius: 9999, marginTop: 6, overflow: "hidden", background: "rgba(255,255,255,0.2)" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.85)",
                  width: `${Math.min((dream.savedCoins / dream.targetCoins) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#ffffff", flexShrink: 0 }}>
            {Math.round(Math.min((dream.savedCoins / dream.targetCoins) * 100, 100))}%
          </span>
        </button>
      ) : null}

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          margin: "16px 20px 0",
          background: "rgba(0,0,0,0.18)",
          borderRadius: 9999,
          padding: 4,
        }}
      >
        {(["rewards", "dream"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 9999,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "inherit",
              transition: "all 0.15s",
              background: activeTab === tab ? "rgba(255,255,255,0.9)" : "transparent",
              color: activeTab === tab ? "#4776e6" : "rgba(255,255,255,0.55)",
            }}
          >
            {tab === "rewards" ? "🎁 Награды" : "💫 Мечта"}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 20px 0" }}>
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
    <Suspense fallback={<div style={{ minHeight: "100dvh" }} />}>
      <ChildShopInner />
    </Suspense>
  );
}

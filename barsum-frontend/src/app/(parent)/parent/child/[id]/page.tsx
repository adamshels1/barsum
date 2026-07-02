"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { childrenApi } from "@/lib/api/children";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";
import { sessionsApi } from "@/lib/api/sessions";
import type { Child, ChildStats, Session } from "@/types";
import { CoinIcon } from "@/components/CoinIcon";

const REJECT_REASONS = [
  "Слишком дорого",
  "Подумай ещё раз",
  "Сначала нужно заслужить",
  "Выбери что-то другое",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_CONFIG = {
  completed: { icon: "✅", label: "Выполнено", bg: "rgba(34,197,94,0.3)", color: "#ffffff" },
  pending: { icon: "⏳", label: "В процессе", bg: "rgba(255,200,0,0.25)", color: "#ffffff" },
  failed: { icon: "❌", label: "Не выполнено", bg: "rgba(239,68,68,0.35)", color: "#ffffff" },
} satisfies Record<Session["status"], { icon: string; label: string; bg: string; color: string }>;

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

function SessionRow({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;

  return (
    <div style={{ ...GLASS, overflow: "hidden" }}>
      <button style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }} onClick={() => setOpen((v) => !v)}>
        <span style={{ fontSize: 18 }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.enrollment?.challenge?.bookTitle ?? "Книга"} · часть {session.partNumber}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{formatDate(session.createdAt)}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 9999, fontWeight: 800, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          {session.transcription ? (
            <div>
              <p style={{ margin: "10px 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Расшифровка</p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px" }}>
                {session.transcription}
              </p>
            </div>
          ) : (
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Расшифровка недоступна</p>
          )}
        </div>
      )}
    </div>
  );
}

function EditProfileSection({ child }: { child: Child }) {
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
      toast.success("Профиль обновлён!");
      queryClient.invalidateQueries({ queryKey: ["child", child.id] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
      setOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const valid = name.trim().length >= 2 && Number(age) >= 4 && Number(age) <= 16;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ width: "100%", ...GLASS, padding: "13px 16px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.7)" }}
      >
        ✏️ Редактировать профиль
      </button>
    );
  }

  return (
    <div style={{ ...GLASS, padding: "16px 16px" }}>
      <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14, color: "#ffffff" }}>Редактировать профиль</p>
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
              ? `url(${child.photoUrl}) center/cover`
              : "rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {!photoPreview && !child.photoUrl && <Camera size={20} color="rgba(255,255,255,0.6)" strokeWidth={2} />}
        </button>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" className="glass-input" />
        <input type="number" min={4} max={16} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Возраст" className="glass-input" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setOpen(false); setName(child.name); setAge(String(child.age)); setPhotoFile(null); setPhotoPreview(null); }} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>Отмена</button>
          <button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 13, background: "rgba(255,255,255,0.9)", color: "#4776e6", opacity: !valid ? 0.5 : 1 }}>
            {mutation.isPending ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordSection({ childId }: { childId: string; parentId: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => childrenApi.update(childId, { password: newPassword }),
    onSuccess: () => {
      toast.success("Пароль изменён!");
      setNewPassword("");
      setConfirm("");
      setOpen(false);
    },
    onError: () => toast.error("Ошибка смены пароля"),
  });

  const valid = newPassword.length >= 4 && newPassword === confirm;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ width: "100%", ...GLASS, padding: "13px 16px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.7)" }}
      >
        🔑 Изменить пароль ребёнка
      </button>
    );
  }

  return (
    <div style={{ ...GLASS, padding: "16px 16px" }}>
      <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14, color: "#ffffff" }}>Изменить пароль</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Новый пароль (мин. 4 символа)" className="glass-input" />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Повторите пароль" className="glass-input" style={confirm && confirm !== newPassword ? { borderColor: "rgba(239,68,68,0.6)" } : {}} />
        {confirm && confirm !== newPassword && <p style={{ margin: 0, fontSize: 12, color: "#ffd6d6" }}>Пароли не совпадают</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setOpen(false); setNewPassword(""); setConfirm(""); }} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>Отмена</button>
          <button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 13, background: "rgba(255,255,255,0.9)", color: "#4776e6", opacity: !valid ? 0.5 : 1 }}>
            {mutation.isPending ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DreamApprovalSection() {
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
    onSuccess: () => { toast.success("Мечта одобрена!"); setApprovingId(null); setTargetCoins(""); queryClient.invalidateQueries({ queryKey: ["dreams-pending"] }); },
    onError: () => toast.error("Ошибка"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => dreamsApi.reject(id, reason),
    onSuccess: () => { toast.success("Мечта отклонена"); setRejectingId(null); setRejectReason(""); setCustomReason(""); queryClient.invalidateQueries({ queryKey: ["dreams-pending"] }); },
    onError: () => toast.error("Ошибка"),
  });

  if (pendingDreams.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 900, color: "#ffffff" }}>💫 Мечты на одобрение</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pendingDreams.map((dream: any) => (
          <div key={dream.id} style={{ ...GLASS, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              {dream.photoUrl ? (
                <img src={dream.photoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>💫</div>
              )}
              <div>
                <p style={{ margin: 0, fontWeight: 800, color: "#ffffff" }}>{dream.name}</p>
                <p style={{ margin: "2px 0 4px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Ребёнок: {dream.child?.name ?? ""}</p>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 9999, fontWeight: 800, background: "rgba(255,255,255,0.2)", color: "#ffffff" }}>Ждёт одобрения</span>
              </div>
            </div>

            {approvingId === dream.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Установите стоимость в монетах:</p>
                <input type="number" min={1} value={targetCoins} onChange={(e) => setTargetCoins(e.target.value)} placeholder="Например: 1000" className="glass-input" />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setApprovingId(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>Отмена</button>
                  <button onClick={() => approveMutation.mutate({ id: dream.id, coins: Number(targetCoins) })} disabled={!targetCoins || Number(targetCoins) < 1 || approveMutation.isPending} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.7)", color: "#ffffff", opacity: !targetCoins || Number(targetCoins) < 1 ? 0.5 : 1 }}>
                    {approveMutation.isPending ? "..." : "✅ Одобрить"}
                  </button>
                </div>
              </div>
            ) : rejectingId === dream.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Причина отказа:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {REJECT_REASONS.map((r) => (
                    <button key={r} onClick={() => setRejectReason(r)} style={{ padding: "6px 10px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: rejectReason === r ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.15)", color: "#ffffff" }}>
                      {r}
                    </button>
                  ))}
                </div>
                <input type="text" value={customReason} onChange={(e) => { setCustomReason(e.target.value); setRejectReason(""); }} placeholder="Или своя причина..." className="glass-input" />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setRejectingId(null); setRejectReason(""); setCustomReason(""); }} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>Отмена</button>
                  <button onClick={() => rejectMutation.mutate({ id: dream.id, reason: customReason || rejectReason })} disabled={(!rejectReason && !customReason) || rejectMutation.isPending} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(239,68,68,0.7)", color: "#ffffff", opacity: !rejectReason && !customReason ? 0.5 : 1 }}>
                    {rejectMutation.isPending ? "..." : "❌ Отклонить"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setApprovingId(dream.id)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(34,197,94,0.7)", color: "#ffffff" }}>✅ Одобрить</button>
                <button onClick={() => setRejectingId(dream.id)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: "rgba(239,68,68,0.5)", color: "#ffffff" }}>❌ Отклонить</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ParentChildProgressPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const childId = params.id;

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
        ← Назад
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
          <p style={{ margin: "0 0 16px", fontWeight: 700, color: "#ffffff" }}>Ребёнок не найден</p>
          <button onClick={() => router.push("/parent/cabinet")} style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.75)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Вернуться в кабинет
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            {child.photoUrl ? (
              <img src={child.photoUrl} alt={child.name} style={{ width: 64, height: 64, borderRadius: 20, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#ffffff", flexShrink: 0 }}>
                {child.name[0]}
              </div>
            )}
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{child.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{child.age} лет</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>🔥 {child.streak} дней</span>
                {balance != null && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}><CoinIcon size={13} /> {balance.balance ?? 0}</span>
                )}
              </div>
            </div>
          </div>

          <DreamApprovalSection />

          <div style={{ marginBottom: 12 }}>
            <EditProfileSection child={child} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <ChangePasswordSection childId={childId} parentId={child.parentId} />
          </div>

          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              <StatCard emoji="🔥" value={stats.streak} label="Дней подряд" highlight />
              <StatCard emoji="📚" value={stats.totalSessions} label="Сессий" />
              <StatCard emoji={<CoinIcon size={22} />} value={stats.totalCoinsEarned} label="Монет заработано" />
              <StatCard emoji="📖" value={stats.activeEnrollments} label="Активных курсов" />
            </div>
          )}

          <div>
            <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 900, color: "#ffffff" }}>История сессий</h2>
            {loadingSessions ? (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Загрузка...</p>
            ) : sortedSessions.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 18, padding: "32px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 40, margin: "0 0 8px" }}>📭</p>
                <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#ffffff" }}>Сессий пока нет</p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Начните первый курс, чтобы увидеть прогресс</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sortedSessions.map((session) => <SessionRow key={session.id} session={session} />)}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

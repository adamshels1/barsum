"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { childrenApi } from "@/lib/api/children";
import { coinsApi } from "@/lib/api/coins";
import { dreamsApi } from "@/lib/api/dreams";
import { sessionsApi } from "@/lib/api/sessions";
import type { Child, ChildStats, Session } from "@/types";

const REJECT_REASONS = [
  "Слишком дорого",
  "Подумай ещё раз",
  "Сначала нужно заслужить",
  "Выбери что-то другое",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CONFIG = {
  completed: { icon: "✅", label: "Выполнено", color: "#16A34A" },
  pending: { icon: "⏳", label: "В процессе", color: "#D97706" },
  failed: { icon: "❌", label: "Не выполнено", color: "#DC2626" },
} satisfies Record<Session["status"], { icon: string; label: string; color: string }>;

function StatCard({ emoji, value, label, highlight }: { emoji: string; value: string | number; label: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-2xl p-4 text-center"
      style={{ background: highlight ? "var(--purple)" : "var(--surface)", color: highlight ? "#fff" : "var(--ink)" }}
    >
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs mt-0.5" style={{ color: highlight ? "rgba(255,255,255,0.75)" : "var(--muted)" }}>
        {label}
      </p>
    </div>
  );
}

function SessionRow({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
      <button className="w-full px-4 py-3 flex items-center gap-3 text-left" onClick={() => setOpen((v) => !v)}>
        <span className="text-xl">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>День {session.day}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(session.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: session.status === "completed" ? "#DCFCE7" : session.status === "failed" ? "#FEE2E2" : "#FEF3C7",
              color: cfg.color,
            }}
          >
            {cfg.label}
          </span>
          <span style={{ color: "var(--muted)", fontSize: 16 }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: "#F3F4F6" }}>
          {session.transcription ? (
            <div>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--muted)" }}>Расшифровка</p>
              <p className="text-sm rounded-xl p-3 leading-relaxed" style={{ background: "#F9FAFB", color: "var(--ink)" }}>
                {session.transcription}
              </p>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Расшифровка недоступна</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Change password section ───────────────────────────────────────────────────
function ChangePasswordSection({ childId, parentId }: { childId: string; parentId: string }) {
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
        className="w-full py-3 rounded-2xl text-sm font-semibold"
        style={{ background: "var(--surface)", color: "var(--muted)" }}
      >
        🔑 Изменить пароль ребёнка
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)" }}>
      <p className="font-bold text-sm" style={{ color: "var(--ink)" }}>Изменить пароль</p>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Новый пароль (мин. 4 символа)"
        className="w-full px-4 py-3 rounded-xl border text-base outline-none"
        style={{ borderColor: "var(--line)", color: "var(--ink)", background: "#fff" }}
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Повторите пароль"
        className="w-full px-4 py-3 rounded-xl border text-base outline-none"
        style={{ borderColor: confirm && confirm !== newPassword ? "#DC2626" : "var(--line)", color: "var(--ink)", background: "#fff" }}
      />
      {confirm && confirm !== newPassword && (
        <p className="text-xs" style={{ color: "#DC2626" }}>Пароли не совпадают</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setNewPassword(""); setConfirm(""); }}
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ background: "var(--line)", color: "var(--muted)" }}
        >
          Отмена
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!valid || mutation.isPending}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
          style={{ background: "var(--purple)" }}
        >
          {mutation.isPending ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}

// ─── Dream approval section ────────────────────────────────────────────────────
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
    mutationFn: ({ id, coins }: { id: string; coins: number }) =>
      dreamsApi.approve(id, coins),
    onSuccess: () => {
      toast.success("Мечта одобрена!");
      setApprovingId(null);
      setTargetCoins("");
      queryClient.invalidateQueries({ queryKey: ["dreams-pending"] });
    },
    onError: () => toast.error("Ошибка"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      dreamsApi.reject(id, reason),
    onSuccess: () => {
      toast.success("Мечта отклонена");
      setRejectingId(null);
      setRejectReason("");
      setCustomReason("");
      queryClient.invalidateQueries({ queryKey: ["dreams-pending"] });
    },
    onError: () => toast.error("Ошибка"),
  });

  if (pendingDreams.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-extrabold mb-3" style={{ color: "var(--ink)" }}>
        💫 Мечты на одобрение
      </h2>
      <div className="space-y-3">
        {pendingDreams.map((dream: any) => (
          <div key={dream.id} className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)" }}>
            <div className="flex items-start gap-3">
              {dream.photoUrl ? (
                <img src={dream.photoUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "var(--lav)" }}>
                  💫
                </div>
              )}
              <div>
                <p className="font-bold" style={{ color: "var(--ink)" }}>{dream.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Ребёнок: {dream.child?.name ?? ""}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#FEF3C7", color: "#92400E" }}>
                  Ждёт одобрения
                </span>
              </div>
            </div>

            {approvingId === dream.id ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Установите стоимость в монетах:</p>
                <input
                  type="number"
                  min={1}
                  value={targetCoins}
                  onChange={(e) => setTargetCoins(e.target.value)}
                  placeholder="Например: 1000"
                  className="w-full px-4 py-3 rounded-xl border text-base outline-none"
                  style={{ borderColor: "var(--line)", color: "var(--ink)", background: "#fff" }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setApprovingId(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "var(--line)", color: "var(--muted)" }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => approveMutation.mutate({ id: dream.id, coins: Number(targetCoins) })}
                    disabled={!targetCoins || Number(targetCoins) < 1 || approveMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                    style={{ background: "var(--green)" }}
                  >
                    {approveMutation.isPending ? "..." : "✅ Одобрить"}
                  </button>
                </div>
              </div>
            ) : rejectingId === dream.id ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Причина отказа:</p>
                <div className="flex flex-wrap gap-2">
                  {REJECT_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRejectReason(r)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: rejectReason === r ? "#DC2626" : "var(--line)",
                        color: rejectReason === r ? "#fff" : "var(--muted)",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => { setCustomReason(e.target.value); setRejectReason(""); }}
                  placeholder="Или своя причина..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--line)", color: "var(--ink)", background: "#fff" }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setRejectingId(null); setRejectReason(""); setCustomReason(""); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "var(--line)", color: "var(--muted)" }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate({ id: dream.id, reason: customReason || rejectReason })}
                    disabled={(!rejectReason && !customReason) || rejectMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                    style={{ background: "#DC2626" }}
                  >
                    {rejectMutation.isPending ? "..." : "❌ Отклонить"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setApprovingId(dream.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "var(--green)" }}
                >
                  ✅ Одобрить
                </button>
                <button
                  onClick={() => setRejectingId(dream.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "#DC2626" }}
                >
                  ❌ Отклонить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
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
    <main className="min-h-screen p-6 max-w-lg mx-auto pb-12">
      <button
        onClick={() => router.push("/parent/cabinet")}
        className="flex items-center gap-2 text-sm font-semibold mb-6"
        style={{ color: "var(--purple)" }}
      >
        ← Назад
      </button>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--surface)" }} />
          ))}
        </div>
      ) : !child ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold" style={{ color: "var(--ink)" }}>Ребёнок не найден</p>
          <button onClick={() => router.push("/parent/cabinet")} className="mt-4 text-sm font-semibold" style={{ color: "var(--purple)" }}>
            Вернуться в кабинет
          </button>
        </div>
      ) : (
        <>
          {/* Child header */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white flex-shrink-0"
              style={{ background: "var(--purple)" }}
            >
              {child.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>{child.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-sm" style={{ color: "var(--muted)" }}>{child.age} лет</span>
                <span className="text-sm font-semibold">🔥 {child.streak} дней</span>
                {balance != null && (
                  <span className="text-sm font-semibold" style={{ color: "var(--purple)" }}>
                    🪙 {balance.balance ?? 0}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dream approvals */}
          <DreamApprovalSection />

          {/* Password change */}
          <div className="mb-6">
            <ChangePasswordSection childId={childId} parentId={child.parentId} />
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mb-8">
              <StatCard emoji="🔥" value={stats.streak} label="Дней подряд" highlight />
              <StatCard emoji="📚" value={stats.totalSessions} label="Сессий" />
              <StatCard emoji="🪙" value={stats.totalCoinsEarned} label="Монет заработано" />
              <StatCard emoji="📖" value={stats.activeEnrollments} label="Активных курсов" />
            </div>
          )}

          {/* Sessions */}
          <div>
            <h2 className="text-lg font-extrabold mb-3" style={{ color: "var(--ink)" }}>
              История сессий
            </h2>
            {loadingSessions ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Загрузка...</p>
            ) : sortedSessions.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "var(--surface)" }}>
                <p className="text-4xl mb-2">📭</p>
                <p className="font-semibold" style={{ color: "var(--ink)" }}>Сессий пока нет</p>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  Начните первый курс, чтобы увидеть прогресс
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedSessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

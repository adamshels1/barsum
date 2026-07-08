"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Gift, LogOut, ShoppingBag, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { childrenApi } from "@/lib/api/children";
import { coinsApi } from "@/lib/api/coins";
import { paymentsApi } from "@/lib/api/payments";
import { useAuthStore } from "@/stores/auth-store";
import { CoinIcon } from "@/components/CoinIcon";
import { Portal } from "@/components/Portal";
import type { Payment } from "@/types";
import { childPhotoUrl } from "@/lib/media";

const PAYMENT_STATUS_LABEL: Record<Payment["status"], string> = {
  confirmed: "Оплачено",
  pending: "Ожидает",
  rejected: "Отклонено",
};

const PAYMENT_STATUS_COLOR: Record<Payment["status"], string> = {
  confirmed: "rgba(34,197,94,0.3)",
  pending: "rgba(255,200,0,0.25)",
  rejected: "rgba(239,68,68,0.35)",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

const childSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  age: z.coerce.number().min(4).max(16),
  login: z.string().min(3).regex(/^[a-z0-9_]+$/, "Только a-z, 0-9, _"),
  password: z.string().min(4, "Минимум 4 символа"),
});

type ChildForm = z.infer<typeof childSchema>;

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 20,
};

export default function ParentCabinetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [showModal, setShowModal] = useState(false);
  const [newCreds, setNewCreds] = useState<{ login: string; password: string; name: string } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children"],
    queryFn: childrenApi.list,
  });

  const { data: balance } = useQuery({
    queryKey: ["parent-balance"],
    queryFn: coinsApi.parentBalance,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: paymentsApi.list,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ChildForm>({
    resolver: zodResolver(childSchema),
  });

  const resetPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const createMutation = useMutation({
    mutationFn: childrenApi.create,
    onSuccess: async (created, variables) => {
      if (photoFile) {
        try {
          await childrenApi.uploadPhoto(created.id, photoFile);
        } catch {
          toast.error("Не удалось загрузить фото, но профиль создан");
        }
      }
      queryClient.invalidateQueries({ queryKey: ["children"] });
      setNewCreds({ login: variables.login, password: variables.password, name: variables.name });
      reset();
      resetPhoto();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Ошибка создания профиля");
    },
  });

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <main style={{ minHeight: "100dvh", padding: "0 0 32px" }}>
      {/* Header */}
      <div
        className="glass-header"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 20px 20px" }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Семейный кабинет
          </p>
          <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>
            {user?.name || "Родитель"} 👋
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="glass-chip"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 13 }}
        >
          <LogOut size={14} strokeWidth={2.5} />
          Выйти
        </button>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {/* Balance card */}
        <div style={{ ...GLASS, padding: "20px 20px", marginBottom: 16, background: "rgba(255,255,255,0.2)" }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Баланс монет</p>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#ffffff" }}>{balance?.balance ?? "—"} <CoinIcon size={26} /></p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>1 ₸ = 10 монет</p>
        </div>

        {/* Navigation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Каталог", Icon: BookOpen, href: "/parent/home" },
            { label: "Награды", Icon: Gift, href: "/parent/rewards" },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{ ...GLASS, padding: "16px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontFamily: "inherit" }}
            >
              <item.Icon size={16} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#ffffff" }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Children section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Дети
          </p>
          <button
            onClick={() => { setShowModal(true); setNewCreds(null); }}
            style={{ fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit", background: "rgba(255,255,255,0.9)", color: "#4776e6" }}
          >
            + Добавить
          </button>
        </div>

        {isLoading ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Загрузка...</p>
        ) : children.length === 0 ? (
          <div style={{ ...GLASS, padding: 32, textAlign: "center" }}>
            <p style={{ fontSize: 40, margin: "0 0 8px" }}>👶</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.7)" }}>Ещё нет детей</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {children.map((child: any) => (
              <button
                key={child.id}
                onClick={() => router.push(`/parent/child/${child.id}`)}
                style={{ ...GLASS, width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, textAlign: "left", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontFamily: "inherit" }}
              >
                {child.photoUrl ? (
                  <img src={childPhotoUrl(child)} alt={child.name} style={{ width: 48, height: 48, borderRadius: 16, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#ffffff", flexShrink: 0 }}>
                    {child.name[0]}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", fontSize: 15 }}>{child.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    {child.age} лет · 🔥 {child.streak} дней
                  </p>
                </div>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 20 }}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* Purchases section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "24px 0 12px" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Мои покупки
          </p>
        </div>

        {payments.length === 0 ? (
          <div style={{ ...GLASS, padding: 28, textAlign: "center" }}>
            <ShoppingBag size={32} color="rgba(255,255,255,0.5)" strokeWidth={1.5} style={{ margin: "0 auto 8px" }} />
            <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 14 }}>Покупок пока нет</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {payments.map((payment) => (
              <div key={payment.id} style={{ ...GLASS, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,0.2)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  📚
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {payment.challenge?.bookTitle || payment.challenge?.title || "Задание"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>
                    Для {payment.child?.name ?? "ребёнка"} · {formatDate(payment.createdAt)}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontWeight: 900, color: "#ffffff", fontSize: 15 }}>{payment.total.toLocaleString()} ₸</p>
                  <span style={{ display: "inline-block", marginTop: 4, fontSize: 10.5, padding: "3px 8px", borderRadius: 9999, fontWeight: 800, background: PAYMENT_STATUS_COLOR[payment.status], color: "#ffffff" }}>
                    {PAYMENT_STATUS_LABEL[payment.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add child modal */}
      {showModal && (
        <Portal>
        <div
          className="fixed inset-0 flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 60 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) { setShowModal(false); setNewCreds(null); resetPhoto(); }
          }}
        >
          <div style={{ width: "100%", maxWidth: 400, background: "rgba(20,10,60,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "28px 28px 0 0", padding: "28px 24px max(40px, env(safe-area-inset-bottom))" }}>
            {newCreds ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: "#ffffff" }}>Профиль создан!</h3>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px 16px", marginBottom: 16, textAlign: "left" }}>
                  {[
                    { label: "Имя", value: newCreds.name, mono: false },
                    { label: "Логин", value: newCreds.login, mono: true },
                    { label: "Пароль", value: newCreds.password, mono: true },
                  ].map(({ label, value, mono }) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{label}</p>
                      <p style={{ margin: 0, fontWeight: 800, color: "#ffffff", fontFamily: mono ? "monospace" : "inherit" }}>{value}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setShowModal(false); setNewCreds(null); resetPhoto(); }}
                  className="btn-white"
                  style={{ color: "#4776e6" }}
                >
                  Готово
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 900, color: "#ffffff" }}>Новый ребёнок</h3>
                <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handlePhotoChange}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ alignSelf: "center", width: 76, height: 76, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.35)", background: photoPreview ? `url(${photoPreview}) center/cover` : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 4 }}
                  >
                    {!photoPreview && <Camera size={22} color="rgba(255,255,255,0.6)" strokeWidth={2} />}
                  </button>
                  <p style={{ margin: "-8px 0 4px", fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                    {photoPreview ? "Фото выбрано" : "Фото ребёнка (необязательно)"}
                  </p>
                  {[
                    { name: "name", placeholder: "Имя", type: "text" },
                    { name: "age", placeholder: "Возраст", type: "number" },
                    { name: "login", placeholder: "Логин (a-z, 0-9, _)", type: "text" },
                    { name: "password", placeholder: "Пароль", type: "password" },
                  ].map((f) => (
                    <div key={f.name}>
                      <input
                        {...register(f.name as keyof ChildForm)}
                        placeholder={f.placeholder}
                        type={f.type}
                        className="glass-input"
                      />
                      {errors[f.name as keyof ChildForm] && (
                        <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                          {errors[f.name as keyof ChildForm]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={isSubmitting || createMutation.isPending}
                    className="btn-white"
                    style={{ marginTop: 4, color: "#4776e6" }}
                  >
                    {createMutation.isPending ? "Создаём..." : "Создать"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
        </Portal>
      )}
    </main>
  );
}

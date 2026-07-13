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
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ChildRequestsInbox } from "@/components/ChildRequestsInbox";
import { OwnBookConfirmInbox } from "@/components/OwnBookConfirmInbox";
import type { Payment } from "@/types";
import { childPhotoUrl } from "@/lib/media";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    paid: "Оплачено",
    pending: "Ожидает",
    rejected: "Отклонено",
    min2: "Минимум 2 символа",
    loginRule: "Только a-z, 0-9, _",
    min4: "Минимум 4 символа",
    photoFailed: "Не удалось загрузить фото, но профиль создан",
    createError: "Ошибка создания профиля",
    familyCabinet: "Семейный кабинет",
    parentFallback: "Родитель",
    logout: "Выйти",
    coinBalance: "Баланс монет",
    rate: "1 ₸ = 10 монет",
    catalog: "Каталог",
    rewards: "Награды",
    children: "Дети",
    add: "+ Добавить",
    loading: "Загрузка...",
    noChildren: "Ещё нет детей",
    childInfo: "{age} лет · 🔥 {streak} дней",
    myPurchases: "Мои покупки",
    challengeFallback: "Задание",
    forChild: "Для {name} · {date}",
    childFallback: "ребёнка",
    noPurchases: "Покупок пока нет",
    profileCreated: "Профиль создан!",
    name: "Имя",
    login: "Логин",
    password: "Пароль",
    done: "Готово",
    newChild: "Новый ребёнок",
    photoSelected: "Фото выбрано",
    photoOptional: "Фото ребёнка (необязательно)",
    agePlaceholder: "Возраст",
    loginPlaceholder: "Логин (a-z, 0-9, _)",
    creating: "Создаём...",
    create: "Создать",
  },
  kk: {
    paid: "Төленді",
    pending: "Күтуде",
    rejected: "Қабылданбады",
    min2: "Кемінде 2 таңба",
    loginRule: "Тек a-z, 0-9, _",
    min4: "Кемінде 4 таңба",
    photoFailed: "Фотоны жүктеу мүмкін болмады, бірақ профиль құрылды",
    createError: "Профильді құру қатесі",
    familyCabinet: "Отбасылық кабинет",
    parentFallback: "Ата-ана",
    logout: "Шығу",
    coinBalance: "Монета балансы",
    rate: "1 ₸ = 10 монета",
    catalog: "Каталог",
    rewards: "Сыйлықтар",
    children: "Балалар",
    add: "+ Қосу",
    loading: "Жүктелуде...",
    noChildren: "Әзірге балалар жоқ",
    childInfo: "{age} жас · 🔥 {streak} күн",
    myPurchases: "Менің сатып алуларым",
    challengeFallback: "Тапсырма",
    forChild: "{name} үшін · {date}",
    childFallback: "бала",
    noPurchases: "Әзірге сатып алулар жоқ",
    profileCreated: "Профиль құрылды!",
    name: "Аты",
    login: "Логин",
    password: "Құпиясөз",
    done: "Дайын",
    newChild: "Жаңа бала",
    photoSelected: "Фото таңдалды",
    photoOptional: "Бала фотосы (міндетті емес)",
    agePlaceholder: "Жасы",
    loginPlaceholder: "Логин (a-z, 0-9, _)",
    creating: "Құрылуда...",
    create: "Құру",
  },
};

const PAYMENT_STATUS_COLOR: Record<Payment["status"], string> = {
  confirmed: "rgba(34,197,94,0.3)",
  pending: "rgba(255,200,0,0.25)",
  rejected: "rgba(239,68,68,0.35)",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 20,
};

export default function ParentCabinetPage() {
  const t = useT(dict);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const PAYMENT_STATUS_LABEL: Record<Payment["status"], string> = {
    confirmed: t("paid"),
    pending: t("pending"),
    rejected: t("rejected"),
  };

  const childSchema = z.object({
    name: z.string().min(2, t("min2")),
    age: z.coerce.number().min(4).max(16),
    login: z.string().min(3).regex(/^[a-z0-9_]+$/, t("loginRule")),
    password: z.string().min(4, t("min4")),
  });
  type ChildForm = z.infer<typeof childSchema>;

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
          toast.error(t("photoFailed"));
        }
      }
      queryClient.invalidateQueries({ queryKey: ["children"] });
      setNewCreds({ login: variables.login, password: variables.password, name: variables.name });
      reset();
      resetPhoto();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("createError"));
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
            {t("familyCabinet")}
          </p>
          <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>
            {user?.name || t("parentFallback")} 👋
          </h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <LanguageSwitcher />
          <button
            onClick={handleLogout}
            className="glass-chip"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 700, fontSize: 13 }}
          >
            <LogOut size={14} strokeWidth={2.5} />
            {t("logout")}
          </button>
        </div>
      </div>

      {/* Подтверждение чтения (спорные/экспертские сессии) — на главной, с аудиозаписью */}
      <OwnBookConfirmInbox />

      {/* Запросы от детей — награды + мечты (задача: всё на главной) */}
      <ChildRequestsInbox />

      <div style={{ padding: "20px 20px 0" }}>
        {/* Balance card */}
        <div style={{ ...GLASS, padding: "20px 20px", marginBottom: 16, background: "rgba(255,255,255,0.2)" }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{t("coinBalance")}</p>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#ffffff" }}>{balance?.balance ?? "—"} <CoinIcon size={26} /></p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{t("rate")}</p>
        </div>

        {/* Navigation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: t("catalog"), Icon: BookOpen, href: "/parent/home" },
            { label: t("rewards"), Icon: Gift, href: "/parent/rewards" },
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
            {t("children")}
          </p>
          <button
            onClick={() => { setShowModal(true); setNewCreds(null); }}
            style={{ fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit", background: "rgba(255,255,255,0.9)", color: "#4776e6" }}
          >
            {t("add")}
          </button>
        </div>

        {isLoading ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{t("loading")}</p>
        ) : children.length === 0 ? (
          <div style={{ ...GLASS, padding: 32, textAlign: "center" }}>
            <p style={{ fontSize: 40, margin: "0 0 8px" }}>👶</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.7)" }}>{t("noChildren")}</p>
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
                    {t("childInfo", { age: child.age, streak: child.streak })}
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
            {t("myPurchases")}
          </p>
        </div>

        {payments.length === 0 ? (
          <div style={{ ...GLASS, padding: 28, textAlign: "center" }}>
            <ShoppingBag size={32} color="rgba(255,255,255,0.5)" strokeWidth={1.5} style={{ margin: "0 auto 8px" }} />
            <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{t("noPurchases")}</p>
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
                    {payment.challenge?.bookTitle || payment.challenge?.title || t("challengeFallback")}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>
                    {t("forChild", { name: payment.child?.name ?? t("childFallback"), date: formatDate(payment.createdAt) })}
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
                <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: "#ffffff" }}>{t("profileCreated")}</h3>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px 16px", marginBottom: 16, textAlign: "left" }}>
                  {[
                    { label: t("name"), value: newCreds.name, mono: false },
                    { label: t("login"), value: newCreds.login, mono: true },
                    { label: t("password"), value: newCreds.password, mono: true },
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
                  {t("done")}
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 900, color: "#ffffff" }}>{t("newChild")}</h3>
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
                    {photoPreview ? t("photoSelected") : t("photoOptional")}
                  </p>
                  {[
                    { name: "name", placeholder: t("name"), type: "text" },
                    { name: "age", placeholder: t("agePlaceholder"), type: "number" },
                    { name: "login", placeholder: t("loginPlaceholder"), type: "text" },
                    { name: "password", placeholder: t("password"), type: "password" },
                  ].map((f) => {
                    const reg = register(f.name as keyof ChildForm);
                    const isLogin = f.name === "login";
                    return (
                    <div key={f.name}>
                      <input
                        {...reg}
                        onChange={isLogin ? (e) => { e.target.value = e.target.value.toLowerCase(); reg.onChange(e); } : reg.onChange}
                        placeholder={f.placeholder}
                        type={f.type}
                        className="glass-input"
                        {...(isLogin ? { autoCapitalize: "none", autoCorrect: "off", spellCheck: false } : {})}
                      />
                      {errors[f.name as keyof ChildForm] && (
                        <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                          {errors[f.name as keyof ChildForm]?.message}
                        </p>
                      )}
                    </div>
                    );
                  })}
                  <button
                    type="submit"
                    disabled={isSubmitting || createMutation.isPending}
                    className="btn-white"
                    style={{ marginTop: 4, color: "#4776e6" }}
                  >
                    {createMutation.isPending ? t("creating") : t("create")}
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

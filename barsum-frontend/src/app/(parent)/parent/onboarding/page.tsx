"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Baby, Camera, ClipboardCopy, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { childrenApi } from "@/lib/api/children";
import { rewardsApi } from "@/lib/api/rewards";
import { RewardTemplatePicker } from "@/components/RewardTemplatePicker";
import type { RewardTemplate } from "@/lib/rewardTemplates";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    min2: "Минимум 2 символа",
    min3: "Минимум 3 символа",
    loginRule: "Только a-z, 0-9, _",
    min4: "Минимум 4 символа",
    templateAdded: "«{name}» добавлена в магазин",
    addError: "Ошибка при добавлении",
    createError: "Ошибка создания профиля",
    credsCopied: "Логин и пароль скопированы",
    copyText: "Логин: {login}\nПароль: {password}\nСайт: https://barsum.app",
    shareText: "Barsum — данные для входа ребёнка «{name}»\nЛогин: {login}\nПароль: {password}\nСайт: https://barsum.app",
    shareTitle: "Barsum — вход для ребёнка",
    dataCopied: "Данные скопированы в буфер обмена",
    setupShop: "Настрой магазин",
    shopHint: "Добавь пару наград одним тапом — цену можно поправить. Это необязательно, всегда можно сделать позже.",
    toCabinet: "В кабинет →",
    profileCreated: "Профиль создан!",
    saveCreds: "Сохрани данные для входа ребёнка",
    name: "Имя",
    login: "Логин",
    password: "Пароль",
    copiedSuffix: "{label} скопирован",
    copy: "Копировать",
    share: "Поделиться",
    next: "Далее →",
    shareRequiredHint: "⚠️ Сначала скопируйте или отправьте данные ребёнку — без них он не войдёт",
    shareFirst: "Поделитесь, чтобы продолжить",
    addChild: "Добавь ребёнка",
    createToStart: "Создай профиль, чтобы начать",
    childNamePlaceholder: "Имя ребёнка",
    agePlaceholder: "Возраст",
    loginPlaceholder: "Логин (a-z, 0-9, _)",
    passwordPlaceholder: "Пароль для ребёнка",
    creating: "Создаём...",
    createProfile: "Создать профиль",
    addPhoto: "Фото",
    chooseBook: "Выбрать книгу в каталоге →",
  },
  kk: {
    min2: "Кемінде 2 таңба",
    min3: "Кемінде 3 таңба",
    loginRule: "Тек a-z, 0-9, _",
    min4: "Кемінде 4 таңба",
    templateAdded: "«{name}» дүкенге қосылды",
    addError: "Қосу кезінде қате",
    createError: "Профильді құру қатесі",
    credsCopied: "Логин мен құпиясөз көшірілді",
    copyText: "Логин: {login}\nҚұпиясөз: {password}\nСайт: https://barsum.app",
    shareText: "Barsum — «{name}» баласының кіру деректері\nЛогин: {login}\nҚұпиясөз: {password}\nСайт: https://barsum.app",
    shareTitle: "Barsum — бала үшін кіру",
    dataCopied: "Деректер алмасу буферіне көшірілді",
    setupShop: "Дүкенді баптаңыз",
    shopHint: "Бір рет түртіп бірнеше сыйлық қосыңыз — бағаны түзетуге болады. Бұл міндетті емес, оны кейін де жасауға болады.",
    toCabinet: "Кабинетке →",
    profileCreated: "Профиль құрылды!",
    saveCreds: "Баланың кіру деректерін сақтаңыз",
    name: "Аты",
    login: "Логин",
    password: "Құпиясөз",
    copiedSuffix: "{label} көшірілді",
    copy: "Көшіру",
    share: "Бөлісу",
    next: "Әрі қарай →",
    shareRequiredHint: "⚠️ Алдымен деректерді балаға көшіріп немесе жіберіңіз — онсыз ол кіре алмайды",
    shareFirst: "Жалғастыру үшін бөлісіңіз",
    addChild: "Бала қосу",
    createToStart: "Бастау үшін профиль құрыңыз",
    childNamePlaceholder: "Баланың аты",
    agePlaceholder: "Жасы",
    loginPlaceholder: "Логин (a-z, 0-9, _)",
    passwordPlaceholder: "Балаға арналған құпиясөз",
    creating: "Құрылуда...",
    createProfile: "Профиль құру",
    addPhoto: "Фото",
    chooseBook: "Каталогтан кітап таңдау →",
  },
};

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 20,
};

export default function ParentOnboardingPage() {
  const t = useT(dict);
  const router = useRouter();
  const [created, setCreated] = useState<{ login: string; password: string; name: string } | null>(null);
  // Родитель обязан скопировать/отправить данные ребёнку прежде чем идти дальше —
  // иначе многие забывают поделиться, и ребёнок не может войти.
  const [shared, setShared] = useState(false);
  const [showShopStep, setShowShopStep] = useState(false);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());
  const [pendingName, setPendingName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const childSchema = z.object({
    name: z.string().min(2, t("min2")),
    age: z.coerce.number().min(4).max(16),
    login: z.string().min(3, t("min3")).regex(/^[a-z0-9_]+$/, t("loginRule")),
    password: z.string().min(4, t("min4")),
  });
  type ChildForm = z.infer<typeof childSchema>;

  const addTemplateMutation = useMutation({
    mutationFn: (template: RewardTemplate) => rewardsApi.create({ name: template.name, cost: template.cost, type: template.type, photoUrl: template.image }),
    onMutate: (template) => setPendingName(template.name),
    onSuccess: (_data, template) => {
      setAddedNames((prev) => new Set(prev).add(template.name));
      toast.success(t("templateAdded", { name: template.name }));
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t("addError")),
    onSettled: () => setPendingName(null),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChildForm>({
    resolver: zodResolver(childSchema),
  });

  const onSubmit = async (data: ChildForm) => {
    try {
      const child = await childrenApi.create(data);
      if (photoFile && child?.id) {
        try {
          await childrenApi.uploadPhoto(child.id, photoFile);
        } catch {
          // фото не критично — профиль уже создан
        }
      }
      setCreated({ login: data.login, password: data.password, name: data.name });
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("createError"));
    }
  };

  const copyAll = () => {
    if (!created) return;
    const text = t("copyText", { login: created.login, password: created.password });
    navigator.clipboard.writeText(text).then(() => { setShared(true); toast.success(t("credsCopied")); });
  };

  const shareAll = () => {
    if (!created) return;
    const text = t("shareText", { name: created.name, login: created.login, password: created.password });
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: t("shareTitle"), text }).then(() => setShared(true)).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => { setShared(true); toast.success(t("dataCopied")); });
    }
  };

  if (created && showShopStep) {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 44, marginBottom: 6 }}>🎁</div>
            <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{t("setupShop")}</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
              {t("shopHint")}
            </p>
          </div>

          <RewardTemplatePicker
            onAdd={(t) => addTemplateMutation.mutate(t)}
            addedNames={addedNames}
            pendingName={pendingName}
          />

          <button
            onClick={() => router.push("/parent/home")}
            className="btn-white"
            style={{ marginTop: 20, color: "#4776e6" }}
          >
            {t("chooseBook")}
          </button>
          <button
            onClick={() => router.push("/parent/cabinet")}
            style={{ marginTop: 10, width: "100%", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.7)" }}
          >
            {t("toCabinet")}
          </button>
        </div>
      </main>
    );
  }

  if (created) {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 900, color: "#ffffff" }}>{t("profileCreated")}</h1>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{t("saveCreds")}</p>
          </div>

          <div style={{ ...GLASS, padding: "20px 20px", marginBottom: 12 }}>
            {[
              { label: t("name"), value: created.name, mono: false, copyKey: null as string | null },
              { label: t("login"), value: created.login, mono: true, copyKey: created.login as string | null },
              { label: t("password"), value: created.password, mono: true, copyKey: created.password as string | null },
            ].map(({ label, value, mono, copyKey }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{label}</p>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#ffffff", fontFamily: mono ? "monospace" : "inherit" }}>{value}</p>
                </div>
                {copyKey && (
                  <button
                    onClick={() => navigator.clipboard.writeText(copyKey).then(() => { setShared(true); toast.success(t("copiedSuffix", { label })); })}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}
                  >
                    <ClipboardCopy size={16} color="rgba(255,255,255,0.8)" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button
              onClick={copyAll}
              style={{ flex: 1, ...GLASS, padding: "13px 0", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <ClipboardCopy size={15} />
              {t("copy")}
            </button>
            <button
              onClick={shareAll}
              style={{ flex: 1, ...GLASS, padding: "13px 0", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Share2 size={15} />
              {t("share")}
            </button>
          </div>

          {!shared && (
            <p style={{ margin: "0 0 10px", fontSize: 12.5, fontWeight: 700, color: "#ffd200", textAlign: "center", lineHeight: 1.4 }}>
              {t("shareRequiredHint")}
            </p>
          )}
          <button
            onClick={() => shared && setShowShopStep(true)}
            disabled={!shared}
            className="btn-white"
            style={{ color: "#4776e6", opacity: shared ? 1 : 0.45, cursor: shared ? "pointer" : "not-allowed" }}
          >
            {shared ? t("next") : t("shareFirst")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Baby size={32} color="#ffffff" strokeWidth={2} />
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900, color: "#ffffff" }}>{t("addChild")}</h1>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{t("createToStart")}</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 24, padding: "28px 24px" }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ alignSelf: "center", width: 88, height: 88, borderRadius: 9999, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", padding: 0 }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <Camera size={22} color="rgba(255,255,255,0.75)" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{t("addPhoto")}</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
            {[
              { name: "name", placeholder: t("childNamePlaceholder"), type: "text" },
              { name: "age", placeholder: t("agePlaceholder"), type: "number" },
              { name: "login", placeholder: t("loginPlaceholder"), type: "text" },
              { name: "password", placeholder: t("passwordPlaceholder"), type: "password" },
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
                  {...(f.name === "age" ? { min: 4, max: 16 } : {})}
                />
                {errors[f.name as keyof ChildForm] && (
                  <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                    {errors[f.name as keyof ChildForm]?.message}
                  </p>
                )}
              </div>
            );})}
            <button type="submit" disabled={isSubmitting} className="btn-white" style={{ marginTop: 4, color: "#4776e6" }}>
              {isSubmitting ? t("creating") : t("createProfile")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

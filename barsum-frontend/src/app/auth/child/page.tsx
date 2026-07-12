"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { MascotWave } from "@/components/MascotWave";
import { BackButton } from "@/components/BackButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuthStore } from "@/stores/auth-store";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    enterLogin: "Введите логин",
    enterPassword: "Введите пароль",
    wrongCredentials: "Неверный логин или пароль",
    hello: "Привет!",
    subtitle: "Войди и начни читать 📚",
    childLogin: "Вход для ребёнка",
    login: "Логин",
    loginPlaceholder: "Твой логин",
    password: "Пароль",
    passwordPlaceholder: "Твой пароль",
    loading: "Загрузка...",
    signIn: "Войти",
    parentHint: "Логин и пароль выдаёт родитель",
    showPassword: "Показать пароль",
    hidePassword: "Скрыть пароль",
  },
  kk: {
    enterLogin: "Логинді енгізіңіз",
    enterPassword: "Құпиясөзді енгізіңіз",
    wrongCredentials: "Қате логин немесе құпиясөз",
    hello: "Сәлем!",
    subtitle: "Кіріп, оқи баста 📚",
    childLogin: "Бала кірісі",
    login: "Логин",
    loginPlaceholder: "Сенің логиниң",
    password: "Құпиясөз",
    passwordPlaceholder: "Сенің құпиясөзің",
    loading: "Жүктелуде...",
    signIn: "Кіру",
    parentHint: "Логин мен құпиясөзді ата-ана береді",
    showPassword: "Құпиясөзді көрсету",
    hidePassword: "Құпиясөзді жасыру",
  },
};

const BG = "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)";

export default function ChildAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const t = useT(dict);

  const schema = z.object({
    identifier: z.string().min(1, t("enterLogin")),
    password: z.string().min(1, t("enterPassword")),
  });
  type Form = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const identifierReg = register("identifier");

  const onSubmit = async (data: Form) => {
    try {
      const res = await apiClient.post("/auth/login", {
        ...data,
        identifier: data.identifier.trim().toLowerCase(),
      });
      const { access_token, role, user, child, expert } = res.data;
      setAuth(access_token, role, user ?? child, expert?.status);
      redirectByRole(role, expert?.status, router);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("wrongCredentials"));
    }
  };

  return (
    <main style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column" }}>
      <BackButton />
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 2 }}>
        <LanguageSwitcher />
      </div>
      <div style={{ position: "fixed", top: "-15%", right: "-10%", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.15)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(0,0,0,0.12)", filter: "blur(50px)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, paddingBottom: 32, position: "relative", zIndex: 1 }}>
        <MascotWave size={140} animate={false} />
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", margin: 0 }}>{t("hello")}</h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, fontWeight: 600, marginTop: 6 }}>
          {t("subtitle")}
        </p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.22)", borderRadius: "28px 28px 0 0", padding: "32px 24px 40px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: "0 0 24px" }}>
          {t("childLogin")}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("login")}
            </label>
            <input {...identifierReg} onChange={(e) => { e.target.value = e.target.value.toLowerCase(); identifierReg.onChange(e); }} placeholder={t("loginPlaceholder")} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="glass-input" />
            {errors.identifier && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.identifier.message}</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("password")}
            </label>
            <div style={{ position: "relative" }}>
              <input {...register("password")} type={showPassword ? "text" : "password"} placeholder={t("passwordPlaceholder")} autoComplete="current-password" className="glass-input" style={{ paddingRight: 48 }} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
              </button>
            </div>
            {errors.password && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-white" style={{ marginTop: 8, color: "#4776e6" }}>
            {isSubmitting ? t("loading") : t("signIn")}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
          {t("parentHint")}
        </p>
      </div>
    </main>
  );
}

function redirectByRole(role: string, expertStatus: string | undefined, router: ReturnType<typeof useRouter>) {
  if (role === "child") router.push("/child/home");
  else if (role === "parent") router.push("/parent/cabinet");
  else if (role === "expert") router.push(expertStatus === "approved" ? "/expert/home" : "/expert/onboarding");
  else if (role === "admin") router.push("/admin");
}

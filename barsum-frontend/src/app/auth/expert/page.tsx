"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
    enterEmailOrLogin: "Введите email или логин",
    enterPassword: "Введите пароль",
    enterValidEmail: "Введите корректный email",
    minSixChars: "Минимум 6 символов",
    enterName: "Введите имя",
    loginError: "Ошибка входа",
    title: "Эксперт",
    subtitle: "Создавайте задания для детей",
    tabLogin: "Войти",
    tabRegister: "Регистрация",
    yourName: "Ваше имя",
    namePlaceholder: "Например: Айгерим",
    email: "Email",
    emailOrLogin: "Email или логин",
    emailPlaceholder: "email@example.com",
    emailOrLoginPlaceholder: "email@example.com или логин",
    password: "Пароль",
    minSixPlaceholder: "Минимум 6 символов",
    yourPassword: "Ваш пароль",
    loading: "Загрузка...",
    signUp: "Зарегистрироваться",
    signIn: "Войти",
  },
  kk: {
    enterEmailOrLogin: "Email немесе логинді енгізіңіз",
    enterPassword: "Құпиясөзді енгізіңіз",
    enterValidEmail: "Дұрыс email енгізіңіз",
    minSixChars: "Кемінде 6 таңба",
    enterName: "Атыңызды енгізіңіз",
    loginError: "Кіру қатесі",
    title: "Сарапшы",
    subtitle: "Балаларға тапсырмалар жасаңыз",
    tabLogin: "Кіру",
    tabRegister: "Тіркелу",
    yourName: "Атыңыз",
    namePlaceholder: "Мысалы: Айгерім",
    email: "Email",
    emailOrLogin: "Email немесе логин",
    emailPlaceholder: "email@example.com",
    emailOrLoginPlaceholder: "email@example.com немесе логин",
    password: "Құпиясөз",
    minSixPlaceholder: "Кемінде 6 таңба",
    yourPassword: "Құпиясөзіңіз",
    loading: "Жүктелуде...",
    signUp: "Тіркелу",
    signIn: "Кіру",
  },
};

const BG = "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)";

export default function ExpertAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isRegister, setIsRegister] = useState(false);
  const t = useT(dict);

  const loginSchema = z.object({
    identifier: z.string().min(1, t("enterEmailOrLogin")),
    password: z.string().min(1, t("enterPassword")),
  });
  const registerSchema = z.object({
    identifier: z.string().email(t("enterValidEmail")),
    password: z.string().min(6, t("minSixChars")),
    name: z.string().min(2, t("enterName")),
  });

  type Form = z.infer<typeof loginSchema> & { name?: string };

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Form>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
  });

  const switchTab = (reg: boolean) => {
    setIsRegister(reg);
    reset();
  };

  const onSubmit = async (data: Form) => {
    try {
      if (isRegister) {
        const res = await apiClient.post("/auth/expert/register", {
          email: data.identifier,
          password: data.password,
          name: data.name,
        });
        const { access_token, user, expert } = res.data;
        setAuth(access_token, "expert", user, expert?.status);
        router.push(expert?.status === "approved" ? "/expert/home" : "/expert/onboarding");
      } else {
        const res = await apiClient.post("/auth/login", {
          identifier: data.identifier,
          password: data.password,
        });
        const { access_token, role, user, child, expert } = res.data;
        setAuth(access_token, role, user ?? child, expert?.status);
        redirectByRole(role, expert?.status, router);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("loginError"));
    }
  };

  return (
    <main style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column" }}>
      <BackButton variant="fixed" href="/" />
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 2 }}>
        <LanguageSwitcher />
      </div>
      <div style={{ position: "fixed", top: "-15%", right: "-10%", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.18)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(0,0,0,0.1)", filter: "blur(50px)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, paddingBottom: 32, position: "relative", zIndex: 1 }}>
        <MascotWave size={140} animate={false} />
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", margin: 0 }}>{t("title")}</h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, fontWeight: 600, marginTop: 6 }}>
          {t("subtitle")}
        </p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.28)", borderRadius: "28px 28px 0 0", padding: "32px 24px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", background: "rgba(0,0,0,0.12)", borderRadius: 9999, padding: 4, marginBottom: 24 }}>
          {[t("tabLogin"), t("tabRegister")].map((label, i) => {
            const active = isRegister === (i === 1);
            return (
              <button key={label} type="button" onClick={() => switchTab(i === 1)} style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", background: active ? "rgba(255,255,255,0.9)" : "transparent", color: active ? "#4776e6" : "rgba(255,255,255,0.65)", transition: "all 0.18s" }}>
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {isRegister && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("yourName")}</label>
              <input {...register("name")} placeholder={t("namePlaceholder")} className="glass-input" />
              {errors.name && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.name.message}</p>}
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isRegister ? t("email") : t("emailOrLogin")}
            </label>
            <input {...register("identifier")} type={isRegister ? "email" : "text"} placeholder={isRegister ? t("emailPlaceholder") : t("emailOrLoginPlaceholder")} autoComplete="email" className="glass-input" />
            {errors.identifier && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.identifier.message}</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("password")}</label>
            <input {...register("password")} type="password" placeholder={isRegister ? t("minSixPlaceholder") : t("yourPassword")} autoComplete={isRegister ? "new-password" : "current-password"} className="glass-input" />
            {errors.password && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-white" style={{ marginTop: 8, color: "#4776e6" }}>
            {isSubmitting ? t("loading") : isRegister ? t("signUp") : t("signIn")}
          </button>
        </form>
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

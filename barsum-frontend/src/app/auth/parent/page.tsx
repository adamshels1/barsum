"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { MascotWave } from "@/components/MascotWave";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  identifier: z.string().min(1, "Введите email или логин"),
  password: z.string().min(1, "Введите пароль"),
});
const registerSchema = z.object({
  identifier: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  name: z.string().min(2, "Введите имя"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type Form = LoginForm & { name?: string };

const BG = "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)";

export default function ParentAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isRegister, setIsRegister] = useState(false);

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
        const res = await apiClient.post("/auth/parent/register", {
          email: data.identifier,
          password: data.password,
          name: data.name,
        });
        const { access_token, user } = res.data;
        setAuth(access_token, "parent", user);
        router.push("/parent/home");
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
      toast.error(error.response?.data?.message || "Ошибка входа");
    }
  };

  return (
    <main style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "fixed", top: "-15%", right: "-10%", width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.12)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-10%", width: 220, height: 220, borderRadius: "50%", background: "rgba(0,0,0,0.15)", filter: "blur(60px)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, paddingBottom: 32, position: "relative", zIndex: 1 }}>
        <MascotWave size={140} animate={false} />
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", margin: 0 }}>Родитель</h1>
        <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 15, fontWeight: 600, marginTop: 6 }}>
          Мотивируй своего ребёнка
        </p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.2)", borderRadius: "28px 28px 0 0", padding: "32px 24px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: 9999, padding: 4, marginBottom: 24 }}>
          {["Войти", "Регистрация"].map((label, i) => {
            const active = isRegister === (i === 1);
            return (
              <button key={label} type="button" onClick={() => switchTab(i === 1)} style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", background: active ? "rgba(255,255,255,0.9)" : "transparent", color: active ? "#4776e6" : "rgba(255,255,255,0.62)", transition: "all 0.18s" }}>
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {isRegister && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ваше имя</label>
              <input {...register("name")} placeholder="Например: Айгерим" className="glass-input" />
              {errors.name && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.name.message}</p>}
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isRegister ? "Email" : "Email или логин"}
            </label>
            <input {...register("identifier")} type={isRegister ? "email" : "text"} placeholder={isRegister ? "email@example.com" : "email@example.com или логин"} autoComplete="email" className="glass-input" />
            {errors.identifier && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.identifier.message}</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Пароль</label>
            <input {...register("password")} type="password" placeholder={isRegister ? "Минимум 6 символов" : "Ваш пароль"} autoComplete={isRegister ? "new-password" : "current-password"} className="glass-input" />
            {errors.password && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-white" style={{ marginTop: 8, color: "#4776e6" }}>
            {isSubmitting ? "Загрузка..." : isRegister ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}

function redirectByRole(role: string, expertStatus: string | undefined, router: ReturnType<typeof useRouter>) {
  if (role === "child") router.push("/child/home");
  else if (role === "parent") router.push("/parent/home");
  else if (role === "expert") router.push(expertStatus === "approved" ? "/expert/home" : "/expert/onboarding");
  else if (role === "admin") router.push("/admin");
}

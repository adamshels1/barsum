"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const BRAND = "#7B61FF";
const BRAND_DEEP = "#5B41DF";

export default function ParentAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isRegister, setIsRegister] = useState(false);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onLogin = async (data: LoginForm) => {
    try {
      const res = await apiClient.post("/auth/parent/login", data);
      const { access_token, user } = res.data;
      setAuth(access_token, "parent", user);
      router.push("/parent/cabinet");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ошибка входа");
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      const res = await apiClient.post("/auth/parent/register", data);
      const { access_token, user } = res.data;
      setAuth(access_token, "parent", user);
      router.push("/parent/onboarding");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ошибка регистрации");
    }
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Brand header */}
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center pt-14 pb-12 px-6"
        style={{
          background: BRAND,
          boxShadow: `0 8px 32px ${BRAND}66`,
        }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <Users size={40} color="#fff" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-black text-white">Родитель</h1>
        <p className="text-white mt-1 text-sm font-semibold" style={{ opacity: 0.85 }}>
          Управляйте обучением детей
        </p>
      </div>

      {/* Form area */}
      <div
        className="flex-1 rounded-t-[32px] p-6 pt-8 -mt-5 relative"
        style={{ background: "#fff" }}
      >
        {/* Tab toggle */}
        <div
          className="flex rounded-2xl p-1 mb-7"
          style={{ background: "var(--soft)" }}
        >
          {[
            { label: "Войти", active: !isRegister },
            { label: "Регистрация", active: isRegister },
          ].map(({ label, active }, i) => (
            <button
              key={label}
              onClick={() => setIsRegister(i === 1)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: active ? "#fff" : "transparent",
                color: active ? BRAND : "var(--muted)",
                boxShadow: active ? "var(--shadow-sm)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {isRegister ? (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--ink)" }}>
                Ваше имя
              </label>
              <input
                {...registerForm.register("name")}
                placeholder="Например: Анара"
                className="clay-input"
              />
              {registerForm.formState.errors.name && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--destructive)" }}>
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--ink)" }}>
                Email
              </label>
              <input
                {...registerForm.register("email")}
                type="email"
                placeholder="email@example.com"
                autoComplete="email"
                className="clay-input"
              />
              {registerForm.formState.errors.email && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--destructive)" }}>
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--ink)" }}>
                Пароль
              </label>
              <input
                {...registerForm.register("password")}
                type="password"
                placeholder="Минимум 6 символов"
                autoComplete="new-password"
                className="clay-input"
              />
              {registerForm.formState.errors.password && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--destructive)" }}>
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={registerForm.formState.isSubmitting}
              className="clay-btn clay-btn-purple w-full py-4 rounded-2xl text-base mt-2 disabled:opacity-60"
            >
              {registerForm.formState.isSubmitting ? "Загрузка..." : "Зарегистрироваться"}
            </button>
          </form>
        ) : (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--ink)" }}>
                Email
              </label>
              <input
                {...loginForm.register("email")}
                type="email"
                placeholder="email@example.com"
                autoComplete="email"
                className="clay-input"
              />
              {loginForm.formState.errors.email && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--destructive)" }}>
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--ink)" }}>
                Пароль
              </label>
              <input
                {...loginForm.register("password")}
                type="password"
                placeholder="Ваш пароль"
                autoComplete="current-password"
                className="clay-input"
              />
              {loginForm.formState.errors.password && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--destructive)" }}>
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loginForm.formState.isSubmitting}
              className="clay-btn clay-btn-purple w-full py-4 rounded-2xl text-base mt-2 disabled:opacity-60"
            >
              {loginForm.formState.isSubmitting ? "Загрузка..." : "Войти"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

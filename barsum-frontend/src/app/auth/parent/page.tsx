"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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

export default function ParentAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isRegister, setIsRegister] = useState(false);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl">
        <h1
          className="text-2xl font-extrabold mb-6"
          style={{ color: "var(--ink)" }}
        >
          {isRegister ? "Регистрация" : "Вход"} родителя
        </h1>

        {isRegister ? (
          <form
            onSubmit={registerForm.handleSubmit(onRegister)}
            className="space-y-4"
          >
            <div>
              <input
                {...registerForm.register("name")}
                placeholder="Ваше имя"
                className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
                style={{ borderColor: "var(--line)" }}
              />
              {registerForm.formState.errors.name && (
                <p className="text-sm mt-1 text-red-500">
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...registerForm.register("email")}
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
                style={{ borderColor: "var(--line)" }}
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm mt-1 text-red-500">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...registerForm.register("password")}
                type="password"
                placeholder="Пароль"
                className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
                style={{ borderColor: "var(--line)" }}
              />
              {registerForm.formState.errors.password && (
                <p className="text-sm mt-1 text-red-500">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={registerForm.formState.isSubmitting}
              className="w-full py-4 rounded-2xl font-bold text-white text-base"
              style={{ background: "var(--purple)" }}
            >
              {registerForm.formState.isSubmitting
                ? "Загрузка..."
                : "Зарегистрироваться"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={loginForm.handleSubmit(onLogin)}
            className="space-y-4"
          >
            <div>
              <input
                {...loginForm.register("email")}
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
                style={{ borderColor: "var(--line)" }}
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm mt-1 text-red-500">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...loginForm.register("password")}
                type="password"
                placeholder="Пароль"
                className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
                style={{ borderColor: "var(--line)" }}
              />
              {loginForm.formState.errors.password && (
                <p className="text-sm mt-1 text-red-500">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loginForm.formState.isSubmitting}
              className="w-full py-4 rounded-2xl font-bold text-white text-base"
              style={{ background: "var(--purple)" }}
            >
              {loginForm.formState.isSubmitting ? "Загрузка..." : "Войти"}
            </button>
          </form>
        )}

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-4 text-sm text-center"
          style={{ color: "var(--muted)" }}
        >
          {isRegister
            ? "Уже есть аккаунт? Войти"
            : "Нет аккаунта? Зарегистрироваться"}
        </button>
      </div>
    </main>
  );
}

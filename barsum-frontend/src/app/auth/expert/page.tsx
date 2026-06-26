"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  name: z.string().min(2, "Введите имя").optional(),
});

type Form = z.infer<typeof schema>;

export default function ExpertAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isRegister, setIsRegister] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      const endpoint = isRegister
        ? "/auth/expert/register"
        : "/auth/expert/login";
      const res = await apiClient.post(endpoint, data);
      const { access_token, user, expert } = res.data;
      setAuth(access_token, "expert", user, expert?.status);
      if (expert?.status === "approved") {
        router.push("/expert/home");
      } else {
        router.push("/expert/onboarding");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Ошибка входа");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl">
        <h1
          className="text-2xl font-extrabold mb-6"
          style={{ color: "var(--ink)" }}
        >
          {isRegister ? "Регистрация" : "Вход"} эксперта
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isRegister && (
            <div>
              <input
                {...register("name")}
                placeholder="Имя"
                className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
                style={{ borderColor: "var(--line)" }}
              />
              {errors.name && (
                <p className="text-sm mt-1 text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>
          )}

          <div>
            <input
              {...register("email")}
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
              style={{ borderColor: "var(--line)" }}
            />
            {errors.email && (
              <p className="text-sm mt-1 text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <input
              {...register("password")}
              type="password"
              placeholder="Пароль"
              className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
              style={{ borderColor: "var(--line)" }}
            />
            {errors.password && (
              <p className="text-sm mt-1 text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl font-bold text-white text-base"
            style={{ background: "var(--ink)" }}
          >
            {isSubmitting
              ? "Загрузка..."
              : isRegister
                ? "Зарегистрироваться"
                : "Войти"}
          </button>
        </form>

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

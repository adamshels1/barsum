"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
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

const BRAND = "#F97316";
const BRAND_DEEP = "#EA580C";

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
      const endpoint = isRegister ? "/auth/expert/register" : "/auth/expert/login";
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
          <Star size={40} color="#fff" strokeWidth={2} fill="white" />
        </div>
        <h1 className="text-3xl font-black text-white">Эксперт</h1>
        <p className="text-white mt-1 text-sm font-semibold" style={{ opacity: 0.85 }}>
          Создавайте задания для детей
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--ink)" }}>
                Ваше имя
              </label>
              <input
                {...register("name")}
                placeholder="Например: Айгерим"
                className="clay-input"
              />
              {errors.name && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--destructive)" }}>
                  {errors.name.message}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--ink)" }}>
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="email@example.com"
              autoComplete="email"
              className="clay-input"
            />
            {errors.email && (
              <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--destructive)" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--ink)" }}>
              Пароль
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder={isRegister ? "Минимум 6 символов" : "Ваш пароль"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="clay-input"
            />
            {errors.password && (
              <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--destructive)" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="clay-btn clay-btn-orange w-full py-4 rounded-2xl text-base mt-2 disabled:opacity-60"
          >
            {isSubmitting
              ? "Загрузка..."
              : isRegister
                ? "Зарегистрироваться"
                : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}

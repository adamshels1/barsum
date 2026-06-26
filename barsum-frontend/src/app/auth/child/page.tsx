"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

const schema = z.object({
  login: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

type Form = z.infer<typeof schema>;

const BRAND = "#10B981";
const BRAND_DEEP = "#059669";

export default function ChildAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      const res = await apiClient.post("/auth/child/login", data);
      const { access_token, child } = res.data;
      setAuth(access_token, "child", child);
      localStorage.setItem("access_token", access_token);
      router.push("/child/home");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Неверный логин или пароль");
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
          <BookOpen size={40} color="#fff" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-black text-white">Привет!</h1>
        <p className="text-white mt-1 text-sm font-semibold" style={{ opacity: 0.85 }}>
          Войди и начни читать 📚
        </p>
      </div>

      {/* Form area */}
      <div
        className="flex-1 rounded-t-[32px] p-6 pt-8 -mt-5 relative"
        style={{ background: "#fff" }}
      >
        <h2
          className="text-xl font-black mb-6"
          style={{ color: "var(--ink)" }}
        >
          Вход для ребёнка
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--ink)" }}>
              Логин
            </label>
            <input
              {...register("login")}
              placeholder="Твой логин"
              autoComplete="username"
              className="clay-input"
            />
            {errors.login && (
              <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--destructive)" }}>
                {errors.login.message}
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
              placeholder="Твой пароль"
              autoComplete="current-password"
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
            className="clay-btn clay-btn-green w-full py-4 rounded-2xl text-base mt-2 disabled:opacity-60"
          >
            {isSubmitting ? "Загрузка..." : "Войти"}
          </button>
        </form>

        <p
          className="text-xs text-center mt-6 font-semibold"
          style={{ color: "var(--muted)" }}
        >
          Логин и пароль выдаёт родитель
        </p>
      </div>
    </main>
  );
}

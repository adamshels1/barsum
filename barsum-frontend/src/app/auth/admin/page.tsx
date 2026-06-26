"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type Form = z.infer<typeof schema>;

export default function AdminAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      const res = await apiClient.post("/auth/admin/login", data);
      const { access_token, user } = res.data;
      setAuth(access_token, "admin", user);
      router.push("/admin");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ошибка входа");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl">
        <div className="text-4xl text-center mb-4">🛡️</div>
        <h1
          className="text-2xl font-extrabold mb-6 text-center"
          style={{ color: "var(--ink)" }}
        >
          Вход администратора
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {isSubmitting ? "Загрузка..." : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}

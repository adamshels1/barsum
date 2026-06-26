"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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

export default function ChildAuthPage() {
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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl">
        <h1
          className="text-2xl font-extrabold mb-6"
          style={{ color: "var(--ink)" }}
        >
          Привет! Войди в Barsum
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register("login")}
              placeholder="Логин"
              className="w-full px-4 py-3 rounded-xl border text-base outline-none"
              style={{ borderColor: "var(--line)" }}
            />
            {errors.login && (
              <p className="text-sm mt-1 text-red-500">
                {errors.login.message}
              </p>
            )}
          </div>

          <div>
            <input
              {...register("password")}
              type="password"
              placeholder="Пароль"
              className="w-full px-4 py-3 rounded-xl border text-base outline-none"
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
            style={{ background: "var(--green)" }}
          >
            {isSubmitting ? "Загрузка..." : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}

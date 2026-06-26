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

const BG = "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)";

export default function ExpertAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isRegister, setIsRegister] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      const endpoint = isRegister ? "/auth/expert/register" : "/auth/expert/login";
      const res = await apiClient.post(endpoint, data);
      const { access_token, user, expert } = res.data;
      setAuth(access_token, "expert", user, expert?.status);
      router.push(expert?.status === "approved" ? "/expert/home" : "/expert/onboarding");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Ошибка входа");
    }
  };

  return (
    <main style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "fixed", top: "-15%", right: "-10%", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.18)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(0,0,0,0.1)", filter: "blur(50px)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, paddingBottom: 32, position: "relative", zIndex: 1 }}>
        <div style={{ width: 72, height: 72, borderRadius: 24, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Star size={32} color="#ffffff" strokeWidth={2} fill="rgba(255,255,255,0.3)" />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", margin: 0 }}>Эксперт</h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, fontWeight: 600, marginTop: 6 }}>
          Создавайте задания для детей
        </p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.28)", borderRadius: "28px 28px 0 0", padding: "32px 24px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", background: "rgba(0,0,0,0.12)", borderRadius: 9999, padding: 4, marginBottom: 24 }}>
          {["Войти", "Регистрация"].map((label, i) => {
            const active = isRegister === (i === 1);
            return (
              <button key={label} onClick={() => setIsRegister(i === 1)} style={{ flex: 1, padding: "10px 0", borderRadius: 9999, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", background: active ? "rgba(255,255,255,0.9)" : "transparent", color: active ? "#c97000" : "rgba(255,255,255,0.65)", transition: "all 0.18s" }}>
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {isRegister && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ваше имя</label>
              <input {...register("name")} placeholder="Например: Айгерим" className="glass-input" />
              {errors.name && <p style={{ color: "#3a1500", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.name.message}</p>}
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
            <input {...register("email")} type="email" placeholder="email@example.com" autoComplete="email" className="glass-input" />
            {errors.email && <p style={{ color: "#3a1500", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.email.message}</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Пароль</label>
            <input {...register("password")} type="password" placeholder={isRegister ? "Минимум 6 символов" : "Ваш пароль"} autoComplete={isRegister ? "new-password" : "current-password"} className="glass-input" />
            {errors.password && <p style={{ color: "#3a1500", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-white" style={{ marginTop: 8, color: "#c97000" }}>
            {isSubmitting ? "Загрузка..." : isRegister ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}

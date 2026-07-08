"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { BackButton } from "@/components/BackButton";
import { useAuthStore } from "@/stores/auth-store";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type Form = z.infer<typeof schema>;

const BG = "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)";

export default function AdminAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
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
    <main style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column" }}>
      <BackButton />
      <div style={{ position: "fixed", top: "-15%", right: "-10%", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.18)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(0,0,0,0.1)", filter: "blur(50px)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, paddingBottom: 32, position: "relative", zIndex: 1 }}>
        <div style={{ width: 72, height: 72, borderRadius: 24, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Shield size={32} color="#ffffff" strokeWidth={2} />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", margin: 0 }}>Администратор</h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, fontWeight: 600, marginTop: 6 }}>
          Панель управления Barsum
        </p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.28)", borderRadius: "28px 28px 0 0", padding: "32px 24px 40px", position: "relative", zIndex: 1 }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
            <input {...register("email")} type="email" placeholder="admin@barsum.kz" autoComplete="email" className="glass-input" />
            {errors.email && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.email.message}</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Пароль</label>
            <input {...register("password")} type="password" placeholder="Ваш пароль" autoComplete="current-password" className="glass-input" />
            {errors.password && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-white" style={{ marginTop: 8, color: "#4776e6" }}>
            {isSubmitting ? "Загрузка..." : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}

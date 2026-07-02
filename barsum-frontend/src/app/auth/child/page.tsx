"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { MascotWave } from "@/components/MascotWave";
import { useAuthStore } from "@/stores/auth-store";

const schema = z.object({
  identifier: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});
type Form = z.infer<typeof schema>;

const BG = "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)";

export default function ChildAuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      const res = await apiClient.post("/auth/login", data);
      const { access_token, role, user, child, expert } = res.data;
      setAuth(access_token, role, user ?? child, expert?.status);
      redirectByRole(role, expert?.status, router);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Неверный логин или пароль");
    }
  };

  return (
    <main style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "fixed", top: "-15%", right: "-10%", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.15)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(0,0,0,0.12)", filter: "blur(50px)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, paddingBottom: 32, position: "relative", zIndex: 1 }}>
        <MascotWave size={140} animate={false} />
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", margin: 0 }}>Привет!</h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, fontWeight: 600, marginTop: 6 }}>
          Войди и начни читать 📚
        </p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.22)", borderRadius: "28px 28px 0 0", padding: "32px 24px 40px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: "0 0 24px" }}>
          Вход для ребёнка
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Логин
            </label>
            <input {...register("identifier")} placeholder="Твой логин" autoComplete="username" className="glass-input" />
            {errors.identifier && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.identifier.message}</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Пароль
            </label>
            <input {...register("password")} type="password" placeholder="Твой пароль" autoComplete="current-password" className="glass-input" />
            {errors.password && <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-white" style={{ marginTop: 8, color: "#4776e6" }}>
            {isSubmitting ? "Загрузка..." : "Войти"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
          Логин и пароль выдаёт родитель
        </p>
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

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { expertsApi } from "@/lib/api/experts";
import { useAuthStore } from "@/stores/auth-store";

const applySchema = z.object({
  specialization: z.string().min(5, "Минимум 5 символов"),
  bio: z.string().min(20, "Расскажи о себе подробнее (мин. 20 символов)"),
});

type ApplyForm = z.infer<typeof applySchema>;

export default function ExpertOnboardingPage() {
  const router = useRouter();
  const { expertStatus, setAuth, user, token, role } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);

  const { data: expertData, refetch, isFetching } = useQuery({
    queryKey: ["expert-me"],
    queryFn: expertsApi.me,
    staleTime: 0,
  });

  const currentStatus = expertData?.status ?? expertStatus;

  useEffect(() => {
    if (currentStatus === "approved") {
      router.replace("/expert/home");
    }
  }, [currentStatus, router]);

  const handleRefresh = async () => {
    const result = await refetch();
    const newStatus = result.data?.status;
    if (newStatus === "approved") {
      if (token && user) {
        setAuth(token, role ?? "expert", user, "approved");
      }
      router.replace("/expert/home");
    } else {
      toast.info("Заявка всё ещё на рассмотрении");
    }
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
  });

  const onSubmit = async (data: ApplyForm) => {
    try {
      await expertsApi.updateMe(data);
      await expertsApi.apply();
      if (token && user) {
        setAuth(token, role ?? "expert", user, "review");
      }
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ошибка подачи заявки");
    }
  };

  const isReview = currentStatus === "review" || submitted;
  const isRejected = currentStatus === "rejected";

  if (currentStatus === "approved") {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.65)" }}>Перенаправление...</p>
      </main>
    );
  }

  if (isReview) {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          <div style={{ width: 96, height: 96, borderRadius: 28, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Clock size={40} color="#ffffff" strokeWidth={1.5} />
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 900, color: "#ffffff" }}>
            Заявка на рассмотрении
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
            Ваша заявка рассматривается, мы свяжемся с вами в течение 1–2 рабочих дней.
          </p>

          <div className="glass" style={{ padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffd200", flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#ffffff" }}>
              Статус: На проверке
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="btn-white"
            style={{ color: "#4776e6" }}
          >
            {isFetching ? "Проверяем..." : "Обновить статус"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <FileText size={28} color="#ffffff" strokeWidth={2} />
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 900, color: "#ffffff" }}>Стать экспертом</h1>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
            Расскажи о себе, чтобы мы могли одобрить твой профиль
          </p>
        </div>

        {isRejected && (
          <div style={{ background: "rgba(220,0,0,0.25)", border: "1px solid rgba(255,100,100,0.3)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#ffaaaa", fontWeight: 600 }}>
            Ваша заявка была отклонена. Можно подать повторно.
          </div>
        )}

        <div style={{ background: "rgba(255,255,255,0.13)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 24, padding: "28px 24px" }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Специализация
              </label>
              <textarea
                {...register("specialization")}
                placeholder="Детский психолог, логопед, педагог..."
                rows={2}
                className="glass-input"
                style={{ resize: "none" }}
              />
              {errors.specialization && (
                <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>
                  {errors.specialization.message}
                </p>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                О себе
              </label>
              <textarea
                {...register("bio")}
                placeholder="Опиши свой опыт, квалификацию, подход к работе с детьми..."
                rows={5}
                className="glass-input"
                style={{ resize: "none" }}
              />
              {errors.bio && (
                <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 6 }}>
                  {errors.bio.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-white"
              style={{ marginTop: 4, color: "#4776e6" }}
            >
              {isSubmitting ? "Отправляем..." : "Подать заявку"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

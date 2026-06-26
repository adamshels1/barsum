"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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

  const {
    data: expertData,
    refetch,
    isFetching,
  } = useQuery({
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplyForm>({
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
      <main className="min-h-screen flex items-center justify-center p-6">
        <p style={{ color: "var(--muted)" }}>Перенаправление...</p>
      </main>
    );
  }

  if (isReview) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "var(--background)" }}
      >
        <div className="w-full max-w-sm text-center">
          <div
            className="mx-auto mb-6 w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{ background: "var(--lav)", boxShadow: "var(--shadow-md)" }}
          >
            ⏳
          </div>
          <h1
            className="text-2xl font-extrabold mb-3"
            style={{ color: "var(--ink)" }}
          >
            Заявка на рассмотрении
          </h1>
          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: "var(--muted)" }}
          >
            Ваша заявка рассматривается, мы свяжемся с вами в течение 1–2
            рабочих дней.
          </p>

          <div
            className="rounded-2xl p-4 mb-6"
            style={{
              background: "var(--white)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "var(--orange)" }}
              />
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--ink)" }}
              >
                Статус: На проверке
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-opacity disabled:opacity-60"
            style={{
              background: "var(--purple)",
              boxShadow: "0 6px 0 var(--purple-deep)",
            }}
          >
            {isFetching ? "Проверяем..." : "Обновить статус"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{
          background: "var(--white)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <div
          className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "var(--lav)" }}
        >
          📝
        </div>
        <h1
          className="text-2xl font-extrabold text-center mb-2"
          style={{ color: "var(--ink)" }}
        >
          Стать экспертом
        </h1>

        {isRejected && (
          <div className="mb-4 p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
            Ваша заявка была отклонена. Можно подать повторно.
          </div>
        )}

        <p
          className="text-sm text-center mb-6"
          style={{ color: "var(--muted)" }}
        >
          Расскажи о себе, чтобы мы могли одобрить твой профиль
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--muted)" }}
            >
              Специализация
            </label>
            <textarea
              {...register("specialization")}
              placeholder="Детский психолог, логопед, педагог..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2 resize-none"
              style={{
                borderColor: "var(--line)",
                background: "var(--soft)",
                color: "var(--ink)",
              }}
            />
            {errors.specialization && (
              <p className="text-xs mt-1 text-red-500">
                {errors.specialization.message}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--muted)" }}
            >
              О себе
            </label>
            <textarea
              {...register("bio")}
              placeholder="Опиши свой опыт, квалификацию, подход к работе с детьми..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2 resize-none"
              style={{
                borderColor: "var(--line)",
                background: "var(--soft)",
                color: "var(--ink)",
              }}
            />
            {errors.bio && (
              <p className="text-xs mt-1 text-red-500">{errors.bio.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-opacity disabled:opacity-60"
            style={{
              background: "var(--purple)",
              boxShadow: "0 6px 0 var(--purple-deep)",
            }}
          >
            {isSubmitting ? "Отправляем..." : "Подать заявку"}
          </button>
        </form>
      </div>
    </main>
  );
}

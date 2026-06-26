"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { childrenApi } from "@/lib/api/children";

const childSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  age: z.coerce.number().min(4).max(16),
  login: z
    .string()
    .min(3, "Минимум 3 символа")
    .regex(/^[a-z0-9_]+$/, "Только a-z, 0-9, _"),
  password: z.string().min(4, "Минимум 4 символа"),
});

type ChildForm = z.infer<typeof childSchema>;

export default function ParentOnboardingPage() {
  const router = useRouter();
  const [created, setCreated] = useState<{
    login: string;
    password: string;
    name: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChildForm>({
    resolver: zodResolver(childSchema),
  });

  const onSubmit = async (data: ChildForm) => {
    try {
      await childrenApi.create(data);
      setCreated({
        login: data.login,
        password: data.password,
        name: data.name,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ошибка создания профиля");
    }
  };

  const copyAll = () => {
    if (!created) return;
    const text = `Логин: ${created.login}\nПароль: ${created.password}`;
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Логин и пароль скопированы"));
  };

  const shareAll = () => {
    if (!created) return;
    const text = `Barsum — данные для входа ребёнка «${created.name}»\nЛогин: ${created.login}\nПароль: ${created.password}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Barsum — вход для ребёнка", text });
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => toast.success("Данные скопированы в буфер обмена"));
    }
  };

  if (created) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1
            className="text-2xl font-extrabold mb-2"
            style={{ color: "var(--ink)" }}
          >
            Профиль создан!
          </h1>
          <p className="mb-6" style={{ color: "var(--muted)" }}>
            Сохрани данные для входа ребёнка
          </p>

          <div
            className="rounded-2xl p-4 mb-4 text-left space-y-3"
            style={{ background: "var(--surface)" }}
          >
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--muted)" }}
              >
                Имя
              </p>
              <p className="font-bold text-lg" style={{ color: "var(--ink)" }}>
                {created.name}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}
                >
                  Логин
                </p>
                <p
                  className="font-bold text-lg font-mono"
                  style={{ color: "var(--purple)" }}
                >
                  {created.login}
                </p>
              </div>
              <button
                onClick={() =>
                  navigator.clipboard
                    .writeText(created.login)
                    .then(() => toast.success("Логин скопирован"))
                }
                className="text-xl"
                title="Скопировать логин"
              >
                📋
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}
                >
                  Пароль
                </p>
                <p
                  className="font-bold text-lg font-mono"
                  style={{ color: "var(--purple)" }}
                >
                  {created.password}
                </p>
              </div>
              <button
                onClick={() =>
                  navigator.clipboard
                    .writeText(created.password)
                    .then(() => toast.success("Пароль скопирован"))
                }
                className="text-xl"
                title="Скопировать пароль"
              >
                📋
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={copyAll}
              className="flex-1 py-3 rounded-2xl font-bold border-2 text-sm"
              style={{
                borderColor: "var(--purple)",
                color: "var(--purple)",
                background: "transparent",
              }}
            >
              📋 Копировать
            </button>
            <button
              onClick={shareAll}
              className="flex-1 py-3 rounded-2xl font-bold border-2 text-sm"
              style={{
                borderColor: "var(--purple)",
                color: "var(--purple)",
                background: "transparent",
              }}
            >
              🔗 Поделиться
            </button>
          </div>

          <button
            onClick={() => router.push("/parent/cabinet")}
            className="w-full py-4 rounded-2xl font-bold text-white"
            style={{ background: "var(--purple)" }}
          >
            В кабинет →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl">
        <div className="text-4xl mb-4 text-center">👶</div>
        <h1
          className="text-2xl font-extrabold mb-2 text-center"
          style={{ color: "var(--ink)" }}
        >
          Добавь ребёнка
        </h1>
        <p
          className="text-sm text-center mb-6"
          style={{ color: "var(--muted)" }}
        >
          Создай профиль, чтобы начать
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register("name")}
              placeholder="Имя ребёнка"
              className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
              style={{ borderColor: "var(--line)" }}
            />
            {errors.name && (
              <p className="text-sm mt-1 text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("age")}
              type="number"
              placeholder="Возраст"
              min={4}
              max={16}
              className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
              style={{ borderColor: "var(--line)" }}
            />
            {errors.age && (
              <p className="text-sm mt-1 text-red-500">{errors.age.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("login")}
              placeholder="Логин (a-z, 0-9, _)"
              className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
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
              placeholder="Пароль для ребёнка"
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
            style={{ background: "var(--purple)" }}
          >
            {isSubmitting ? "Создаём..." : "Создать профиль"}
          </button>
        </form>
      </div>
    </main>
  );
}

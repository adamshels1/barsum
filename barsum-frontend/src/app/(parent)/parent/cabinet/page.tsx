"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { childrenApi } from "@/lib/api/children";
import { coinsApi } from "@/lib/api/coins";
import { useAuthStore } from "@/stores/auth-store";

const childSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  age: z.coerce.number().min(4).max(16),
  login: z
    .string()
    .min(3)
    .regex(/^[a-z0-9_]+$/, "Только a-z, 0-9, _"),
  password: z.string().min(4, "Минимум 4 символа"),
});

type ChildForm = z.infer<typeof childSchema>;

export default function ParentCabinetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [showModal, setShowModal] = useState(false);
  const [newCreds, setNewCreds] = useState<{
    login: string;
    password: string;
    name: string;
  } | null>(null);

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children"],
    queryFn: childrenApi.list,
  });

  const { data: balance } = useQuery({
    queryKey: ["parent-balance"],
    queryFn: coinsApi.parentBalance,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChildForm>({
    resolver: zodResolver(childSchema),
  });

  const createMutation = useMutation({
    mutationFn: childrenApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      setNewCreds({
        login: variables.login,
        password: variables.password,
        name: variables.name,
      });
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Ошибка создания профиля");
    },
  });

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-extrabold"
            style={{ color: "var(--ink)" }}
          >
            Привет, {user?.name || "Родитель"} 👋
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Семейный кабинет
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-2 rounded-xl"
          style={{ color: "var(--muted)", background: "var(--surface)" }}
        >
          Выйти
        </button>
      </div>

      {/* Balance card */}
      <div
        className="rounded-3xl p-5 mb-6 text-white"
        style={{ background: "var(--purple)" }}
      >
        <p className="text-sm opacity-80 mb-1">Баланс монет</p>
        <p className="text-3xl font-extrabold">{balance?.balance ?? "—"} 🪙</p>
        <p className="text-xs opacity-70 mt-1">1 ₸ = 10 монет</p>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "📚 Каталог", href: "/parent/home" },
          { label: "🎁 Награды", href: "/parent/rewards" },
        ].map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="py-4 rounded-2xl font-semibold text-sm"
            style={{ background: "var(--surface)", color: "var(--ink)" }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Children section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
          Дети
        </h2>
        <button
          onClick={() => {
            setShowModal(true);
            setNewCreds(null);
          }}
          className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
          style={{ background: "var(--purple)" }}
        >
          + Добавить
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Загрузка...
        </p>
      ) : children.length === 0 ? (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "var(--surface)" }}
        >
          <p className="text-4xl mb-2">👶</p>
          <p style={{ color: "var(--muted)" }}>Ещё нет детей</p>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map((child: any) => (
            <button
              key={child.id}
              onClick={() => router.push(`/parent/child/${child.id}`)}
              className="w-full rounded-2xl p-4 flex items-center gap-4 text-left"
              style={{ background: "var(--surface)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: "var(--purple)", color: "#fff" }}
              >
                {child.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-bold" style={{ color: "var(--ink)" }}>
                  {child.name}
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {child.age} лет · 🔥 {child.streak} дней
                </p>
              </div>
              <span style={{ color: "var(--muted)" }}>›</span>
            </button>
          ))}
        </div>
      )}

      {/* Add child modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setNewCreds(null);
            }
          }}
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6">
            {newCreds ? (
              <div className="text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3
                  className="text-xl font-extrabold mb-2"
                  style={{ color: "var(--ink)" }}
                >
                  Профиль создан!
                </h3>
                <div
                  className="rounded-2xl p-4 mb-4 text-left space-y-2"
                  style={{ background: "var(--surface)" }}
                >
                  <div>
                    <p
                      className="text-xs font-semibold uppercase"
                      style={{ color: "var(--muted)" }}
                    >
                      Имя
                    </p>
                    <p className="font-bold" style={{ color: "var(--ink)" }}>
                      {newCreds.name}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase"
                      style={{ color: "var(--muted)" }}
                    >
                      Логин
                    </p>
                    <p
                      className="font-bold font-mono"
                      style={{ color: "var(--purple)" }}
                    >
                      {newCreds.login}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase"
                      style={{ color: "var(--muted)" }}
                    >
                      Пароль
                    </p>
                    <p
                      className="font-bold font-mono"
                      style={{ color: "var(--purple)" }}
                    >
                      {newCreds.password}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewCreds(null);
                  }}
                  className="w-full py-3 rounded-2xl font-bold text-white"
                  style={{ background: "var(--purple)" }}
                >
                  Готово
                </button>
              </div>
            ) : (
              <>
                <h3
                  className="text-xl font-extrabold mb-4"
                  style={{ color: "var(--ink)" }}
                >
                  Новый ребёнок
                </h3>
                <form
                  onSubmit={handleSubmit((d) => createMutation.mutate(d))}
                  className="space-y-3"
                >
                  {[
                    { name: "name", placeholder: "Имя", type: "text" },
                    { name: "age", placeholder: "Возраст", type: "number" },
                    { name: "login", placeholder: "Логин", type: "text" },
                    {
                      name: "password",
                      placeholder: "Пароль",
                      type: "password",
                    },
                  ].map((f) => (
                    <div key={f.name}>
                      <input
                        {...register(f.name as keyof ChildForm)}
                        placeholder={f.placeholder}
                        type={f.type}
                        className="w-full px-4 py-3 rounded-xl border text-base outline-none"
                        style={{ borderColor: "var(--line)" }}
                      />
                      {errors[f.name as keyof ChildForm] && (
                        <p className="text-xs mt-1 text-red-500">
                          {errors[f.name as keyof ChildForm]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={isSubmitting || createMutation.isPending}
                    className="w-full py-3 rounded-2xl font-bold text-white"
                    style={{ background: "var(--purple)" }}
                  >
                    {createMutation.isPending ? "Создаём..." : "Создать"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

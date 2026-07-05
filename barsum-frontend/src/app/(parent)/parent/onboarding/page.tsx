"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Baby, ClipboardCopy, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { childrenApi } from "@/lib/api/children";

const childSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  age: z.coerce.number().min(4).max(16),
  login: z.string().min(3, "Минимум 3 символа").regex(/^[a-z0-9_]+$/, "Только a-z, 0-9, _"),
  password: z.string().min(4, "Минимум 4 символа"),
});

type ChildForm = z.infer<typeof childSchema>;

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 20,
};

export default function ParentOnboardingPage() {
  const router = useRouter();
  const [created, setCreated] = useState<{ login: string; password: string; name: string } | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChildForm>({
    resolver: zodResolver(childSchema),
  });

  const onSubmit = async (data: ChildForm) => {
    try {
      await childrenApi.create(data);
      setCreated({ login: data.login, password: data.password, name: data.name });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ошибка создания профиля");
    }
  };

  const copyAll = () => {
    if (!created) return;
    const text = `Логин: ${created.login}\nПароль: ${created.password}\nСайт: https://barsum.app`;
    navigator.clipboard.writeText(text).then(() => toast.success("Логин и пароль скопированы"));
  };

  const shareAll = () => {
    if (!created) return;
    const text = `Barsum — данные для входа ребёнка «${created.name}»\nЛогин: ${created.login}\nПароль: ${created.password}\nСайт: https://barsum.app`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Barsum — вход для ребёнка", text });
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success("Данные скопированы в буфер обмена"));
    }
  };

  if (created) {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 900, color: "#ffffff" }}>Профиль создан!</h1>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>Сохрани данные для входа ребёнка</p>
          </div>

          <div style={{ ...GLASS, padding: "20px 20px", marginBottom: 12 }}>
            {[
              { label: "Имя", value: created.name, mono: false, copyKey: null as string | null },
              { label: "Логин", value: created.login, mono: true, copyKey: created.login as string | null },
              { label: "Пароль", value: created.password, mono: true, copyKey: created.password as string | null },
            ].map(({ label, value, mono, copyKey }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{label}</p>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#ffffff", fontFamily: mono ? "monospace" : "inherit" }}>{value}</p>
                </div>
                {copyKey && (
                  <button
                    onClick={() => navigator.clipboard.writeText(copyKey).then(() => toast.success(`${label} скопирован`))}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}
                  >
                    <ClipboardCopy size={16} color="rgba(255,255,255,0.8)" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button
              onClick={copyAll}
              style={{ flex: 1, ...GLASS, padding: "13px 0", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <ClipboardCopy size={15} />
              Копировать
            </button>
            <button
              onClick={shareAll}
              style={{ flex: 1, ...GLASS, padding: "13px 0", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Share2 size={15} />
              Поделиться
            </button>
          </div>

          <button onClick={() => router.push("/parent/cabinet")} className="btn-white" style={{ color: "#4776e6" }}>
            В кабинет →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Baby size={32} color="#ffffff" strokeWidth={2} />
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900, color: "#ffffff" }}>Добавь ребёнка</h1>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>Создай профиль, чтобы начать</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 24, padding: "28px 24px" }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { name: "name", placeholder: "Имя ребёнка", type: "text" },
              { name: "age", placeholder: "Возраст", type: "number" },
              { name: "login", placeholder: "Логин (a-z, 0-9, _)", type: "text" },
              { name: "password", placeholder: "Пароль для ребёнка", type: "password" },
            ].map((f) => (
              <div key={f.name}>
                <input
                  {...register(f.name as keyof ChildForm)}
                  placeholder={f.placeholder}
                  type={f.type}
                  className="glass-input"
                  {...(f.name === "age" ? { min: 4, max: 16 } : {})}
                />
                {errors[f.name as keyof ChildForm] && (
                  <p style={{ color: "#ffd6d6", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                    {errors[f.name as keyof ChildForm]?.message}
                  </p>
                )}
              </div>
            ))}
            <button type="submit" disabled={isSubmitting} className="btn-white" style={{ marginTop: 4, color: "#4776e6" }}>
              {isSubmitting ? "Создаём..." : "Создать профиль"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

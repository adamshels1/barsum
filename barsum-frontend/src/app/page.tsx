import Link from "next/link";
import { BookOpen, Users, Star } from "lucide-react";

const roles = [
  {
    href: "/auth/parent",
    label: "Я родитель",
    desc: "Покупаю курсы и слежу за прогрессом ребёнка",
    Icon: Users,
    bg: "#7B61FF",
    shadow: "#5B41DF",
  },
  {
    href: "/auth/child",
    label: "Я ребёнок",
    desc: "Читаю книги и зарабатываю монеты",
    Icon: BookOpen,
    bg: "#10B981",
    shadow: "#059669",
  },
  {
    href: "/auth/expert",
    label: "Я эксперт",
    desc: "Создаю образовательные задания",
    Icon: Star,
    bg: "#F97316",
    shadow: "#EA580C",
  },
];

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--background)" }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-5"
          style={{
            background: "var(--purple)",
            boxShadow: "0 6px 0 var(--purple-deep), 0 10px 32px rgba(123,97,255,0.35)",
          }}
        >
          <BookOpen size={44} color="#fff" strokeWidth={2.5} />
        </div>
        <h1
          className="text-5xl font-black tracking-tight leading-none"
          style={{ color: "var(--ink)" }}
        >
          Barsum
        </h1>
        <p
          className="text-base mt-2.5 font-semibold"
          style={{ color: "var(--muted)" }}
        >
          Читай книги — исполняй мечты ✨
        </p>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        {roles.map((role) => {
          const { Icon } = role;
          return (
            <Link
              key={role.href}
              href={role.href}
              className="flex items-center gap-4 p-5 rounded-3xl transition-transform active:scale-[0.97] active:translate-y-1 cursor-pointer"
              style={{
                background: role.bg,
                boxShadow: `0 5px 0 ${role.shadow}, 0 10px 28px ${role.shadow}55`,
              }}
            >
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.22)" }}
              >
                <Icon size={28} color="#fff" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-white leading-tight">
                  {role.label}
                </p>
                <p className="text-sm text-white mt-0.5" style={{ opacity: 0.82 }}>
                  {role.desc}
                </p>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.7, flexShrink: 0 }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          );
        })}
      </div>

      <p
        className="mt-10 text-xs text-center font-semibold"
        style={{ color: "var(--muted)" }}
      >
        Образовательная платформа для детей Казахстана 🇰🇿
      </p>
    </main>
  );
}

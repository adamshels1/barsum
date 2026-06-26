import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-extrabold" style={{ color: "var(--ink)" }}>
          Barsum
        </h1>
        <p className="text-lg" style={{ color: "var(--muted)" }}>
          Образовательная платформа для детей
        </p>
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/auth/parent"
            className="w-full max-w-xs px-6 py-4 rounded-2xl font-bold text-white text-center"
            style={{ background: "var(--purple)" }}
          >
            Войти как родитель
          </Link>
          <Link
            href="/auth/child"
            className="w-full max-w-xs px-6 py-4 rounded-2xl font-bold text-white text-center"
            style={{ background: "var(--green)" }}
          >
            Войти как ребёнок
          </Link>
          <Link
            href="/auth/expert"
            className="w-full max-w-xs px-6 py-4 rounded-2xl font-bold text-white text-center"
            style={{ background: "var(--ink)" }}
          >
            Войти как эксперт
          </Link>
        </div>
      </div>
    </main>
  );
}

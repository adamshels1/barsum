"use client";

import { BookOpen, Star, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const ROLES = [
  {
    key: "child",
    label: "Ребёнок",
    sub: "Читай книги, зарабатывай монеты",
    Icon: BookOpen,
    gradient: "linear-gradient(135deg, #11998e, #38ef7d)",
    href: "/auth/child",
  },
  {
    key: "parent",
    label: "Родитель",
    sub: "Мотивируй своего ребёнка",
    Icon: Users,
    gradient: "linear-gradient(135deg, #4776e6, #8e54e9)",
    href: "/auth/parent",
  },
  {
    key: "expert",
    label: "Эксперт",
    sub: "Создавай задания для детей",
    Icon: Star,
    gradient: "linear-gradient(135deg, #fc4a1a, #f7b733)",
    href: "/auth/expert",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 20px",
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: "fixed", top: "-20%", left: "-10%", width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.15)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-15%", right: "-10%", width: 280, height: 280, borderRadius: "50%", background: "rgba(0,0,0,0.15)", filter: "blur(70px)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 52, position: "relative", zIndex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot.png"
          alt="Barsum"
          width={200}
          height={200}
          style={{ objectFit: "contain", mixBlendMode: "screen", display: "block", margin: "0 auto" }}
        />
        <h1 style={{ fontSize: 40, fontWeight: 900, color: "#ffffff", lineHeight: 1, letterSpacing: "0.04em", margin: 0 }}>
          BARSUM
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Читай · Зарабатывай · Мечтай
        </p>
      </div>

      {/* Role cards */}
      <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}>
        {ROLES.map(({ key, label, sub, Icon, gradient, href }) => (
          <button
            key={key}
            onClick={() => router.push(href)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px 20px",
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.13)",
              borderRadius: 20,
              textAlign: "left",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              }}
            >
              <Icon size={24} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#ffffff", fontWeight: 800, fontSize: 17, margin: 0 }}>{label}</p>
              <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 13, fontWeight: 500, margin: "3px 0 0" }}>{sub}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>

      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, marginTop: 40, fontWeight: 600, position: "relative", zIndex: 1 }}>
        Образовательная платформа · Казахстан
      </p>
    </main>
  );
}

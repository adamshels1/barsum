"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { enablePush, isPushSubscribed, pushSupported } from "@/lib/push-client";
import { pushApi } from "@/lib/api/push";

const DISMISS_KEY = "barsum-push-dismissed";

export function PushEnable() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return;
      if (Notification.permission === "denied") return; // уже запретил в браузере
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
      if (Notification.permission === "granted" && (await isPushSubscribed())) return; // уже включено
      setShow(true);
    })();
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  const enable = async () => {
    setBusy(true);
    try {
      const ok = await enablePush();
      if (ok) {
        toast.success("Уведомления включены 🔔");
        setShow(false);
        localStorage.setItem(DISMISS_KEY, "1");
        // Сразу шлём приветственный пуш — подтверждение, что всё работает.
        pushApi.test().catch(() => {});
      } else {
        toast.error("Разрешение не выдано");
      }
    } catch {
      toast.error("Не удалось включить уведомления");
    } finally {
      setBusy(false);
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 100, // над нижним меню
        zIndex: 45,
        margin: "0 auto",
        maxWidth: 480,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 20,
        background: "rgba(255,255,255,0.16)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.28)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.28)",
      }}
    >
      <div style={{ fontSize: 26, flexShrink: 0 }}>🔔</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: "#ffffff" }}>
          Включить уведомления
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.35 }}>
          Узнавайте сразу, когда ребёнок просит награду или заканчивает чтение
        </p>
      </div>
      <button
        onClick={enable}
        disabled={busy}
        style={{
          flexShrink: 0,
          padding: "9px 16px",
          borderRadius: 9999,
          border: "none",
          background: "#ffffff",
          color: "#4776e6",
          fontWeight: 900,
          fontSize: 13,
          cursor: busy ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "…" : "Включить"}
      </button>
      <button
        onClick={dismiss}
        aria-label="Закрыть"
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: 9999,
          border: "none",
          background: "rgba(255,255,255,0.16)",
          color: "#ffffff",
          fontSize: 16,
          cursor: "pointer",
          fontFamily: "inherit",
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

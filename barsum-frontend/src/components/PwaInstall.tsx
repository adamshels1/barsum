"use client";

import { useEffect, useState } from "react";

// Событие beforeinstallprompt (нестандартный тип — объявляем минимально).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "barsum-pwa-dismissed";

export function PwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // 1) Регистрируем service worker.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Уже установлено (открыто как приложение) — ничего не показываем.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Пользователь уже закрывал баннер — не надоедаем.
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    // 2) Android/Chrome — ловим предложение установки.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const onInstalled = () => {
      setHidden(true);
      setDeferred(null);
      localStorage.setItem(DISMISS_KEY, "1");
    };
    window.addEventListener("appinstalled", onInstalled);

    // 3) iOS Safari — своего события нет, показываем подсказку.
    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (isIos && isSafari) {
      setShowIosHint(true);
      setHidden(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
    setHidden(true);
  };

  if (hidden || (!deferred && !showIosHint)) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 3000,
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-192.png"
        alt="Barsum"
        style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: "#ffffff" }}>
          Установить Barsum
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.35 }}>
          {showIosHint
            ? "Нажмите «Поделиться» ⬆️ → «На экран «Домой»»"
            : "Приложение на главном экране — открывается как обычная программа"}
        </p>
      </div>
      {deferred && (
        <button
          onClick={install}
          style={{
            flexShrink: 0,
            padding: "9px 16px",
            borderRadius: 9999,
            border: "none",
            background: "#ffffff",
            color: "#4776e6",
            fontWeight: 900,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Установить
        </button>
      )}
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

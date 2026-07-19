"use client";

import { useEffect, useRef } from "react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

// Скользящая сессия: при каждом открытии/возврате в приложение молча меняем
// ещё валидный токен на свежий (полный срок жизни). Пока пользователь заходит
// хотя бы раз в 90 дней — перелогин не понадобится. Протухший токен рефрешем
// не спасти: интерсептор клиента получит 401 и отправит на форму входа.
const REFRESH_MIN_INTERVAL_MS = 60 * 60 * 1000; // не чаще раза в час

export function SessionRefresher() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const lastRefresh = useRef(0);

  useEffect(() => {
    if (!token) return;

    const refresh = () => {
      const now = Date.now();
      if (now - lastRefresh.current < REFRESH_MIN_INTERVAL_MS) return;
      lastRefresh.current = now;
      authApi
        .refresh()
        .then((res) => {
          if (res?.access_token) setToken(res.access_token);
        })
        // Сетевые сбои игнорируем; 401 обработает интерсептор apiClient.
        .catch(() => undefined);
    };

    refresh();

    // Возврат в свёрнутую PWA не перемонтирует приложение — ловим visibilitychange.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [token, setToken]);

  return null;
}

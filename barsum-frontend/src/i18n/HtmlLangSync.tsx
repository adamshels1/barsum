"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/stores/locale-store";

/**
 * Синхронизирует атрибут <html lang> с выбранным языком.
 * SSR отдаёт lang="ru", после гидрации выставляем актуальный.
 */
export function HtmlLangSync() {
  const locale = useLocaleStore((s) => s.locale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

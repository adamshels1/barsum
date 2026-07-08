"use client";

import { useLocaleStore, type Locale } from "@/stores/locale-store";

/**
 * Локальный словарь страницы/компонента.
 * Формат: { ru: { key: "текст" }, kk: { key: "мәтін" } }.
 * Переводы держим рядом с компонентом — так их проще поддерживать
 * и не возникает конфликтов в общем файле.
 */
export type Dict = Record<Locale, Record<string, string>>;

/**
 * Хук перевода. Принимает локальный словарь и возвращает функцию t().
 *
 *   const t = useT(dict);
 *   t("title")                    // строка на текущем языке
 *   t("saved", { n: 250 })        // подстановка {n} → 250
 *
 * Если ключа нет в текущем языке — откатываемся на русский, затем на сам ключ.
 */
export function useT<D extends Dict>(dict: D) {
  const locale = useLocaleStore((s) => s.locale);
  return (
    key: keyof D["ru"] & string,
    vars?: Record<string, string | number>
  ): string => {
    const table = dict[locale] ?? dict.ru;
    let str = table[key] ?? dict.ru[key] ?? key;
    if (vars) {
      for (const k of Object.keys(vars)) {
        str = str.split(`{${k}}`).join(String(vars[k]));
      }
    }
    return str;
  };
}

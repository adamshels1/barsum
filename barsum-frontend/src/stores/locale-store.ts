import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "ru" | "kk";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: "ru",
      setLocale: (locale) => {
        if (typeof document !== "undefined") {
          document.documentElement.lang = locale;
        }
        set({ locale });
      },
      toggleLocale: () => get().setLocale(get().locale === "ru" ? "kk" : "ru"),
    }),
    { name: "barsum-locale" }
  )
);

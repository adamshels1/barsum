import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "parent" | "child" | "expert" | "admin" | null;

interface AuthState {
  token: string | null;
  role: Role;
  user: any | null;
  expertStatus: string | null;
  setAuth: (
    token: string,
    role: Role,
    user: any,
    expertStatus?: string
  ) => void;
  // Тихая замена токена (скользящая сессия): роль и пользователь не меняются.
  setToken: (token: string) => void;
  clearAuth: () => void;
}

// Токен живёт 90 дней (JWT_EXPIRES_IN на бэке) — cookie столько же.
const TOKEN_MAX_AGE = 90 * 24 * 3600;

function persistToken(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `barsum_token=${token}; path=/; max-age=${TOKEN_MAX_AGE}`;
  }
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      user: null,
      expertStatus: null,
      setAuth: (token, role, user, expertStatus) => {
        persistToken(token);
        set({ token, role, user, expertStatus: expertStatus ?? null });
      },
      setToken: (token) => {
        persistToken(token);
        set({ token });
      },
      clearAuth: () => {
        if (typeof document !== "undefined") {
          document.cookie = "barsum_token=; path=/; max-age=0";
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
        }
        set({ token: null, role: null, user: null, expertStatus: null });
      },
    }),
    { name: "barsum-auth" }
  )
);

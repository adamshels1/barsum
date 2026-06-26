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
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      user: null,
      expertStatus: null,
      setAuth: (token, role, user, expertStatus) => {
        if (typeof document !== "undefined") {
          document.cookie = `barsum_token=${token}; path=/; max-age=${7 * 24 * 3600}`;
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
        }
        set({ token, role, user, expertStatus: expertStatus ?? null });
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

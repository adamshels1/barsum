import { useAuthStore } from "@/stores/auth-store";

export const useCurrentUser = () => useAuthStore((s) => s.user);

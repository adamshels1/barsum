import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3012",
  // ngrok-skip-browser-warning отключает межстраничный интерстишл ngrok,
  // который иначе перехватывает XHR-запросы из настоящего браузера и ломает CORS.
  headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("barsum_token="))
        ?.split("=")[1] ?? localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// При протухшем токене отправляем сразу на форму входа своей роли,
// а не на лендинг — меньше шагов до повторного входа.
const LOGIN_BY_ROLE: Record<string, string> = {
  parent: "/auth/parent",
  child: "/auth/child",
  expert: "/auth/expert",
  admin: "/auth/admin",
};

function loginPathForStoredRole(): string {
  try {
    const raw = localStorage.getItem("barsum-auth");
    const role = raw ? JSON.parse(raw)?.state?.role : null;
    return LOGIN_BY_ROLE[role] ?? "/";
  } catch {
    return "/";
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRoute && typeof window !== "undefined") {
      const loginPath = loginPathForStoredRole();
      document.cookie = "barsum_token=; path=/; max-age=0";
      localStorage.removeItem("access_token");
      window.location.href = loginPath;
    }
    return Promise.reject(error);
  }
);

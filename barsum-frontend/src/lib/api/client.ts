import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3012",
  headers: { "Content-Type": "application/json" },
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRoute && typeof window !== "undefined") {
      document.cookie = "barsum_token=; path=/; max-age=0";
      localStorage.removeItem("access_token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

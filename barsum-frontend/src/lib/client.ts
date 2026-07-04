import axios from "axios";
import Cookies from "js-cookie";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3012",
  // ngrok-skip-browser-warning отключает межстраничный интерстишл ngrok,
  // который иначе перехватывает XHR-запросы из настоящего браузера и ломает CORS.
  headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("barsum_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRoute) {
      Cookies.remove("barsum_token");
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

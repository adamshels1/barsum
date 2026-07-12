import { apiClient } from "../client";

export const expertsApi = {
  me: () => apiClient.get("/experts/me").then((r) => r.data),
  updateMe: (data: { specialization?: string; bio?: string; whatsapp?: string }) =>
    apiClient.patch("/experts/me", data).then((r) => r.data),
  apply: () => apiClient.post("/experts/apply").then((r) => r.data),
  stats: () => apiClient.get("/experts/me/stats").then((r) => r.data),
};

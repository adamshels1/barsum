import { apiClient } from "../client";

export const adminApi = {
  stats: () => apiClient.get("/admin/stats").then((r) => r.data),
  readersRating: () =>
    apiClient.get("/admin/readers-rating").then((r) => r.data),
  payments: (status?: string) =>
    apiClient
      .get("/admin/payments", { params: { status } })
      .then((r) => r.data),
  confirmPayment: (id: string) =>
    apiClient.post(`/admin/payments/${id}/confirm`).then((r) => r.data),
  rejectPayment: (id: string, adminNote: string) =>
    apiClient
      .post(`/admin/payments/${id}/reject`, { adminNote })
      .then((r) => r.data),
  experts: (status?: string) =>
    apiClient.get("/admin/experts", { params: { status } }).then((r) => r.data),
  approveExpert: (id: string) =>
    apiClient.post(`/experts/${id}/approve`).then((r) => r.data),
  rejectExpert: (id: string, reason: string) =>
    apiClient.post(`/experts/${id}/reject`, { reason }).then((r) => r.data),
  challenges: (status?: string) =>
    apiClient
      .get("/admin/challenges", { params: { status } })
      .then((r) => r.data),
};

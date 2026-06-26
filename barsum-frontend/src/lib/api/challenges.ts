import { apiClient } from "../client";

export const challengesApi = {
  list: (params?: { category?: string; age?: number }) =>
    apiClient.get("/challenges", { params }).then((r) => r.data),
  my: () => apiClient.get("/challenges/my").then((r) => r.data),
  get: (id: string) => apiClient.get(`/challenges/${id}`).then((r) => r.data),
  create: (data: unknown) =>
    apiClient.post("/challenges", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    apiClient.patch(`/challenges/${id}`, data).then((r) => r.data),
  submit: (id: string) =>
    apiClient.post(`/challenges/${id}/submit`).then((r) => r.data),
  approve: (id: string) =>
    apiClient.post(`/challenges/${id}/approve`).then((r) => r.data),
  reject: (id: string, reason: string) =>
    apiClient.post(`/challenges/${id}/reject`, { reason }).then((r) => r.data),
};

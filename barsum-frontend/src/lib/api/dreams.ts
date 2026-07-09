import { apiClient } from "../client";

export const dreamsApi = {
  my: () => apiClient.get("/dreams/my").then((r) => r.data),
  myAll: () => apiClient.get("/dreams/my/all").then((r) => r.data),
  create: (data: { name: string }) =>
    apiClient.post("/dreams", data).then((r) => r.data),
  update: (id: string, data: { name?: string; targetCoins?: number }) =>
    apiClient.patch(`/dreams/${id}`, data).then((r) => r.data),
  send: (amount: number, dreamId?: string) =>
    apiClient.post("/dreams/send", { amount, dreamId }).then((r) => r.data),
  uploadPhoto: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("photo", file);
    return apiClient.post(`/dreams/${id}/photo`, fd).then((r) => r.data);
  },
  parentPending: () => apiClient.get("/dreams/parent/pending").then((r) => r.data),
  parentCompleted: () => apiClient.get("/dreams/parent/completed").then((r) => r.data),
  parentChild: (childId: string) =>
    apiClient.get(`/dreams/parent/child/${childId}`).then((r) => r.data),
  approve: (id: string, targetCoins: number) =>
    apiClient.post(`/dreams/${id}/approve`, { targetCoins }).then((r) => r.data),
  reject: (id: string, reason: string) =>
    apiClient.post(`/dreams/${id}/reject`, { reason }).then((r) => r.data),
  fulfill: (id: string) =>
    apiClient.post(`/dreams/${id}/fulfill`).then((r) => r.data),
};

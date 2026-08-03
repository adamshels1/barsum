import { apiClient } from "../client";

export const childrenApi = {
  list: () => apiClient.get("/children").then((r) => r.data),
  get: (id: string) => apiClient.get(`/children/${id}`).then((r) => r.data),
  getStats: (id: string) =>
    apiClient.get(`/children/${id}/stats`).then((r) => r.data),
  create: (data: {
    name: string;
    age: number;
    login: string;
    password: string;
  }) => apiClient.post("/children", data).then((r) => r.data),
  update: (
    id: string,
    data: Partial<{ name: string; age: number; login: string; password: string }>
  ) => apiClient.patch(`/children/${id}`, data).then((r) => r.data),
  // Ребёнку показали и он ответил на вопрос «на что копишь?».
  markDreamPrompted: () =>
    apiClient.post("/children/me/dream-prompted").then((r) => r.data),
  // Пригласительная ссылка для входа ребёнка одним тапом.
  inviteLink: (id: string): Promise<{ token: string; expiresAt: string }> =>
    apiClient.get(`/children/${id}/invite-link`).then((r) => r.data),
  regenerateInviteLink: (id: string): Promise<{ token: string; expiresAt: string }> =>
    apiClient.post(`/children/${id}/invite-link/regenerate`).then((r) => r.data),
  // Ребёнок отмечает, что прошёл (или пропустил) онбординг.
  markOnboarded: () =>
    apiClient.post("/children/me/onboarded").then((r) => r.data),
  uploadPhoto: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("photo", file);
    return apiClient.post(`/children/${id}/photo`, fd).then((r) => r.data);
  },
};

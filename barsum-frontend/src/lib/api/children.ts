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
    data: Partial<{ name: string; age: number; password: string }>
  ) => apiClient.patch(`/children/${id}`, data).then((r) => r.data),
};

import { apiClient } from "../client";

export const authApi = {
  registerParent: (data: { email: string; password: string; name: string }) =>
    apiClient.post("/auth/parent/register", data).then((r) => r.data),

  loginParent: (data: { email: string; password: string }) =>
    apiClient.post("/auth/parent/login", data).then((r) => r.data),

  loginChild: (data: { login: string; password: string }) =>
    apiClient.post("/auth/child/login", data).then((r) => r.data),

  registerExpert: (data: { email: string; password: string; name: string }) =>
    apiClient.post("/auth/expert/register", data).then((r) => r.data),

  loginExpert: (data: { email: string; password: string }) =>
    apiClient.post("/auth/expert/login", data).then((r) => r.data),

  loginAdmin: (data: { email: string; password: string }) =>
    apiClient.post("/auth/admin/login", data).then((r) => r.data),
};

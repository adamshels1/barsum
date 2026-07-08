import { apiClient } from "../client";

export const rewardsApi = {
  list: () => apiClient.get("/rewards").then((r) => r.data),
  listForChild: () => apiClient.get("/rewards/for-child").then((r) => r.data),
  create: (data: { name: string; cost: number; type: string; photoUrl?: string }) =>
    apiClient.post("/rewards", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    apiClient.patch(`/rewards/${id}`, data).then((r) => r.data),
  deactivate: (id: string) =>
    apiClient.delete(`/rewards/${id}`).then((r) => r.data),
  uploadPhoto: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("photo", file);
    return apiClient.post(`/rewards/${id}/photo`, fd).then((r) => r.data);
  },
  request: (id: string) =>
    apiClient.post(`/rewards/${id}/request`).then((r) => r.data),
  listRequests: () => apiClient.get("/reward-requests").then((r) => r.data),
  listMyRequests: () => apiClient.get("/reward-requests/my").then((r) => r.data),
  deliver: (requestId: string) =>
    apiClient.post(`/reward-requests/${requestId}/deliver`).then((r) => r.data),
  reject: (requestId: string) =>
    apiClient.post(`/reward-requests/${requestId}/reject`).then((r) => r.data),
};

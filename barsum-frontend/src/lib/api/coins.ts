import { apiClient } from "../client";

export const coinsApi = {
  parentBalance: () =>
    apiClient.get("/coins/parent-balance").then((r) => r.data),
  childBalance: (childId: string) =>
    apiClient.get(`/coins/child-balance/${childId}`).then((r) => r.data),
  transactions: () => apiClient.get("/coins/transactions").then((r) => r.data),
};

import { apiClient } from "../client";

export const bookRequestsApi = {
  // Ребёнок просит родителя купить книгу из каталога.
  request: (challengeId: string) =>
    apiClient.post("/book-requests", { challengeId }).then((r) => r.data),
  my: () => apiClient.get("/book-requests/my").then((r) => r.data),
  list: () => apiClient.get("/book-requests").then((r) => r.data),
  reject: (id: string) =>
    apiClient.post(`/book-requests/${id}/reject`).then((r) => r.data),
};

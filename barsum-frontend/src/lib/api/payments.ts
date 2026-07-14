import { apiClient } from "../client";

export const paymentsApi = {
  create: (data: {
    childId: string;
    challengeId: string;
    coinsAmount: number;
  }) => apiClient.post("/payments", data).then((r) => r.data),
  // Черновик оплаты — создаётся при клике «Оплатить через Kaspi» (до перехода в Kaspi).
  createIntent: (data: {
    childId: string;
    challengeId: string;
    coinsAmount: number;
  }) => apiClient.post("/payments/intent", data).then((r) => r.data),
  // Родитель подтверждает свой незавершённый платёж.
  confirmMine: (id: string) =>
    apiClient.post(`/payments/${id}/confirm`).then((r) => r.data),
  // Родитель отменяет свой незавершённый платёж.
  cancelMine: (id: string) =>
    apiClient.post(`/payments/${id}/cancel`).then((r) => r.data),
  createOwnBook: (data: {
    childId: string;
    bookTitle: string;
    amountTg: number;
  }) => apiClient.post("/payments/own-book", data).then((r) => r.data),
  uploadReceipt: (id: string, file: File) => {
    const form = new FormData();
    form.append("receipt", file);
    return apiClient
      .post(`/payments/${id}/receipt`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  list: () => apiClient.get("/payments").then((r) => r.data),
};

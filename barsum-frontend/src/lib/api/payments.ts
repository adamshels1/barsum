import { apiClient } from "../client";

export const paymentsApi = {
  create: (data: {
    childId: string;
    challengeId: string;
    coinsAmount: number;
  }) => apiClient.post("/payments", data).then((r) => r.data),
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

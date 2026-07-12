import { apiClient } from "../client";

export const pushApi = {
  publicKey: () => apiClient.get("/push/public-key").then((r) => r.data as { publicKey: string }),
  subscribe: (sub: PushSubscriptionJSON) => apiClient.post("/push/subscribe", sub).then((r) => r.data),
  unsubscribe: (endpoint: string) => apiClient.post("/push/unsubscribe", { endpoint }).then((r) => r.data),
  test: () => apiClient.post("/push/test").then((r) => r.data),
};

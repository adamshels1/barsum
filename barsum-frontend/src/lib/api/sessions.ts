import { apiClient } from "../client";

export const sessionsApi = {
  create: (enrollmentId: string) =>
    apiClient.post("/sessions", { enrollmentId }).then((r) => r.data),
  list: (params?: { childId?: string }) =>
    apiClient.get("/sessions", { params }).then((r) => r.data),
  listByEnrollment: (enrollmentId: string) =>
    apiClient.get("/sessions", { params: { enrollmentId } }).then((r) => r.data),
  listEnrollments: () => apiClient.get("/enrollments").then((r) => r.data),
  listParentEnrollments: () =>
    apiClient.get("/enrollments/parent").then((r) => r.data),
  get: (id: string) => apiClient.get(`/sessions/${id}`).then((r) => r.data),
  getPartText: (id: string) =>
    apiClient.get(`/sessions/${id}/text`).then((r) => r.data) as Promise<{ text: string | null; partNumber: number }>,
  startRecording: (id: string) =>
    apiClient.post(`/sessions/${id}/start-recording`).then((r) => r.data),
  uploadAudio: (id: string, file: File) => {
    const form = new FormData();
    form.append("audio", file);
    return apiClient
      .post(`/sessions/${id}/upload-audio`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  transcribe: (id: string) =>
    apiClient.post(`/sessions/${id}/transcribe`).then((r) => r.data),
  analyze: (id: string) =>
    apiClient.post(`/sessions/${id}/analyze`).then((r) => r.data),
  answer: (id: string, answers: Record<string, string>) =>
    apiClient.post(`/sessions/${id}/answer`, { answers }).then((r) => r.data),

  // Review queue (for expert)
  reviewQueue: () => apiClient.get("/review-queue").then((r) => r.data),
  approveReview: (id: string) =>
    apiClient.post(`/review-queue/${id}/approve`).then((r) => r.data),
  rejectReview: (id: string) =>
    apiClient.post(`/review-queue/${id}/reject`).then((r) => r.data),
};

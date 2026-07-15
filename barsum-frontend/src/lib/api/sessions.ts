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
  listStudents: () => apiClient.get("/enrollments/students").then((r) => r.data),
  getStudent: (childId: string) =>
    apiClient.get(`/enrollments/students/${childId}`).then((r) => r.data),
  get: (id: string) => apiClient.get(`/sessions/${id}`).then((r) => r.data),
  getPartText: (id: string) =>
    apiClient.get(`/sessions/${id}/text`).then((r) => r.data) as Promise<{ text: string | null; imageUrl: string | null; title: string | null; partNumber: number }>,
  startRecording: (id: string) =>
    apiClient.post(`/sessions/${id}/start-recording`).then((r) => r.data),
  uploadAudio: (id: string, file: File, durationSec?: number) => {
    const form = new FormData();
    form.append("audio", file);
    if (durationSec && durationSec > 0) form.append("durationSec", String(durationSec));
    return apiClient
      .post(`/sessions/${id}/upload-audio`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  uploadRetell: (id: string, file: File, durationSec?: number) => {
    const form = new FormData();
    form.append("audio", file);
    if (durationSec && durationSec > 0) form.append("durationSec", String(durationSec));
    return apiClient
      .post(`/sessions/${id}/upload-retell-audio`, form, {
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

  // «Своя книжка»: спорные сессии, ожидающие подтверждения родителя.
  parentPending: () =>
    apiClient.get("/sessions/parent-pending").then((r) => r.data),
  parentConfirm: (id: string, approve: boolean) =>
    apiClient.post(`/sessions/${id}/parent-confirm`, { approve }).then((r) => r.data),

  // Review queue (for expert)
  reviewQueue: () => apiClient.get("/review-queue").then((r) => r.data),
  approveReview: (id: string, report?: string) =>
    apiClient.post(`/review-queue/${id}/approve`, { report }).then((r) => r.data),
  rejectReview: (id: string, report?: string) =>
    apiClient.post(`/review-queue/${id}/reject`, { report }).then((r) => r.data),
};

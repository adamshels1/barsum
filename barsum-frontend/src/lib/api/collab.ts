import { apiClient } from "../client";

export interface CollabBook {
  id: string;
  bookTitle: string;
  bookAuthor: string;
  description?: string;
  coverImage?: string | null;
  partTexts?: string[];
  partTitles?: string[];
  partImages?: string[];
  partAudios?: string[];
  currentRound: number;
  collaborative: boolean;
  collabOpen: boolean;
  collabCompleted: boolean;
  winnerCoins: number;
  coAuthors?: { type: "child" | "parent"; id: string; name?: string }[];
}

export interface Contribution {
  id: string;
  challengeId: string;
  roundNumber: number;
  authorType: "child" | "parent";
  authorId: string;
  authorName?: string;
  audioUrl?: string;
  durationSec?: number;
  transcription?: string;
  aiScore?: number | string | null;
  aiScoreBreakdown?: { relevance: number; creativity: number; coherence: number; language: number } | null;
  aiFeedback?: string | null;
  safetyFlag?: boolean;
  expertEditedText?: string | null;
  status: "pending" | "selected" | "not_selected";
  isWinner?: boolean;
  coinsAwarded?: number;
  createdAt: string;
}

// Публичный URL стриминга аудио продолжения через backend (обход mixed-content).
export function contributionAudioUrl(id: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3012";
  return `${base}/collab/contributions/${id}/audio`;
}

export const collabApi = {
  listOpen: (): Promise<CollabBook[]> => apiClient.get("/collab/open").then((r) => r.data),
  getBook: (id: string): Promise<CollabBook> => apiClient.get(`/collab/${id}`).then((r) => r.data),
  mine: (challengeId?: string): Promise<Contribution[]> =>
    apiClient.get("/collab/mine", { params: challengeId ? { challengeId } : {} }).then((r) => r.data),
  contribute: (challengeId: string, file: File, durationSec?: number): Promise<Contribution> => {
    const form = new FormData();
    form.append("audio", file);
    if (durationSec && durationSec > 0) form.append("durationSec", String(durationSec));
    return apiClient
      .post(`/collab/${challengeId}/contributions`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  // Expert
  round: (challengeId: string, round?: number): Promise<Contribution[]> =>
    apiClient.get(`/collab/${challengeId}/contributions`, { params: round ? { round } : {} }).then((r) => r.data),
  select: (challengeId: string, body: { round?: number; contributionIds: string[]; editedText?: string }): Promise<CollabBook> =>
    apiClient.post(`/collab/${challengeId}/select`, body).then((r) => r.data),
  setRound: (challengeId: string, open: boolean): Promise<CollabBook> =>
    apiClient.post(`/collab/${challengeId}/round`, { open }).then((r) => r.data),
  complete: (challengeId: string, coverImage?: string): Promise<CollabBook> =>
    apiClient.post(`/collab/${challengeId}/complete`, { coverImage }).then((r) => r.data),
};

// Мотивирующие тексты для проигравших (ротация) + поздравление победителю.
export const LOSE_MESSAGES_RU = [
  "Ты большой молодец! 🌟 В этот раз выбрали другое продолжение, но твоя идея была классной. Попробуй ещё — у тебя обязательно получится!",
  "Супер, что ты придумал продолжение! ✨ Эту главу выбрали не твою, но не расстраивайся — впереди ещё много глав. Расскажи свою идею для следующей!",
  "Здорово получилось! 💪 Сейчас победила другая история, но ты настоящий писатель. Давай попробуем ещё раз в следующей главе!",
  "Твоя фантазия — огонь! 🔥 В этот раз выбрали не тебя, но каждый твой рассказ делает тебя лучше. Жми «Придумать продолжение» снова!",
  "Ты старался — и это главное! 🌈 Пусть выбрали другую идею, зато ты потренировал речь и придумал целую историю. Впереди новая глава — вперёд!",
];

export const LOSE_MESSAGES_KK = [
  "Сен нағыз жарайсың! 🌟 Бұл жолы басқа жалғасы таңдалды, бірақ сенің идеяң тамаша болды. Тағы да байқап көр — сенде міндетті түрде шығады!",
  "Жалғасын ойлап тапқаның үшін рахмет! ✨ Бұл тарауды сенікі емес таңдады, бірақ ренжіме — алда әлі көп тарау бар. Келесісіне өз идеяңды айт!",
  "Керемет шықты! 💪 Қазір басқа әңгіме жеңді, бірақ сен нағыз жазушысың. Келесі тарауда тағы байқап көрейік!",
  "Сенің қиялың — керемет! 🔥 Бұл жолы сен таңдалмадың, бірақ әр әңгімең сені жақсарта түседі. «Жалғасын ойлап табу» батырмасын қайта бас!",
  "Тырыстың — ең бастысы осы! 🌈 Басқа идея таңдалса да, сен сөйлеуіңді жаттықтырып, тұтас әңгіме ойлап таптың. Алда жаңа тарау — алға!",
];

export function loseMessage(lang: string, seed: string): string {
  const arr = lang === "kk" ? LOSE_MESSAGES_KK : LOSE_MESSAGES_RU;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

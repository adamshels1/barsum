export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "parent" | "expert" | "admin";
  isActive: boolean;
  createdAt: string;
}

export interface Child {
  id: string;
  login: string;
  name: string;
  age: number;
  parentId: string;
  streak: number;
  photoUrl?: string | null;
  createdAt: string;
}

export interface Expert {
  id: string;
  userId: string;
  user?: User;
  status: "new" | "review" | "approved";
  specialization?: string;
  bio?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  pagesTotal: number;
  pagesPerPart: number;
  description?: string;
  authorId: string;
  author?: User;
  category: "reading";
  ageMin: number;
  ageMax: number;
  totalParts: number;
  price: number;
  coinsReward: number;
  status: "draft" | "moderation" | "published" | "rejected";
  rejectedReason?: string;
  membersCount: number;
  coverImage?: string;
  createdAt: string;
}

export interface ChallengeEnrollment {
  id: string;
  childId: string;
  child?: Child;
  challengeId: string;
  challenge?: Challenge;
  parentId: string;
  coinsPerPart: number;
  completedParts?: number;
  status: "active" | "completed" | "cancelled";
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  enrollmentId: string;
  enrollment?: ChallengeEnrollment;
  childId: string;
  partNumber: number;
  phase: "read" | "recording" | "transcribing" | "analyzing" | "done";
  audioUrl?: string;
  transcription?: string;
  aiScore?: number;
  aiFeedback?: string;
  aiQuestions?: string[];
  aiAnswers?: Record<string, string>;
  readingAccuracy?: number | null;
  readingCompleteness?: number | null;
  readingSpeedWpm?: number | null;
  errorWords?: string[] | null;
  audioDurationSec?: number | null;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

export interface CoinTransaction {
  id: string;
  fromType: string;
  fromId?: string;
  toType: string;
  toId?: string;
  amount: number;
  type: string;
  status: string;
  referenceId?: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  parentId: string;
  name: string;
  cost: number;
  type: "snack" | "time" | "experience";
  isActive: boolean;
  photoUrl?: string | null;
  createdAt: string;
}

export interface RewardRequest {
  id: string;
  childId: string;
  child?: Child;
  parentId: string;
  rewardId: string;
  reward?: Reward;
  coinsAmount: number;
  status: "pending" | "delivered" | "rejected";
  createdAt: string;
  resolvedAt?: string;
}

export interface Payment {
  id: string;
  parentId: string;
  childId: string;
  child?: Child;
  challengeId: string;
  challenge?: Challenge;
  challengePrice: number;
  coinsAmount: number;
  coinsTg: number;
  total: number;
  receiptUrl?: string;
  status: "pending" | "confirmed" | "rejected";
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Dream {
  id: string;
  childId: string;
  parentId?: string;
  name: string;
  targetCoins: number;
  savedCoins: number;
  photoUrl?: string;
  rejectedReason?: string;
  status: "pending_approval" | "active" | "completed" | "rejected";
  createdAt: string;
}

export interface ChildStats {
  streak: number;
  totalSessions: number;
  totalCoinsEarned: number;
  activeEnrollments: number;
  childBalance: number;
}

export interface AdminStats {
  totalUsers: number;
  totalChildren: number;
  totalPayments: number;
  totalRevenueTg: number;
  pendingPayments: number;
  pendingExperts: number;
  pendingChallenges: number;
}

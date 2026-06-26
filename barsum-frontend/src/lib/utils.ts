import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoins(coins: number): string {
  return coins.toLocaleString("ru-RU");
}

export function formatTenge(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₸`;
}

export const COIN_RATE = 10;
export const COMMISSION_PCT = 0.15;

export function calcPurchase(challengePrice: number, coinsAmount: number) {
  const coinsTg = Math.round(coinsAmount / COIN_RATE);
  const platform = Math.round(challengePrice * COMMISSION_PCT);
  const expert = challengePrice - platform;
  const total = challengePrice + coinsTg;
  return { coinsTg, platform, expert, total };
}

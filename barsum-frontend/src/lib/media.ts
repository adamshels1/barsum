const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3012";

/**
 * Фото children/dreams/rewards, загруженные через наш API, хранятся в MinIO и
 * отдаются напрямую по http на проде — это ломается mixed-content на https-странице.
 * Проксируем такие ссылки через backend (тот же https-origin), а не отдаём их как есть.
 * Локальные статические картинки (каталог наград и т.п., путь начинается с "/") не трогаем.
 */
function proxied(path: string, photoUrl: string | null | undefined): string | undefined {
  if (!photoUrl) return undefined;
  if (photoUrl.startsWith("/")) return photoUrl;
  return `${API_BASE}${path}`;
}

export function childPhotoUrl(child: { id: string; photoUrl?: string | null } | null | undefined): string | undefined {
  return proxied(`/children/${child?.id}/photo`, child?.photoUrl);
}

export function dreamPhotoUrl(dream: { id: string; photoUrl?: string | null } | null | undefined): string | undefined {
  return proxied(`/dreams/${dream?.id}/photo`, dream?.photoUrl);
}

export function rewardPhotoUrl(reward: { id: string; photoUrl?: string | null } | null | undefined): string | undefined {
  return proxied(`/rewards/${reward?.id}/photo`, reward?.photoUrl);
}

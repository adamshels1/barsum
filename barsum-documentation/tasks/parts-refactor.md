# Рефакторинг: Дни → Части (Parts Refactor)

## Суть
Заменить концепцию "дней" на "части книги". Ребёнок читает книгу по частям (например 3 части по 3 страницы), без привязки к календарным дням. Каждая часть разблокируется после завершения предыдущей.

---

## Backend

### Entities
- [x] `challenge.entity.ts` — переименовать: `days`→`totalParts`, `pagesPerDay`→`pagesPerPart`, `dailyTexts`→`partTexts`
- [x] `session.entity.ts` — переименовать: `day`→`partNumber`
- [x] `review-queue.entity.ts` — заменить `parentId` на `expertId` (проверку делает эксперт, не родитель)

### Service
- [x] `sessions.service.ts` — обновить все поля (`day`→`partNumber`, `dailyTexts`→`partTexts` и т.д.)
- [x] `sessions.service.ts` — `getDayText()` → `getPartText()` (использует `partNumber`)
- [x] `sessions.service.ts` — `analyze()` → отправлять в review queue к эксперту (по `challenge.authorId`)
- [x] `sessions.service.ts` — `findReviewQueue()` → по `expertId` вместо `parentId`
- [x] `sessions.service.ts` — `findEnrollmentsByChild()` → добавить `completedParts` в ответ
- [x] `sessions.service.ts` — добавить `findByEnrollment(enrollmentId, childId)`

### Controller
- [x] `sessions.controller.ts` — добавить фильтр `?enrollmentId=` к `GET /sessions`
- [x] `sessions.controller.ts` — переименовать endpoint `/text` → остаётся, но вызывает `getPartText`

---

## Frontend — API Layer
- [x] `lib/api/sessions.ts` — добавить `getByEnrollment(enrollmentId)`
- [x] `lib/api/sessions.ts` — добавить методы review-queue для эксперта

---

## Frontend — Child
- [x] `child/home/page.tsx` — карточка книги → переходит на `/child/book/[enrollmentId]` (не создаёт сессию сразу)
- [x] `child/home/page.tsx` — прогресс по `completedParts` из API (не по календарным дням!)
- [x] NEW `child/book/[enrollmentId]/page.tsx` — страница книги: части с замками (✅ / ▶ / 🔒)
- [x] `child/session/[id]/page.tsx` — "День N" → "Часть N из M", убрать UI пересказа

---

## Frontend — Expert
- [x] `expert/home/page.tsx` — добавить секцию "На проверке" (review queue)
- [x] `expert/books/page.tsx` — "X дней" → "X частей"
- [x] `expert/create/page.tsx` — лейблы "дней" → "частей"

---

## Frontend — Parent
- [x] `parent/child/[id]/page.tsx` — "День N" → "Часть N", убрать кнопки проверки родителем

## Frontend — Admin
- [x] `admin/challenges/page.tsx` — `days` → `totalParts`, "дней" → "частей"

---

## Проверка в браузере
- [x] admin@barsum.kz / admin123 → /auth/admin
- [x] expert@test.kz / test123 → /expert/home (видит review queue)
- [x] parent@test.kz / test123 → /parent/home (только прогресс)
- [x] ayla_2024 / test123 → /child/home (страница книги с частями)

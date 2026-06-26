# Barsum Backend — Задачи

Стек: NestJS 11 · TypeORM · PostgreSQL · Jest · Swagger

---

## ИНФРАСТРУКТУРА

### TASK-B-01 — Database entities (все сущности)
- [x] `User` entity — id, email, password, name, role(`parent|expert|admin`), isActive, createdAt, updatedAt
- [x] `Child` entity — id, login, password, name, age, parentId(FK→User), **streak**, createdAt, updatedAt
- [x] `Expert` entity — id, userId(FK→User), status(`new|review|approved`), specialization, bio, rejectedReason, createdAt, updatedAt
- [x] `Challenge` entity — id, title, **bookTitle**, **bookAuthor**, **pagesTotal**, **pagesPerDay**, **description**, authorId(FK→User), category(`reading`), ageMin, ageMax, days, price, coinsReward, status(`draft|moderation|published|rejected`), rejectedReason, membersCount(default:0), createdAt, updatedAt
  - `membersCount` инкрементируется при подтверждении платежа (`PaymentsService.confirm()`)
- [x] `ChallengeEnrollment` entity — id, childId(FK→Child), challengeId(FK→Challenge), parentId(FK→User), status(`active|completed|cancelled`), startedAt, completedAt
- [x] `Session` entity — id, enrollmentId(FK→ChallengeEnrollment), childId(FK→Child), day, phase(`read|recording|transcribing|analyzing|done`), audioUrl, transcription, aiScore, aiQuestions(json), **aiAnswers(json)**, status(`pending|completed|failed`), createdAt
- [x] `CoinTransaction` entity — id, fromType(`parent|child|system`), fromId, toType(`parent|child|system`), toId, amount, type(`purchase|reserve|earn|reward_request|reward_confirm|reward_return|dream`), status(`pending|confirmed|returned`), referenceId, referenceType, createdAt
- [x] `Reward` entity — id, **parentId(FK→User)**, name, cost(монеты), type(`snack|time|experience`), isActive, createdAt
- [x] `RewardRequest` entity — id, childId(FK→Child), parentId(FK→User), rewardId(FK→Reward), coinsAmount, status(`pending|delivered|rejected`), createdAt, resolvedAt
- [x] `Payment` entity — id, parentId(FK→User), **childId(FK→Child)**, challengeId(FK→Challenge), challengePrice, coinsAmount, coinsTg, total, receiptUrl, status(`pending|confirmed|rejected`), adminNote, createdAt, resolvedAt
- [x] `Dream` entity — id, childId(FK→Child), name, targetCoins, savedCoins, status(`active|completed`), createdAt
- [x] Все enum-значения вынесены в `src/common/enums/`
- [x] `npm test` — все тесты проходят

---

## AUTH

### TASK-B-02 — Регистрация и вход родителя
**Зависит от:** TASK-B-01

- [x] `POST /auth/parent/register` — email, password, name → JWT + user
- [x] `POST /auth/parent/login` — email, password → JWT + user
- [x] Проверка на дубликат email (ConflictException)
- [x] bcrypt hash пароля (rounds: 10)
- [x] JWT payload: `{ sub, email, role: 'parent' }`
- [x] DTO: `RegisterParentDto`, `LoginDto` с валидацией
- [x] Тест: регистрация нового пользователя → успех
- [x] Тест: регистрация дубликата → ConflictException
- [x] Тест: вход с верным паролем → токен
- [x] Тест: вход с неверным паролем → UnauthorizedException

### TASK-B-03 — Вход ребёнка
**Зависит от:** TASK-B-01, TASK-B-07

- [x] `POST /auth/child/login` — login, password → JWT + child
- [x] JWT payload: `{ sub, login, role: 'child', parentId }`
- [x] DTO: `ChildLoginDto`
- [x] Тест: вход с верным логином/паролем → токен
- [x] Тест: вход с неверными данными → UnauthorizedException

### TASK-B-04 — Регистрация и вход эксперта
**Зависит от:** TASK-B-01

- [x] `POST /auth/expert/register` — email, password, name → JWT + expert (status: new)
- [x] `POST /auth/expert/login` — email, password → JWT + expert
- [x] JWT payload: `{ sub, email, role: 'expert', expertStatus }`
- [x] Тест: регистрация эксперта → статус `new`
- [x] Тест: вход с неверным паролем → UnauthorizedException

### TASK-B-05 — Вход администратора
**Зависит от:** TASK-B-01

- [x] `POST /auth/admin/login` — email, password → JWT + admin
- [x] JWT payload: `{ sub, email, role: 'admin' }`
- [x] Seed: создать первого администратора через скрипт/env
- [x] Тест: вход администратора → токен с role: 'admin'

---

## USERS

### TASK-B-06 — Профиль родителя
**Зависит от:** TASK-B-02

- [x] `GET /users/me` — текущий пользователь (JWT guard)
- [x] `PATCH /users/me` — обновить имя, телефон
- [x] `PATCH /users/me/password` — сменить пароль (старый + новый)
- [x] Тест: получить профиль → возвращает user без password
- [x] Тест: обновить профиль → сохраняет изменения

---

## CHILDREN

### TASK-B-07 — Управление детьми
**Зависит от:** TASK-B-01

- [x] `POST /children` — создать ребёнка (только parent) → login, password, name, age
- [x] `GET /children` — список детей текущего родителя
- [x] `GET /children/:id` — профиль ребёнка (включает streak, activeChallengesCount)
- [x] `GET /children/:id/stats` — статистика: streak, totalSessions, totalCoinsEarned, activeEnrollments
- [x] `PATCH /children/:id` — обновить имя, возраст, пароль
- [x] Логин ребёнка — уникальный в системе (проверка)
- [x] bcrypt hash пароля ребёнка
- [x] DTO: `CreateChildDto`, `UpdateChildDto`
- [x] Тест: создать ребёнка → успех, логин уникален
- [x] Тест: дубликат логина → ConflictException
- [x] Тест: получить детей родителя → только своих детей
- [x] Тест: GET stats → возвращает streak и totalSessions

---

## CHALLENGES

### TASK-B-08 — Каталог челленджей
**Зависит от:** TASK-B-01

- [x] `GET /challenges` — список опубликованных челленджей (фильтр по category, age)
- [x] `GET /challenges/:id` — детальная карточка
- [x] `POST /challenges` — создать черновик (только expert, status: approved)
- [x] `PATCH /challenges/:id` — обновить черновик (только автор)
- [x] `POST /challenges/:id/submit` — отправить на модерацию (draft → moderation)
- [x] `POST /challenges/:id/approve` — одобрить (только admin, moderation → published)
- [x] `POST /challenges/:id/reject` — отклонить с причиной (только admin)
- [x] Тест: получить каталог → только published
- [x] Тест: создать челлендж не-экспертом → ForbiddenException
- [x] Тест: одобрить без admin роли → ForbiddenException
- [x] Тест: отправить на модерацию → статус меняется

---

## ENROLLMENTS

### TASK-B-09 — Запись на челлендж
**Зависит от:** TASK-B-01, TASK-B-08, TASK-B-11

> **Важно:** enrollment создаётся **автоматически внутри B-14** при подтверждении платежа администратором.
> `POST /enrollments` — вспомогательный метод, вызывается только из `PaymentsService.confirm()`, не напрямую из фронта.

- [x] `PaymentsService.confirm()` вызывает `EnrollmentsService.create()` — enrollment создаётся атомарно с зачислением монет
- [x] `GET /enrollments` — список активных челленджей ребёнка (child token)
- [x] `GET /enrollments/parent` — список всех записей детей текущего родителя
- [x] `GET /enrollments/:id` — детали записи + прогресс (кол-во пройденных сессий)
- [x] Проверка: `parentBalance >= challenge.coinsReward` перед созданием enrollment
- [x] При создании: `CoinTransaction` type=`reserve` → `parentBalance -= coinsReward`
- [x] Тест: подтверждение платежа → enrollment создан + монеты зарезервированы
- [x] Тест: недостаточный баланс при confirm → BadRequestException, enrollment не создан
- [x] Тест: дублирующий confirm (idempotency) → ConflictException

---

## SESSIONS

### TASK-B-10 — Ежедневная сессия
**Зависит от:** TASK-B-01, TASK-B-09, TASK-B-11, TASK-B-15, TASK-B-16

- [x] `POST /sessions` — начать сессию (child) → создать session record, phase: `read`
- [x] `GET /sessions` — история сессий ребёнка (child: свои; parent: по childId query param)
- [x] `GET /sessions/:id` — детали сессии (транскрипция, оценка, вопросы, ответы)
- [x] `POST /sessions/:id/start-recording` — перейти в фазу `recording`
- [x] `POST /sessions/:id/upload-audio` — загрузить аудио (multipart) → Minio → phase: `transcribing`
- [x] `POST /sessions/:id/transcribe` — запустить Whisper → сохранить текст → phase: `analyzing`
- [x] `POST /sessions/:id/analyze` — запустить GPT → сохранить оценку + вопросы → phase: `done`
- [x] `POST /sessions/:id/answer` — ответить на вопрос AI
- [x] Если score > 80%: автозачёт → начислить монеты → `childBalance += coinsReward`
- [x] Если score < 80%: создать запись в `reviewQueue` родителя
- [x] Streak: увеличить счётчик `child.streak` при успешной сессии; сбросить если пропущен день
- [x] Тест: успешная сессия > 80% → монеты начислены, streak +1
- [x] Тест: сессия < 80% → попадает в reviewQueue
- [x] Тест: повторный upload → идемпотентно (не дублирует транзакцию)
- [x] Тест: GET /sessions?childId=X от родителя → только сессии своего ребёнка

---

## COINS

### TASK-B-11 — Леджер монет
**Зависит от:** TASK-B-01

- [x] `GET /coins/parent-balance` — текущий баланс родителя
- [x] `GET /coins/child-balance/:childId` — баланс ребёнка
- [x] `GET /coins/transactions` — история транзакций (parent видит свои + детей)
- [x] Внутренний метод `transfer(from, to, amount, type)` — идемпотентный (уникальный `referenceId`)
  - Отправка монет в мечту реализована в `DreamsService` (B-20), а не здесь
- [x] Никогда не уходит в минус — проверка перед каждой транзакцией
- [x] Тест: transfer → корректно обновляет оба баланса
- [x] Тест: двойной вызов с тем же referenceId → не дублирует
- [x] Тест: transfer с недостаточным балансом → BadRequestException

---

## REWARDS

### TASK-B-12 — Магазин наград
**Зависит от:** TASK-B-01, TASK-B-11

- [x] `GET /rewards` — список активных наград
- [x] `POST /rewards` — создать награду (только parent)
- [x] `PATCH /rewards/:id` — обновить награду
- [x] `DELETE /rewards/:id` — деактивировать награду
- [x] `POST /rewards/:id/request` — ребёнок запрашивает награду
  - `childBalance -= cost` → status: `pending`
  - Уведомление родителю
- [x] `POST /reward-requests/:id/deliver` — родитель выдал награду
  - status: `delivered`
  - `parentBalance += cost` ← монеты возвращаются
- [x] `POST /reward-requests/:id/reject` — родитель отклонил
  - status: `rejected`
  - `childBalance += cost` ← монеты возвращаются ребёнку
- [x] `GET /reward-requests` — список запросов (parent видит по своим детям)
- [x] Тест: запрос награды → монеты списаны, статус pending
- [x] Тест: выдача награды → монеты вернулись на parentBalance
- [x] Тест: отклонение → монеты вернулись ребёнку
- [x] Тест: запрос при недостаточном балансе → BadRequestException

---

## EXPERTS

### TASK-B-13 — Кабинет эксперта
**Зависит от:** TASK-B-01, TASK-B-04

- [x] `GET /experts/me` — профиль эксперта + статус
- [x] `PATCH /experts/me` — обновить специализацию, bio
- [x] `POST /experts/apply` — подать заявку (new → review)
- [x] `POST /experts/:id/approve` — одобрить (только admin, review → approved)
- [x] `POST /experts/:id/reject` — отклонить (только admin, review → new)
- [x] `GET /experts/me/stats` — количество челленджей, участников, заработок
- [x] Тест: подать заявку → статус меняется на review
- [x] Тест: одобрение без admin → ForbiddenException
- [x] Тест: статистика эксперта → корректные данные

---

## PAYMENTS

### TASK-B-14 — Оплата через Kaspi Pay
**Зависит от:** TASK-B-01, TASK-B-08, TASK-B-11, TASK-B-15

- [x] `POST /payments` — создать заявку на оплату (parent) → **childId**, challengeId, coinsAmount
  - Проверить что childId принадлежит этому родителю
  - Рассчитать: `total = challengePrice + coinsTg`
  - Сохранить в БД, status: `pending`
- [x] `POST /payments/:id/receipt` — загрузить скриншот чека (multipart → Minio bucket: `barsum-receipts`)
- [x] `GET /payments` — список платежей текущего родителя
- [x] `GET /admin/payments?status=pending` — очередь всех pending платежей (только admin; дублируется в B-18 для читаемости)
- [x] `POST /admin/payments/:id/confirm` — подтвердить оплату (admin)
  - status: `confirmed`
  - Зачислить `coinsAmount` монет на `parentBalance`
  - Вызвать `EnrollmentsService.create(childId, challengeId, parentId)` → enrollment создан
  - Инкрементировать `challenge.membersCount`
  - Отправить email родителю (B-17)
- [x] `POST /admin/payments/:id/reject` — отклонить с причиной (admin)
  - status: `rejected`, adminNote = причина
  - Отправить email родителю (B-17)
- [x] Тест: создать платёж с чужим childId → ForbiddenException
- [x] Тест: создать платёж → корректный расчёт total
- [x] Тест: подтверждение → монеты зачислены + enrollment создан + membersCount +1
- [x] Тест: подтверждение без admin → ForbiddenException
- [x] Тест: повторное подтверждение одного платежа → ConflictException (idempotency)

---

## FILES

### TASK-B-15 — Файловое хранилище (Minio)
**Зависит от:** TASK-B-01

- [x] Подключить Minio SDK, конфигурация через `.env`
- [x] Создать buckets при старте (если не существуют): `barsum-audio` (аудио сессий), `barsum-receipts` (чеки Kaspi Pay)
- [x] `uploadFile(buffer, filename, bucket)` → возвращает URL
- [x] `deleteFile(filename, bucket)` → удалить файл
- [x] `getSignedUrl(filename, bucket, expiresIn)` → временный URL
- [x] Поддерживаемые типы: `audio/webm`, `audio/mp4`, `audio/wav`, `image/jpeg`, `image/png`
- [x] Лимит размера: аудио 50MB, изображения 10MB
- [x] Тест: upload → файл доступен по URL
- [x] Тест: неподдерживаемый тип → BadRequestException

---

## AI

### TASK-B-16 — AI интеграция (Whisper + GPT)
**Зависит от:** TASK-B-15

- [x] Подключить OpenAI SDK, `OPENAI_API_KEY` из `.env`
- [x] `transcribeAudio(audioBuffer, filename)` → текст на русском (Whisper)
  - Вернуть: `{ text, confidence }` где confidence = 0-1
- [x] `analyzeRetelling(text, bookTitle, chapterContext?)` → GPT-4o
  - Промпт: проверить пересказ, оценить понимание (0-100%)
  - Вернуть: `{ score, feedback, questions: [3 вопроса] }`
- [x] `answerQuestion(question, childAnswer, context)` → оценить ответ ребёнка
- [x] Обработка ошибок OpenAI (rate limit, timeout) → retry 3 раза
- [x] Тест: transcribeAudio mock → возвращает корректный формат
- [x] Тест: analyzeRetelling mock → возвращает score + 3 вопроса
- [x] Тест: ошибка API → корректная обработка

---

## EMAIL

### TASK-B-17 — Email уведомления
**Зависит от:** TASK-B-01

- [x] Настроить `@nestjs-modules/mailer` + Nodemailer + Mailgun
- [x] Шаблоны (Handlebars):
  - [x] Приветствие родителя после регистрации
  - [x] Новая заявка на награду (родителю)
  - [x] Платёж подтверждён (родителю)
  - [x] Платёж отклонён с причиной (родителю)
  - [x] Заявка эксперта одобрена/отклонена
- [x] `sendMail(to, template, context)` — универсальный метод
- [x] Не блокировать основной флоу при ошибке отправки (try/catch + log)
- [x] Тест: sendMail вызывается с правильными параметрами (mock)

---

## ADMIN

### TASK-B-18 — Панель администратора
**Зависит от:** TASK-B-13, TASK-B-14

- [x] `GET /admin/payments?status=pending` — очередь чеков (endpoint реализован в B-14, здесь только AdminController)
- [x] `GET /admin/experts?status=review` — заявки экспертов
- [x] `GET /admin/challenges?status=moderation` — челленджи на модерации
- [x] `GET /admin/stats` — общая статистика: `{ totalUsers, totalChildren, totalPayments, totalRevenueTg, pendingPayments, pendingExperts, pendingChallenges }`
- [x] Все маршруты в AdminController защищены `@Roles('admin')` guard
- [x] Тест: доступ с role: 'parent' → ForbiddenException
- [x] Тест: статистика → возвращает корректную структуру

---

## REVIEW QUEUE

### TASK-B-19 — Очередь ручной проверки сессий
**Зависит от:** TASK-B-10

- [x] `GET /review-queue` — список сессий на проверке (parent, только своих детей)
- [x] `GET /review-queue/:id` — детали сессии (текст, аудио, оценка AI)
- [x] `POST /review-queue/:id/approve` — засчитать вручную → начислить монеты
- [x] `POST /review-queue/:id/reject` — не засчитывать
- [x] Тест: одобрение → монеты начислены
- [x] Тест: доступ к чужой сессии → ForbiddenException

---

## DREAM

### TASK-B-20 — Трекер мечты
**Зависит от:** TASK-B-01, TASK-B-11

- [x] `POST /dreams` — создать мечту (child) → name, targetCoins
- [x] `GET /dreams/my` — текущая мечта ребёнка
- [x] `POST /dreams/send` — отправить монеты в мечту (ручная кнопка)
  - `childBalance -= amount`
  - `dream.savedCoins += amount`
  - Если `savedCoins >= targetCoins` → status: `completed`
- [x] `PATCH /dreams/:id` — обновить название / цель
- [x] Тест: отправить монеты → savedCoins увеличился
- [x] Тест: достигнута цель → статус completed
- [x] Тест: отправить больше чем баланс → BadRequestException

---

## AI / ТРАНСКРИБАЦИЯ

### TASK-B-21 — Исправить транскрибацию (скачивать аудио из MinIO)
**Зависит от:** TASK-B-18

- [x] В `SessionsService.transcribe()` скачать аудио по `session.audioUrl` из MinIO (`filesService.getBuffer()`)
- [x] Передать реальный `Buffer` в `aiService.transcribeAudio(buffer, filename)`
- [x] Добавить `getBuffer(filename, bucket)` в `FilesService`
- [x] Тест: `transcribe()` вызывает `transcribeAudio` с непустым буфером

### TASK-B-22 — Добавить Gemini-адаптер для транскрибации (казахский/русский)
**Зависит от:** TASK-B-21

- [x] Установить `@google/generative-ai` в backend
- [x] В `AiService` добавить метод `transcribeWithGemini(buffer, mimeType)`:
  - Нормализовать MIME type: `audio/webm;codecs=opus` → `audio/webm`, `video/webm` → `audio/webm`
  - System instruction на казахском/русском для детского пересказа книг
  - 3 retry при 503
- [x] `GEMINI_API_KEY` в `.env`
- [x] Выбор провайдера: если `GEMINI_API_KEY` есть — Gemini, иначе OpenAI Whisper
- [x] MIME type нормализация реализована

### TASK-B-23 — Автозапуск транскрибации после загрузки аудио
**Зависит от:** TASK-B-21

- [x] После `uploadAudio()` — сразу запускать `transcribe()` в фоне (без ожидания клиента)
- [x] Сессия переходит: `recording` → `transcribing` (немедленно) → `analyzing` (после AI)
- [x] Фронт поллит статус каждые 3 сек (уже реализовано в `refetchInterval`)

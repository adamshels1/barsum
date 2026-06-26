# Barsum Infra — Задачи

---

## TASK-I-01 — Docker окружение
- [x] `docker-compose.yml` в корне проекта:
  - [x] `postgres:16-alpine` на порту **5435** (внутри контейнера 5432, изменён с 5433 из-за конфликта)
  - [x] `minio/minio` на портах **9100** (API) / **9101** (Console)
  - [x] Volumes для данных (не теряются при рестарте)
- [x] `.env.example` актуален для обоих сервисов
- [x] `.env` создан из `.env.example` (не в git)
- [x] `docker compose up -d` — всё поднимается с первого раза
- [x] Проверка: `docker compose ps` — все контейнеры healthy

## TASK-I-02 — Запуск проекта (dev)

Backend:
- [x] `cd barsum-backend && npm install` — без ошибок
- [x] `npm run start:dev` — сервер на :3012, Swagger на /api (изменён с 3010 из-за конфликта)
- [x] `npm test` — все тесты зелёные
- [x] TypeORM `synchronize: true` в dev создаёт таблицы автоматически

Frontend:
- [x] `cd barsum-frontend && npm install` — без ошибок
- [x] `npm run dev` — фронт на :3011
- [x] `npm run check` — Biome без ошибок

## TASK-I-03 — Seed данные (dev)
- [x] Скрипт `seed.ts`: создать тестовые данные
  - [x] Администратор: `admin@barsum.kz` / `admin123`
  - [x] Родитель: `parent@test.kz` / `test123`
  - [x] Ребёнок: логин `ayla_2024`, пароль `test123`, parentId → родитель выше
  - [x] Эксперт: `expert@test.kz` / `test123`, status: `approved`
  - [x] 3 тестовых челленджа (category: reading, status: published, bookTitle заполнен, pagesTotal: 200, days: 30, coinsReward: 500)
  - [x] 5 базовых наград (мороженое 200, прогулка 300, приставка 500, пицца 1500, кино 3000) — parentId → тестовый родитель
  - [x] 1 тестовый enrollment: `ayla_2024` записана на первый челлендж (статус active) — для непустого F-07
- [x] `npm run seed` запускает скрипт
- [x] Seed идемпотентен (повторный запуск не дублирует)

## TASK-I-04 — .gitignore и конфиги
- [x] `.gitignore` в корне: `node_modules/`, `.env`, `dist/`, `coverage/`, `.next/`
- [x] `.env` не попадает в git
- [x] `barsum-frontend/.env.example`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3010
  ```
- [x] `barsum-backend/.env.example` с полным списком переменных:
  ```
  # Server
  PORT=3010

  # Database
  DB_HOST=localhost
  DB_PORT=5433
  DB_USERNAME=postgres
  DB_PASSWORD=postgres
  DB_NAME=barsum

  # JWT
  JWT_SECRET=your-secret-key-min-32-chars
  JWT_EXPIRES_IN=7d

  # Minio
  MINIO_ENDPOINT=localhost
  MINIO_PORT=9100
  MINIO_USE_SSL=false
  MINIO_ACCESS_KEY=minioadmin
  MINIO_SECRET_KEY=minioadmin

  # OpenAI
  OPENAI_API_KEY=sk-...

  # Mailgun
  MAILGUN_API_KEY=key-...
  MAILGUN_DOMAIN=mg.barsum.kz
  FROM_EMAIL=noreply@barsum.kz
  ```

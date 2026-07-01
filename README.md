# Barsum — Образовательная платформа для детей

Barsum — мобильная веб-платформа для детей Казахстана. Дети читают книги, зарабатывают монеты и обменивают их на награды. Родители покупают задания и контролируют прогресс. Эксперты создают и публикуют задания.

---

## Технологический стек

| Слой | Технология |
|---|---|
| Backend | NestJS 11 + TypeScript + TypeORM |
| База данных | PostgreSQL 16 |
| Frontend | Next.js 16 + React 19 + Tailwind CSS v4 |
| Аутентификация | JWT (cookie + localStorage) |
| AI | Google Gemini API (транскрипция) |
| Хранилище файлов | MinIO (опционально) |

---

## Роли пользователей

- **Ребёнок** — читает книги, выполняет задания, зарабатывает монеты, выбирает награды
- **Родитель** — добавляет детей, покупает задания, пополняет монеты, управляет наградами
- **Эксперт** — создаёт задания на книги, отправляет на модерацию
- **Администратор** — модерирует задания, управляет платежами и экспертами

---

## Структура проекта

```
barsum/
├── barsum-backend/          # NestJS API
│   ├── src/
│   │   ├── auth/            # Аутентификация (JWT)
│   │   ├── users/           # Пользователи
│   │   ├── children/        # Дети
│   │   ├── challenges/      # Задания
│   │   ├── payments/        # Платежи
│   │   ├── rewards/         # Награды
│   │   ├── coins/           # Монеты
│   │   ├── dreams/          # Мечты ребёнка
│   │   ├── experts/         # Эксперты
│   │   ├── sessions/        # Сессии чтения
│   │   ├── admin/           # Административные методы
│   │   └── seed.ts          # Начальные данные
│   └── dump.sql             # Дамп базы данных
│
└── barsum-frontend/         # Next.js приложение
    └── src/app/
        ├── page.tsx         # Главная страница (выбор роли)
        ├── auth/            # Страницы входа
        ├── (child)/         # Страницы ребёнка
        ├── (parent)/        # Страницы родителя
        ├── (expert)/        # Страницы эксперта
        └── (admin)/         # Страницы администратора
```

---

## Локальный запуск

### 1. Требования

- Node.js 18+
- PostgreSQL 16 (или Docker)
- npm

### 2. Клонировать репозиторий

```bash
git clone https://github.com/adamshels1/barsum.git
cd barsum
```

### 3. Запустить PostgreSQL

Через Docker (рекомендуется):

```bash
docker run -d \
  --name barsum-postgres \
  -p 5435:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=barsum \
  postgres:16-alpine
```

### 4. Восстановить дамп базы данных

```bash
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d barsum -f barsum-backend/dump.sql
```

> Дамп содержит структуру таблиц и тестовые данные (пользователи, задания, дети).

### 5. Настроить переменные окружения — Backend

```bash
cd barsum-backend
cp .env.example .env
```

Отредактировать `.env`:

```env
PORT=3012

DB_HOST=localhost
DB_PORT=5435
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=barsum

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3011

GEMINI_API_KEY=your-gemini-key   # опционально, для AI-транскрипции
```

### 6. Настроить переменные окружения — Frontend

```bash
cd barsum-frontend
cp .env.example .env.local
```

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3012
```

### 7. Установить зависимости и запустить

Открыть **два терминала**:

**Терминал 1 — Backend:**
```bash
cd barsum-backend
npm install
npm run start:dev
# API запустится на http://localhost:3012
# Swagger: http://localhost:3012/api
```

**Терминал 2 — Frontend:**
```bash
cd barsum-frontend
npm install
npm run dev
# Приложение на http://localhost:3011
```

---

## Тестовые аккаунты

После восстановления дампа доступны следующие аккаунты:

| Роль | Email | Пароль |
|---|---|---|
| Администратор | admin@barsum.kz | admin123 |
| Родитель | parent@test.kz | test123 |
| Эксперт | expert@test.kz | test123 |

Ребёнок создаётся родителем через личный кабинет.

---

## API

Swagger-документация доступна после запуска backend:

```
http://localhost:3012/api
```

---

## Как работает платформа

1. **Эксперт** создаёт задание (книга + план чтения + цена + награда в монетах) и отправляет на модерацию
2. **Администратор** проверяет и публикует задание
3. **Родитель** видит опубликованные задания, покупает нужное для своего ребёнка
4. **Ребёнок** видит своё задание, отмечает прочитанные части, зарабатывает монеты
5. **Родитель** добавляет награды (игрушка, поход в кино и т.д.)
6. **Ребёнок** выбирает мечту и копит монеты для её достижения

# Barsum — Правила разработки

## Общие правила

- Каждая задача закрывается **только если все пункты чеклиста выполнены**
- Не начинать следующую задачу если текущая не закрыта полностью
- Все решения по архитектуре — в соответствии с `process-flow.md`
- Язык кода — **TypeScript**, язык интерфейса — **русский**
- Язык коммитов и комментариев — **русский** или **английский** (единообразно в файле)

---

## Правила бэкенда (NestJS)

### Структура модуля
Каждый модуль содержит:
```
src/<module>/
├── <module>.module.ts
├── <module>.controller.ts
├── <module>.controller.spec.ts
├── <module>.service.ts
├── <module>.service.spec.ts
├── dto/
│   ├── create-<entity>.dto.ts
│   └── update-<entity>.dto.ts
└── entities/
    └── <entity>.entity.ts
```

### Entities (TypeORM)
- Первичный ключ — всегда `uuid` (`@PrimaryGeneratedColumn('uuid')`)
- Всегда добавлять `@CreateDateColumn()` и `@UpdateDateColumn()`
- Soft delete через `@DeleteDateColumn()` где нужно
- Все enum-значения — в отдельных файлах `enums/`

### DTOs
- Все входящие данные — через DTO с `class-validator`
- Обязательно: `@IsString()`, `@IsEmail()`, `@IsEnum()`, `@IsUUID()` и т.д.
- `@ApiProperty()` на каждом поле для Swagger
- `UpdateDto` наследуется через `PartialType(CreateDto)`

### Сервисы
- Бизнес-логика только в сервисах, не в контроллерах
- Контроллер только маршрутизирует и вызывает сервис
- Все ошибки — через NestJS exceptions (`NotFoundException`, `BadRequestException`, etc.)
- Логирование через `Logger` из `@nestjs/common`

### Тесты
- **Каждый сервис** имеет `.spec.ts` рядом
- Все зависимости мокируются через `jest.fn()`
- Минимум тестов на сервис:
  - `should be defined`
  - Тест на успешный сценарий каждого метода
  - Тест на ошибочный сценарий (не найдено, уже существует и т.д.)
- E2E тесты в `test/` для критичных флоу (auth, coins, payments)
- Запускать тесты: `npm test` — все должны проходить перед коммитом

### API
- Все роуты защищены `JwtAuthGuard` кроме публичных (`@Public()`)
- Версионирование не нужно в v1
- Swagger доступен на `/api`
- Ответы всегда возвращают объект, не примитив

### База данных
- `synchronize: true` только в dev. В prod — миграции
- Имена таблиц — snake_case, plural: `challenges`, `coin_transactions`
- Внешние ключи — всегда с `onDelete` политикой

---

## Правила фронтенда (Next.js)

### Структура файлов
```
src/
├── app/                    # App Router pages
│   ├── (child)/           # Route group — child role
│   ├── (parent)/          # Route group — parent role
│   ├── (expert)/          # Route group — expert role
│   ├── (admin)/           # Route group — admin role
│   └── auth/              # Auth pages (public)
├── components/
│   ├── ui/                # Переиспользуемые UI-компоненты (shadcn)
│   └── <feature>/         # Компоненты по фичам
├── lib/
│   ├── api/               # API-клиенты по модулям
│   └── utils.ts
├── hooks/                 # Кастомные хуки
├── stores/                # Zustand stores
└── types/                 # TypeScript типы
```

### Компоненты
- Один компонент — один файл
- Имена файлов — `kebab-case.tsx`
- Имена компонентов — `PascalCase`
- `'use client'` только там где нужно (формы, стейт, браузерные API)
- Server Components по умолчанию

### Стили
- Только Tailwind CSS + CSS переменные из `globals.css`
- Цветовая палитра — строго из дизайна:
  - Purple: `#7B61FF` (primary)
  - Green: `#1FA463` (success, child accent)
  - Orange: `#EA8C2D` (warning)
  - Ink: `#1E1B2E` (text)
  - Muted: `#9AA0AE` (secondary text)
- Шрифт — Manrope
- Border radius — `rounded-2xl` (16px) для карточек, `rounded-xl` (12px) для полей
- Mobile-first: все экраны сначала для 375px

### Данные
- Все запросы к API — через TanStack Query (`useQuery`, `useMutation`)
- API-функции в `src/lib/api/<module>.ts`
- Глобальное состояние (auth, роль) — Zustand
- Локальное состояние компонента — `useState`

### Формы
- Все формы — React Hook Form + Zod
- Схема валидации — рядом с компонентом или в `lib/schemas/`
- Ошибки отображать под полем
- Toast уведомления — через `sonner`

### Авторизация
- `access_token` хранится в `localStorage`
- Роль (`parent` | `child` | `expert` | `admin`) в Zustand store
- Защита роутов — middleware (`src/middleware.ts`)
- При 401 — редирект на `/`

### Тесты (Playwright)
- E2E тесты в `e2e/` директории
- Тест на каждый критичный флоу:
  - Вход родителя / ребёнка
  - Покупка челленджа
  - Ежедневная сессия
  - Запрос и выдача награды
- Запуск: `npm run test:e2e`

### Линтинг
- Biome проверяет код перед коммитом (husky)
- `npm run check:fix` перед каждым PR
- Нет `any` без обоснования
- Нет `console.log` в продакшн-коде

---

## Правила монет (бизнес-логика)

- Курс: **1 ₸ = 10 монет** (только при покупке, не при возврате)
- Монеты резервируются **сразу** при записи на челлендж
- Монеты возвращаются родителю **только** после нажатия «Награда выдана»
- Автоматическое 10% отчисление — **отсутствует**
- Все транзакции — идемпотентны (нет дублирования при ретраях)
- Баланс никогда не уходит в минус

## Правила AI (сессии)

- Транскрибация: OpenAI Whisper
- Анализ пересказа: OpenAI GPT-4o
- Уверенность > 80% → автозачёт + монеты
- Уверенность < 80% → в `reviewQueue` родителя
- AI задаёт 3 вопроса по тексту пересказа
- Аудиофайлы хранятся в Minio, удаляются через 30 дней

## Правила оплаты

- Провайдер v1: **Kaspi Pay** (ручное подтверждение)
- Родитель загружает скриншот чека
- Администратор подтверждает или отклоняет
- Статусы: `pending` → `confirmed` | `rejected`
- После `confirmed` — монеты зачисляются, челлендж активируется

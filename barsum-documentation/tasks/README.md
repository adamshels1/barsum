# Barsum — Задачи и правила

## Файлы

| Файл | Содержание |
|------|-----------|
| [rules.md](rules.md) | Правила разработки — backend, frontend, бизнес-логика |
| [backend.md](backend.md) | Все задачи бэкенда с чеклистами |
| [frontend.md](frontend.md) | Все задачи фронтенда с чеклистами |
| [infra.md](infra.md) | Инфраструктура: Docker, seed, конфиги |

---

## Порядок выполнения

```
TASK-I-01  Docker окружение
TASK-I-02  Запуск проекта
TASK-I-03  Seed данные
    ↓
TASK-B-01  Database entities (все сущности)
    ↓
TASK-B-02  Auth родитель
TASK-B-04  Auth эксперт        ← параллельно
TASK-B-05  Auth админ          ← параллельно
    ↓
TASK-B-07  Children
TASK-B-06  Users profile       ← параллельно
    ↓
TASK-B-03  Auth ребёнок (зависит от Children)
    ↓
TASK-B-08  Challenges
TASK-B-15  Files (Minio)       ← параллельно
TASK-B-17  Email               ← параллельно
    ↓
TASK-B-11  Coins ledger
TASK-B-13  Experts             ← параллельно
    ↓
TASK-B-09  Enrollments (зависит от Coins)
TASK-B-12  Rewards (зависит от Coins)
TASK-B-14  Payments (зависит от Files + Coins)
    ↓
TASK-B-16  AI (зависит от Files)
    ↓
TASK-B-10  Sessions (зависит от AI + Files + Coins)
TASK-B-19  Review queue
TASK-B-20  Dream
TASK-B-18  Admin panel
    ↓
TASK-F-01  Frontend base
TASK-F-02  UI Kit
    ↓
TASK-F-03  Landing
TASK-F-04  Auth parent
TASK-F-04b Parent onboarding   ← после регистрации (зависит от F-04)
TASK-F-05  Auth child          ← параллельно с F-04
TASK-F-06  Auth expert         ← параллельно с F-04
    ↓
TASK-F-07  Child home
TASK-F-10  Parent cabinet      ← параллельно
TASK-F-13  Expert onboarding   ← параллельно
TASK-F-17  Admin dashboard     ← параллельно
    ↓
TASK-F-08  Child session
TASK-F-09  Child shop
TASK-F-10b Parent child/:id    ← зависит от F-10 + B-10
TASK-F-11  Parent catalog
TASK-F-12  Parent rewards
TASK-F-14  Expert home
TASK-F-15  Expert books
TASK-F-16  Expert wizard
TASK-F-18  Admin payments
TASK-F-19  Admin experts
TASK-F-20  Admin challenges
```

---

## Итого задач

| Раздел | Кол-во задач |
|--------|-------------|
| Backend | 19 (B-01 → B-20) |
| Frontend | 22 (F-01 → F-20 + F-04b + F-10b) |
| Infra | 4 (I-01 → I-04) |
| **Итого** | **45 задач** |

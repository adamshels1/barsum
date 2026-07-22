# Barsum — Продакшн-деплой

> ⚠️ Этот репозиторий **публичный** на GitHub. Никогда не коммитить сюда пароли, `.env` файлы, ключи API или токены. Все секреты живут только в `.env`/`.env.local` на сервере (не в git).

## Архитектура прод-окружения

Всё крутится на одном VPS (без Docker для приложений — только для БД и файлового хранилища):

| Компонент | Как запущен | Порт | Управление |
|---|---|---|---|
| Backend (NestJS) | `pm2` процесс `barsum-backend` | 3010 | `pm2 restart barsum-backend` |
| Frontend (Next.js) | `pm2` процесс `barsum-frontend` | 3011 | `pm2 restart barsum-frontend` |
| PostgreSQL | Docker-контейнер `barsum-postgres` | 5435 (только `127.0.0.1`, наружу закрыт) | `docker compose` в `/opt/barsum` |
| MinIO (файлы: аудио, обложки, чеки) | Docker-контейнер `barsum-minio` | 9100 (S3 API), 9101 (консоль) — **открыты наружу**, т.к. ссылки на файлы отдаются напрямую браузеру | `docker compose` в `/opt/barsum` |
| nginx | системный сервис | 80 → редирект на 443, 443 (SSL) | `systemctl restart nginx` |

**Маршрутизация через nginx** (`/etc/nginx/sites-available/barsum`):
- `https://barsum.app/` → frontend (127.0.0.1:3011)
- `https://barsum.app/api/*` → backend (127.0.0.1:3010), префикс `/api` обрезается
- `https://api.barsum.app/*` → backend напрямую (легаси, оставлен для совместимости; фронтенд сейчас ходит через `barsum.app/api`, а не через этот поддомен — так надёжнее, не зависит от отдельной DNS-записи)

**Лимит размера загрузки** (`/etc/nginx/conf.d/upload_size.conf`, НЕ в git):
```nginx
client_max_body_size 50m;
```
Отдельный сниптет в `conf.d` (подключается в http-контексте `nginx.conf`, действует на все server-блоки). Без него у nginx дефолт **1 МБ**, и загрузка аудио чтения длиннее ~45–60 сек падает с **HTTP 413 (Payload Too Large)** ещё до бэкенда. Запись чтения ограничена 10 минутами на клиенте (~10–20 МБ в худшем случае в зависимости от кодека) — лимит 50m даёт запас. При переустановке сервера этот файл нужно создать заново:
```bash
echo "client_max_body_size 50m;" > /etc/nginx/conf.d/upload_size.conf
nginx -t && systemctl restart nginx
```

SSL — бесплатный сертификат Let's Encrypt (через `certbot`), автопродление настроено через системный таймер certbot.

## Сервер

- **IP:** `185.113.132.6`
- **ОС:** Ubuntu 24.04 LTS
- **Тариф:** Cloud 4-4-100 (4 vCPU / 4 ГБ RAM / 100 ГБ NVMe)
- **Пользователь:** `root`
- **Пароль:** не хранится нигде в этом репозитории. Он был выдан хостинг-провайдером при заказе сервера — если не сохранён отдельно (менеджер паролей), нужно восстанавливать через панель хостинга. **Рекомендуется** сменить пароль и/или перейти на вход по SSH-ключу (`ssh-copy-id`), чтобы не передавать пароль открытым текстом.

## Домен и DNS (Cloudflare)

Домен `barsum.app` куплен и управляется в Cloudflare DNS.

| Запись | Тип | Значение | Proxy status |
|---|---|---|---|
| `barsum.app` | A | `185.113.132.6` | DNS only (серое облако) |
| `api.barsum.app` | A | `185.113.132.6` | DNS only (легаси, см. выше) |

**Важно:** Proxy status должен быть **выключен** (DNS only). Если включить оранжевое облако (Cloudflare proxy), сломается и Let's Encrypt (валидация HTTP-01 идёт напрямую на сервер), и прямые ссылки на файлы MinIO.

`.app` — домен из HSTS-preload листа браузеров: он **обязан** открываться по HTTPS, обычный http не сработает вообще ни в одном браузере. Поэтому SSL — не опция, а необходимость.

## Пути на сервере

```
/opt/barsum/                          — git clone https://github.com/adamshels1/barsum (ветка main)
/opt/barsum/docker-compose.yml        — Postgres + MinIO
/opt/barsum/barsum-backend/.env       — секреты backend (НЕ в git, создан вручную)
/opt/barsum/barsum-frontend/.env.local — NEXT_PUBLIC_API_URL (НЕ в git)
/etc/nginx/sites-available/barsum     — конфиг nginx (frontend + api routing)
/etc/letsencrypt/live/barsum.app/     — SSL-сертификаты (управляются certbot)
```

## Как выкатить обновление кода

После `git push` в `main`:

```bash
ssh root@185.113.132.6
cd /opt/barsum
git pull

# backend
cd barsum-backend
npm install
npm run build
pm2 restart barsum-backend

# frontend
cd ../barsum-frontend
npm install
npm run build      # ОБЯЗАТЕЛЬНО пересобрать, простого restart мало
pm2 restart barsum-frontend
```

**Важно про фронтенд:** переменные `NEXT_PUBLIC_*` (например `NEXT_PUBLIC_API_URL`) "зашиваются" в JS-бандл на этапе `npm run build`, а не читаются в рантайме. Если поменять `.env.local` — обязательно пересобрать (`npm run build`), иначе изменения не применятся, сколько ни рестартуй `pm2`.

**Новые файлы в `public/`** (обложки книг, иллюстрации частей) тоже требуют `npm run build`. Next кэширует список статики с момента сборки: файл лежит на диске, но отдаётся **404**, пока фронтенд не пересобран — одного `git pull` + `pm2 restart` недостаточно. Проверка: `curl -o /dev/null -w '%{http_code}\n' https://barsum.app/books/<книга>/cover.jpg` должен вернуть `200`.

## Полезные команды на сервере

```bash
pm2 list                                   # статус процессов
pm2 logs barsum-backend --lines 50         # логи backend
pm2 logs barsum-frontend --lines 50        # логи frontend
pm2 restart barsum-backend barsum-frontend # перезапуск обоих

docker ps                                  # статус Postgres/MinIO
docker exec -it barsum-postgres psql -U postgres -d barsum   # зайти в БД

nginx -t                                   # проверить конфиг перед применением
systemctl restart nginx                    # применить конфиг (reload иногда не подхватывает изменения — использовать restart)

certbot renew --dry-run                    # проверка, что автопродление SSL работает
ufw status                                 # проверить открытые порты
```

## Перенос данных БД (dev → prod, разово)

Делается с локальной машины разработчика, у которой поднят `docker-compose.yml` из корня репо:

```bash
# 1. Выгрузить данные из локальной БД
docker exec barsum-postgres pg_dump -U postgres -d barsum --data-only --disable-triggers > barsum_data.sql

# 2. Скопировать на сервер
scp barsum_data.sql root@185.113.132.6:/tmp/

# 3. Залить на сервере (схема уже создана бэкендом через TypeORM synchronize при первом старте)
ssh root@185.113.132.6 "docker exec -i barsum-postgres psql -U postgres -d barsum < /tmp/barsum_data.sql"
```

## Известные ограничения / что стоит сделать дальше

- **Нет бэкапов БД.** Postgres и MinIO хранят данные в Docker volume на диске сервера — если диск умрёт, всё потеряется. Нужно настроить регулярный `pg_dump` в отдельное хранилище (S3/другой сервер).
- **MinIO без SSL** — работает по http напрямую на порту 9100, не через nginx. Можно тоже завести под домен+сертификат для аккуратности.
- **SMTP и OpenAI ключи — заглушки.** Email-уведомления и OpenAI-фолбэк (Gemini как основной работает) в проде не функционируют, пока не проставить реальные ключи в `barsum-backend/.env`.
- **`www.barsum.app` не настроен** — DNS-записи нет, при желании открывать сайт с `www.` нужно добавить ещё одну A-запись и перевыпустить сертификат (`certbot --nginx -d www.barsum.app ...`).
- **Всё на одном сервере** (backend + frontend + БД + файлы). Для роста нагрузки стоит разносить БД/файлы на отдельные машины.
- **root-доступ без SSH-ключа** — см. раздел выше про смену пароля.

## Чек-лист "если что-то не работает"

1. **Сайт не открывается вообще** → `ssh root@185.113.132.6 "systemctl status nginx; pm2 list"` — всё ли запущено.
2. **Логин/API не работает** → `pm2 logs barsum-backend` — смотреть ошибки; проверить `dig barsum.app` действительно указывает на `185.113.132.6`.
3. **Меняли `.env`/`.env.local`, но не помогло** → не забыли пересобрать (`npm run build`) и перезапустить (`pm2 restart`)?
4. **Правили nginx-конфиг, не применяется** → использовать `systemctl restart nginx`, а не `reload`.
5. **Картинки/аудио не грузятся** → проверить, что порт 9100 (MinIO) открыт в `ufw status` и контейнер `barsum-minio` запущен (`docker ps`).
6. **Запись чтения не отправляется (длинная запись)** → в DevTools → Network загрузка `upload-audio` отдаёт **413**? Значит слетел `client_max_body_size` (см. раздел про nginx выше) — пересоздать `/etc/nginx/conf.d/upload_size.conf` и `systemctl restart nginx`.

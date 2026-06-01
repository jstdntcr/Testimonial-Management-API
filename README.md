# Testimonial Management API

REST API для управления видео-отзывами (testimonials). Бизнесы создают отзывы, отслеживают их статус, шарят по каналам и смотрят аналитику.

## Стек

- Node.js + Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken) для аутентификации
- bcryptjs для хеширования паролей
- uuid для генерации `testimonialId`
- express-rate-limit для ограничения попыток входа
- Jest + Supertest + mongodb-memory-server для тестов

## Установка и запуск

```bash
# Установить зависимости
npm install

# Создать .env (см. раздел ниже)
cp .env.example .env

# Запуск
npm start

# Тесты
npm test
```

Сервер поднимется на `http://localhost:3000` (или порт из `.env`).

## Переменные окружения

| Переменная    | Описание                          | По умолчанию                              |
| ------------- | --------------------------------- |-------------------------------------------|
| `PORT`        | Порт сервера                      | `3000`                                    |
| `MONGODB_URI` | Строка подключения к MongoDB      | `mongodb://localhost:27017/testimonial-api` |
| `JWT_SECRET`  | Секрет для подписи JWT            | `your_super_secret_key_here`                |
| `JWT_EXPIRY`  | Время жизни токена                | `7d`                                      |

## Структура проекта

```
├── models/              # Mongoose-схемы
│   ├── user.js
│   ├── testimonial.js
│   └── testimonialSettings.js
├── controllers/         # Логика обработки запросов
│   ├── authController.js
│   └── testimonialController.js
├── routes/              # Определение маршрутов
│   ├── authRoute.js
│   └── testimonialRoute.js
├── middleware/
│   └── auth.js          # JWT-проверка
├── lib/
│   ├── constants.js     # Общие константы и enum-значения
│   └── utils.js         # Валидация, хеширование
├── tests/               # Jest
├── app.js               # Express-приложение
└── README.md
```

## API

Все эндпоинты `/api/testimonials/*` требуют заголовок `Authorization: Bearer <token>`.

### Аутентификация

**POST `/api/auth/register`** - регистрация, возвращает данные пользователя (без пароля) и JWT.

```json
// Запрос
{ "email": "user@example.com", "password": "MyPass1!", "businessName": "My Co" }
```

**POST `/api/auth/login`** - авторизация, возвращает JWT.

```json
// Запрос
{ "email": "user@example.com", "password": "MyPass1!" }
```

### Testimonials

| Метод  | Эндпоинт                                  | Описание                       |
| ------ | ----------------------------------------- | ------------------------------ |
| POST   | `/api/testimonials`                       | Создать отзыв                  |
| GET    | `/api/testimonials`                       | Список с пагинацией и фильтром |
| GET    | `/api/testimonials/:testimonialId`        | Один отзыв                     |
| PUT    | `/api/testimonials/:testimonialId`        | Обновить отзыв                 |
| PATCH  | `/api/testimonials/:testimonialId/status` | Сменить статус                 |
| DELETE | `/api/testimonials/:testimonialId`        | Мягкое удаление                |
| POST   | `/api/testimonials/:testimonialId/share`  | Записать шаринг                |

**GET `/api/testimonials`** - query-параметры: `status`, `page`, `limit`, `sort`.

```json
// Ответ
{
  "code": 200,
  "status": "success",
  "message": "Data retrieved successfully",
  "data": [],
  "pagination": { "total": 25, "page": 1, "limit": 10, "pages": 3 }
}
```

**PATCH `/api/testimonials/:testimonialId/status`** - переходы разрешены только на один шаг вперёд: `draft → recording → processing → completed → shared`. При переходе в `shared` проставляется `sharedAt`.

```json
// Запрос
{ "status": "recording" }
```

**POST `/api/testimonials/:testimonialId/share`** - добавляет каналы без дубликатов, при статусе `completed` переводит в `shared`.

```json
// Запрос
{ "channels": ["email", "facebook"] }
```

### Settings

| Метод | Эндпоинт                     | Описание                  |
| ----- | ---------------------------- | ------------------------- |
| GET   | `/api/testimonials/settings` | Получить настройки        |
| POST  | `/api/testimonials/settings` | Создать/обновить (upsert) |

### Analytics

**GET `/api/testimonials/analytics`** - query-параметры: `startDate`, `endDate` (ISO). Использует MongoDB aggregation pipeline для подсчёта по статусам и среднего рейтинга.

### Бонусные эндпоинты

| Метод | Эндпоинт                          | Описание                          |
| ----- | --------------------------------- | --------------------------------- |
| GET   | `/api/testimonials/search`        | Поиск по тексту, дате, рейтингу   |
| POST  | `/api/testimonials/bulk/status`   | Массовая смена статуса            |
| GET   | `/api/testimonials/export`        | Экспорт в CSV                     |

## Формат ответов

```json
// Успех
{ "code": 200, "status": "success", "message": "...", "data": {} }

// Ошибка
{ "code": 400, "status": "failure", "message": "..." }
```

Используются HTTP-коды: `200`, `201`, `400`, `401`, `403`, `404`, `500`.

## Архитектурные решения

- **Слоистая структура** (models / controllers / routes / middleware) - разделение ответственности, проще тестировать и расширять.
- **Проверка владельца двухшаговая** - сначала ищем ресурс по `testimonialId` (без `userId`): если не найден — `404`; если найден, но `userId` не совпадает с JWT — `403 Forbidden`; только после этого выполняем операцию.
- **Мягкое удаление** - флаг `isDeleted` + `deletedAt`, все выборки фильтруют `isDeleted: false`.
- **Валидация переходов статусов** через индекс в массиве `constants.testimonialStatus` - переход разрешён только если новый индекс на единицу больше текущего.
- **Статичные роуты (`/settings`, `/analytics`, `/search`, `/export`) объявлены выше динамического `/:testimonialId`** - иначе Express матчил бы их как id.
- **app.js экспортирует Express-приложение**, а подключение к БД и `app.listen` выполняются только при прямом запуске (`require.main === module`) - это позволяет Supertest работать с приложением, подключая отдельную in-memory БД.

## Тесты

```bash
npm test
```

- `tests/auth.middleware.test.js` - проверка JWT-middleware (нет токена, невалидный, истёкший, валидный).
- `tests/utils.test.js` - unit-тесты валидации и хеширования.
- `tests/testimonials.test.js` - интеграционные тесты CRUD-эндпоинтов на in-memory MongoDB.

---

## Информация о сдаче

**Время выполнения:** _7-8 часов_

**Выполненные бонусные задачи:**

- Бонус 1 - Rate Limiting на эндпоинты аутентификации (`express-rate-limit`, 5 запросов в минуту с одного IP)
- Бонус 2 - Поиск и фильтрация (`/search`)
- Бонус 3 - Массовые операции (`/bulk/status`)
- Бонус 4 - Экспорт в CSV (`/export`)
- Бонус 5 - Тесты (Jest + mongodb-memory-server)

Выполнены все 5 бонусных задач.

**Что бы сделал иначе:**

- **Использовал бы TypeScript и Zod вместо ручной валидации:** сейчас валидация написана вручную
  в контроллерах (проверки полей, email, рейтинга). В реальном проекте использовал бы
  TypeScript и Zod, т.к. схемы описывают форму запроса, дают автоматический вывод типов и
  централизуют валидацию вне контроллеров.
- **Сейчас контроллеры напрямую вызывают Mongoose:** в реальном проекте добавил бы слой services/ между 
  контроллером и моделью. Контроллер бы отвечал только за HTTP (парсинг запроса, формат ответа и т.п.), 
  сервис - за бизнес-логику.

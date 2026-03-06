# Система аутентификации и комментариев

## 📋 Обзор

Полная система аутентификации пользователей с верификацией email и система комментариев с поддержкой смайлов и модерацией.

---

## 🔐 Аутентификация

### Регистрация
- **URL:** `/auth` (вкладка "Регистрация")
- **Требования:**
  - **Ник для входа** (уникальный, 2-50 символов, буквы/цифры/подчеркивание)
  - **Email** (уникальный, для восстановления пароля)
  - **Пароль** (мин. 6 символов)
  - **Ник в Арене** (отображаемое имя, 2-50 символов)
  - **Ссылка на персонажа** (обязательно, `apeha.ru`)
- **Верификация email:**
  - Токен действителен 24 часа
  - Ссылка `/verify-email/:token`
  - Повторная отправка через 1 час

### Вход
- **URL:** `/auth` (вкладка "Вход")
- **Ник для входа** + **Пароль**
- JWT токен (7 дней)
- Токен хранится в localStorage

### Восстановление пароля
- **URL:** `/auth/forgot-password`
- Введите email, указанный при регистрации
- Токен действителен 1 час
- **URL сброса:** `/auth/reset-password/:token`

### Профиль
- **URL:** `/profile`
- Информация о пользователе
- Выход из системы

---

## 💬 Комментарии

### Возможности
- Создание комментариев к новостям
- Ответы на комментарии (цитирование через `parentId`)
- Редактирование (в течение 10 минут)
- Удаление (свои комментарии)
- Форматирование: **жирный** (`<b>`), *курсив* (`<i>`)
- Смайлы (emoji-mart, макс. 10)
- Пагинация (20 на странице)

### Модерация
- **Авторы и админы:** скрытие комментариев с указанием причины
- **Админы:** восстановление скрытых комментариев
- Жалобы от пользователей (мин. 10 символов)

---

## 👥 Роли и права

| Действие | Гость | Пользователь | Автор | Админ |
|----------|-------|--------------|-------|-------|
| Читать комментарии | ✅ | ✅ | ✅ | ✅ |
| Писать комментарии | ❌ | ✅* | ✅ | ✅ |
| Редактировать свои | ❌ | ✅ (<10 мин) | ✅ | ✅ |
| Удалять свои | ❌ | ✅ | ✅ | ✅ |
| Скрывать комментарии | ❌ | ❌ | ✅ | ✅ |
| Восстанавливать | ❌ | ❌ | ✅ | ✅ |
| Жаловаться | ❌ | ✅ | ✅ | ✅ |
| Просмотр жалоб | ❌ | ❌ | ✅ | ✅ |
| Управление пользователями | ❌ | ❌ | ❌ | ✅ |

\* Только после верификации email

---

## 📁 Структура файлов

### Бэкенд
```
backend/
├── migrations/
│   └── 001_auth_and_comments.sql       # SQL миграция
├── src/
│   ├── models/
│   │   ├── user.js                     # Пользователи
│   │   ├── userProfile.js              # Профили пользователей
│   │   ├── emailVerificationToken.js   # Токены верификации
│   │   ├── passwordResetToken.js       # Токены сброса пароля
│   │   ├── comment.js                  # Комментарии
│   │   └── commentReport.js            # Жалобы
│   ├── routes/
│   │   ├── authRoutes.js               # Аутентификация
│   │   ├── commentRoutes.js            # Комментарии
│   │   └── reportRoutes.js             # Жалобы
│   ├── middleware/
│   │   ├── auth.js                     # JWT аутентификация
│   │   ├── rateLimiter.js              # Rate limiting
│   │   ├── validateAuth.js             # Валидация аутентификации
│   │   └── validateComment.js          # Валидация комментариев
│   └── controllers/
│       └── authController.js           # Контроллеры аутентификации
└── server.js
```

### Фронтенд
```
src/
├── contexts/
│   └── AuthContext.tsx                 # Контекст аутентификации
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx               # Форма входа
│   │   └── RegisterForm.tsx            # Форма регистрации
│   └── news/
│       ├── CommentCard.tsx             # Карточка комментария
│       ├── CommentEditor.tsx           # Редактор комментариев
│       └── CommentsSection.tsx         # Секция комментариев
├── pages/
│   ├── Auth.tsx                        # Страница входа/регистрации
│   ├── EmailVerification.tsx           # Верификация email
│   ├── ForgotPassword.tsx              # Восстановление пароля
│   └── ResetPassword.tsx               # Сброс пароля
├── lib/
│   └── api.ts                          # API клиент
└── App.tsx                             # Маршрутизация
```

---

## 🔒 Безопасность

### Пароли
- Хеширование с bcrypt (10 раундов)
- Никогда не хранятся в открытом виде

### XSS защита
- DOMPurify для очистки HTML
- Разрешены только: `<b>`, `<i>`, `<em>`, `<strong>`
- CSP заголовки через helmet

### SQL Injection
- Prepared statements (better-sqlite3)
- Валидация через Zod

### Rate Limiting
| Операция | Лимит |
|----------|-------|
| Регистрация | 3 в час |
| Вход | 5 в минуту |
| Комментарии | 10 в минуту |
| Жалобы | 5 в час |
| Верификация | 3 в час |

### Валидация
- Макс. длина комментария: 2000 символов
- Макс. смайлов: 10
- Редактирование: 10 минут
- Пароль: мин. 6 символов
- Ник: 2-50 символов (буквы, цифры, подчеркивание)

---

## 📊 База данных

### Таблицы

**users**
- `id` - PRIMARY KEY
- `username` - Ник для входа (уникальный)
- `email` - Email (уникальный)
- `password_hash` - Хешированный пароль
- `role` - 'user', 'author', 'admin'
- `is_active` - Активен ли пользователь

**user_profiles**
- `id` - PRIMARY KEY
- `user_id` - FOREIGN KEY → users
- `arena_nickname` - Ник в Арене
- `character_url` - Ссылка на персонажа
- `email_verified` - Верифицирован ли email

**email_verification_tokens**
- `id` - PRIMARY KEY
- `user_id` - FOREIGN KEY → users
- `token` - Токен верификации
- `expires_at` - Срок действия

**password_reset_tokens**
- `id` - PRIMARY KEY
- `user_id` - FOREIGN KEY → users
- `token` - Токен сброса
- `expires_at` - Срок действия
- `used` - Использован ли

**comments**
- `id` - PRIMARY KEY
- `news_id` - FOREIGN KEY → news
- `user_id` - FOREIGN KEY → users
- `parent_id` - FOREIGN KEY → comments (для ответов)
- `content` - Текст комментария
- `is_deleted` - Удален ли
- `is_hidden` - Скрыт ли модератором
- `hidden_by` - Кто скрыл
- `hidden_reason` - Причина скрытия
- `edited_at` - Когда отредактирован

**comment_reports**
- `id` - PRIMARY KEY
- `comment_id` - FOREIGN KEY → comments
- `user_id` - Кто пожаловался
- `reason` - Причина
- `status` - 'pending', 'reviewed', 'resolved', 'rejected'
- `reviewed_by` - Кто рассмотрел

**comment_edits** (история)
- `id` - PRIMARY KEY
- `comment_id` - FOREIGN KEY → comments
- `user_id` - Кто отредактировал
- `old_content` - Старое содержимое

---

## 🚀 Запуск локально

### 1. Миграция БД
```bash
cd backend
npm run migrate
```

### 2. Бэкенд
```bash
cd backend
node server.js
# http://localhost:3000
```

### 3. Фронтенд
```bash
cd sin-city-sentinels
npm run dev
# http://localhost:8080
```

---

## 📝 API Endpoints

### Аутентификация
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/me` | Текущий пользователь |
| POST | `/api/auth/verify-token` | Проверка токена |
| GET | `/api/auth/verify-email/:token` | Верификация email |
| POST | `/api/auth/resend-verification` | Повторная верификация |
| POST | `/api/auth/forgot-password` | Запрос сброса пароля |
| POST | `/api/auth/reset-password/:token` | Сброс пароля |

### Комментарии
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/comments?newsId=&page=&limit=` | Список комментариев |
| POST | `/api/comments` | Создать комментарий |
| PUT | `/api/comments/:id` | Обновить комментарий |
| DELETE | `/api/comments/:id` | Удалить комментарий |
| PATCH | `/api/comments/:id/hide` | Скрыть комментарий |
| PATCH | `/api/comments/:id/restore` | Восстановить |
| GET | `/api/comments/:id/history` | История редактирования |
| POST | `/api/comments/:id/report` | Жалоба |

### Жалобы (Admin/Author)
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/reports?status=&page=&limit=` | Список жалоб |
| GET | `/api/reports/summary` | Сводка жалоб |
| GET | `/api/reports/:id` | Жалоба по ID |
| PATCH | `/api/reports/:id/status` | Обновить статус |
| POST | `/api/reports/:id/review` | Рассмотреть жалобу |

---

## ⚠️ Важные заметки

1. **Email верификация:** Токен действителен 24 часа
2. **Редактирование комментариев:** Только в течение 10 минут
3. **Ссылка на персонажа:** Обязательна при регистрации
4. **Вход по нику:** Используется ник для входа (не email)
5. **Почта:** Только для восстановления пароля

---

## 🧪 Тестирование

### Тестовые данные
```bash
# Регистрация
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"test123","arenaNickname":"Тест","characterUrl":"https://kovcheg2.apeha.ru/info.html?user=123"}'

# Вход
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Верификация email
curl http://localhost:3000/api/auth/verify-email/:token
```

---

## 📖 Changelog

### Версия 2.0 (текущая)
- ✅ Вход по нику (вместо email)
- ✅ Email для восстановления пароля
- ✅ Обязательная ссылка на персонажа
- ✅ Верификация email
- ✅ Смайлы в комментариях (макс. 10)
- ✅ Упрощенная модерация
- ✅ Роли: admin/author/user

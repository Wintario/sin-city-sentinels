# Система комментариев и аутентификации

## 📋 Обзор

Полная система комментариев с аутентификацией пользователей, модерацией и жалобами.

---

## 🔐 Аутентификация

### Регистрация
- **URL:** `/auth` (вкладка "Регистрация")
- **Требования:**
  - Email (уникальный)
  - Пароль (мин. 6 символов)
  - Ник в Арене
  - Ссылка на персонажа (опционально, валидация)
- **Верификация email:**
  - Токен на 24 часа
  - Ссылка `/verify-email/:token`
  - Повторная отправка через 1 час

### Вход
- **URL:** `/auth` (вкладка "Вход")
- Email + пароль
- JWT токен (7 дней)
- HttpOnly cookie + localStorage

### Профиль
- **URL:** `/profile`
- Информация о пользователе
- Смена пароля
- Статистика активности

---

## 💬 Комментарии

### Возможности
- Создание комментариев к новостям
- Ответы на комментарии (цитирование)
- Редактирование (10 минут)
- Удаление (свои комментарии)
- Форматирование: **жирный**, *курсив*
- Смайлы (emoji-mart, макс. 10)
- Пагинация (20 на странице)

### Модерация
- **Авторы:** скрытие комментариев
- **Админы:** скрытие, удаление, восстановление
- Жалобы от пользователей

---

## 🚩 Жалобы

### Создание жалобы
- Причина (мин. 10 символов)
- Лимит: 5 жалоб в час

### Модерация жалоб
- **URL:** `/admin/reports`
- Статусы: pending, reviewed, resolved, rejected
- Скрытие комментария по жалобе

---

## 👥 Админка пользователей

### Управление
- **URL:** `/admin/users`
- Просмотр всех пользователей
- Поиск и фильтрация по роли
- Редактирование роли
- Сброс пароля
- Деактивация пользователя

---

## 📁 Структура файлов

### Бэкенд
```
backend/
├── migrations/
│   └── 002_add_comments_system.sql
├── src/
│   ├── models/
│   │   ├── user.js (обновлён)
│   │   ├── userProfile.js (новый)
│   │   ├── comment.js (новый)
│   │   └── commentReport.js (новый)
│   ├── routes/
│   │   ├── registrationRoutes.js (новый)
│   │   ├── commentRoutes.js (новый)
│   │   └── reportRoutes.js (новый)
│   ├── middleware/
│   │   ├── validateComment.js (новый)
│   │   └── rateLimiter.js (обновлён)
│   └── controllers/
│       ├── authController.js (обновлён)
│       └── usersController.js (обновлён)
└── server.js (обновлён)
```

### Фронтенд
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── EmailVerification.tsx
│   ├── news/
│   │   ├── CommentEditor.tsx
│   │   ├── CommentCard.tsx
│   │   └── CommentsSection.tsx
│   └── admin/
│       ├── UsersAdmin.tsx
│       └── ReportsAdmin.tsx
├── pages/
│   ├── Auth.tsx
│   ├── EmailVerification.tsx
│   └── Profile.tsx
├── lib/
│   └── api.ts (обновлён)
└── App.tsx (обновлён)
```

---

## 🔒 Безопасность

### XSS защита
- DOMPurify для очистки HTML
- Разрешены только: `<b>`, `<i>`, `<em>`, `<strong>`
- CSP заголовки

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

---

## 📊 База данных

### Таблицы

**user_profiles**
- user_id, arena_nickname, character_url
- email_verified, verification_token

**comments**
- news_id, user_id, parent_id
- content, is_deleted, is_hidden
- hidden_by, hidden_reason, edited_at

**comment_reports**
- comment_id, user_id, reason
- status (pending/reviewed/resolved/rejected)

**email_verification_tokens**
- user_id, token, expires_at

**comment_edits** (история)
- comment_id, user_id, old_content

---

## 🚀 Запуск локально

1. **Миграция БД:**
   ```bash
   cd backend
   node scripts/migrate.js
   ```

2. **Бэкенд:**
   ```bash
   cd backend
   node server.js
   # http://localhost:3000
   ```

3. **Фронтенд:**
   ```bash
   npm run dev
   # http://localhost:8080
   ```

4. **Тестирование:**
   - Регистрация: `/auth`
   - Вход под admin/admin
   - Комментарии к новостям
   - Админка: `/admin/users`, `/admin/reports`

---

## 📝 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `GET /api/auth/verify-email/:token` - Верификация
- `POST /api/auth/resend-verification` - Повторная верификация

### Комментарии
- `GET /api/comments?newsId=&page=&limit=` - Список
- `POST /api/comments` - Создать
- `PUT /api/comments/:id` - Обновить
- `DELETE /api/comments/:id` - Удалить
- `PATCH /api/comments/:id/hide` - Скрыть
- `PATCH /api/comments/:id/restore` - Восстановить

### Жалобы
- `GET /api/reports?status=&page=&limit=` - Список
- `POST /api/comments/:id/report` - Создать жалобу
- `PATCH /api/reports/:id/status` - Обновить статус

### Пользователи (Admin)
- `GET /api/users` - Все пользователи
- `PUT /api/users/:id` - Обновить
- `DELETE /api/users/:id` - Деактивировать
- `POST /api/users/:id/reset-password` - Сброс пароля

---

## ⚠️ Важные заметки

1. **Email верификация:** Токен действителен 24 часа
2. **Редактирование комментариев:** Только в течение 10 минут
3. **Последний админ:** Нельзя удалить последнего активного админа
4. **CSP:** Настроен через helmet (без upgrade-insecure-requests)

---

## 🎯 Роли и права

| Действие | Гость | Пользователь | Автор | Админ |
|----------|-------|--------------|-------|-------|
| Читать комментарии | ✅ | ✅ | ✅ | ✅ |
| Писать комментарии | ❌ | ✅* | ✅ | ✅ |
| Редактировать свои | ❌ | ✅ (<10 мин) | ✅ | ✅ |
| Скрывать комментарии | ❌ | ❌ | ✅ | ✅ |
| Удалять комментарии | ❌ | ❌ | ❌ | ✅ |
| Жаловаться | ❌ | ✅ | ✅ | ✅ |
| Просмотр жалоб | ❌ | ❌ | ❌ | ✅ |
| Управление пользователями | ❌ | ❌ | ❌ | ✅ |

*Только после верификации email

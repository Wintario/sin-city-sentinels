# Интеграция системы комментариев с админ-панелью

## 📋 Обзор

Полная интеграция новой системы комментариев с админ-панелью для модерации и управления.

---

## 🎯 Что было добавлено

### Фронтенд

#### Новые хуки (`src/hooks/`)
- **`useReports.ts`** - TanStack Query хуки для работы с жалобами:
  - `useReports(status, page, limit)` - получение жалоб с фильтрацией
  - `usePendingReportsCount()` - количество ожидающих жалоб
  - `useUpdateReportStatus()` - обновление статуса жалобы
  - `useReviewReport()` - рассмотрение жалобы (скрыть/отклонить)
  - `useReportsSummary()` - сводка для дашборда

#### Новые компоненты админки (`src/components/admin/`)
- **`ReportsAdmin.tsx`** (обновлён) - управление жалобами:
  - Интеграция с TanStack Query
  - Оптимистичные обновления статусов
  - Диалоги подтверждения
  - Кнопка перехода к комментарию в новости
  
- **`CommentHistoryInAdmin.tsx`** - история жалоб на комментарий:
  - Все жалобы на конкретный комментарий
  - Статистика по статусам
  - Информация о комментарии
  - Ссылка на контекст новости

- **`CommentsAdmin.tsx`** - управление всеми комментариями:
  - Поиск по тексту комментария
  - Фильтры по статусу (all/hidden/deleted)
  - Массовые операции (скрыть/восстановить/удалить)
  - Просмотр истории редактирования
  - Экспорт статистики

#### Обновлённые компоненты
- **`Admin.tsx`** - добавлена вкладка "Комментарии"

### Бэкенд

#### Новые endpoints (`backend/src/routes/commentAdminRoutes.js`)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/comments/admin/all` | Все комментарии с фильтрами |
| GET | `/api/comments/admin/:id/context` | Комментарий с контекстом (новость, жалобы) |
| POST | `/api/comments/admin/bulk-action` | Массовые операции |
| GET | `/api/comments/admin/:id/history` | История редактирования |
| GET | `/api/comments/admin/user/:userId/stats` | Статистика комментариев пользователя |
| POST | `/api/comments/admin/user/:userId/hide-all` | Скрыть все комментарии пользователя |
| GET | `/api/reports/admin/summary` | Сводка по жалобам |

#### Обновлённые файлы
- **`server.js`** - подключены новые routes
- **`src/lib/api/comments.ts`** - добавлены функции для админки:
  - `getAdminComments()`
  - `getCommentWithContext()`
  - `bulkCommentAction()`
  - `getUserCommentStats()`
  - `hideAllUserComments()`

---

## 🎨 Админ-панель: Функционал

### Вкладка "Жалобы" (`/admin/reports`)

**Фильтры:**
- Ожидающие (с счётчиком новых)
- Проверенные
- Решённые
- Отклонённые

**Действия:**
- ✅ Быстрое рассмотрение (скрыть комментарий + закрыть жалобу)
- ✅ Отклонить жалобу
- ✅ Решить жалобу
- ✅ Просмотр детальной информации
- ✅ Переход к комментарию в новости

**Оптимистичные обновления:**
- Статус жалобы обновляется мгновенно
- При ошибке происходит откат

### Вкладка "Комментарии" (`/admin/comments`)

**Поиск и фильтры:**
- Поиск по тексту комментария
- Фильтр по статусу (все/скрытые/удалённые)
- Фильтр по новости
- Фильтр по пользователю

**Массовые операции:**
- Выделение нескольких комментариев
- Скрыть выбранные
- Восстановить выбранные
- Удалить выбранные

**Действия с одним комментарием:**
- Просмотр полного текста
- История редактирования
- Скрыть/восстановить
- Удалить
- Переход к новости

### Вкладка "Пользователи" (`/admin/users`)

**Интеграция (планируется):**
- Статистика комментариев пользователя
- Количество жалоб
- Последние комментарии
- Кнопка "Скрыть все комментарии"

---

## 📊 Типы данных

### CommentReport
```typescript
interface CommentReport {
  id: number;
  comment_id: number;
  user_id: number;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  comment_content?: string;
  reporter_username?: string;
}
```

### AdminComment (расширенный Comment)
```typescript
interface AdminComment extends Comment {
  reports_count: number;
}
```

---

## 🔧 Использование API

### Получение жалоб

```typescript
import { useReports } from '@/hooks/useReports';

function MyComponent() {
  const { data, isLoading } = useReports('pending', 1, 50);
  
  return (
    <div>
      {data?.reports.map(report => (
        <div key={report.id}>{report.reason}</div>
      ))}
    </div>
  );
}
```

### Обновление статуса жалобы

```typescript
import { useUpdateReportStatus } from '@/hooks/useReports';

function MyComponent() {
  const mutation = useUpdateReportStatus();
  
  const handleResolve = async (id: number) => {
    await mutation.mutateAsync({ id, status: 'resolved' });
  };
  
  return (
    <Button onClick={handleResolve}>
      Решить жалобу
    </Button>
  );
}
```

### Массовые операции с комментариями

```typescript
import { commentsAPI } from '@/lib/api/comments';

const handleBulkHide = async (commentIds: number[]) => {
  await commentsAPI.admin.bulkAction({
    ids: commentIds,
    action: 'hide',
    reason: 'Нарушение правил сообщества',
  });
};
```

### Статистика пользователя

```typescript
import { commentsAPI } from '@/lib/api/comments';

const stats = await commentsAPI.admin.getUserStats(userId);
console.log(stats.stats);
// {
//   totalComments: 42,
//   hiddenComments: 5,
//   totalReports: 12
// }
```

---

## 🗄️ База данных

### Миграция 003

Применить миграцию для добавления индексов:

```bash
cd backend
node scripts/migrate-003.js
```

**Созданные индексы:**
- `idx_comments_parent` - для древовидной структуры
- `idx_comments_news_created` - для сортировки по новости
- `idx_comments_user` - для фильтра по автору
- `idx_comments_hidden` - для фильтра скрытых
- `idx_comments_deleted` - для фильтра удалённых
- `idx_comment_reports_comment` - для жалоб
- `idx_comment_reports_user` - для жалоб по пользователю
- `idx_comment_reports_status` - для фильтра по статусу
- `idx_comment_edits_comment` - для истории редактирования

---

## 🧪 Тестирование

### Чеклист

- [ ] Открыть `/admin/reports`
- [ ] Проверить отображение жалоб по статусам
- [ ] Рассмотреть жалобу (скрыть комментарий)
- [ ] Отклонить жалобу
- [ ] Открыть `/admin/comments`
- [ ] Поиск комментариев по тексту
- [ ] Фильтр по статусу
- [ ] Массовое скрытие комментариев
- [ ] Просмотр истории редактирования
- [ ] Переход к комментарию из новости

### Playwright тесты (планируются)

```typescript
// tests/admin-comments.spec.ts
1. Авторизация под админом
2. Просмотр жалоб
3. Рассмотрение жалобы
4. Поиск комментариев
5. Массовые операции
6. Проверка прав (author vs admin)
```

---

## 📝 API Endpoints

### Comments Admin

#### GET `/api/comments/admin/all`

**Параметры query:**
- `page` (default: 1)
- `limit` (default: 50)
- `status` ('all' | 'hidden' | 'deleted')
- `newsId` (number)
- `userId` (number)
- `search` (string)

**Ответ:**
```json
{
  "success": true,
  "comments": [...],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

#### GET `/api/comments/admin/:id/context`

**Ответ:**
```json
{
  "success": true,
  "comment": {...},
  "news": {"id": 1, "title": "...", "slug": "..."},
  "reports": [...]
}
```

#### POST `/api/comments/admin/bulk-action`

**Body:**
```json
{
  "ids": [1, 2, 3],
  "action": "hide",
  "reason": "Нарушение правил"
}
```

**Ответ:**
```json
{
  "success": true,
  "results": [
    {"id": 1, "success": true, "action": "hidden"},
    {"id": 2, "success": false, "error": "..."}
  ],
  "total": 3,
  "successful": 2,
  "failed": 1
}
```

### Reports Admin

#### GET `/api/reports/admin/summary`

**Ответ:**
```json
{
  "success": true,
  "summary": {
    "pending": 5,
    "reviewed": 10,
    "resolved": 20,
    "rejected": 3
  }
}
```

---

## 🔐 Безопасность

### Проверка прав

Все endpoints админки требуют:
1. Авторизации (`authenticate` middleware)
2. Роли `admin` или `author` (`requireRole` middleware)

### Rate Limiting

- Стандартный rate limit для всех API
- Отдельный limit для массовых операций

### Валидация

- Проверка массива ID для массовых операций
- Проверка допустимых действий (hide/restore/delete)
- Санитизация текста причин

---

## 🎯 Roadmap

### Реализовано
- ✅ Хуки для жалоб (useReports)
- ✅ Обновлённый ReportsAdmin
- ✅ CommentHistoryInAdmin
- ✅ CommentsAdmin с поиском и фильтрами
- ✅ Массовые операции
- ✅ Backend endpoints
- ✅ Индексы БД

### В планах
- ⏳ Интеграция статистики в UsersAdmin
- ⏳ Уведомления о новых жалобах
- ⏳ Экспорт статистики в CSV
- ⏳ Графики активности комментариев
- ⏳ Автоматическое скрытие при N жалобах

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте права доступа (роль admin/author)
2. Проверьте логи backend
3. Проверьте Network tab в DevTools
4. Убедитесь, что миграция БД применена

---

## 📚 Связанная документация

- `COMMENTS_SYSTEM_V2.md` - основная документация системы комментариев
- `COMMENTS_MIGRATION_GUIDE.md` - руководство по миграции
- `AUTH_AND_COMMENTS.md` - аутентификация и права доступа

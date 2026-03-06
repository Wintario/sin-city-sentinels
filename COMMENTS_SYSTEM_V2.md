# Новая система комментариев (v2)

## 📋 Обзор

Полный рефакторинг системы комментариев с использованием современных паттернов и лучших практик.

### Ключевые улучшения

1. **TanStack Query** - кэширование, оптимистичные обновления, retry-логика
2. **Zustand** - управление UI состоянием (диалоги, редактирование)
3. **TypeScript** - строгая типизация всех данных
4. **Древовидная структура** - поддержка вложенности комментариев
5. **Оптимистичные обновления** - мгновенный отклик UI
6. **Обработка ошибок** - автоматические повторные попытки, откат изменений
7. **Диалоги** - подтверждение удаления, жалобы, история редактирования

---

## 🏗️ Архитектура

### Структура файлов

```
src/
├── types/
│   └── comments.ts                 # TypeScript интерфейсы
├── stores/
│   └── useCommentStore.ts          # Zustand store для UI
├── hooks/
│   └── useComments.ts              # TanStack Query хуки
├── lib/api/
│   └── comments.ts                 # API функции
└── components/
    └── comments/
        ├── index.ts                # Экспорт компонентов
        ├── CommentsContainer.tsx   # Главный контейнер
        ├── CommentThread.tsx       # Дерево комментариев
        ├── CommentItem.tsx         # Один комментарий
        ├── CommentActions.tsx      # Dropdown меню действий
        ├── CommentEditor.tsx       # Редактор комментариев
        ├── ReportDialog.tsx        # Диалог жалобы
        ├── DeleteConfirmDialog.tsx # Подтверждение удаления
        └── EditHistoryDialog.tsx   # История редактирования
```

---

## 🔧 Использование

### Базовый пример

```tsx
import { CommentsContainer } from '@/components/comments';

function NewsDetail({ newsId }) {
  return (
    <div>
      <article>{/* Контент новости */}</article>
      <CommentsContainer newsId={newsId} />
    </div>
  );
}
```

### Использование хуков

```tsx
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/useComments';

function MyComponent() {
  const newsId = 1;
  
  // Получение комментариев
  const { data, isLoading, error } = useComments(newsId, 1, 20);
  
  // Создание комментария
  const createMutation = useCreateComment(newsId);
  const handleCreate = async (content: string) => {
    await createMutation.mutateAsync({ newsId, content });
  };
  
  // Обновление комментария
  const updateMutation = useUpdateComment(newsId);
  const handleUpdate = async (id: number, content: string) => {
    await updateMutation.mutateAsync({ id, data: { content } });
  };
  
  // Удаление комментария
  const deleteMutation = useDeleteComment(newsId);
  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };
  
  // ...
}
```

### Использование store для UI

```tsx
import { useCommentStore } from '@/stores/useCommentStore';

function MyComponent() {
  const {
    editingComment,
    setEditingComment,
    openReportDialog,
    closeReportDialog,
    reportDialog,
  } = useCommentStore();
  
  const handleReport = (comment) => {
    openReportDialog(comment);
  };
  
  return (
    <>
      {/* Контент */}
      <ReportDialog
        open={reportDialog.isOpen}
        onOpenChange={closeReportDialog}
        onSubmit={handleReportSubmit}
      />
    </>
  );
}
```

---

## 📊 Типы данных

### Comment

```typescript
interface Comment {
  id: number;
  news_id: number;
  user_id: number;
  parent_id?: number | null;
  content: string;
  is_deleted: boolean;
  is_hidden: boolean;
  hidden_by?: number | null;
  hidden_at?: string | null;
  hidden_reason?: string | null;
  edited_at?: string | null;
  created_at: string;
  author_username: string;
  author_display_name?: string | null;
  author_arena_nickname?: string | null;
  author_character_url?: string | null;
  replies?: Comment[];      // Вложенные комментарии
  _isOptimistic?: boolean;  // Флаг оптимистичного обновления
  _depth?: number;          // Глубина вложенности
}
```

---

## 🎯 Хуки

### useComments(newsId, page, limit)

Получение комментариев с пагинацией.

**Параметры:**
- `newsId` - ID новости
- `page` - страница (по умолчанию 1)
- `limit` - комментариев на странице (по умолчанию 20)

**Возвращает:**
- `data` - данные (comments, total, page, limit)
- `isLoading` - флаг загрузки
- `error` - ошибка
- `refetch()` - функция повторного запроса

### useCreateComment(newsId)

Создание комментария с оптимистичным обновлением.

**Возвращает:**
- `mutate(data)` - синхронный вызов
- `mutateAsync(data)` - асинхронный вызов
- `isPending` - выполняется ли мутация
- `error` - ошибка

**Пример:**
```tsx
const createMutation = useCreateComment(newsId);

await createMutation.mutateAsync({
  newsId,
  content: 'Текст комментария',
  parentId: null,
});
```

### useUpdateComment(newsId)

Обновление комментария с оптимистичным обновлением.

**Пример:**
```tsx
const updateMutation = useUpdateComment(newsId);

await updateMutation.mutateAsync({
  id: commentId,
  data: { content: 'Новый текст' },
});
```

### useDeleteComment(newsId)

Удаление комментария.

**Пример:**
```tsx
const deleteMutation = useDeleteComment(newsId);

await deleteMutation.mutateAsync(commentId);
```

### useHideComment(newsId)

Скрытие комментария (модерация).

### useRestoreComment(newsId)

Восстановление комментария.

### useReportComment()

Жалоба на комментарий.

**Пример:**
```tsx
const reportMutation = useReportComment();

await reportMutation.mutateAsync({
  id: commentId,
  data: { reason: 'Причина жалобы' },
});
```

### useCommentHistory(commentId, enabled)

Получение истории редактирования.

---

## 🎨 Компоненты

### CommentsContainer

Главный контейнер для отображения комментариев.

**Props:**
- `newsId` (required) - ID новости

### CommentThread

Рекурсивный компонент для отображения дерева комментариев.

**Props:**
- `comment` (required) - объект комментария
- `currentUser` - текущий пользователь
- `depth` - глубина вложенности
- `maxDepth` - максимальная глубина (по умолчанию 5)
- `editingCommentId` - ID редактируемого комментария
- `onReply`, `onEdit`, `onDelete`, `onRestore`, `onReport`, `onHide`, `onCancelEdit`, `onViewHistory`

### CommentItem

Один комментарий.

**Props:**
- `comment` (required)
- `currentUser`
- `depth`
- `isEditing`
- `onReply`, `onEdit`, `onDelete`, `onRestore`, `onReport`, `onHide`, `onCancelEdit`, `onViewHistory`

### CommentActions

Dropdown меню с действиями.

### CommentEditor

Редактор комментариев.

**Props:**
- `onSubmit` (required)
- `onCancel`
- `replyingTo`
- `initialValue`
- `isEditing`
- `disabled`

### Dialogs

- `ReportDialog` - диалог жалобы
- `DeleteConfirmDialog` - подтверждение удаления
- `EditHistoryDialog` - история редактирования

---

## ⚙️ Настройки

### Кэширование (TanStack Query)

```typescript
// staleTime - данные считаются свежими 5 минут
staleTime: 1000 * 60 * 5

// gcTime - данные удаляются из кэша через 30 минут
gcTime: 1000 * 60 * 30

// retry - 3 попытки при ошибке
retry: 3

// retryDelay - экспоненциальная задержка
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
```

### Оптимистичные обновления

Все мутации поддерживают оптимистичные обновления:

1. **onMutate** - сохранение предыдущего состояния, обновление кэша
2. **onError** - откат к предыдущему состоянию
3. **onSuccess** - инвалидация запроса для перезагрузки

### Валидация

- Максимальная длина: 2000 символов
- Максимум смайлов: 10
- Минимальная причина жалобы: 10 символов
- Окно редактирования: 1 час

---

## 🔧 Backend

### Миграции

Применить миграцию для добавления индексов:

```bash
cd backend
node scripts/migrate-003.js
```

### API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/comments?newsId=&page=&limit=` | Получить комментарии |
| POST | `/api/comments` | Создать комментарий |
| PUT | `/api/comments/:id` | Обновить комментарий |
| DELETE | `/api/comments/:id` | Удалить комментарий |
| PATCH | `/api/comments/:id/hide` | Скрыть комментарий |
| PATCH | `/api/comments/:id/restore` | Восстановить |
| GET | `/api/comments/:id/history` | История редактирования |
| POST | `/api/comments/:id/report` | Жалоба |

---

## 🧪 Тестирование

### Playwright тесты

Смотри файл `tests/comments.spec.ts` для примеров автотестов.

### Ручное тестирование

1. Создание комментария
2. Ответ на комментарий (вложенность)
3. Редактирование в течение 1 часа
4. Удаление с подтверждением
5. Жалоба на комментарий
6. Скрытие/восстановление (модератор)
7. Просмотр истории редактирования

---

## 📝 Changelog

### Версия 2.0 (текущая)

**Изменения:**
- ✅ TanStack Query для управления состоянием
- ✅ Zustand для UI состояний
- ✅ Оптимистичные обновления
- ✅ Древовидная структура комментариев
- ✅ Строгая типизация TypeScript
- ✅ Улучшенная обработка ошибок
- ✅ Диалоги для всех действий
- ✅ Индексы для производительности
- ✅ Улучшенная обработка времени редактирования

**Удалено:**
- ❌ Старый CommentsSection
- ❌ Старый CommentCard
- ❌ Прямые вызовы API в компонентах

---

## 🆘 Миграция со старой версии

### Шаг 1: Обновить импорты

**Было:**
```tsx
import CommentsSection from '@/components/news/CommentsSection';
import { Comment } from '@/lib/api';
```

**Стало:**
```tsx
import { CommentsContainer } from '@/components/comments';
import type { Comment } from '@/types/comments';
```

### Шаг 2: Заменить компонент

**Было:**
```tsx
<CommentsSection newsId={newsId} />
```

**Стало:**
```tsx
<CommentsContainer newsId={newsId} />
```

### Шаг 3: Применить миграцию БД

```bash
cd backend
node scripts/migrate-003.js
```

---

## 📚 Дополнительные ресурсы

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [shadcn/ui Documentation](https://ui.shadcn.com)

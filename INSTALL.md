# Инструкция по установке зависимостей и запуску

## Установка зависимостей

### Фронтенд

Откройте терминал в корне проекта (`sin-city-sentinels/`) и выполните:

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-image-resize @tiptap/extension-link @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-underline @tiptap/extension-color @tiptap/extension-text-align @tiptap/extension-character-count dompurify emoji-mart react-dropzone
```

### Бекэнд

Откройте терминал в папке бекэнда (`sin-city-sentinels/backend/`) и выполните:

```bash
cd backend
npm install multer sharp uuid
```

## Запуск

### Терминал 1 (Бекэнд):

```bash
cd backend
npm run dev
```

Ожидаемый вывод:
```
🐰 Sin City Sentinels backend running on port 3000
```

### Терминал 2 (Фронтенд):

```bash
npm run dev
```

Ожидаемый вывод:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
```

## Проверка функционала

1. Откройте `http://localhost:8080`
2. Войдите в админку (если есть учётная запись)
3. Перейдите в раздел "Новости"
4. Нажмите "Добавить новость"

### Доступный функционал редактора:

**Форматирование текста:**
- Жирный, курсив, подчёркнутый, зачёркнутый
- Заголовки H1, H2, H3
- Списки (маркированные и нумерованные)
- Выравнивание (слева, центр, справа, по ширине)
- Ссылки
- Таблицы
- Горизонтальная линия
- Очистка форматирования

**Изображения:**
- Вставка по URL
- Загрузка с компьютера (drag & drop)
- Вставка из буфера обмена (Ctrl+V)
- Изменение размера изображений
- Изображение шапки новости (загрузка или URL)

**Эмодзи:**
- Кнопка смайлика справа от заголовка формы
- Выбор эмодзи из пикера

## Безопасность

**Ограничения:**
- Макс. размер файла: 2MB (обычные), 5MB (шапка новости)
- Разрешённые форматы: JPEG, PNG, GIF, WebP
- SVG запрещён (может содержать XSS)
- Макс. 5 файлов за раз
- Rate limiting: 10 загрузок в минуту

**Защита:**
- Валидация MIME-типов (не только расширения)
- Генерация уникальных имён файлов (UUID)
- Сжатие изображений >1MB
- Санитизация HTML в редакторе
- Авторизация для всех операций загрузки

## Структура файлов

```
src/components/admin/
  ├── NewsForm.tsx (обновлён)
  ├── NewsAdmin.tsx (без изменений)
  ├── RichTextEditor.tsx (новый)
  ├── RichTextEditorToolbar.tsx (новый)
  ├── RichTextEditor.css (новый)
  ├── ImageUploader.tsx (новый)
  ├── EmojiPicker.tsx (новый)
  └── NewsHeaderImageUploader.tsx (новый)

backend/
  ├── src/middleware/uploadValidator.js (новый)
  ├── src/utils/fileUtils.js (новый)
  ├── src/controllers/uploadController.js (новый)
  ├── src/routes/uploadRoutes.js (новый)
  ├── server.js (обновлён)
  └── uploads/news-images/ (создаётся автоматически)
```

## Возможные проблемы

### Ошибка "Module not found"

Убедитесь, что все зависимости установлены:
```bash
npm install
```

### Ошибка загрузки файлов

Проверьте, что папка `backend/uploads` существует и есть права на запись:
```bash
mkdir -p backend/uploads/news-images
```

### CORS ошибки

Убедитесь, что в `backend/.env` правильно указан `CORS_ORIGIN`:
```
CORS_ORIGIN=http://localhost:8080
```

### Изображения не отображаются

Проверьте, что сервер раздаёт статические файлы:
- Откройте `http://localhost:3000/uploads/news-images/` - должен быть список файлов
- Убедитесь, что URL в редакторе начинается с `/uploads/`

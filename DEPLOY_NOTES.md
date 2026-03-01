# Заметки для деплоя на сервер

## Файлы для деплоя

### Бекэнд (на сервер):

**Новые файлы:**
- `backend/src/middleware/uploadValidator.js`
- `backend/src/utils/fileUtils.js`
- `backend/src/controllers/uploadController.js`
- `backend/src/routes/uploadRoutes.js`

**Обновлённые файлы:**
- `backend/server.js`

**Зависимости (установить на сервере):**
```bash
cd backend
npm install
# или
npm install multer sharp uuid
```

**Директории:**
- Создать `backend/uploads/` с правами на запись
- Создать `backend/uploads/news-images/`

```bash
mkdir -p /var/www/rabbits/backend/uploads/news-images
chown -R www-data:www-data /var/www/rabbits/backend/uploads
chmod -R 755 /var/www/rabbits/backend/uploads
```

### Фронтенд (сборка):

**Новые файлы:**
- `src/components/admin/RichTextEditor.tsx`
- `src/components/admin/RichTextEditorToolbar.tsx`
- `src/components/admin/RichTextEditor.css`
- `src/components/admin/ImageUploader.tsx`
- `src/components/admin/EmojiPicker.tsx`
- `src/components/admin/NewsHeaderImageUploader.tsx`

**Обновлённые файлы:**
- `src/components/admin/NewsForm.tsx`

**Зависимости (установить локально перед сборкой):**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-image-resize @tiptap/extension-link @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-underline @tiptap/extension-color @tiptap/extension-text-align @tiptap/extension-character-count dompurify emoji-mart react-dropzone
```

**Сборка:**
```bash
npm run build
```

## Конфигурация на сервере

### backend/.env.production

```
NODE_ENV=production
PORT=3000
DB_PATH=/var/www/rabbits/backend/data/app.db
JWT_SECRET=your_secret_key
CORS_ORIGIN=https://wickedrabbits.ru
LOG_LEVEL=info
```

### .env.production (фронтенд)

```
VITE_API_URL=https://wickedrabbits.ru/api
```

### Nginx конфигурация

Добавить location для раздачи загруженных файлов:

```nginx
server {
    listen 80;
    server_name wickedrabbits.ru;
    
    # Фронтенд
    location / {
        root /var/www/rabbits/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Бекэнд API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Загруженные файлы (изображения новостей)
    location /uploads {
        alias /var/www/rabbits/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Защита от выполнения PHP/скриптов
        location ~ \.(php|php5|phtml)$ {
            deny all;
            return 404;
        }
    }
    
    # Аватарки (существующее)
    location /avatars {
        alias /var/www/rabbits/public/avatars;
        expires 30d;
    }
}
```

## Миграция данных

**Не требуется!** 

Все существующие новости сохранятся. Новые поля используются только для новых функций.

## Проверка после деплоя

1. **Проверка загрузки файлов:**
   - Зайти в админку → Новости → Добавить новость
   - Попробовать загрузить изображение через drag & drop
   - Проверить, что изображение отображается в редакторе

2. **Проверка отображения:**
   - Открыть новость на публичной странице
   - Убедиться, что изображения и форматирование отображаются корректно

3. **Проверка безопасности:**
   - Попробовать загрузить файл >5MB (должна быть ошибка)
   - Попробовать загрузить .exe файл (должна быть ошибка)
   - Проверить rate limiting (10 загрузок в минуту)

4. **Проверка путей:**
   - Открыть DevTools → Network
   - Убедиться, что запросы идут на правильный домен
   - Проверить, что изображения загружаются с `/uploads/...`

## Откат изменений

Если что-то пошло не так:

**Бекэнд:**
```bash
cd /var/www/rabbits/backend
git checkout HEAD -- server.js
rm -f src/middleware/uploadValidator.js
rm -f src/utils/fileUtils.js
rm -f src/controllers/uploadController.js
rm -f src/routes/uploadRoutes.js
npm uninstall multer sharp uuid
pm2 restart rabbits-backend
```

**Фронтенд:**
```bash
cd /var/www/rabbits
git checkout HEAD -- src/components/admin/NewsForm.tsx
rm -rf src/components/admin/RichTextEditor*
rm -rf src/components/admin/ImageUploader.tsx
rm -rf src/components/admin/EmojiPicker.tsx
rm -rf src/components/admin/NewsHeaderImageUploader.tsx
npm uninstall @tiptap/* dompurify emoji-mart react-dropzone
npm run build
```

## Мониторинг

**Логи для проверки:**
```bash
# Логи бекэнда
tail -f /var/log/rabbits/backend.log

# Логи nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Размер загруженных файлов
du -sh /var/www/rabbits/backend/uploads/news-images/
```

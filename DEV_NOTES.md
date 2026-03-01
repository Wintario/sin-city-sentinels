# Заметки для разработки

## Локальная разработка

**Запуск:**
1. Терминал 1 (бекэнд): `cd backend && npm run dev`
2. Терминал 2 (фронтенд): `npm run dev`
3. Открыть: http://localhost:8080

## Деплой на сервер

**Frontend:**
```bash
npm run build  # автоматически использует .env.production
```

**Backend:**
```bash
NODE_ENV=production npm start  # автоматически использует .env.production
```

**Или через PM2:**
```bash
pm2 start backend/server.js --name rabbit-website-api --env NODE_ENV=production
```

## Конфигурация

### Переменные окружения работают автоматически:

| Среда | Frontend | Backend |
|-------|----------|---------|
| **Локально** (`npm run dev`) | `.env` → `VITE_API_URL=http://localhost:3000/api` | `.env` → `CORS_ORIGIN=http://localhost:8080` |
| **Сервер** (`npm run build` / `NODE_ENV=production`) | `.env.production` → `VITE_API_URL=https://wickedrabbits.ru/api` | `.env.production` → `CORS_ORIGIN=https://wickedrabbits.ru` |

### Важно:
- ✅ **Не нужно менять файлы вручную** — Vite и dotenv выбирают правильный файл автоматически
- ✅ **Frontend**: `npm run dev` использует `.env`, `npm run build` использует `.env.production`
- ✅ **Backend**: `NODE_ENV=development` использует `.env`, `NODE_ENV=production` использует `.env.production`

## База данных

SQLite: `backend/data/app.db` (скопирована с сервера)

## Технологии

- Фронтенд: React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- Бекэнд: Node.js 24 + Express + better-sqlite3
- Домен: https://wickedrabbits.ru

## Парсинг ссылок на персонажей (kovcheg2.apeha.ru)

### Источники данных

**Импорт персонажа** (кнопка ℹ️ в редакторе):
- Ник и уровень: из `<title>Ник - Раса [Уровень] - Персональная информация</title>`
- Клан: из `<td class="writer">Состоит в</td><td>...<img src="..."> <a href="...">Название клана</a>...</td>`
- Изображение: из `<div style="background: url('https://resources.apeha.ru/pers/N_NNNN.gif')">`

**Вставка образа** (в диалоге загрузки изображения):
- Изображение персонажа: из `<div style="...background: url('...pers/N_NNNN.gif')...">`

### Обработка редиректов

Серверы игры могут перенаправлять между доменами:
- `kovcheg2.apeha.ru` → `magicforest.apeha.ru` → другие сервера
- Редирект через JavaScript: `location.href="URL"`
- URL может быть относительным: `info.html?user=123`

**Алгоритм:**
1. Загрузить исходный URL через backend proxy
2. Проверить HTML на наличие `location.href="..."`
3. Если найден редирект:
   - Преобразовать относительный URL в абсолютный через `new URL(relative, baseUrl)`
   - Загрузить страницу по новому URL
4. Парсить данные из финальной страницы

### Backend proxy (`/api/proxy/fetch`)

**Команда curl:**
```bash
curl -s --max-time 10 -A "Mozilla/5.0" "URL"
```

**Конвертация кодировки:**
- Сайт использует Windows-1251
- Backend конвертирует в UTF-8 через `iconv-lite`
- Fallback: ручная декодировка через таблицу символов

**Валидация URL:**
- Только `http:` и `https:`
- Домен должен содержать `apeha.ru`

### Frontend парсинг

**Функция `parseCharacterData(html)`:**
```javascript
// Ник и уровень из title
const titleMatch = html.match(/<title[^>]*>([^<]+?)\s*-\s*[^\[]+\s*\[(\d+)\]/i);

// Клан из таблицы
const clanMatch = html.match(/<td[^>]*class="writer"[^>]*>Состоит[^<]*<\/td>\s*<td[^>]*>([\s\S]{0,1000}?)<\/td>/i);

// Изображение из background
const match = style.match(/background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+pers\/\d+_\d+\.gif)['"]?\)/i);
```

**Функция `fetchHtml(url)`:**
- Загружает HTML через `/api/proxy/fetch`
- Обрабатывает JavaScript редиректы
- Преобразует относительные URL в абсолютные

### Частые проблемы

1. **Пустой HTML (length: 0)** — curl не выполнился, проверить backend логи
2. **Редирект на относительный URL** — преобразовывать через `new URL(relative, baseUrl)`
3. **Таймаут 10 секунд** — сервер может медленно отвечать, повторить запрос
4. **Блокировка AdGuard DNS** — сервер показывает страницу блокировки вместо персонажа

## Последнее изменение

CORS настроен, credentials изменён с 'include' на 'same-origin'

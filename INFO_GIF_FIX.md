# Fix для отображения info.gif (иконка импорта персонажа)

## Проблема
При импорте персонажа иконка `info` не отображалась на продакшене, хотя работала на localhost.

## Решение

### 1. Файл info.gif
- Расположение: `backend/static/info.gif`
- Доступен по URL: `/static/info.gif`

### 2. Изменения в коде

**backend/server.js**
```javascript
// Выдача info.gif для импорта персонажей
app.use('/static', express.static(join(__dirname, 'static')));

// CSP настройки (helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"]
    }
  }
}));
```

**src/components/admin/ImportCharacter.tsx**
```typescript
// Используем локальный путь к файлу через бэкенд
const infoIcon = '/static/info.gif';
```

### 3. Nginx конфигурация
Добавлен маршрут для `/static`:
```nginx
location /static {
    alias /var/www/rabbits/backend/static/;
}
```

### 4. Обновление существующего контента в БД
```sql
UPDATE news SET content = REPLACE(content, '/src/assets/info.gif', '/static/info.gif');
```

## Коммиты
- `38e7bdd` - Serve info.gif via backend static route
- `303efa3` - Fix CSP to allow images from same origin
- `169f8b7` - Fix CSP configuration - remove invalid directive
- `fefd187` - Disable helmet CSP defaults to remove upgrade-insecure-requests

## Почему это работает
1. Изображение раздаётся через бэкенд (не внешний ресурс)
2. CSP разрешает изображения с `'self'` (тот же домен)
3. Нет директивы `upgrade-insecure-requests`
4. Nginx корректно отдаёт файлы из `/static/`

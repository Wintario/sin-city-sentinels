# API документации по загрузке изображений

## Эндпоинты загрузки

### POST /api/upload/image

Загрузка изображений для контента новости (до 5 файлов).

**Требования:**
- Авторизация: требуется (role: admin или author)
- Content-Type: `multipart/form-data`
- Rate limiting: 10 запросов в минуту

**Параметры:**
```
images: File[] (max 5 файлов, max 2MB каждый)
```

**Ответ (успех):**
```json
{
  "success": true,
  "files": [
    {
      "filename": "1234567890_uuid_image.jpg",
      "originalname": "image.jpg",
      "url": "/uploads/news-images/1234567890_uuid_image.jpg",
      "size": 102400,
      "mimetype": "image/jpeg"
    }
  ],
  "message": "Загружено файлов: 1"
}
```

**Ответ (ошибка):**
```json
{
  "error": "Файл слишком большой. Максимальный размер: 2MB"
}
```

**Пример использования (JavaScript):**
```javascript
const fileInput = document.getElementById('image-input');
const files = fileInput.files;

const formData = new FormData();
for (const file of files) {
  formData.append('images', file);
}

const response = await fetch('/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result.files[0].url); // /uploads/news-images/...
```

---

### POST /api/upload/header-image

Загрузка изображения шапки новости (1 файл).

**Требования:**
- Авторизация: требуется (role: admin или author)
- Content-Type: `multipart/form-data`
- Rate limiting: 10 запросов в минуту

**Параметры:**
```
image: File (max 1 файл, max 5MB)
```

**Ответ (успех):**
```json
{
  "success": true,
  "file": {
    "filename": "1234567890_uuid_header.png",
    "originalname": "header.png",
    "url": "/uploads/news-images/1234567890_uuid_header.png",
    "size": 512000,
    "mimetype": "image/png"
  }
}
```

**Пример использования:**
```javascript
const fileInput = document.getElementById('header-image-input');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('image', file);

const response = await fetch('/api/upload/header-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result.file.url);
```

---

### DELETE /api/upload/image/:filename

Удаление загруженного изображения.

**Требования:**
- Авторизация: требуется (role: admin или author)

**Параметры:**
```
filename: string (в URL)
```

**Ответ (успех):**
```json
{
  "success": true,
  "message": "Изображение удалено"
}
```

**Пример:**
```javascript
const filename = '1234567890_uuid_image.jpg';

const response = await fetch(`/api/upload/image/${filename}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
```

---

## Разрешённые форматы файлов

| Формат | MIME тип | Расширения | Макс. размер |
|--------|----------|------------|--------------|
| JPEG | image/jpeg | .jpg, .jpeg | 2MB / 5MB |
| PNG | image/png | .png | 2MB / 5MB |
| GIF | image/gif | .gif | 2MB / 5MB |
| WebP | image/webp | .webp | 2MB / 5MB |

**SVG запрещён** из соображений безопасности (может содержать XSS).

---

## Валидация

**На стороне сервера:**
1. Проверка MIME-типа
2. Проверка расширения файла
3. Проверка размера файла
4. Генерация уникального имени (UUID + timestamp)
5. Сжатие изображений >1MB

**На стороне клиента:**
1. Предварительная проверка размера
2. Проверка типа файла
3. Предпросмотр изображения

---

## Хранение файлов

**Структура:**
```
backend/
  uploads/
    news-images/
      1234567890_uuid_originalname.jpg
      1234567891_uuid_header.png
      ...
```

**Публичный доступ:**
```
https://wickedrabbits.ru/uploads/news-images/1234567890_uuid_originalname.jpg
```

---

## Безопасность

**Защита от уязвимостей:**
- Валидация MIME-типов (не только расширения)
- Проверка "магических байтов" файла
- Санитизация имени файла
- Генерация уникальных имён
- Ограничение размера файлов
- Rate limiting
- Логирование всех загрузок

**Защита от XSS:**
- SVG запрещён
- Изображения отдаются как статические файлы
- Нет выполнения скриптов в директории uploads

**Защита от DoS:**
- Макс. 10 загрузок в минуту на пользователя
- Макс. 5 файлов за раз
- Ограничение размера файлов

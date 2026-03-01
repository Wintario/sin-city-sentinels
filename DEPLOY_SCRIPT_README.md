# 🐰 Скрипт автоматического развёртывания

**Sin City Sentinels** — сайт клана "Свирепые Кролики"

## 🚀 Быстрый старт

### Одна команда для развёртывания:

```bash
sudo bash <(curl -s https://raw.githubusercontent.com/Wintario/sin-city-sentinels/main/deploy.sh)
```

### Или вручную:

```bash
# 1. Скопируйте deploy.sh на сервер
scp deploy.sh user@your-server:/tmp/

# 2. Запустите скрипт
ssh user@your-server
cd /tmp
sudo bash deploy.sh
```

---

## 📋 Что делает скрипт

| Шаг | Действие |
|-----|----------|
| 1 | Остановка старых процессов (PM2, Node.js, Nginx) |
| 2 | Очистка старой версии проекта |
| 3 | Создание директорий |
| 4 | Установка зависимостей (Node.js 20 LTS, PM2, Nginx, Git) |
| 5 | Клонирование репозитория с GitHub |
| 6 | Сборка фронтенда (React + Vite) |
| 7 | Настройка бекенда (создание .env, миграции БД) |
| 8 | Создание директорий для загрузок |
| 9 | Настройка Nginx (reverse proxy + статика) |
| 10 | Запуск бекенда через PM2 |
| 11 | Проверка работоспособности |
| 12 | Вывод итоговой информации |

---

## ✅ Требования

- **ОС:** Ubuntu 20.04+ (проверено на 24.04)
- **RAM:** 2GB минимум (4GB рекомендуется)
- **Диск:** 5GB свободного места
- **Права:** Root-доступ или sudo
- **Порт:** 80 должен быть свободен

---

## 🔧 После развёртывания

### Доступ к сайту:
```
Фронтенд:     http://<IP-сервера>
Админка:      http://<IP-сервера>/admin
Health:       http://<IP-сервера>/api/health
```

### Учётные данные по умолчанию:
```
Администратор: admin / admin
Автор:         author / author
```

⚠️ **Смените пароли немедленно после первого входа!**

---

## 📊 Полезные команды

### Управление бекендом (PM2)
```bash
pm2 status                    # Статус процессов
pm2 logs rabbits-backend      # Логи в реальном времени
pm2 restart rabbits-backend   # Перезапуск
pm2 stop rabbits-backend      # Остановка
pm2 start rabbits-backend     # Запуск
pm2 save                      # Сохранить состояние
```

### Управление Nginx
```bash
sudo systemctl status nginx   # Статус
sudo systemctl reload nginx   # Перезагрузка конфига
sudo systemctl restart nginx  # Полный рестарт
sudo nginx -t                 # Проверка конфига
```

### Логи
```bash
# Backend
pm2 logs rabbits-backend --lines 50

# Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System
sudo journalctl -u nginx -f
```

### База данных
```bash
cd /var/www/rabbits/backend
sqlite3 data/app.db

# Полезные запросы:
.tables                      # Показать таблицы
SELECT * FROM users;         # Все пользователи
SELECT * FROM members;       # Все участники
SELECT * FROM news;          # Все новости
```

---

## 📁 Структура после деплоя

```
/var/www/rabbits/
├── dist/                      # Собранный фронтенд (React)
├── public/
│   ├── avatars/               # Аватарки участников
│   └── favicon.png
├── backend/
│   ├── src/                   # Исходный код бекенда
│   ├── data/
│   │   └── app.db            # SQLite база
│   ├── uploads/
│   │   └── news-images/      # Изображения новостей
│   ├── .env                   # Конфигурация
│   ├── server.js              # Точка входа
│   └── package.json
├── src/                       # Исходный код фронтенда
├── package.json
└── deploy.sh                  # Скрипт деплоя

/etc/nginx/sites-available/
└── rabbits                    # Конфиг Nginx
```

---

## 🔍 Проверка после деплоя

### 1. Проверка бекенда
```bash
curl http://127.0.0.1:3000/api/health
# Ожидаемый ответ: {"status":"ok",...}
```

### 2. Проверка фронтенда
```bash
curl -I http://127.0.0.1/
# Ожидаемый статус: HTTP/1.1 200 OK
```

### 3. Проверка аватарок
```bash
ls -la /var/www/rabbits/public/avatars/
curl http://127.0.0.1/avatars/имя_файла.gif
```

### 4. Проверка API
```bash
curl http://127.0.0.1/api/news
curl http://127.0.0.1/api/members
```

---

## 🐛 Решение проблем

### Бекенд не запускается
```bash
# Проверить логи
pm2 logs rabbits-backend --nostream

# Проверить порт
sudo lsof -i :3000

# Перезапустить
pm2 restart rabbits-backend
```

### Nginx выдаёт 502 Bad Gateway
```bash
# Проверить конфиг
sudo nginx -t

# Проверить бекенд
pm2 status

# Проверить proxy_pass в конфиге
sudo cat /etc/nginx/sites-available/rabbits
```

### Фронтенд не обновляется
```bash
# Пересобрать
cd /var/www/rabbits
npm run build

# Перезагрузить Nginx
sudo systemctl reload nginx
```

### Ошибка "Permission denied"
```bash
# Исправить права
sudo chmod -R 755 /var/www/rabbits
sudo chown -R www-data:www-data /var/www/rabbits/public
sudo chown -R www-data:www-data /var/www/rabbits/backend/uploads
```

---

## 🔄 Обновление существующей версии

Для обновления кода без полного переразвёртывания:

```bash
cd /var/www/rabbits

# Обновить код
git pull origin main

# Пересобрать фронтенд
npm install
npm run build

# Обновить зависимости бекенда
cd backend
npm install

# Перезапустить бекенд
pm2 restart rabbits-backend

# Перезагрузить Nginx
sudo systemctl reload nginx
```

---

## 📝 История версий

### v3.0 (2026-03-01)
- ✅ Улучшена цветовая индикация в логах
- ✅ Добавлены вспомогательные функции логирования
- ✅ Улучшена обработка ошибок
- ✅ Добавлена проверка валидности Nginx конфига
- ✅ Добавлены заголовки безопасности
- ✅ Улучшена финальная информация

### v2.3 (2025-12-10)
- ✅ Исправлено размещение /api/health endpoint
- ✅ Добавлена поддержка аватарок в Nginx
- ✅ Исправлены синтаксические ошибки server.js

### v2.0 (2025-12-10)
- ✅ Начальная версия скрипта
- ✅ Полная автоматизация деплоя

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `pm2 logs rabbits-backend`
2. Проверьте конфиг Nginx: `sudo nginx -t`
3. Проверьте статус процессов: `pm2 status`
4. Откройте issue на [GitHub](https://github.com/Wintario/sin-city-sentinels/issues)

---

**Версия:** 3.0  
**Последнее обновление:** 2026-03-01  
**Автор:** Wintario  
**Протестировано на:** Ubuntu 24.04, Node.js 20.x, Nginx 1.24

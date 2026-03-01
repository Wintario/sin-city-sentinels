#!/bin/bash

# Скрипт для проверки конфигурации сервера
# Запустите: bash check-server.sh

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  🐰 Проверка конфигурации сервера                                  ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Проверяем /var/www
echo "📁 Директория /var/www:"
ls -la /var/www/ 2>/dev/null || echo "   Директория /var/www не найдена"
echo ""

# 2. Проверяем /var/www/rabbits
echo "📁 Директория /var/www/rabbits:"
if [ -d "/var/www/rabbits" ]; then
    ls -la /var/www/rabbits/
    echo ""
    echo "📊 Git статус:"
    cd /var/www/rabbits && git log -1 --oneline
else
    echo "   Директория /var/www/rabbits не найдена"
fi
echo ""

# 3. Проверяем другие возможные директории
echo "🔍 Поиск других веб-проектов:"
find /var/www -maxdepth 2 -name "index.html" 2>/dev/null || echo "   index.html не найден в /var/www"
find /home -maxdepth 3 -name "index.html" 2>/dev/null || echo "   index.html не найден в /home"
echo ""

# 4. Проверяем Nginx конфигурацию
echo "🔧 Конфигурация Nginx:"
if [ -f "/etc/nginx/sites-enabled/rabbits" ]; then
    echo "   Найден: /etc/nginx/sites-enabled/rabbits"
    cat /etc/nginx/sites-enabled/rabbits
elif [ -f "/etc/nginx/nginx.conf" ]; then
    echo "   Основной конфиг:"
    grep -A 5 "root\|location" /etc/nginx/nginx.conf | head -20
else
    echo "   Конфигурация Nginx не найдена"
fi
echo ""

# 5. Проверяем активные Nginx конфиги
echo "📋 Активные сайты Nginx:"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "   sites-enabled не найден"
echo ""

# 6. Проверяем PM2 процессы
echo "🚀 PM2 процессы:"
pm2 status 2>/dev/null || echo "   PM2 не запущен или не установлен"
echo ""

# 7. Проверяем порты
echo "🌐 Активные порты:"
ss -tlnp | grep -E ":80|:3000|:8080" || echo "   Порты 80, 3000, 8080 не активны"
echo ""

# 8. Проверяем текущую директорию Nginx
echo "📍 Корневая директория Nginx:"
nginx -T 2>/dev/null | grep "root " | head -5 || echo "   Не удалось определить"
echo ""

echo "════════════════════════════════════════════════════════════════════"
echo "Готово! Покажите этот вывод для определения расположения сайта."

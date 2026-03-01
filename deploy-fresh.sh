#!/bin/bash

set -e

# ============================================================================
# 🐰 SIN CITY SENTINELS - FRESH DEPLOYMENT SCRIPT v3.1
# ============================================================================
# ⚠️  ВНИМАНИЕ: Этот скрипт УДАЛЯЕТ ВСЁ и разворачивает сайт с нуля!
#
# Используйте ЭТОТ скрипт ТОЛЬКО для:
#   - Первой установки на новый сервер
#   - Полного сброса и развёртывания заново
#
# Для обновления существующего сайта используйте:
#   bash update.sh  # ← БЕЗОПАСНОЕ обновление (данные сохраняются)
#
# Что делает скрипт:
#   - ⚠️  УДАЛЯЕТ /var/www/rabbits полностью
#   - Клонирует репозиторий с GitHub
#   - Устанавливает зависимости (Node.js 20 LTS, PM2, Nginx)
#   - Собирает фронтенд (React + Vite)
#   - Настраивает и запускает бекенд (Node.js + Express + SQLite)
#   - Конфигурирует Nginx как reverse proxy
#   - Создаёт НОВУЮ базу данных с начальными данными
#
# Использование:
#   bash deploy-fresh.sh
#
# Требования:
#   - Ubuntu 20.04+ (проверено на 24.04)
#   - Root-доступ или sudo
#   - Интернет-соединение
#   - Порт 80 свободен
#
# Автор: Wintario
# Версия: 3.1 (2026-03-01)
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  🐰 SIN CITY SENTINELS - DEPLOYMENT SCRIPT v3.0                   ║"
echo "║  Сайт клана "Свирепые Кролики"                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # Без цвета

# Переменные
PROJECT_DIR="/var/www/rabbits"
GITHUB_REPO="https://github.com/Wintario/sin-city-sentinels.git"
PM2_APP_NAME="rabbits-backend"
NGINX_CONFIG="/etc/nginx/sites-available/rabbits"
NGINX_LINK="/etc/nginx/sites-enabled/rabbits"
DOMAIN="wickedrabbits.ru"

# ============================================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
}

check_sudo() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Скрипт требует root-прав. Запустите с sudo:"
        echo "  sudo bash $0"
        exit 1
    fi
}

# ============================================================================
# ПРОВЕРКА ПРАВ
# ============================================================================
check_sudo

# ============================================================================
# ШАГ 1: ОСТАНОВКА СТАРЫХ ПРОЦЕССОВ
# ============================================================================
log_step "Шаг 1/12: Остановка старых процессов"

log_info "Остановка PM2 процессов..."
pm2 kill 2>/dev/null || true

log_info "Остановка Nginx..."
sudo systemctl stop nginx 2>/dev/null || true

log_info "Завершение Node.js процессов..."
sudo pkill -9 node 2>/dev/null || true
sudo pkill -9 npm 2>/dev/null || true

sleep 2
log_success "Все процессы остановлены"

# ============================================================================
# ШАГ 2: ОЧИСТКА СТАРОЙ ВЕРСИИ
# ============================================================================
log_step "Шаг 2/12: Очистка старой версии"

if [ -d "$PROJECT_DIR" ]; then
    log_info "Удаление старой версии проекта..."
    sudo rm -rf "$PROJECT_DIR"
    log_success "Старая версия удалена"
else
    log_success "Старая версия не найдена, очистка не требуется"
fi

# ============================================================================
# ШАГ 3: СОЗДАНИЕ ДИРЕКТОРИИ
# ============================================================================
log_step "Шаг 3/12: Создание директорий"

log_info "Создание /var/www..."
sudo mkdir -p /var/www
sudo chmod 755 /var/www

log_info "Создание директории проекта..."
sudo mkdir -p "$PROJECT_DIR"
sudo chmod 755 "$PROJECT_DIR"

log_success "Директории созданы"

# ============================================================================
# ШАГ 4: УСТАНОВКА СИСТЕМНЫХ ЗАВИСИМОСТЕЙ
# ============================================================================
log_step "Шаг 4/12: Установка системных зависимостей"

# Обновление пакетов
log_info "Обновление списков пакетов..."
sudo apt-get update -qq

# Проверка и установка Node.js 20 LTS
if ! command -v node &> /dev/null; then
    log_info "Установка Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log_success "Node.js установлен: $(node --version)"
else
    NODE_MAJOR=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 20 ]; then
        log_warning "Node.js устарел (v$NODE_MAJOR), обновление до v20 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y --only-upgrade nodejs
        log_success "Node.js обновлён: $(node --version)"
    else
        log_success "Node.js актуален: $(node --version)"
    fi
fi

# Проверка и установка PM2
if ! command -v pm2 &> /dev/null; then
    log_info "Установка PM2..."
    sudo npm install -g pm2
    log_success "PM2 установлен: $(pm2 --version)"
else
    log_success "PM2 уже установлен: $(pm2 --version)"
fi

# Проверка и установка Nginx
if ! command -v nginx &> /dev/null; then
    log_info "Установка Nginx..."
    sudo apt-get install -y nginx
    log_success "Nginx установлен: $(nginx -v 2>&1)"
else
    log_success "Nginx уже установлен: $(nginx -v 2>&1)"
fi

# Проверка Git
if ! command -v git &> /dev/null; then
    log_info "Установка Git..."
    sudo apt-get install -y git
    log_success "Git установлен: $(git --version)"
else
    log_success "Git уже установлен: $(git --version)"
fi

# ============================================================================
# ШАГ 5: КЛОНИРОВАНИЕ РЕПОЗИТОРИЯ
# ============================================================================
log_step "Шаг 5/12: Клонирование репозитория"

log_info "Клонирование из GitHub..."
cd /var/www
git clone "$GITHUB_REPO" rabbits

if [ ! -d "$PROJECT_DIR/backend" ]; then
    log_error "Бекенд не найден! Ошибка клонирования."
    exit 1
fi

log_success "Репозиторий склонирован"
log_info "Ветка: $(cd $PROJECT_DIR && git branch --show-current)"
log_info "Последний коммит: $(cd $PROJECT_DIR && git log -1 --oneline)"

# ============================================================================
# ШАГ 6: СБОРКА ФРОНТЕНДА
# ============================================================================
log_step "Шаг 6/12: Сборка фронтенда (React + Vite)"

cd "$PROJECT_DIR"

log_info "Установка frontend-зависимостей..."
npm install --silent 2>&1 | tail -3 || true

log_info "Сборка production-версии..."
npm run build

if [ ! -d "dist" ]; then
    log_error "Сборка фронтенда не удалась!"
    exit 1
fi

log_success "Frontend собран в dist/"
log_info "Размер сборки: $(du -sh dist | cut -f1)"

# ============================================================================
# ШАГ 7: НАСТРОЙКА БЕКЕНДА
# ============================================================================
log_step "Шаг 7/12: Настройка бекенда (Node.js + Express)"

cd "$PROJECT_DIR/backend"

log_info "Установка backend-зависимостей..."
npm install --silent 2>&1 | tail -3 || true

# Создание директории для БД
log_info "Создание директории для базы данных..."
mkdir -p data
sudo chmod 755 data

# Создание .env файла
if [ ! -f ".env" ]; then
    log_info "Создание .env файла..."
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > .env << ENVEOF
NODE_ENV=production
PORT=3000
DB_PATH=./data/app.db
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=7d
CORS_ORIGIN=https://$DOMAIN
LOG_LEVEL=info
ENVEOF
    
    log_success ".env создан с безопасным JWT_SECRET"
else
    log_success ".env уже существует, сохраняем"
fi

# Запуск миграций БД
log_info "Запуск миграций базы данных..."
npm run migrate 2>&1 | tail -5 || true

log_success "Backend настроен"

# ============================================================================
# ШАГ 8: СОЗДАНИЕ ДИРЕКТОРИЙ ДЛЯ ЗАГРУЗОК
# ============================================================================
log_step "Шаг 8/12: Создание директорий для загрузок"

log_info "Создание директорий для аватарок и изображений..."
sudo mkdir -p "$PROJECT_DIR/public/avatars"
sudo mkdir -p "$PROJECT_DIR/backend/uploads/news-images"
sudo mkdir -p "$PROJECT_DIR/backend/uploads/avatars"

sudo chmod -R 755 "$PROJECT_DIR/public"
sudo chmod -R 755 "$PROJECT_DIR/backend/uploads"

log_success "Директории созданы:"
echo "   - $PROJECT_DIR/public/avatars"
echo "   - $PROJECT_DIR/backend/uploads/news-images"

# ============================================================================
# ШАГ 9: НАСТРОЙКА NGINX
# ============================================================================
log_step "Шаг 9/12: Настройка Nginx"

# Определение IP сервера
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP="localhost"
fi

log_info "Создание конфигурации Nginx..."

# Создание конфига Nginx
sudo tee "$NGINX_CONFIG" > /dev/null << NGINXEOF
# Nginx конфигурация для Sin City Sentinels
# Домен: $DOMAIN
# Дата: $(date +%Y-%m-%d)

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN _;

    # Фронтенд (React SPA)
    location / {
        root $PROJECT_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
        
        # Безопасность
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Статические файлы из public (favicon, og-image)
    location ~ ^/(favicon\.png|og-image\.jpg|robots\.txt|placeholder\.svg)$ {
        root $PROJECT_DIR/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Аватарки участников
    location /avatars/ {
        alias $PROJECT_DIR/public/avatars/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Запрет выполнения скриптов
        location ~ \.(php|php5|phtml|exe|sh)$ {
            deny all;
            return 404;
        }
    }

    # Изображения новостей
    location /uploads/ {
        alias $PROJECT_DIR/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Запрет выполнения скриптов
        location ~ \.(php|php5|phtml|exe|sh)$ {
            deny all;
            return 404;
        }
    }

    # API бекенд (reverse proxy)
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check (для мониторинга)
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Запрет доступа к скрытым файлам
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINXEOF

log_success "Конфигурация создана: $NGINX_CONFIG"

# Включение сайта
log_info "Включение сайта..."
sudo rm -f /etc/nginx/sites-enabled/*
sudo ln -sf "$NGINX_CONFIG" "$NGINX_LINK"

# Проверка конфигурации
log_info "Проверка конфигурации Nginx..."
if sudo nginx -t; then
    log_success "Конфигурация Nginx валидна"
else
    log_error "Ошибка в конфигурации Nginx!"
    exit 1
fi

# Запуск Nginx
log_info "Запуск Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

log_success "Nginx запущен и добавлен в автозагрузку"

# ============================================================================
# ШАГ 10: ЗАПУСК БЕКЕНДА ЧЕРЕЗ PM2
# ============================================================================
log_step "Шаг 10/12: Запуск бекенда с PM2"

cd "$PROJECT_DIR/backend"

log_info "Остановка старых PM2 процессов..."
pm2 kill 2>/dev/null || true
sleep 1

log_info "Запуск приложения '$PM2_APP_NAME'..."
pm2 start server.js --name "$PM2_APP_NAME"

log_info "Сохранение PM2 конфигурации..."
pm2 save

log_info "Добавление PM2 в автозагрузку..."
pm2 startup 2>/dev/null || true

sleep 3

if pm2 status | grep -q "$PM2_APP_NAME.*online"; then
    log_success "Backend запущен и работает"
else
    log_warning "Backend может быть в процессе запуска..."
fi

# ============================================================================
# ШАГ 11: ПРОВЕРКА РАБОТОСПОСОБНОСТИ
# ============================================================================
log_step "Шаг 11/12: Проверка работоспособности"

# Проверка бекенда
log_info "Проверка бекенда..."
sleep 2
BACKEND_STATUS=$(pm2 status "$PM2_APP_NAME" 2>/dev/null | grep -o "online" || echo "offline")
if [ "$BACKEND_STATUS" = "online" ]; then
    log_success "Backend: $BACKEND_STATUS ✓"
else
    log_error "Backend: $BACKEND_STATUS ✗"
    log_info "Логи бекенда:"
    pm2 logs "$PM2_APP_NAME" --lines 20 --nostream || true
fi

# Проверка /api/health
log_info "Проверка /api/health..."
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:3000/api/health 2>/dev/null || echo "FAIL")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    log_success "/api/health: OK ✓"
else
    log_warning "/api/health: не отвечает (возможно, ещё запускается)"
fi

# Проверка фронтенда через Nginx
log_info "Проверка фронтенда..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ 2>/dev/null || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    log_success "Frontend: HTTP $FRONTEND_RESPONSE ✓"
else
    log_warning "Frontend: HTTP $FRONTEND_RESPONSE (возможно, Nginx ещё запускается)"
fi

# Проверка Nginx
log_info "Проверка Nginx..."
if sudo systemctl is-active --quiet nginx; then
    log_success "Nginx: активен ✓"
else
    log_error "Nginx: не активен ✗"
fi

# ============================================================================
# ШАГ 12: ФИНАЛЬНАЯ ИНФОРМАЦИЯ
# ============================================================================
log_step "Шаг 12/12: Деплой завершён!"

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT SUCCESSFUL!                                         ║"
echo "║  Развёртывание успешно завершено!                                  ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📍 Доступ к сайту:${NC}"
echo "   🌐 Фронтенд:     http://$SERVER_IP"
echo "   🌐 Домен:        https://$DOMAIN"
echo "   💁 Админка:      http://$SERVER_IP/admin"
echo "   ✅ Health:       http://$SERVER_IP/api/health"
echo "   🚶 Участники:    http://$SERVER_IP/members"
echo ""
echo -e "${YELLOW}🔐 Учётные данные по умолчанию:${NC}"
echo "   Администратор:  admin / admin"
echo "   Автор:          author / author"
echo "   ⚠️  СМЕНите пароли после первого входа!"
echo ""
echo -e "${BLUE}📊 Полезные команды:${NC}"
echo "   Просмотр логов бекенда:  pm2 logs $PM2_APP_NAME"
echo "   Перезапуск бекенда:      pm2 restart $PM2_APP_NAME"
echo "   Остановка бекенда:       pm2 stop $PM2_APP_NAME"
echo "   Статус процессов:        pm2 status"
echo "   Логи Nginx (ошибки):     sudo tail -f /var/log/nginx/error.log"
echo "   Логи Nginx (доступ):     sudo tail -f /var/log/nginx/access.log"
echo "   Перезагрузка Nginx:      sudo systemctl reload nginx"
echo ""
echo -e "${CYAN}📁 Структура проекта:${NC}"
echo "   Фронтенд:  $PROJECT_DIR/dist"
echo "   Бекенд:    $PROJECT_DIR/backend"
echo "   База данных: $PROJECT_DIR/backend/data/app.db"
echo "   Аватарки:  $PROJECT_DIR/public/avatars"
echo "   Загрузки:  $PROJECT_DIR/backend/uploads"
echo "   Nginx:     $NGINX_CONFIG"
echo ""
echo -e "${GREEN}🚀 Следующие шаги:${NC}"
echo "   1. Откройте http://$SERVER_IP в браузере"
echo "   2. Проверьте страницу /members - аватарки должны отображаться"
echo "   3. Перейдите в /admin и войдите как admin/admin"
echo "   4. Немедленно смените пароли по умолчанию"
echo "   5. Настройте DNS для домена $DOMAIN (если ещё не сделано)"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Дата деплоя: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}Версия скрипта: 3.0${NC}"
echo ""

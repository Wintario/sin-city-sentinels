#!/bin/bash

set -e

# ============================================================================
# 🐰 SIN CITY SENTINELS - UPDATE SCRIPT (без удаления данных)
# ============================================================================
# Безопасное обновление существующей установки
# 
# Что делает скрипт:
#   - Останавливает бекенд
#   - Делает git pull
#   - Пересобирает фронтенд
#   - Обновляет зависимости
#   - Перезапускает бекенд
#
# НЕ УДАЛЯЕТ:
#   - Базу данных (backend/data/app.db)
#   - Загрузки (backend/uploads/)
#   - .env файлы
#   - Аватарки (public/avatars/)
#
# Использование:
#   bash update.sh
#
# Требования:
#   - Проект уже установлен в /var/www/rabbits
#   - Root-доступ или sudo
#
# Автор: Wintario
# Версия: 1.0 (2026-03-01)
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  🐰 SIN CITY SENTINELS - UPDATE SCRIPT                            ║"
echo "║  Безопасное обновление (данные сохраняются)                       ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
}

# Проверка root
if [ "$EUID" -ne 0 ]; then
    log_error "Требуется sudo. Запустите: sudo bash $0"
    exit 1
fi

PROJECT_DIR="/var/www/rabbits"
PM2_APP_NAME="rabbits-backend"

# ============================================================================
# ШАГ 1: ПРОВЕРКА СУЩЕСТВОВАНИЯ ПРОЕКТА
# ============================================================================
log_step "Шаг 1/7: Проверка установки"

if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Проект не найден в $PROJECT_DIR"
    log_info "Для первой установки используйте: bash deploy-fresh.sh"
    exit 1
fi

if [ ! -d "$PROJECT_DIR/.git" ]; then
    log_error "Директория .git не найдена. Это не клон GitHub."
    exit 1
fi

log_success "Проект найден"

# ============================================================================
# ШАГ 2: ОСТАНОВКА БЕКЕНДА
# ============================================================================
log_step "Шаг 2/7: Остановка бекенда"

pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
sleep 2

log_success "Бекенд остановлен"

# ============================================================================
# ШАГ 3: GIT PULL
# ============================================================================
log_step "Шаг 3/7: Обновление кода из GitHub"

cd "$PROJECT_DIR"

# Сохраняем текущую версию
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
log_info "Текущий коммит: $CURRENT_COMMIT"

# Обновляем
git fetch origin
git reset --hard origin/main

NEW_COMMIT=$(git rev-parse --short HEAD)
log_success "Обновлено до коммита: $NEW_COMMIT"

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    log_warning "Код не изменился. Обновление не требуется."
fi

# ============================================================================
# ШАГ 4: ОБНОВЛЕНИЕ ЗАВИСИМОСТЕЙ И СБОРКА
# ============================================================================
log_step "Шаг 4/7: Установка зависимостей и сборка"

# Frontend
log_info "Установка frontend зависимостей..."
npm install --silent 2>&1 | tail -3 || true

log_info "Сборка frontend..."
npm run build

if [ ! -d "dist" ]; then
    log_error "Сборка frontend не удалась!"
    exit 1
fi

log_success "Frontend собран"

# Backend
log_info "Установка backend зависимостей..."
cd "$PROJECT_DIR/backend"
npm install --silent 2>&1 | tail -3 || true

log_success "Backend зависимости обновлены"

# ============================================================================
# ШАГ 5: ПРОВЕРКА .ENV ФАЙЛОВ
# ============================================================================
log_step "Шаг 5/7: Проверка конфигурации"

# Проверяем .env.production для backend
if [ ! -f "$PROJECT_DIR/backend/.env.production" ]; then
    log_warning ".env.production не найден. Создаю..."
    
    cat > "$PROJECT_DIR/backend/.env.production" << EOF
NODE_ENV=production
PORT=3000
DB_PATH=./data/app.db
JWT_SECRET=q91GqivduveR9uHhDhoaIkG9gnySYmxhG08YrOmaU5o=
JWT_EXPIRE=7d
CORS_ORIGIN=https://wickedrabbits.ru
LOG_LEVEL=info
EOF
    
    log_success ".env.production создан"
else
    log_success ".env.production существует"
fi

# ============================================================================
# ШАГ 6: ЗАПУСК БЕКЕНДА
# ============================================================================
log_step "Шаг 6/7: Запуск бекенда"

cd "$PROJECT_DIR/backend"

pm2 start "$PM2_APP_NAME" --update-env
pm2 save

sleep 3

if pm2 status "$PM2_APP_NAME" | grep -q "online"; then
    log_success "Бекенд запущен"
else
    log_error "Бекенд не запустился. Проверьте логи: pm2 logs $PM2_APP_NAME"
    exit 1
fi

# ============================================================================
# ШАГ 7: ПРОВЕРКА РАБОТОСПОСОБНОСТИ
# ============================================================================
log_step "Шаг 7/7: Проверка API"

sleep 2

# Проверка /api/health
HEALTH=$(curl -s http://127.0.0.1:3000/api/health 2>/dev/null || echo "FAIL")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    log_success "API health: OK"
else
    log_warning "API health: не отвечает (возможно, ещё запускается)"
fi

# Проверка /api/news
NEWS=$(curl -s http://127.0.0.1:3000/api/news 2>/dev/null | head -c 100)
if [ -n "$NEWS" ] && ! echo "$NEWS" | grep -q "error"; then
    log_success "API news: OK"
else
    log_warning "API news: проблема"
fi

# Проверка /api/members
MEMBERS=$(curl -s http://127.0.0.1:3000/api/members 2>/dev/null | head -c 100)
if [ -n "$MEMBERS" ] && ! echo "$MEMBERS" | grep -q "error"; then
    log_success "API members: OK"
else
    log_warning "API members: проблема"
fi

# ============================================================================
# ЗАВЕРШЕНИЕ
# ============================================================================
log_step "Обновление завершено!"

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  ✅ UPDATE SUCCESSFUL!                                             ║"
echo "║  Обновление завершено успешно!                                     ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📍 Сайт доступен:${NC}"
echo "   🌐 https://wickedrabbits.ru"
echo "   💁 https://wickedrabbits.ru/admin"
echo ""
echo -e "${BLUE}📊 Полезные команды:${NC}"
echo "   pm2 logs $PM2_APP_NAME        # Логи бекенда"
echo "   pm2 restart $PM2_APP_NAME     # Перезапуск бекенда"
echo "   pm2 status                    # Статус процессов"
echo ""
echo -e "${CYAN}📁 Данные сохранены:${NC}"
echo "   База данных: $PROJECT_DIR/backend/data/app.db"
echo "   Загрузки:    $PROJECT_DIR/backend/uploads/"
echo "   Аватарки:    $PROJECT_DIR/public/avatars/"
echo ""
echo -e "${BLUE}Дата обновления: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

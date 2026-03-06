/**
 * Playwright тесты для системы комментариев v2
 * 
 * Тестируемый функционал:
 * 1. Создание комментария
 * 2. Ответ на комментарий (вложенность)
 * 3. Редактирование своего комментария
 * 4. Удаление комментария с подтверждением
 * 5. Жалоба на комментарий
 * 6. Проверка прав (нельзя редактировать чужое)
 * 7. Ограничение времени редактирования
 */

import { test, expect } from '@playwright/test';

// Тестовые данные
const TEST_USER = {
  username: 'testcommenter',
  email: 'testcommenter@example.com',
  password: 'test123',
  arenaNickname: 'Тестовый Комментатор',
};

const TEST_COMMENT = {
  content: 'Это тестовый комментарий для проверки новой системы!',
  editedContent: 'Отредактированный тестовый комментарий',
};

const TEST_REPLY = {
  content: 'Это ответ на комментарий',
};

const TEST_REPORT = {
  reason: 'Тестовая жалоба: нарушение правил сообщества',
};

test.describe('Система комментариев v2', () => {
  let context: any;
  let page: any;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    // Регистрация тестового пользователя
    await page.goto('/auth?tab=register');
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.fill('input[name="arenaNickname"]', TEST_USER.arenaNickname);
    await page.fill('input[name="characterUrl"]', 'https://kovcheg2.apeha.ru/info.html?user=1');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Регистрация успешна')).toBeVisible({ timeout: 5000 });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Вход перед каждым тестом
    await page.goto('/auth?tab=login');
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Вход успешен')).toBeVisible({ timeout: 5000 });
  });

  test('1. Создание комментария', async ({ page }) => {
    // Переход на страницу новости
    await page.goto('/news/1');
    
    // Проверка загрузки контейнера комментариев
    await expect(page.locator('h2:has-text("Комментарии")')).toBeVisible();
    
    // Открытие редактора
    await page.click('button:has-text("Написать комментарий")');
    
    // Заполнение комментария
    await page.locator('textarea').fill(TEST_COMMENT.content);
    
    // Проверка счётчика символов
    const remainingChars = await page.locator('text="символов осталось"').textContent();
    expect(remainingChars).toContain((2000 - TEST_COMMENT.content.length).toString());
    
    // Отправка комментария
    await page.click('button:has-text("Опубликовать")');
    
    // Проверка успешного создания
    await expect(page.locator('text="Комментарий опубликован"')).toBeVisible({ timeout: 5000 });
    
    // Проверка отображения комментария
    await expect(page.locator(`text="${TEST_COMMENT.content}"`)).toBeVisible();
  });

  test('2. Ответ на комментарий (вложенность)', async ({ page }) => {
    await page.goto('/news/1');
    
    // Находим существующий комментарий
    const commentElement = page.locator('[class*="CommentItem"]').first();
    await expect(commentElement).toBeVisible();
    
    // Открытие меню действий
    await commentElement.locator('button[aria-label="More"]').click();
    
    // Выбор ответа
    await page.click('text=Ответить');
    
    // Проверка открытия редактора с цитатой
    await expect(page.locator('text="пишет:"')).toBeVisible();
    
    // Заполнение ответа
    await page.locator('textarea').fill(TEST_REPLY.content);
    
    // Отправка ответа
    await page.click('button:has-text("Ответить")');
    
    // Проверка успешного создания ответа
    await expect(page.locator('text="Ответ опубликован"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text="${TEST_REPLY.content}"`)).toBeVisible();
  });

  test('3. Редактирование своего комментария', async ({ page }) => {
    await page.goto('/news/1');
    
    // Находим свой комментарий
    const commentElement = page.locator(`text="${TEST_COMMENT.content}"`).locator('..').locator('..');
    
    // Открытие меню действий
    await commentElement.locator('button[aria-label="More"]').click();
    
    // Выбор редактирования
    await page.click('text=Редактировать');
    
    // Проверка открытия редактора
    await expect(page.locator('text="Редактирование комментария"')).toBeVisible();
    
    // Изменение текста
    await page.locator('textarea').fill(TEST_COMMENT.editedContent);
    
    // Сохранение
    await page.click('button:has-text("Сохранить")');
    
    // Проверка успешного обновления
    await expect(page.locator('text="Комментарий обновлён"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text="${TEST_COMMENT.editedContent}"`)).toBeVisible();
    
    // Проверка индикатора редактирования
    await expect(page.locator('text="(ред.)"')).toBeVisible();
  });

  test('4. Удаление комментария с подтверждением', async ({ page }) => {
    await page.goto('/news/1');
    
    // Создаём комментарий для удаления
    await page.click('button:has-text("Написать комментарий")');
    await page.locator('textarea').fill('Комментарий для удаления');
    await page.click('button:has-text("Опубликовать")');
    await page.waitForTimeout(1000);
    
    // Находим комментарий
    const commentElement = page.locator('text="Комментарий для удаления"').locator('..').locator('..');
    
    // Открытие меню действий
    await commentElement.locator('button[aria-label="More"]').click();
    
    // Выбор удаления
    await page.click('text=Удалить');
    
    // Проверка диалога подтверждения
    await expect(page.locator('text="Удалить комментарий?"')).toBeVisible();
    
    // Подтверждение удаления
    await page.click('button:has-text("Удалить")');
    
    // Проверка успешного удаления
    await expect(page.locator('text="Комментарий удалён"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text="Комментарий для удаления"')).not.toBeVisible();
  });

  test('5. Жалоба на комментарий', async ({ page }) => {
    await page.goto('/news/1');
    
    // Находим чужой комментарий (первый в списке)
    const commentElement = page.locator('[class*="CommentItem"]').first();
    
    // Открытие меню действий
    await commentElement.locator('button[aria-label="More"]').click();
    
    // Выбор жалобы
    await page.click('text=Пожаловаться');
    
    // Проверка диалога жалобы
    await expect(page.locator('text="Пожаловаться на комментарий"')).toBeVisible();
    
    // Заполнение причины (слишком короткой)
    await page.locator('input[id="report-reason"]').fill('Коротко');
    
    // Попытка отправки (должна быть заблокирована)
    const submitButton = page.locator('button:has-text("Отправить жалобу")');
    await expect(submitButton).toBeDisabled();
    
    // Заполнение корректной причины
    await page.locator('input[id="report-reason"]').fill(TEST_REPORT.reason);
    
    // Отправка жалобы
    await submitButton.click();
    
    // Проверка успешной отправки
    await expect(page.locator('text="Жалоба отправлена"')).toBeVisible({ timeout: 5000 });
  });

  test('6. Проверка прав - нельзя редактировать чужое', async ({ page }) => {
    await page.goto('/news/1');
    
    // Находим чужой комментарий
    const commentElement = page.locator('[class*="CommentItem"]').first();
    
    // Открытие меню действий
    await commentElement.locator('button[aria-label="More"]').click();
    
    // Проверка отсутствия кнопки редактирования
    await expect(page.locator('text=Редактировать')).not.toBeVisible();
  });

  test('7. Валидация - пустой комментарий', async ({ page }) => {
    await page.goto('/news/1');
    
    // Открытие редактора
    await page.click('button:has-text("Написать комментарий")');
    
    // Попытка отправки пустого комментария
    await page.click('button:has-text("Опубликовать")');
    
    // Проверка ошибки
    await expect(page.locator('text="Введите текст комментария"')).toBeVisible({ timeout: 3000 });
  });

  test('8. Валидация - слишком длинный комментарий', async ({ page }) => {
    await page.goto('/news/1');
    
    // Открытие редактора
    await page.click('button:has-text("Написать комментарий")');
    
    // Заполнение очень длинного текста
    const longText = 'A'.repeat(2001);
    await page.locator('textarea').fill(longText);
    
    // Проверка счётчика
    await expect(page.locator('text="0 символов осталось"')).toBeVisible();
    
    // Попытка отправки
    await page.click('button:has-text("Опубликовать")');
    
    // Проверка ошибки
    await expect(page.locator('text="слишком длинный"')).toBeVisible({ timeout: 3000 });
  });

  test('9. Валидация - много смайлов', async ({ page }) => {
    await page.goto('/news/1');
    
    // Открытие редактора
    await page.click('button:has-text("Написать комментарий")');
    
    // Заполнение текста с избытком смайлов
    const emojiText = 'Текст ' + '😀'.repeat(11);
    await page.locator('textarea').fill(emojiText);
    
    // Отправка
    await page.click('button:has-text("Опубликовать")');
    
    // Проверка ошибки
    await expect(page.locator('text="Слишком много смайлов"')).toBeVisible({ timeout: 3000 });
  });

  test('10. Отмена редактирования', async ({ page }) => {
    await page.goto('/news/1');
    
    // Находим свой комментарий
    const commentElement = page.locator(`text="${TEST_COMMENT.editedContent}"`).locator('..').locator('..');
    
    // Открытие меню действий
    await commentElement.locator('button[aria-label="More"]').click();
    
    // Выбор редактирования
    await page.click('text=Редактировать');
    
    // Изменение текста
    await page.locator('textarea').fill('Временный текст');
    
    // Отмена
    await page.click('button:has-text("Отмена")');
    
    // Проверка что текст не изменился
    await expect(page.locator(`text="${TEST_COMMENT.editedContent}"`)).toBeVisible();
    await expect(page.locator('text="Временный текст"')).not.toBeVisible();
  });
});

import { exec } from 'child_process';
import iconv from 'iconv-lite';

/**
 * Получить HTML страницы персонажа через curl
 * @param {string} characterUrl - Ссылка на персонажа
 * @returns {Promise<string>} HTML содержимое
 */
export async function fetchCharacterPage(characterUrl) {
  return new Promise((resolve, reject) => {
    console.log('[characterVerificationService] Fetching character page:', characterUrl);

    // Экранируем кавычки в URL для безопасности curl команды
    const escapedUrl = characterUrl.replace(/"/g, '\\"');

    // curl запрос с -L для следования редиректам
    const curlCommand = `curl -sL --max-time 15 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${escapedUrl}"`;

    exec(curlCommand, { encoding: 'buffer', timeout: 20000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('[characterVerificationService] curl error:', error.message);

        if (error.code === 'ENOTFOUND') {
          reject(new Error('Не удалось найти сервер. Проверьте подключение к интернету.'));
          return;
        }

        if (error.killed || error.code === 'ETIMEDOUT') {
          reject(new Error('Превышено время ожидания ответа от сервера (20 сек). Сайт Арены может быть недоступен.'));
          return;
        }

        reject(new Error('Не удалось загрузить страницу персонажа: ' + error.message));
        return;
      }

      console.log('[characterVerificationService] Received', stdout.length, 'bytes');

      // Конвертируем из Windows-1251 в UTF-8
      let html = '';
      try {
        html = iconv.decode(stdout, 'win-1251');
      } catch (e) {
        console.error('[characterVerificationService] Conversion error:', e.message);
        html = stdout.toString('utf8');
      }

      console.log('[characterVerificationService] First 300 chars:', html.substring(0, 300));

      // Проверяем, не пустая ли страница
      if (!html || html.trim().length < 50) {
        console.error('[characterVerificationService] Empty or too short response');
        reject(new Error('Сервер Арены вернул пустую страницу. Попробуйте позже.'));
        return;
      }

      // Проверяем на JavaScript редирект (как в ImportCharacter.tsx)
      const redirectMatch = html.match(/location\.href\s*=\s*["']([^"']+)["']/i);
      if (redirectMatch && redirectMatch[1]) {
        let redirectUrl = redirectMatch[1];
        console.log('[characterVerificationService] Found JavaScript redirect to:', redirectUrl);

        // Если URL относительный - преобразуем в абсолютный
        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
          try {
            redirectUrl = new URL(redirectUrl, characterUrl).href;
          } catch {
            // Игнорируем ошибки парсинга URL
          }
        }

        console.log('[characterVerificationService] Following redirect to:', redirectUrl);

        // Защита от зацикливания - не переходим если URL совпадает с исходным
        if (redirectUrl === characterUrl) {
          console.log('[characterVerificationService] Redirect URL is the same as original, ignoring redirect');
          resolve(html);
          return;
        }

        // Рекурсивно загружаем страницу по URL редиректа
        fetchCharacterPage(redirectUrl)
          .then(resolve)
          .catch(reject);
        return;
      }

      resolve(html);
    });
  });
}

/**
 * Найти токен верификации в HTML страницы персонажа
 * @param {string} html - HTML содержимое страницы
 * @param {string} expectedToken - Ожидаемый токен для поиска
 * @returns {boolean} true если токен найден
 */
export function findVerificationTokenInHtml(html, expectedToken) {
  if (!html || !expectedToken) return false;

  // Токен может быть в любом месте страницы
  // Ищем точное совпадение токена
  const tokenRegex = new RegExp(
    expectedToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'i'
  );

  return tokenRegex.test(html);
}

/**
 * Проверить токен верификации на странице персонажа
 * @param {string} characterUrl - Ссылка на персонажа
 * @param {string} token - Токен для проверки
 * @returns {Promise<boolean>} true если токен найден
 */
export async function verifyTokenOnCharacterPage(characterUrl, token) {
  const html = await fetchCharacterPage(characterUrl);
  return findVerificationTokenInHtml(html, token);
}

/**
 * Извлечь ник персонажа из HTML страницы
 * Используем рабочий regex из ImportCharacter.tsx
 * Формат title: "! MissSweeneyTodd ! - Эльф [21] - Персональная информация"
 * @param {string} html - HTML содержимое страницы
 * @returns {string|null} Ник персонажа или null
 */
export function extractCharacterName(html) {
  if (!html) return null;

  console.log('[characterVerificationService] Extracting character name...');
  
  // Способ 1: Ищем title через regex (рабочий вариант из ImportCharacter.tsx)
  const titleRegex = /<title[^>]*>([^<]+?)\s*-\s*[^\[]+\s*\[(\d+)\]/i;
  const match = html.match(titleRegex);
  
  console.log('[characterVerificationService] Title match:', match);
  
  if (match && match[1]) {
    const nickname = match[1].trim();
    const level = match[2];
    console.log('[characterVerificationService] Extracted from title - Nickname:', nickname, 'Level:', level);
    return nickname;
  }

  // Способ 2: Ищем verh_persa.png и данные рядом (из ImportCharacter.tsx)
  const persContainerMatch = html.match(/verh_persa\.png[^>]*>[\s\S]{0,500}?(\d{1,3})[\s\S]{0,200}?<span[^>]*class=cnavy[^>]*>([^<]+)<\/span>/i);
  console.log('[characterVerificationService] Pers container match:', persContainerMatch);
  
  if (persContainerMatch) {
    const nickname = persContainerMatch[2].trim();
    const level = persContainerMatch[1];
    console.log('[characterVerificationService] Extracted from pers container - Nickname:', nickname, 'Level:', level);
    return nickname;
  }

  // Способ 3: Альтернативный поиск - в заголовке h1
  const h1Regex = /<h1[^>]*>([^<]+)<\/h1>/i;
  const h1Match = html.match(h1Regex);
  if (h1Match && h1Match[1]) {
    console.log('[characterVerificationService] Extracted from h1:', h1Match[1]);
    return h1Match[1].trim();
  }

  console.log('[characterVerificationService] Character name not found');
  return null;
}

/**
 * Извлечь URL изображения персонажа из HTML
 * Ищем в <div style="background: url('...pers/N_NNNN.gif')">
 * @param {string} html - HTML содержимое страницы
 * @returns {string|null} URL изображения или null
 */
export function extractCharacterImage(html) {
  if (!html) return null;

  // Ищем паттерн: background: url('...pers/N_NNNN.gif')
  // или background-image: url(...)
  const bgRegex = /background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+pers\/[^'")\s]+)['"]?\)/i;
  const match = html.match(bgRegex);

  if (match && match[1]) {
    let imageUrl = match[1];
    // Если относительный URL, делаем абсолютным
    if (!imageUrl.startsWith('http')) {
      imageUrl = 'https://kovcheg2.apeha.ru/' + imageUrl.replace(/^\//, '');
    }
    console.log('[characterVerificationService] Extracted character image:', imageUrl);
    return imageUrl;
  }

  // Альтернативный поиск - прямой URL на gif
  const gifRegex = /['"](https?:\/\/[^'"]*\/pers\/[^'"]*\.gif)['"]/i;
  const gifMatch = html.match(gifRegex);
  if (gifMatch && gifMatch[1]) {
    console.log('[characterVerificationService] Extracted character image (alt):', gifMatch[1]);
    return gifMatch[1];
  }

  console.log('[characterVerificationService] Character image not found');
  return null;
}

/**
 * Извлечь "О себе" из HTML страницы персонажа
 * @param {string} html - HTML содержимое страницы
 * @returns {string|null} Текст из раздела "О себе" или null
 */
export function extractAboutSection(html) {
  if (!html) return null;

  // Пробуем найти раздел "О себе" в различных форматах
  // Формат 1: <td class="writer">О себе</td><td>...</td>
  const aboutRegex = /<td[^>]*class=["'][^"']*writer[^"']*["'][^>]*>О\s*себе<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i;
  const match = html.match(aboutRegex);

  if (match && match[1]) {
    // Очищаем от HTML тегов
    const about = match[1].replace(/<[^>]*>/g, '').trim();
    console.log('[characterVerificationService] Extracted about section:', about.substring(0, 100));
    return about;
  }

  return null;
}

/**
 * Распарсить всю информацию о персонаже
 * @param {string} html - HTML содержимое страницы
 * @returns {object} { name, imageUrl, about }
 */
export function parseCharacterInfo(html) {
  return {
    name: extractCharacterName(html),
    imageUrl: extractCharacterImage(html),
    about: extractAboutSection(html)
  };
}

export default {
  fetchCharacterPage,
  findVerificationTokenInHtml,
  verifyTokenOnCharacterPage,
  extractCharacterName,
  extractCharacterImage,
  extractAboutSection,
  parseCharacterInfo
};

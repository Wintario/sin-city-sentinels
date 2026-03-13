import iconv from 'iconv-lite';
import http from 'http';
import https from 'https';

const RACE_STYLES = {
  rOr: 'color: black; font-weight: bold;',
  rEl: 'color: green; font-weight: bold;',
  rGn: 'color: gray; font-weight: bold;',
  rHb: 'color: maroon; font-weight: bold;',
  rHm: 'color: #BC2EEA; font-weight: bold;',
  rDr: 'color: red; font-weight: bold;',
  rAr: 'color: #0066cc; font-weight: bold;',
  rAb: 'color: #0800B9; font-weight: bold;',
  rWm: 'color: black; font-weight: bold;',
};

/**
 * Получить HTML страницы персонажа через curl
 * @param {string} characterUrl - Ссылка на персонажа
 * @returns {Promise<string>} HTML содержимое
 */
export async function fetchCharacterPage(characterUrl) {
  console.log('[characterVerificationService] Fetching character page:', characterUrl);

  const raw = await fetchRawPage(characterUrl);
  console.log('[characterVerificationService] Received', raw.length, 'bytes');

  let html = '';
  try {
    html = iconv.decode(raw, 'win-1251');
  } catch (e) {
    console.error('[characterVerificationService] Conversion error:', e.message);
    html = raw.toString('utf8');
  }

  if (!html || html.trim().length < 50) {
    throw new Error('Сервер Арены вернул пустую страницу. Попробуйте позже.');
  }

  const redirectMatch = html.match(/location\.href\s*=\s*["']([^"']+)["']/i);
  if (redirectMatch && redirectMatch[1]) {
    let redirectUrl = redirectMatch[1];
    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      try {
        redirectUrl = new URL(redirectUrl, characterUrl).href;
      } catch {
        // keep raw redirect url
      }
    }
    if (redirectUrl !== characterUrl) {
      return fetchCharacterPage(redirectUrl);
    }
  }

  return html;
}

async function fetchRawPage(targetUrl, redirects = 0) {
  if (redirects > 5) {
    throw new Error('Слишком много перенаправлений при загрузке страницы персонажа.');
  }

  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      reject(new Error('Некорректный URL страницы персонажа.'));
      return;
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      parsed,
      {
        method: 'GET',
        timeout: 20000,
        rejectUnauthorized: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      },
      (res) => {
        const status = res.statusCode || 0;

        if (status >= 300 && status < 400 && res.headers.location) {
          let redirectUrl = res.headers.location;
          if (!/^https?:\/\//i.test(redirectUrl)) {
            try {
              redirectUrl = new URL(redirectUrl, targetUrl).href;
            } catch {
              reject(new Error('Ошибка обработки URL редиректа.'));
              return;
            }
          }

          res.resume();
          fetchRawPage(redirectUrl, redirects + 1).then(resolve).catch(reject);
          return;
        }

        if (status < 200 || status >= 400) {
          res.resume();
          reject(new Error(`Сервер вернул код ${status}`));
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('ECONNABORTED'));
    });

    req.on('error', (error) => {
      const code = error?.code || '';
      if (code === 'ENOTFOUND') {
        reject(new Error('Не удалось найти сервер. Проверьте подключение к интернету.'));
        return;
      }
      if (code === 'ECONNABORTED') {
        reject(new Error('Превышено время ожидания ответа от сервера (20 сек). Сайт Арены может быть недоступен.'));
        return;
      }
      reject(new Error('Не удалось загрузить страницу персонажа: ' + (error?.message || 'unknown error')));
    });

    req.end();
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
 * Извлечь уровень персонажа из HTML
 * @param {string} html - HTML содержимое страницы
 * @returns {number|null}
 */
export function extractCharacterLevel(html) {
  if (!html) return null;

  const titleMatch = html.match(/<title[^>]*>([^<]+?)\s*-\s*[^\[]+\s*\[(\d+)\]/i);
  if (titleMatch && titleMatch[2]) {
    return parseInt(titleMatch[2], 10);
  }

  const persContainerMatch = html.match(/verh_persa\.png[^>]*>[\s\S]{0,500}?(\d{1,3})[\s\S]{0,200}?<span[^>]*class=cnavy[^>]*>[^<]+<\/span>/i);
  if (persContainerMatch && persContainerMatch[1]) {
    return parseInt(persContainerMatch[1], 10);
  }

  return null;
}

/**
 * Извлечь данные расы из HTML
 * @param {string} html - HTML содержимое страницы
 * @returns {{ raceCode?: string, raceClass?: string, raceTitle?: string, raceStyle?: string } | null}
 */
export function extractRaceInfo(html) {
  if (!html) return null;

  const raceMatch = html.match(
    /<span([^>]*)class\s*=\s*["']?(r(?:Or|El|Gn|Hb|Hm|Dr|Ar|Ab|Wm))["']?([^>]*)>\s*([A-Za-z]{2})\s*<\/span>/i
  );

  if (!raceMatch) {
    return null;
  }

  const attrs = `${raceMatch[1]} ${raceMatch[3]}`;
  const raceClass = raceMatch[2];
  const raceCode = raceMatch[4]?.trim();
  const raceTitle = attrs.match(/title\s*=\s*["']([^"']+)["']/i)?.[1]?.trim();

  return {
    raceCode,
    raceClass,
    raceTitle,
    raceStyle: RACE_STYLES[raceClass] || 'font-weight: bold;',
  };
}

/**
 * Извлечь URL изображения персонажа из HTML
 * Ищем в <div style="background: url('...pers/N_NNNN.gif')">
 * @param {string} html - HTML содержимое страницы
 * @returns {string|null} URL изображения или null
 */
export function extractCharacterImage(html, baseUrl = 'https://apeha.ru/') {
  if (!html) return null;

  // Ищем паттерн: background: url('...pers/N_NNNN.gif')
  // или background-image: url(...)
  const bgRegex = /background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+pers\/[^'")\s]+)['"]?\)/i;
  const match = html.match(bgRegex);

  if (match && match[1]) {
    let imageUrl = match[1];
    // Если относительный URL, делаем абсолютным
    if (!/^https?:\/\//i.test(imageUrl)) {
      try {
        imageUrl = new URL(imageUrl, baseUrl).href;
      } catch {
        imageUrl = `https://apeha.ru/${imageUrl.replace(/^\//, '')}`;
      }
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
 * Извлечь данные клана из HTML страницы персонажа
 * @param {string} html - HTML содержимое страницы
 * @param {string} baseUrl - Базовый URL для относительных ссылок
 * @returns {{ clanName?: string, clanUrl?: string, clanIcon?: string } | null}
 */
export function extractClanInfo(html, baseUrl = 'https://apeha.ru/') {
  if (!html) return null;

  let clanName;
  let clanUrl;
  let clanIcon;

  const clanRowRegex = /<td[^>]*class=["']writer["'][^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]{0,2000}?)<\/td>/gi;
  let clanRowMatch = null;
  while ((clanRowMatch = clanRowRegex.exec(html)) !== null) {
    const rawLabel = clanRowMatch[1] || '';
    const clanCell = clanRowMatch[2] || '';
    const labelText = rawLabel
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const hasClanMarkup = /<img[^>]+>\s*<a[^>]+>[^<]+<\/a>/i.test(clanCell)
      || /alt="(?:Логотип\s+)?[^"]+"/i.test(clanCell);

    const isClanStatusRow = labelText.includes('состоит')
      || labelText.includes('глава')
      || labelText.includes('зам. главы')
      || labelText.includes('зам главы')
      || labelText.includes('советник');

    if (!isClanStatusRow && !hasClanMarkup) {
      continue;
    }

    const iconMatch = clanCell.match(/<img[^>]*src="([^"]+)"/i);
    if (iconMatch && iconMatch[1]) {
      clanIcon = iconMatch[1];
    }

    const linkMatch = clanCell.match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
    if (linkMatch) {
      clanUrl = linkMatch[1]?.trim();
      clanName = linkMatch[2]?.trim();
    }

    if (!clanName) {
      const altNameMatch = clanCell.match(/<img[^>]*alt="(?:Логотип\s+)?([^"]+)"[^>]*>/i);
      if (altNameMatch && altNameMatch[1]) {
        clanName = altNameMatch[1].trim();
      }
    }

    break;
  }

  if (!clanName && !clanUrl && !clanIcon) {
    return null;
  }

  const normalizeUrl = (value) => {
    if (!value) return value;
    if (/^https?:\/\//i.test(value)) return value;
    try {
      return new URL(value, baseUrl).href;
    } catch {
      return value;
    }
  };

  return {
    clanName,
    clanUrl: normalizeUrl(clanUrl),
    clanIcon: normalizeUrl(clanIcon),
  };
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
 * @param {string} [baseUrl]
 * @returns {object} { name, imageUrl, about }
 */
export function parseCharacterInfo(html, baseUrl = 'https://apeha.ru/') {
  const raceInfo = extractRaceInfo(html);
  const clanInfo = extractClanInfo(html, baseUrl);

  return {
    name: extractCharacterName(html),
    level: extractCharacterLevel(html),
    raceCode: raceInfo?.raceCode,
    raceClass: raceInfo?.raceClass,
    raceTitle: raceInfo?.raceTitle,
    raceStyle: raceInfo?.raceStyle,
    clanName: clanInfo?.clanName,
    clanUrl: clanInfo?.clanUrl,
    clanIcon: clanInfo?.clanIcon,
    imageUrl: extractCharacterImage(html, baseUrl),
    about: extractAboutSection(html)
  };
}

export default {
  fetchCharacterPage,
  findVerificationTokenInHtml,
  verifyTokenOnCharacterPage,
  extractCharacterName,
  extractCharacterLevel,
  extractRaceInfo,
  extractCharacterImage,
  extractClanInfo,
  extractAboutSection,
  parseCharacterInfo
};


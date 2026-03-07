import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import { exec } from 'child_process';
import { Buffer } from 'buffer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Пытаемся загрузить iconv-lite для конвертации кодировок
let IconvLite = null;
try {
  IconvLite = require('iconv-lite');
  console.log('iconv-lite loaded successfully');
} catch (e) {
  console.log('iconv-lite not installed, using fallback');
}

/**
 * Декодирование буфера из Windows-1251 в UTF-8 (fallback если нет iconv-lite)
 */
function decodeWin1251(buffer) {
  const win1251 = [
    0x0402,0x0403,0x201A,0x0453,0x201E,0x2026,0x2020,0x2021,0x20AC,0x2030,0x0409,0x2039,0x040A,0x040C,0x040B,0x040F,
    0x0452,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,0x0000,0x2122,0x0459,0x203A,0x045A,0x045C,0x045B,0x045F,
    0x00A0,0x040E,0x045E,0x0408,0x00A4,0x0490,0x00A6,0x00A7,0x0401,0x00A9,0x0404,0x00AB,0x00AC,0x00AD,0x00AE,0x0407,
    0x00B0,0x00B1,0x0406,0x0456,0x0491,0x00B5,0x00B6,0x00B7,0x0451,0x2116,0x0454,0x00BB,0x0458,0x00BC,0x00BD,0x0457,
    0x0410,0x0411,0x0412,0x0413,0x0414,0x0415,0x0416,0x0417,0x0418,0x0419,0x041A,0x041B,0x041C,0x041D,0x041E,0x041F,
    0x0420,0x0421,0x0422,0x0423,0x0424,0x0425,0x0426,0x0427,0x0428,0x0429,0x042A,0x042B,0x042C,0x042D,0x042E,0x042F,
    0x0430,0x0431,0x0432,0x0433,0x0434,0x0435,0x0436,0x0437,0x0438,0x0439,0x043A,0x043B,0x043C,0x043D,0x043E,0x043F,
    0x0440,0x0441,0x0442,0x0443,0x0444,0x0445,0x0446,0x0447,0x0448,0x0449,0x044A,0x044B,0x044C,0x044D,0x044E,0x044F
  ];

  let result = '';
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (byte >= 0x80 && byte <= 0xFF) {
      result += String.fromCharCode(win1251[byte - 0x80]);
    } else {
      result += String.fromCharCode(byte);
    }
  }
  return result;
}

const router = Router();
const isApehaHost = (hostname) => hostname === 'apeha.ru' || hostname.endsWith('.apeha.ru');

/**
 * POST /api/proxy/fetch
 * Прокси для загрузки внешних страниц (обход CORS)
 * Доступно без авторизации (публичные данные)
 */
router.post('/fetch',
  asyncHandler(async (req, res) => {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      throw new ApiError(400, 'URL is required');
    }

    // Валидация URL
    try {
      const parsedUrl = new URL(url);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new ApiError(400, 'Only HTTP and HTTPS URLs are allowed');
      }

      if (!isApehaHost(parsedUrl.hostname)) {
        throw new ApiError(400, 'Only *.apeha.ru domains are allowed');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(400, 'Invalid URL');
    }

    console.log('Fetching URL:', url);

    // Простой curl запрос
    const curlCommand = `curl -sLk --max-time 10 -A "Mozilla/5.0" "${url.replace(/"/g, '\\"')}"`;
    
    const html = await new Promise((resolve, reject) => {
      exec(curlCommand, { encoding: 'buffer', timeout: 12000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('curl error:', error);
          reject(new Error('curl failed: ' + error.message));
          return;
        }

        console.log('Received', stdout.length, 'bytes');

        // Конвертируем из Windows-1251 в UTF-8
        let result = '';
        try {
          if (IconvLite) {
            result = IconvLite.decode(stdout, 'win1251');
          } else {
            result = decodeWin1251(stdout);
          }
        } catch (e) {
          console.error('Conversion error:', e);
          result = stdout.toString('utf8');
        }

        resolve(result);
      });
    });

    res.json({
      success: true,
      html: html,
    });
  })
);

export default router;

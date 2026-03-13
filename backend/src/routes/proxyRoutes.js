import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import { fetchCharacterPage } from '../services/characterVerificationService.js';

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
    const html = await fetchCharacterPage(url);

    res.json({
      success: true,
      html: html,
    });
  })
);

export default router;

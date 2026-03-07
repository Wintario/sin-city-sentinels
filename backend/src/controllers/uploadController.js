import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import { compressImageIfNeeded, getPublicUrl, getNewsImagesDir } from '../utils/fileUtils.js';
import { MAX_FILE_SIZE, MAX_HEADER_IMAGE_SIZE, MAX_VIDEO_SIZE } from '../middleware/uploadValidator.js';
import { enqueueVideoProcessing, getVideoJobStatus } from '../services/videoProcessingQueue.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
const isApehaHost = (hostname) => hostname === 'apeha.ru' || hostname.endsWith('.apeha.ru');

/**
 * POST /api/upload/image
 * Загрузить изображение в контент новости
 */
export const uploadNewsImage = asyncHandler(async (req, res) => {
  logger.info('Upload image request', { 
    user: req.user?.username,
    files: req.files?.map(f => f.originalname)
  });

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'Нет файлов для загрузки');
  }

  const uploadedFiles = [];

  for (const file of req.files) {
    try {
      // Сжимаем изображение если нужно
      await compressImageIfNeeded(file.path);

      // Получаем публичный URL
      const url = getPublicUrl(file.filename, 'news-images');

      uploadedFiles.push({
        filename: file.filename,
        originalname: file.originalname,
        url: url,
        size: file.size,
        mimetype: file.mimetype
      });

      logger.info('File uploaded successfully', {
        filename: file.filename,
        size: file.size,
        user: req.user?.username
      });
    } catch (error) {
      logger.error('Error processing uploaded file', {
        filename: file.filename,
        error: error.message
      });
      // Продолжаем с другими файлами
    }
  }

  if (uploadedFiles.length === 0) {
    throw new ApiError(500, 'Ошибка загрузки файлов');
  }

  res.json({
    success: true,
    files: uploadedFiles,
    message: `Загружено файлов: ${uploadedFiles.length}`
  });
});

/**
 * POST /api/upload/header-image
 * Загрузить изображение шапки новости (единственный файл)
 */
export const uploadHeaderImage = asyncHandler(async (req, res) => {
  logger.info('Upload header image request', { 
    user: req.user?.username,
    file: req.file?.originalname
  });

  if (!req.file) {
    throw new ApiError(400, 'Нет файла для загрузки');
  }

  try {
    // Сжимаем изображение если нужно
    await compressImageIfNeeded(req.file.path);

    // Получаем публичный URL
    const url = getPublicUrl(req.file.filename, 'news-images');

    logger.info('Header image uploaded successfully', {
      filename: req.file.filename,
      size: req.file.size,
      user: req.user?.username
    });

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        url: url,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    logger.error('Error processing header image', {
      filename: req.file.filename,
      error: error.message
    });
    throw new ApiError(500, 'Ошибка обработки изображения');
  }
});

/**
 * POST /api/upload/external-image
 * Скачать внешнее изображение и сохранить локально в uploads/news-images
 */
export const uploadExternalImage = asyncHandler(async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    throw new ApiError(400, 'URL is required');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ApiError(400, 'Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new ApiError(400, 'Only HTTP and HTTPS URLs are allowed');
  }

  // Разрешаем только источники apeha.ru
  if (!isApehaHost(parsedUrl.hostname)) {
    throw new ApiError(400, 'Only *.apeha.ru domains are allowed');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  let response;
  try {
    response = await fetch(parsedUrl.href, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
  } catch (error) {
    clearTimeout(timeout);
    throw new ApiError(502, `Failed to download image: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ApiError(502, `Failed to download image (status ${response.status})`);
  }

  const contentTypeRaw = (response.headers.get('content-type') || '').toLowerCase();
  const contentType = contentTypeRaw.split(';')[0].trim();
  const maxBytes = 8 * 1024 * 1024;

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    throw new ApiError(400, 'Downloaded file is empty');
  }

  if (buffer.length > maxBytes) {
    throw new ApiError(400, `Image is too large. Max size: ${Math.round(maxBytes / 1024 / 1024)}MB`);
  }

  const contentTypeToExt = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };

  const urlExt = path.extname(parsedUrl.pathname || '').toLowerCase();
  const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
  let ext = contentTypeToExt[contentType] || (allowedExt.has(urlExt) ? urlExt : '.jpg');
  if (ext === '.jpeg') ext = '.jpg';

  if (!contentType.startsWith('image/') && !allowedExt.has(ext)) {
    throw new ApiError(400, 'URL does not point to an image');
  }

  const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 20);
  const filename = `external_${hash}${ext}`;
  const targetPath = path.join(getNewsImagesDir(), filename);

  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, buffer);
    await compressImageIfNeeded(targetPath);
    logger.info('External image downloaded and saved', {
      filename,
      source: parsedUrl.href,
      user: req.user?.username,
      size: buffer.length,
    });
  } else {
    logger.info('External image reuse (already cached)', {
      filename,
      source: parsedUrl.href,
      user: req.user?.username,
    });
  }

  res.json({
    success: true,
    file: {
      filename,
      url: getPublicUrl(filename, 'news-images'),
      size: buffer.length,
      source: parsedUrl.href,
    },
  });
});

/**
 * POST /api/upload/video
 * Р—Р°РіСЂСѓР·РёС‚СЊ РІРёРґРµРѕ Рё РїРѕСЃС‚Р°РІРёС‚СЊ РІ РѕС‡РµСЂРµРґСЊ РѕР±СЂР°Р±РѕС‚РєРё
 */
export const uploadNewsVideo = asyncHandler(async (req, res) => {
  logger.info('Upload video request', {
    user: req.user?.username,
    file: req.file?.originalname
  });

  if (!req.file) {
    throw new ApiError(400, 'РќРµС‚ РІРёРґРµРѕ РґР»СЏ Р·Р°РіСЂСѓР·РєРё');
  }

  if (req.file.size > MAX_VIDEO_SIZE) {
    throw new ApiError(400, `Р’РёРґРµРѕ СЃР»РёС€РєРѕРј Р±РѕР»СЊС€РѕРµ. РњР°РєСЃРёРјСѓРј ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
  }

  const jobId = enqueueVideoProcessing(req.file.path, req.file.originalname, req.user?.id);

  res.status(202).json({
    success: true,
    jobId,
    message: 'Processing video...'
  });
});

/**
 * GET /api/upload/video/status/:jobId
 * РџРѕР»СѓС‡РёС‚СЊ СЃС‚Р°С‚СѓСЃ РѕР±СЂР°Р±РѕС‚РєРё РІРёРґРµРѕ
 */
export const getVideoUploadStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = getVideoJobStatus(jobId);

  if (!job) {
    throw new ApiError(404, 'Video processing job not found');
  }

  res.json({
    success: true,
    job
  });
});

/**
 * DELETE /api/upload/image/:filename
 * Удалить загруженное изображение
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const { filename } = req.params;

  logger.info('Delete image request', { 
    filename,
    user: req.user?.username
  });

  // Проверяем, что имя файла безопасное (только разрешённые символы)
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
    throw new ApiError(400, 'Недопустимое имя файла');
  }

  const fs = await import('fs');
  const path = await import('path');
  const { getNewsImagesDir } = await import('../utils/fileUtils.js');

  const filePath = path.join(getNewsImagesDir(), filename);

  // Проверяем существование
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Файл не найден');
  }

  // Удаляем файл
  fs.unlinkSync(filePath);

  logger.info('Image deleted successfully', {
    filename,
    user: req.user?.username
  });

  res.json({
    success: true,
    message: 'Изображение удалено'
  });
});

export default {
  uploadNewsImage,
  uploadHeaderImage,
  uploadExternalImage,
  uploadNewsVideo,
  getVideoUploadStatus,
  deleteImage
};

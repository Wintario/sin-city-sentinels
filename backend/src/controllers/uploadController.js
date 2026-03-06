import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import { compressImageIfNeeded, getPublicUrl } from '../utils/fileUtils.js';
import { MAX_FILE_SIZE, MAX_HEADER_IMAGE_SIZE, MAX_VIDEO_SIZE } from '../middleware/uploadValidator.js';
import { enqueueVideoProcessing, getVideoJobStatus } from '../services/videoProcessingQueue.js';

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
  uploadNewsVideo,
  getVideoUploadStatus,
  deleteImage
};

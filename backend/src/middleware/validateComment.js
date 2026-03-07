import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
const getZodMessages = (zodError) => {
  const issues = zodError?.issues || zodError?.errors || [];
  if (!Array.isArray(issues)) {
    return ['Validation error'];
  }

  const messages = issues
    .map((issue) => issue?.message)
    .filter((message) => typeof message === 'string' && message.trim().length > 0);

  return messages.length > 0 ? messages : ['Validation error'];
};

// Разрешённые теги для форматирования
const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'blockquote', 'p', 'br'];
const MAX_EMOJIS = 10;

// Схема для валидации комментария
export const commentSchema = z.object({
  newsId: z.number().int().positive('Неверный ID новости'),
  content: z.string()
    .min(1, 'Комментарий не может быть пустым')
    .max(2000, 'Комментарий слишком длинный (макс. 2000 символов)'),
  parentId: z.number().int().positive().optional().nullable()
});

// Схема для обновления комментария
export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Комментарий не может быть пустым')
    .max(2000, 'Комментарий слишком длинный (макс. 2000 символов)')
});

// Схема для жалобы
export const reportSchema = z.object({
  commentId: z.number().int().positive('Неверный ID комментария'),
  reason: z.string()
    .min(10, 'Причина должна быть не менее 10 символов')
    .max(500, 'Причина слишком длинная (макс. 500 символов)')
});

/**
 * Подсчет количества смайлов в тексте
 */
export function countEmojis(str) {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  const matches = str.match(emojiRegex);
  return matches ? matches.length : 0;
}

/**
 * Санитизация HTML в комментарии
 * Разрешены только <b>, <i>, <em>, <strong>
 */
export function sanitizeComment(content) {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: []
  });
}

/**
 * Валидация комментария
 */
export function validateComment(data) {
  const result = commentSchema.safeParse(data);

  if (!result.success) {
    return {
      valid: false,
      errors: getZodMessages(result.error)
    };
  }

  // Проверка на смайлы
  const emojiCount = countEmojis(data.content);
  if (emojiCount > MAX_EMOJIS) {
    return {
      valid: false,
      errors: [`Слишком много смайлов (макс. ${MAX_EMOJIS}, найдено ${emojiCount})`]
    };
  }

  // Санитизация
  const sanitizedContent = sanitizeComment(data.content);

  return {
    valid: true,
    data: { ...result.data, content: sanitizedContent }
  };
}

/**
 * Валидация обновления комментария
 */
export function validateUpdateComment(data) {
  const result = updateCommentSchema.safeParse(data);

  if (!result.success) {
    return {
      valid: false,
      errors: getZodMessages(result.error)
    };
  }

  // Проверка на смайлы
  const emojiCount = countEmojis(data.content);
  if (emojiCount > MAX_EMOJIS) {
    return {
      valid: false,
      errors: [`Слишком много смайлов (макс. ${MAX_EMOJIS}, найдено ${emojiCount})`]
    };
  }

  // Санитизация
  const sanitizedContent = sanitizeComment(data.content);

  return {
    valid: true,
    data: { ...result.data, content: sanitizedContent }
  };
}

/**
 * Валидация жалобы
 */
export function validateReport(data) {
  const result = reportSchema.safeParse(data);

  if (!result.success) {
    return {
      valid: false,
      errors: getZodMessages(result.error)
    };
  }

  return {
    valid: true,
    data: result.data
  };
}

/**
 * Middleware для валидации комментария
 */
export function validateCommentMiddleware(req, res, next) {
  const validation = validateComment(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: validation.errors
    });
  }

  req.validatedBody = validation.data;
  next();
}

/**
 * Middleware для валидации обновления комментария
 */
export function validateUpdateCommentMiddleware(req, res, next) {
  const validation = validateUpdateComment(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: validation.errors
    });
  }

  req.validatedBody = validation.data;
  next();
}

/**
 * Middleware для валидации жалобы
 */
export function validateReportMiddleware(req, res, next) {
  const validation = validateReport(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: validation.errors
    });
  }

  req.validatedBody = validation.data;
  next();
}

export default {
  sanitizeComment,
  countEmojis,
  validateComment,
  validateUpdateComment,
  validateReport,
  validateCommentMiddleware,
  validateUpdateCommentMiddleware,
  validateReportMiddleware,
  commentSchema,
  updateCommentSchema,
  reportSchema,
  MAX_EMOJIS
};

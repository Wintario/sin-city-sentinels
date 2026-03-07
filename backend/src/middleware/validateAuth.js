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

const isApehaHost = (hostname) => hostname === 'apeha.ru' || hostname.endsWith('.apeha.ru');
const isApehaUrl = (url) => {
  try {
    return isApehaHost(new URL(url).hostname);
  } catch {
    return false;
  }
};

// Схема для валидации регистрации
export const registerSchema = z.object({
  password: z.string()
    .min(6, 'Пароль должен быть не менее 6 символов')
    .max(72, 'Пароль слишком длинный'),
  characterUrl: z.string()
    .url('Неверный формат URL')
    .refine(
      isApehaUrl,
      'URL должен вести на страницу персонажа на apeha.ru'
    )
});

// Схема для валидации входа
export const loginSchema = z.object({
  username: z.string().min(1, 'Введите ник'),
  password: z.string().min(1, 'Введите пароль')
});

// Схема для валидации верификации через персонажа
export const verifyCharacterSchema = z.object({
  token: z.string()
    .min(1, 'Введите токен верификации')
    .max(20, 'Неверный формат токена')
});

// Схема для валидации запроса сброса пароля
export const resetPasswordRequestSchema = z.object({
  username: z.string().min(1, 'Введите ник'),
  characterUrl: z.string()
    .url('Неверный формат URL')
    .refine(
      isApehaUrl,
      'URL должен вести на страницу персонажа на apeha.ru'
    )
});

// Схема для валидации сброса пароля
export const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'Пароль должен быть не менее 6 символов')
    .max(72, 'Пароль слишком длинный')
});

/**
 * Валидация регистрации
 */
export function validateRegister(data) {
  const result = registerSchema.safeParse(data);

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
 * Валидация входа
 */
export function validateLogin(data) {
  const result = loginSchema.safeParse(data);

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
 * Валидация верификации через персонажа
 */
export function validateVerifyCharacter(data) {
  const result = verifyCharacterSchema.safeParse(data);

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
 * Валидация запроса сброса пароля
 */
export function validateResetPasswordRequest(data) {
  const result = resetPasswordRequestSchema.safeParse(data);

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
 * Валидация сброса пароля
 */
export function validateResetPassword(data) {
  const result = resetPasswordSchema.safeParse(data);

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
 * Middleware для валидации регистрации
 */
export function validateRegisterMiddleware(req, res, next) {
  const validation = validateRegister(req.body);

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
 * Middleware для валидации входа
 */
export function validateLoginMiddleware(req, res, next) {
  const validation = validateLogin(req.body);

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
 * Middleware для валидации верификации через персонажа
 */
export function validateVerifyCharacterMiddleware(req, res, next) {
  const validation = validateVerifyCharacter(req.body);

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
 * Middleware для валидации запроса сброса пароля
 */
export function validateResetPasswordRequestMiddleware(req, res, next) {
  const validation = validateResetPasswordRequest(req.body);

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
 * Middleware для валидации сброса пароля
 */
export function validateResetPasswordMiddleware(req, res, next) {
  const validation = validateResetPassword(req.body);

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
  registerSchema,
  loginSchema,
  verifyCharacterSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  validateRegister,
  validateLogin,
  validateVerifyCharacter,
  validateResetPasswordRequest,
  validateResetPassword,
  validateRegisterMiddleware,
  validateLoginMiddleware,
  validateVerifyCharacterMiddleware,
  validateResetPasswordRequestMiddleware,
  validateResetPasswordMiddleware
};




import { z } from 'zod';

// Схема для валидации регистрации
export const registerSchema = z.object({
  username: z.string()
    .min(2, 'Ник должен быть не менее 2 символов')
    .max(50, 'Ник слишком длинный')
    .regex(/^[a-zA-Zа-яА-Я0-9_ !№%:*?()@#$^&\[\]{}|\\'".,+-]+$/, 'Ник содержит недопустимые символы'),
  password: z.string()
    .min(6, 'Пароль должен быть не менее 6 символов')
    .max(72, 'Пароль слишком длинный'),
  characterUrl: z.string()
    .url('Неверный формат URL')
    .refine(
      url => url.includes('apeha.ru'),
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
      url => url.includes('apeha.ru'),
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
      errors: result.error.errors.map(e => e.message)
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
      errors: result.error.errors.map(e => e.message)
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
      errors: result.error.errors.map(e => e.message)
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
      errors: result.error.errors.map(e => e.message)
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
      errors: result.error.errors.map(e => e.message)
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

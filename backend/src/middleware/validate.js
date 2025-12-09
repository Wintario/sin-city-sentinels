import { ApiError } from './errorHandler.js';
import { config } from '../config/config.js';

/**
 * Валидация данных для логина
 */
export function validateLoginInput(username, password) {
  const errors = [];
  
  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
  } else if (username.trim().length < 2) {
    errors.push('Username must be at least 2 characters');
  } else if (username.length > 50) {
    errors.push('Username must be less than 50 characters');
  }
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 4) {
    errors.push('Password must be at least 4 characters');
  } else if (password.length > 100) {
    errors.push('Password must be less than 100 characters');
  }
  
  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }
  
  return { username: username.trim(), password };
}

/**
 * Валидация данных для новости
 */
export function validateNewsInput(data, isUpdate = false) {
  const errors = [];
  const validated = {};
  
  // Title
  if (!isUpdate || data.title !== undefined) {
    if (!isUpdate && (!data.title || typeof data.title !== 'string')) {
      errors.push('Title is required');
    } else if (data.title) {
      const title = data.title.trim();
      if (title.length < 3) {
        errors.push('Title must be at least 3 characters');
      } else if (title.length > config.maxTitleLength) {
        errors.push(`Title must be less than ${config.maxTitleLength} characters`);
      } else {
        validated.title = title;
      }
    }
  }
  
  // Content
  if (!isUpdate || data.content !== undefined) {
    if (!isUpdate && (!data.content || typeof data.content !== 'string')) {
      errors.push('Content is required');
    } else if (data.content) {
      const content = data.content.trim();
      if (content.length < 10) {
        errors.push('Content must be at least 10 characters');
      } else if (content.length > config.maxContentLength) {
        errors.push(`Content must be less than ${config.maxContentLength} characters`);
      } else {
        validated.content = content;
      }
    }
  }
  
  // Excerpt (опционально)
  if (data.excerpt !== undefined) {
    if (data.excerpt && typeof data.excerpt === 'string') {
      const excerpt = data.excerpt.trim();
      if (excerpt.length > config.maxExcerptLength) {
        errors.push(`Excerpt must be less than ${config.maxExcerptLength} characters`);
      } else {
        validated.excerpt = excerpt || null;
      }
    } else {
      validated.excerpt = null;
    }
  }
  
  // Image URL (опционально)
  if (data.image_url !== undefined) {
    if (data.image_url && typeof data.image_url === 'string') {
      const url = data.image_url.trim();
      if (url.length > 0 && !isValidUrl(url)) {
        errors.push('Invalid image URL format');
      } else {
        validated.image_url = url || null;
      }
    } else {
      validated.image_url = null;
    }
  }
  
  // Published at (опционально)
  if (data.published_at !== undefined) {
    if (data.published_at === null) {
      validated.published_at = null;
    } else if (data.published_at) {
      const date = new Date(data.published_at);
      if (isNaN(date.getTime())) {
        errors.push('Invalid published_at date format');
      } else {
        validated.published_at = date.toISOString();
      }
    }
  }
  
  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }
  
  return validated;
}

/**
 * Валидация данных для участника
 */
export function validateMemberInput(data, isUpdate = false) {
  const errors = [];
  const validated = {};
  
  // Name
  if (!isUpdate || data.name !== undefined) {
    if (!isUpdate && (!data.name || typeof data.name !== 'string')) {
      errors.push('Name is required');
    } else if (data.name) {
      const name = data.name.trim();
      if (name.length < 2) {
        errors.push('Name must be at least 2 characters');
      } else if (name.length > config.maxNameLength) {
        errors.push(`Name must be less than ${config.maxNameLength} characters`);
      } else {
        validated.name = name;
      }
    }
  }
  
  // Role
  if (!isUpdate || data.role !== undefined) {
    if (!isUpdate && (!data.role || typeof data.role !== 'string')) {
      errors.push('Role is required');
    } else if (data.role) {
      const role = data.role.trim();
      if (!config.memberRoles.includes(role)) {
        errors.push(`Role must be one of: ${config.memberRoles.join(', ')}`);
      } else {
        validated.role = role;
      }
    }
  }
  
  // Profile URL (опционально)
  if (data.profile_url !== undefined) {
    if (data.profile_url && typeof data.profile_url === 'string') {
      const url = data.profile_url.trim();
      if (url.length > 0 && !isValidUrl(url)) {
        errors.push('Invalid profile URL format');
      } else {
        validated.profile_url = url || null;
      }
    } else {
      validated.profile_url = null;
    }
  }
  
  // Status (опционально)
  if (data.status !== undefined) {
    if (data.status && typeof data.status === 'string') {
      if (!config.memberStatuses.includes(data.status)) {
        errors.push(`Status must be one of: ${config.memberStatuses.join(', ')}`);
      } else {
        validated.status = data.status;
      }
    }
  }
  
  // Avatar URL (опционально)
  if (data.avatar_url !== undefined) {
    if (data.avatar_url && typeof data.avatar_url === 'string') {
      const url = data.avatar_url.trim();
      if (url.length > 0 && !isValidUrl(url)) {
        errors.push('Invalid avatar URL format');
      } else {
        validated.avatar_url = url || null;
      }
    } else {
      validated.avatar_url = null;
    }
  }
  
  // Order index (опционально)
  if (data.order_index !== undefined) {
    if (data.order_index !== null) {
      const orderIndex = parseInt(data.order_index, 10);
      if (isNaN(orderIndex) || orderIndex < 0) {
        errors.push('Order index must be a non-negative integer');
      } else {
        validated.order_index = orderIndex;
      }
    }
  }
  
  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }
  
  return validated;
}

/**
 * Проверка валидности URL
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export default {
  validateLoginInput,
  validateNewsInput,
  validateMemberInput
};

import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { findById } from '../models/user.js';

/**
 * Middleware для проверки JWT токена
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Проверяем, что пользователь всё ещё существует и активен
    const user = findById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Unauthorized: User not found or inactive' });
    }
    
    // Добавляем информацию о пользователе в request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/**
 * Middleware для проверки роли пользователя
 * @param {string|string[]} allowedRoles - Роли, которым разрешён доступ
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
}

/**
 * Генерация JWT токена
 */
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
}

export default { authenticate, requireRole, generateToken };

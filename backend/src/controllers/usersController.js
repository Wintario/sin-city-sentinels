import userModel from '../models/user.js';

/**
 * Получить список всех пользователей
 */
export async function getAll(req, res, next) {
  try {
    const users = userModel.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
}

/**
 * Получить пользователя по ID
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const user = userModel.findById(parseInt(id));
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * Создать нового пользователя
 */
export async function create(req, res, next) {
  try {
    const { username, password, role } = req.body;
    
    if (!username || username.length < 2) {
      return res.status(400).json({ error: 'Имя пользователя должно быть минимум 2 символа' });
    }
    
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Пароль должен быть минимум 4 символа' });
    }
    
    // Проверяем, существует ли пользователь
    const existing = userModel.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
    }
    
    const validRole = role === 'admin' ? 'admin' : 'author';
    const user = await userModel.createUser(username, password, validRole);
    
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * Обновить пользователя
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { password, role } = req.body;
    
    const user = userModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Обновляем пароль если передан
    if (password && password.length >= 4) {
      await userModel.updatePassword(parseInt(id), password);
    }
    
    // Обновляем роль если передана
    if (role && (role === 'admin' || role === 'author')) {
      const { getDatabase } = await import('../db/db.js');
      const db = getDatabase();
      const stmt = db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run(role, parseInt(id));
    }
    
    const updatedUser = userModel.findById(parseInt(id));
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
}

/**
 * Удалить (деактивировать) пользователя
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    
    const user = userModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем, не последний ли это админ
    const allUsers = userModel.getAllUsers();
    const adminCount = allUsers.filter(u => u.role === 'admin' && u.is_active !== 0).length;
    
    if (user.role === 'admin' && adminCount <= 1) {
      return res.status(400).json({ error: 'Нельзя удалить последнего администратора' });
    }
    
    userModel.deactivateUser(parseInt(id));
    res.json({ success: true, message: 'Пользователь деактивирован' });
  } catch (error) {
    next(error);
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  remove
};

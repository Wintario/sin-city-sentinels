import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import settingsController from '../controllers/settingsController.js';

const router = Router();

// GET /api/settings/background - публичный доступ
router.get('/background', settingsController.getBackground);

// PUT /api/settings/background - только для авторизованных
router.put('/background', authenticate, settingsController.updateBackground);

// POST /api/settings/background - загрузка файла (только для авторизованных)
router.post('/background', authenticate, settingsController.uploadBackground);

export default router;

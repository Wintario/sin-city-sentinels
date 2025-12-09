import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import aboutCardsController from '../controllers/aboutCardsController.js';

const router = Router();

// GET /api/about-cards - публичный доступ
router.get('/', aboutCardsController.getAll);

// GET /api/about-cards/:id - публичный доступ
router.get('/:id', aboutCardsController.getById);

// POST /api/about-cards - только для авторизованных
router.post('/', authenticate, aboutCardsController.create);

// PUT /api/about-cards/:id - только для авторизованных
router.put('/:id', authenticate, aboutCardsController.update);

// DELETE /api/about-cards/:id - только для авторизованных
router.delete('/:id', authenticate, aboutCardsController.remove);

// PATCH /api/about-cards/:id/reorder - изменить порядок
router.patch('/:id/reorder', authenticate, aboutCardsController.reorder);

export default router;

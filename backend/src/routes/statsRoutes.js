import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as statsController from '../controllers/statsController.js';

const router = express.Router();

// Public routes
router.post('/view/news/:id', statsController.trackNewsView);

// Admin routes
router.get('/overview', authenticate, statsController.getStatsOverview);
router.get('/news-views', authenticate, statsController.getNewsViews);
router.get('/page-visits', authenticate, statsController.getPageVisits);

export default router;

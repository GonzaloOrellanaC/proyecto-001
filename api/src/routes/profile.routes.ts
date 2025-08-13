import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { meController, updateMeController } from '../controllers/profile.controller.js';

const router = Router();
router.get('/me', requireAuth, meController);
router.patch('/me', requireAuth, updateMeController);
export default router;

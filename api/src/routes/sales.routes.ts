import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { authorizeStoreMember } from '../middlewares/orgAuth.js';
import { createSaleController } from '../controllers/sales.controller.js';

const router = Router();
router.post('/', requireAuth, authorize('admin', 'cashier'), authorizeStoreMember(), createSaleController);
export default router;

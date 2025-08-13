import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { setStockController, getStockController } from '../controllers/inventory.controller.js';

const router = Router();
router.get('/:orgId/:storeId/:productId', requireAuth, authorize('admin'), getStockController);
router.put('/:orgId/:storeId/:productId', requireAuth, authorize('admin'), setStockController);
export default router;

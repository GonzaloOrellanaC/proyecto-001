import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { authorizeOrgMember, authorizeProductOrgAdmin } from '../middlewares/orgAuth.js';
import { createProductController, deleteProductController, listProductsController, updateProductController } from '../controllers/products.controller.js';

const router = Router();
// list products: admin or cashier
router.get('/', requireAuth, authorizeOrgMember(), listProductsController);
// mutations: admin only
router.post('/', requireAuth, authorizeProductOrgAdmin(), createProductController);
router.patch('/:id', requireAuth, authorizeProductOrgAdmin(), updateProductController);
router.delete('/:id', requireAuth, authorizeProductOrgAdmin(), deleteProductController);

export default router;

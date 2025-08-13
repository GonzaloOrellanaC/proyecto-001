import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { authorizeOrgMember, authorizeStoreMutation } from '../middlewares/orgAuth.js';
import { createStoreController, listStoresController, updateStoreController } from '../controllers/stores.controller.js';

const router = Router();
// list stores: admin or cashier
router.get('/', requireAuth, authorizeOrgMember(), listStoresController);
// mutations: admin only
router.post('/', requireAuth, authorizeStoreMutation(), createStoreController);
router.patch('/:id', requireAuth, authorizeStoreMutation(), updateStoreController);

export default router;

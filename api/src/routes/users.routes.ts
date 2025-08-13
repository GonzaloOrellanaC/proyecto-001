import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { listUsersController, updateUserController, createUserController, listUsersByOrgController } from '../controllers/users.controller.js';
import { authorizeOrgAdmin, authorizeOrgAdminForTargetUser } from '../middlewares/orgAuth.js';

const router = Router();
router.get('/', requireAuth, authorize('admin'), listUsersController);
router.post('/', requireAuth, authorize('admin'), createUserController);
router.get('/by-org/:orgId', requireAuth, authorizeOrgAdmin(req => req.params?.orgId), listUsersByOrgController);
router.patch('/:id', requireAuth, authorizeOrgAdminForTargetUser(req => req.params?.id), updateUserController);
export default router;

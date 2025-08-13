import { Router } from 'express';
import { authorize } from '../middlewares/authorize.js';
import { requireAuth } from '../middlewares/auth.js';
import { createRoleController, deleteRoleController, listRolesController, updateRoleController } from '../controllers/roles.controller.js';
import { requireSuperAdmin } from '../middlewares/orgAuth.js';
import { Router as _Router } from 'express';
import { RoleModel } from '../models/Role.js';
import { z } from 'zod';

const router = Router();
router.use(requireAuth, authorize('admin'));

router.get('/', listRolesController);
router.post('/', createRoleController);
router.patch('/:id', updateRoleController);
router.delete('/:id', deleteRoleController);

// POST /roles/super-admin — Create Super Admin role (system), restricted
const SuperRoleSchema = z.object({
	key: z.literal('super-admin').optional(),
	name: z.string().min(2).default('Super Admin'),
	description: z.string().optional(),
	permissions: z.array(z.string()).optional(),
});

router.post('/super-admin', requireSuperAdmin, async (req, res) => {
	const parsed = SuperRoleSchema.safeParse(req.body || {});
	if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
	const data = parsed.data;
	const key = 'super-admin';
	const exists = await RoleModel.findOne({ key }).lean();
	if (exists) return res.status(400).json({ ok: false, error: 'Role already exists' });
	const doc = await RoleModel.create({ key, name: data.name, description: data.description, permissions: data.permissions ?? ['*'], isSystem: true });
	res.status(201).json({ ok: true, role: doc.toObject() });
});

export default router;

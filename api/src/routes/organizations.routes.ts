import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { requireSuperAdmin, authorizeOrgAdmin, authorizeOrgAdminForOrgIds } from '../middlewares/orgAuth.js';
import { createOrganizationController, listOrganizationsController } from '../controllers/organizations.controller.js';
import { z } from 'zod';
import { UserOrganizationModel } from '../models/UserOrganization.js';

const router = Router();

// Organizations CRUD (super admin only)
router.get('/', requireAuth, requireSuperAdmin, listOrganizationsController);
router.post('/', requireAuth, requireSuperAdmin, createOrganizationController);

// Link a user (seller) to one or more organizations (admin)
router.post('/link', requireAuth, authorizeOrgAdminForOrgIds(req => req.body?.orgIds), async (req, res) => {
  const schema = z.object({ userId: z.string(), orgIds: z.array(z.string()).min(1), role: z.enum(['admin', 'cashier']).default('cashier') });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const { userId, orgIds, role } = parsed.data;
  const ops = await Promise.all(orgIds.map(orgId =>
    UserOrganizationModel.findOneAndUpdate(
      { userId, orgId },
      { userId, orgId, role },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()
  ));
  res.status(201).json({ ok: true, links: ops });
});

// List organizations linked to a given user (org admin or super admin)
router.get('/by-user/:userId', requireAuth, authorize('admin'), async (req, res) => {
  const { userId } = req.params;
  const links = await UserOrganizationModel.find({ userId }).lean();
  res.json({ ok: true, links });
});

export default router;

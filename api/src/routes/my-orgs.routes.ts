import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middlewares/auth.js';
import { UserOrganizationModel } from '../models/UserOrganization.js';
import { OrganizationModel } from '../models/Organization.js';
import mongoose from 'mongoose';

const router = Router();
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const links = await UserOrganizationModel.find({ userId }).lean();
  const orgIds = links.map(l => l.orgId);
  const orgs = await OrganizationModel.find({ _id: { $in: orgIds as mongoose.Types.ObjectId[] } }).lean();
  res.json({ ok: true, organizations: orgs });
});

router.get('/admin', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const links = await UserOrganizationModel.find({ userId, role: 'admin' }).lean();
  const orgIds = links.map(l => l.orgId);
  const orgs = await OrganizationModel.find({ _id: { $in: orgIds as mongoose.Types.ObjectId[] } }).lean();
  res.json({ ok: true, organizations: orgs });
});

export default router;

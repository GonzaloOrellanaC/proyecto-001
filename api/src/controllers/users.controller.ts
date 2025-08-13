import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { UserOrganizationModel } from '../models/UserOrganization.js';
import { UserStoreModel } from '../models/UserStore.js';
import { StoreModel } from '../models/Store.js';
import { register } from '../services/auth.service.js';
import type { AuthRequest } from '../middlewares/auth.js';

export async function listUsersController(req: AuthRequest, res: Response) {
  // Super admin lists all
  if (req.user?.role === 'admin') {
    const users = await UserModel.find().select('-passwordHash').lean();
    return res.json({ ok: true, users });
  }
  // Org admin: only users in orgs you admin
  const adminLinks = await UserOrganizationModel.find({ userId: req.user?.sub, role: 'admin' }).select('orgId').lean();
  const orgIds = adminLinks.map(l => l.orgId);
  if (orgIds.length === 0) return res.json({ ok: true, users: [] });
  const targetLinks = await UserOrganizationModel.find({ orgId: { $in: orgIds } }).select('userId').lean();
  const userIds = Array.from(new Set(targetLinks.map(l => l.userId)));
  const users = await UserModel.find({ _id: { $in: userIds as any[] } }).select('-passwordHash').lean();
  return res.json({ ok: true, users });
}

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  role: z.enum(['admin', 'cashier']).optional(),
  // Optional linkage fields for convenience updates
  orgId: z.string().optional(),
  storeIds: z.array(z.string()).optional(),
  roleId: z.string().optional(),
});

export async function updateUserController(req: any, res: Response) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, error: 'Invalid id' });
  const parsed = UpdateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const { orgId, storeIds, roleId, ...updates } = parsed.data as any;
  if (roleId) {
    if (!mongoose.isValidObjectId(roleId)) return res.status(400).json({ ok: false, error: 'Invalid roleId' });
    (updates as any).roleId = roleId;
  }
  const user = await UserModel.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash').lean();
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

  // Optionally link organization (admin of org or super admin)
  if (orgId) {
    if (!mongoose.isValidObjectId(orgId)) return res.status(400).json({ ok: false, error: 'Invalid orgId' });
    if (req.user?.role !== 'admin') {
      const can = await UserOrganizationModel.findOne({ userId: req.user?.sub, orgId, role: 'admin' }).lean();
      if (!can) return res.status(403).json({ ok: false, error: 'Forbidden (org)' });
    }
    await UserOrganizationModel.findOneAndUpdate(
      { userId: id, orgId },
      { userId: id, orgId, role: (updates.role ?? user.role) as 'admin' | 'cashier' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  }

  // Optionally link stores (must be admin of those stores' orgs or super admin)
  if (Array.isArray(storeIds) && storeIds.length > 0) {
    const validIds = storeIds.filter(s => mongoose.isValidObjectId(s));
    if (validIds.length !== storeIds.length) return res.status(400).json({ ok: false, error: 'Invalid storeIds' });
    if (req.user?.role !== 'admin') {
      const stores = await StoreModel.find({ _id: { $in: validIds } }, { orgId: 1 }).lean();
      const orgIds = Array.from(new Set(stores.map(s => String(s.orgId))));
      const cnt = await UserOrganizationModel.find({ userId: req.user?.sub, role: 'admin', orgId: { $in: orgIds } }).countDocuments();
      if (cnt < orgIds.length) return res.status(403).json({ ok: false, error: 'Forbidden (stores)' });
    }
    await Promise.all(validIds.map(storeId =>
      UserStoreModel.findOneAndUpdate(
        { userId: id, storeId },
        { userId: id, storeId, role: 'cashier' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean()
    ));
  }

  res.json({ ok: true, user });
}

export async function listUsersByOrgController(req: Request, res: Response) {
  const { orgId } = req.params as any;
  if (!orgId) return res.status(400).json({ ok: false, error: 'orgId is required' });
  const links = await UserOrganizationModel.find({ orgId }).select('userId').lean();
  const userIds = links.map(l => l.userId);
  const users = await UserModel.find({ _id: { $in: userIds as any[] } }).select('-passwordHash').lean();
  res.json({ ok: true, users });
}

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'cashier']).default('cashier').optional(),
  roleId: z.string().optional(),
});

export async function createUserController(req: Request, res: Response) {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  try {
    const { roleId, ...rest } = parsed.data as any;
    const user = await register(rest);
    if (roleId && mongoose.isValidObjectId(roleId)) {
      await UserModel.findByIdAndUpdate(user._id, { roleId });
    }
    res.status(201).json({ ok: true, user });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

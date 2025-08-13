import { type NextFunction, type Response } from 'express';
import type { AuthRequest } from './auth.js';
import { UserOrganizationModel } from '../models/UserOrganization.js';
import { StoreModel } from '../models/Store.js';
import { ProductModel } from '../models/Product.js';
import mongoose from 'mongoose';

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Forbidden' });
  next();
}

export function authorizeOrgAdmin(extractOrgId?: (req: AuthRequest) => string | undefined) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    // Super admin always allowed
    if (req.user.role === 'admin') return next();
    const orgId = extractOrgId ? extractOrgId(req) : (req.body?.orgId || (req.query as any)?.orgId || req.params?.orgId);
    if (!orgId) return res.status(400).json({ ok: false, error: 'orgId is required' });
    const link = await UserOrganizationModel.findOne({ userId: req.user.sub, orgId, role: 'admin' }).lean();
    if (!link) return res.status(403).json({ ok: false, error: 'Forbidden' });
    return next();
  };
}

export function authorizeStoreAdmin(extractStoreIds?: (req: AuthRequest) => string[] | undefined) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (req.user.role === 'admin') return next();
    const ids = extractStoreIds ? extractStoreIds(req) : (Array.isArray(req.body?.storeIds) ? req.body.storeIds : [req.params?.storeId].filter(Boolean) as string[]);
    if (!ids || ids.length === 0) return res.status(400).json({ ok: false, error: 'storeId(s) required' });
    const stores = await StoreModel.find({ _id: { $in: ids } }, { orgId: 1 }).lean();
    const orgIds = Array.from(new Set(stores.map(s => String(s.orgId))));
    const links = await UserOrganizationModel.find({ userId: req.user.sub, orgId: { $in: orgIds }, role: 'admin' }).countDocuments();
    if (links < orgIds.length) return res.status(403).json({ ok: false, error: 'Forbidden' });
    return next();
  };
}

export function authorizeProductOrgAdmin() {
  // For product mutations where orgId is in body OR inferred from product id
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (req.user.role === 'admin') return next();
    let orgId: string | undefined = req.body?.orgId;
    if (!orgId && req.params?.id) {
      const product = await ProductModel.findById(req.params.id).select('orgId').lean();
      orgId = product ? String(product.orgId) : undefined;
    }
    if (!orgId) return res.status(400).json({ ok: false, error: 'orgId is required' });
    const link = await UserOrganizationModel.findOne({ userId: req.user.sub, orgId, role: 'admin' }).lean();
    if (!link) return res.status(403).json({ ok: false, error: 'Forbidden' });
    return next();
  };
}

export function authorizeStoreMutation() {
  // For store mutations where orgId is in body OR inferred from store id
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (req.user.role === 'admin') return next();
    let orgId: string | undefined = req.body?.orgId;
    if (!orgId && req.params?.id) {
      const store = await StoreModel.findById(req.params.id).select('orgId').lean();
      orgId = store ? String(store.orgId) : undefined;
    }
    if (!orgId) return res.status(400).json({ ok: false, error: 'orgId is required' });
    const link = await UserOrganizationModel.findOne({ userId: req.user.sub, orgId, role: 'admin' }).lean();
    if (!link) return res.status(403).json({ ok: false, error: 'Forbidden' });
    return next();
  };
}

export function authorizeOrgMember() {
  // Allow if super admin, or user linked to org (admin or cashier)
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (req.user.role === 'admin') return next();
    const orgId = (req.query as any)?.orgId || req.body?.orgId || req.params?.orgId;
    if (!orgId) return res.status(400).json({ ok: false, error: 'orgId is required' });
    const link = await UserOrganizationModel.findOne({ userId: req.user.sub, orgId }).lean();
    if (!link) return res.status(403).json({ ok: false, error: 'Forbidden' });
    return next();
  };
}

export function authorizeStoreMember() {
  // Allow if super admin or org admin of the store's org, or user linked to the store (cashier)
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (req.user.role === 'admin') return next();
    const storeId = req.body?.storeId || req.params?.storeId;
    if (!storeId) return res.status(400).json({ ok: false, error: 'storeId is required' });
    // Verify store exists and get its org
    const store = await StoreModel.findById(storeId).select('orgId').lean();
    if (!store) return res.status(404).json({ ok: false, error: 'Store not found' });
    // If org admin, allow
    const isOrgAdmin = await UserOrganizationModel.findOne({ userId: req.user.sub, orgId: store.orgId, role: 'admin' }).lean();
    if (isOrgAdmin) return next();
    // Else must be linked to store specifically
    const { UserStoreModel } = await import('../models/UserStore.js');
    const link = await UserStoreModel.findOne({ userId: req.user.sub, storeId }).lean();
    if (!link) return res.status(403).json({ ok: false, error: 'Forbidden' });
    return next();
  };
}

// Allow super admin, or org admin of any organization the target user belongs to
export function authorizeOrgAdminForTargetUser(extractTargetUserId?: (req: AuthRequest) => string | undefined) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (req.user.role === 'admin') return next();
    const targetUserId = extractTargetUserId ? extractTargetUserId(req) : (req.params as any)?.id;
    if (!targetUserId || !mongoose.isValidObjectId(targetUserId)) return res.status(400).json({ ok: false, error: 'Invalid user id' });
    // orgs where requester is admin
    const myAdminLinks = await UserOrganizationModel.find({ userId: req.user.sub, role: 'admin' }).select('orgId').lean();
    const myAdminOrgIds = myAdminLinks.map(l => String(l.orgId));
    if (myAdminOrgIds.length === 0) return res.status(403).json({ ok: false, error: 'Forbidden' });
    // does target user belong to any of these orgs?
    const targetLink = await UserOrganizationModel.findOne({ userId: targetUserId, orgId: { $in: myAdminOrgIds } }).lean();
    if (!targetLink) return res.status(403).json({ ok: false, error: 'Forbidden' });
    return next();
  };
}

// Allow super admin, or org admin for ALL provided orgIds in body
export function authorizeOrgAdminForOrgIds(extractOrgIds?: (req: AuthRequest) => string[] | undefined) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (req.user.role === 'admin') return next();
    const orgIds = extractOrgIds ? extractOrgIds(req) : (Array.isArray(req.body?.orgIds) ? req.body.orgIds : []);
    if (!orgIds || orgIds.length === 0) return res.status(400).json({ ok: false, error: 'orgIds are required' });
    const adminLinks = await UserOrganizationModel.find({ userId: req.user.sub, role: 'admin', orgId: { $in: orgIds } }).countDocuments();
    if (adminLinks < orgIds.length) return res.status(403).json({ ok: false, error: 'Forbidden' });
    return next();
  };
}

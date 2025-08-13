import { Router } from 'express';
import { z } from 'zod';
import { OrganizationModel } from '../models/Organization.js';
import { createProduct } from '../services/product.service.js';
import { UserOrganizationModel } from '../models/UserOrganization.js';
import { register } from '../services/auth.service.js';

const router = Router();

// Simple guard: require ENABLE_DEV_ENDPOINTS=true and optional header token match
router.use((req, res, next) => {
  if (process.env.ENABLE_DEV_ENDPOINTS !== 'true') return res.status(404).end();
  const expected = process.env.SETUP_TOKEN;
  if (expected && req.headers['x-setup-token'] !== expected) return res.status(403).json({ ok: false, error: 'Forbidden' });
  next();
});

// Create business (organization)
router.post('/org', async (req, res) => {
  const schema = z.object({ name: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const org = await OrganizationModel.create({ name: parsed.data.name });
  res.status(201).json({ ok: true, org: org.toObject() });
});

// Create test seller user
router.post('/seller', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  try {
    const user = await register({ ...parsed.data, role: 'cashier' });
    res.status(201).json({ ok: true, user });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Create product
router.post('/product', async (req, res) => {
  const schema = z.object({ orgId: z.string(), sku: z.string().min(1), name: z.string().min(1), price: z.number().nonnegative() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  try {
    const product = await createProduct(parsed.data);
    res.status(201).json({ ok: true, product });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

export default router;
// Link a seller to an organization (for quick setup)
router.post('/link-seller-org', async (req, res) => {
  const schema = z.object({ userId: z.string(), orgId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const { userId, orgId } = parsed.data;
  const link = await UserOrganizationModel.findOneAndUpdate(
    { userId, orgId },
    { userId, orgId, role: 'cashier' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  res.status(201).json({ ok: true, link });
});

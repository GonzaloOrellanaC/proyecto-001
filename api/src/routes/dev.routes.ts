import { Router } from 'express';
import { z } from 'zod';
import { OrganizationModel } from '../models/Organization.js';
import { createProduct } from '../services/product.service.js';
import { UserOrganizationModel } from '../models/UserOrganization.js';
import { register } from '../services/auth.service.js';
import { ProductModel } from '../models/Product.js';
import { setStock } from '../services/inventory.service.js';
import { SeedLogModel } from '../models/SeedLog.js';
import fs from 'fs';
import path from 'path';

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

// One-time seed: 150 clothing products + random stock (1-9)
router.post('/seed/clothing-150', async (req, res) => {
  try {
    const key = 'seed:clothing-150@v1';
    const exists = await SeedLogModel.findOne({ key }).lean();
    if (exists) return res.status(409).json({ ok: false, error: 'Seed already applied' });

    const filePath = path.join(process.cwd(), 'seed', 'products.clothing.150.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as { orgId: string; storeId: string; products: any[] };
    const { orgId, storeId } = data;

    // Build 150 products from template list by cycling and varying SKU suffixes
    const base = data.products;
    const products: any[] = [];
    let counter = 1;
    while (products.length < 150) {
      for (const p of base) {
        if (products.length >= 150) break;
        const idx = counter.toString().padStart(3, '0');
        const sku = `${p.sku}-${idx}`;
        products.push({ ...p, orgId, sku });
        counter++;
      }
    }

    // Upsert by orgId+sku; then set random stock per product for the given store
    const createdIds: string[] = [];
    for (const p of products) {
      const update = { $setOnInsert: { orgId, name: p.name, price: p.price, description: p.description, manufacturer: p.manufacturer, sizes: p.sizes } } as any;
      const doc = await ProductModel.findOneAndUpdate({ orgId, sku: p.sku }, update, { new: true, upsert: true, setDefaultsOnInsert: true });
      createdIds.push(String(doc._id));
      const qty = Math.floor(Math.random() * 9) + 1; // 1..9
      await setStock(orgId, storeId, String(doc._id), qty);
    }

    await SeedLogModel.create({ key });
    res.status(201).json({ ok: true, count: createdIds.length });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

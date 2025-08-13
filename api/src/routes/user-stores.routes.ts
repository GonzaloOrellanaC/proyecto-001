import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { authorizeStoreAdmin } from '../middlewares/orgAuth.js';
import { z } from 'zod';
import { UserStoreModel } from '../models/UserStore.js';

const router = Router();

// Link a user to multiple stores (admin)
router.post('/link', requireAuth, authorizeStoreAdmin(req => req.body?.storeIds), async (req, res) => {
  const schema = z.object({ userId: z.string(), storeIds: z.array(z.string()).min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const { userId, storeIds } = parsed.data;
  const ops = await Promise.all(storeIds.map(storeId =>
    UserStoreModel.findOneAndUpdate(
      { userId, storeId },
      { userId, storeId, role: 'cashier' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()
  ));
  res.status(201).json({ ok: true, links: ops });
});

// List stores linked to a user (admin)
router.get('/by-user/:userId', requireAuth, authorize('admin'), async (req, res) => {
  const { userId } = req.params;
  const links = await UserStoreModel.find({ userId }).lean();
  res.json({ ok: true, links });
});

export default router;

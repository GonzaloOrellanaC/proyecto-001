import { type Request, type Response } from 'express';
import { createStore, listStores, updateStore, UpsertStoreSchema } from '../services/store.service.js';

export async function listStoresController(req: Request, res: Response) {
  const { orgId } = req.query as any;
  if (!orgId) return res.status(400).json({ ok: false, error: 'orgId is required' });
  const stores = await listStores(String(orgId));
  res.json({ ok: true, stores });
}

export async function createStoreController(req: Request, res: Response) {
  const parsed = UpsertStoreSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  try {
    const store = await createStore(parsed.data);
    res.status(201).json({ ok: true, store });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

export async function updateStoreController(req: Request, res: Response) {
  try {
    const store = await updateStore(req.params.id, req.body);
    res.json({ ok: true, store });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

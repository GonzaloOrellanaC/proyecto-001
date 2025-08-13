import { type Request, type Response } from 'express';
import { z } from 'zod';
import { setStock, getStock, InventoryKey } from '../services/inventory.service.js';

export async function setStockController(req: Request, res: Response) {
  const schema = InventoryKey.extend({ qty: z.number().int().nonnegative() });
  const parsed = schema.safeParse({ ...req.params, ...req.body });
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const { orgId, storeId, productId } = parsed.data;
  await setStock(orgId, storeId, productId, parsed.data.qty);
  return res.json({ ok: true });
}

export async function getStockController(req: Request, res: Response) {
  const parsed = InventoryKey.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const { orgId, storeId, productId } = parsed.data;
  const qty = await getStock(orgId, storeId, productId);
  return res.json({ ok: true, qty });
}

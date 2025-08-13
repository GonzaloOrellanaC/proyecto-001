import { type Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { createSale, CreateSaleInput } from '../services/sales.service.js';

export async function createSaleController(req: AuthRequest, res: Response) {
  const parsed = CreateSaleInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  try {
    const sale = await createSale(req.user!.sub, parsed.data);
    return res.status(201).json({ ok: true, sale });
  } catch (err: any) {
  // eslint-disable-next-line no-console
  console.error('createSale error:', err);
  return res.status(400).json({ ok: false, error: err.message });
  }
}

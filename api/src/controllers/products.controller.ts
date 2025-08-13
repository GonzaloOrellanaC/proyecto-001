import { type Request, type Response } from 'express';
import { createProduct, deleteProduct, listProducts, updateProduct, UpsertProductSchema } from '../services/product.service.js';

export async function listProductsController(req: Request, res: Response) {
  const { orgId } = req.query as any;
  if (!orgId) return res.status(400).json({ ok: false, error: 'orgId is required' });
  const products = await listProducts(String(orgId));
  res.json({ ok: true, products });
}

export async function createProductController(req: Request, res: Response) {
  const parsed = UpsertProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  try {
    const product = await createProduct(parsed.data);
    res.status(201).json({ ok: true, product });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

export async function updateProductController(req: Request, res: Response) {
  try {
    const product = await updateProduct(req.params.id, req.body);
    res.json({ ok: true, product });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

export async function deleteProductController(req: Request, res: Response) {
  try {
    await deleteProduct(req.params.id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

import mongoose from 'mongoose';
import { z } from 'zod';
import { ProductModel, type Product } from '../models/Product.js';

export const UpsertProductSchema = z.object({
  orgId: z.string(),
  sku: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
});
export type UpsertProductInput = z.infer<typeof UpsertProductSchema>;

export async function listProducts(orgId: string): Promise<Product[]> {
  return await ProductModel.find({ orgId: new mongoose.Types.ObjectId(orgId) }).lean();
}

export async function createProduct(data: UpsertProductInput): Promise<Product> {
  const parsed = UpsertProductSchema.parse(data);
  const created = await ProductModel.create({
    orgId: new mongoose.Types.ObjectId(parsed.orgId),
    sku: parsed.sku,
    name: parsed.name,
    price: parsed.price,
  });
  return created.toObject() as Product;
}

export async function updateProduct(id: string, data: Partial<UpsertProductInput>): Promise<Product> {
  if (!mongoose.isValidObjectId(id)) throw new Error('Invalid id');
  const parsed = UpsertProductSchema.partial().parse(data);
  const update: any = { ...parsed };
  if (parsed.orgId) update.orgId = new mongoose.Types.ObjectId(parsed.orgId);
  const updated = await ProductModel.findByIdAndUpdate(id, update, { new: true });
  if (!updated) throw new Error('Product not found');
  return updated.toObject() as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  if (!mongoose.isValidObjectId(id)) throw new Error('Invalid id');
  const existed = await ProductModel.findByIdAndDelete(id);
  if (!existed) throw new Error('Product not found');
}

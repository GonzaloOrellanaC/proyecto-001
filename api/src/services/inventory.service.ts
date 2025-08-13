import { z } from 'zod';
import mongoose from 'mongoose';
import { InventoryModel } from '../models/Inventory.js';

export const InventoryKey = z.object({ orgId: z.string(), storeId: z.string(), productId: z.string() });

export async function setStock(orgId: string, storeId: string, productId: string, qty: number) {
  const key = { orgId: new mongoose.Types.ObjectId(orgId), storeId: new mongoose.Types.ObjectId(storeId), productId: new mongoose.Types.ObjectId(productId) };
  await InventoryModel.updateOne(key, { $set: { qty } }, { upsert: true });
}

export async function getStock(orgId: string, storeId: string, productId: string) {
  const doc = await InventoryModel.findOne({ orgId, storeId, productId }).lean();
  return doc?.qty ?? 0;
}

export async function decreaseStock(session: mongoose.ClientSession | null, orgId: string, storeId: string, productId: string, qty: number) {
  const filter = {
    orgId: new mongoose.Types.ObjectId(orgId),
    storeId: new mongoose.Types.ObjectId(storeId),
    productId: new mongoose.Types.ObjectId(productId),
    qty: { $gte: qty },
  } as any;
  const options = session ? { session } : {};
  const res = await InventoryModel.updateOne(filter, { $inc: { qty: -qty } }, options as any);
  if (res.modifiedCount !== 1) throw new Error('Insufficient stock');
}

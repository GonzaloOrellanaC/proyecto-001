import mongoose from 'mongoose';
import { z } from 'zod';
import { StoreModel, type Store } from '../models/Store.js';

export const UpsertStoreSchema = z.object({
  orgId: z.string(),
  name: z.string().min(1),
  code: z.string().optional(),
  address: z.string().optional(),
  // coordinates as [lat, lng] input, but we'll store [lng, lat]
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type UpsertStoreInput = z.infer<typeof UpsertStoreSchema>;

export async function createStore(data: UpsertStoreInput): Promise<Store> {
  const parsed = UpsertStoreSchema.parse(data);
  const doc: any = {
    orgId: new mongoose.Types.ObjectId(parsed.orgId),
    name: parsed.name,
    code: parsed.code,
    address: parsed.address,
  };
  if (parsed.lat !== undefined && parsed.lng !== undefined) {
    doc.location = { type: 'Point', coordinates: [parsed.lng, parsed.lat] };
  }
  const created = await StoreModel.create(doc);
  return created.toObject() as Store;
}

export async function listStores(orgId: string): Promise<Store[]> {
  return await StoreModel.find({ orgId: new mongoose.Types.ObjectId(orgId) }).lean();
}

export async function updateStore(id: string, data: Partial<UpsertStoreInput>): Promise<Store> {
  if (!mongoose.isValidObjectId(id)) throw new Error('Invalid id');
  const parsed = UpsertStoreSchema.partial().parse(data);
  const update: any = { ...parsed };
  if (parsed.orgId) update.orgId = new mongoose.Types.ObjectId(parsed.orgId);
  if (parsed.lat !== undefined && parsed.lng !== undefined) {
    update.location = { type: 'Point', coordinates: [parsed.lng, parsed.lat] };
    delete update.lat; delete update.lng;
  }
  const updated = await StoreModel.findByIdAndUpdate(id, update, { new: true });
  if (!updated) throw new Error('Store not found');
  return updated.toObject() as Store;
}

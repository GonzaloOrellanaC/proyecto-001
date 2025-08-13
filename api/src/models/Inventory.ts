import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const InventorySchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  qty: { type: Number, required: true, min: 0 },
}, { timestamps: true });
InventorySchema.index({ orgId: 1, storeId: 1, productId: 1 }, { unique: true });

export type Inventory = InferSchemaType<typeof InventorySchema> & { _id: mongoose.Types.ObjectId };
export const InventoryModel = (mongoose.models.Inventory as mongoose.Model<Inventory>) || mongoose.model('Inventory', InventorySchema);

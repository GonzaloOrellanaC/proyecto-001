import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const SaleItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
}, { _id: false });

const SaleSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  total: { type: Number, required: true, min: 0 },
  items: { type: [SaleItemSchema], required: true },
  status: { type: String, enum: ['completed', 'void'], default: 'completed' },
}, { timestamps: true });

export type Sale = InferSchemaType<typeof SaleSchema> & { _id: mongoose.Types.ObjectId };
export const SaleModel = (mongoose.models.Sale as mongoose.Model<Sale>) || mongoose.model('Sale', SaleSchema);

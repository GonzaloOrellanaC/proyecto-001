import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const ProductSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  sku: { type: String, required: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String },
  manufacturer: { type: Object },
  sizes: { type: [String], default: [] },
}, { timestamps: true });

export type Product = InferSchemaType<typeof ProductSchema> & { _id: mongoose.Types.ObjectId };
export const ProductModel = (mongoose.models.Product as mongoose.Model<Product>) || mongoose.model('Product', ProductSchema);

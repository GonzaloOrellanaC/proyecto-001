import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const StoreSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true },
  code: { type: String },
  address: { type: String },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [lng, lat]
      validate: {
        validator: (val: number[]) => Array.isArray(val) && val.length === 2,
        message: 'coordinates must be [lng, lat]'
      }
    }
  },
}, { timestamps: true });

StoreSchema.index({ location: '2dsphere' });

export type Store = InferSchemaType<typeof StoreSchema> & { _id: mongoose.Types.ObjectId };
export const StoreModel = (mongoose.models.Store as mongoose.Model<Store>) || mongoose.model('Store', StoreSchema);

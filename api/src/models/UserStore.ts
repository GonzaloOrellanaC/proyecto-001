import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const UserStoreSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  role: { type: String, enum: ['cashier'], default: 'cashier' },
}, { timestamps: true });

UserStoreSchema.index({ userId: 1, storeId: 1 }, { unique: true });

export type UserStore = InferSchemaType<typeof UserStoreSchema> & { _id: mongoose.Types.ObjectId };
export const UserStoreModel = (mongoose.models.UserStore as mongoose.Model<UserStore>) || mongoose.model('UserStore', UserStoreSchema);

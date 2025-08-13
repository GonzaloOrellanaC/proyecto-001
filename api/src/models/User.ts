import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  // legacy string role for compatibility; prefer roleId dynamic model
  role: { type: String, enum: ['admin', 'cashier'], default: 'cashier' },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
  phone: { type: String },
  avatarUrl: { type: String },
}, { timestamps: true });

export type User = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model('User', UserSchema);

import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const RoleSchema = new Schema({
  key: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  description: { type: String },
  permissions: [{ type: String }],
  isSystem: { type: Boolean, default: false },
}, { timestamps: true });

export type Role = InferSchemaType<typeof RoleSchema> & { _id: mongoose.Types.ObjectId };

export const RoleModel = (mongoose.models.Role as mongoose.Model<Role>) || mongoose.model('Role', RoleSchema);

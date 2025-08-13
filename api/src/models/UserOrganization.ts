import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const UserOrganizationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  role: { type: String, enum: ['admin', 'cashier'], default: 'cashier' },
}, { timestamps: true });
UserOrganizationSchema.index({ userId: 1, orgId: 1 }, { unique: true });

export type UserOrganization = InferSchemaType<typeof UserOrganizationSchema> & { _id: mongoose.Types.ObjectId };
export const UserOrganizationModel = (mongoose.models.UserOrganization as mongoose.Model<UserOrganization>) || mongoose.model('UserOrganization', UserOrganizationSchema);

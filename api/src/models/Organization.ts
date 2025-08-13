import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const OrganizationSchema = new Schema({
  name: { type: String, required: true },
}, { timestamps: true });

export type Organization = InferSchemaType<typeof OrganizationSchema> & { _id: mongoose.Types.ObjectId };
export const OrganizationModel = (mongoose.models.Organization as mongoose.Model<Organization>) || mongoose.model('Organization', OrganizationSchema);

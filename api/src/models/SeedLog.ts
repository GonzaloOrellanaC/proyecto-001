import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const SeedLogSchema = new Schema({
  key: { type: String, required: true, unique: true },
  at: { type: Date, default: Date.now },
}, { timestamps: true });

export type SeedLog = InferSchemaType<typeof SeedLogSchema> & { _id: mongoose.Types.ObjectId };
export const SeedLogModel = (mongoose.models.SeedLog as mongoose.Model<SeedLog>) || mongoose.model('SeedLog', SeedLogSchema);

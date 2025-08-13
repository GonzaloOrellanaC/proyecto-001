import mongoose from 'mongoose';
import { z } from 'zod';
import { RoleModel, type Role } from '../models/Role.js';

const UpsertRoleSchema = z.object({
  key: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isSystem: z.boolean().optional(),
});
export type UpsertRoleInput = z.infer<typeof UpsertRoleSchema>;

export async function listRoles(): Promise<Role[]> {
  return await RoleModel.find().lean();
}

export async function createRole(data: UpsertRoleInput): Promise<Role> {
  const parsed = UpsertRoleSchema.parse(data);
  const exists = await RoleModel.findOne({ key: parsed.key }).lean();
  if (exists) throw new Error('Role key already exists');
  const doc = await RoleModel.create(parsed);
  return doc.toObject() as Role;
}

export async function updateRole(id: string, data: Partial<UpsertRoleInput>): Promise<Role> {
  if (!mongoose.isValidObjectId(id)) throw new Error('Invalid id');
  const parsed = UpsertRoleSchema.partial().parse(data);
  const doc = await RoleModel.findByIdAndUpdate(id, parsed, { new: true });
  if (!doc) throw new Error('Role not found');
  return doc.toObject() as Role;
}

export async function deleteRole(id: string): Promise<void> {
  if (!mongoose.isValidObjectId(id)) throw new Error('Invalid id');
  const doc = await RoleModel.findById(id);
  if (!doc) throw new Error('Role not found');
  if (doc.isSystem) throw new Error('Cannot delete system role');
  await RoleModel.findByIdAndDelete(id);
}

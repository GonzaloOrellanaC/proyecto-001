import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.js';
import { RoleModel } from '../models/Role.js';

/**
 * Creates a default super admin user from environment variables if it doesn't exist.
 * Required envs:
 *  - ADMIN_EMAIL
 *  - ADMIN_PASSWORD
 * Optional env:
 *  - ADMIN_NAME (defaults to 'Super Admin')
 */
export async function seedDefaultAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    // Nothing to seed
    return;
  }

  // Ensure base system roles exist
  const baseRoles = [
    { key: 'admin', name: 'Administrator', description: 'Full access', permissions: ['*'], isSystem: true },
    { key: 'cashier', name: 'Cashier', description: 'Point of sale operations', permissions: ['sales:create', 'sales:read', 'inventory:read'], isSystem: true },
  ];
  for (const r of baseRoles) {
    // upsert by key
    await RoleModel.updateOne({ key: r.key }, { $setOnInsert: r }, { upsert: true });
  }

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 10);
  const adminRole = await RoleModel.findOne({ key: 'admin' }).lean();
  await UserModel.create({ email, name, passwordHash, role: 'admin', roleId: adminRole?._id });
  // eslint-disable-next-line no-console
  console.log(`Seeded default admin user: ${email}`);
}

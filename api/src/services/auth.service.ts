import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserModel, type User } from '../models/User.js';

const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['admin', 'cashier']).optional(),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

const LoginInput = z.object({ email: z.string().email(), password: z.string().min(1) });
export type LoginInput = z.infer<typeof LoginInput>;

export async function register(data: RegisterInput): Promise<User> {
  const parsed = RegisterInput.parse(data);
  const exists = await UserModel.findOne({ email: parsed.email }).lean();
  if (exists) throw new Error('Email already in use');
  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const doc = await UserModel.create({ email: parsed.email, passwordHash, name: parsed.name, role: parsed.role ?? 'cashier' });
  const user = doc.toObject() as User;
  // @ts-expect-error strip sensitive field present in raw doc type
  delete user.passwordHash;
  return user;
}

export async function login(data: LoginInput): Promise<{ token: string; user: User }> {
  const parsed = LoginInput.parse(data);
  const doc = await UserModel.findOne({ email: parsed.email });
  if (!doc) throw new Error('Invalid credentials');
  const ok = await bcrypt.compare(parsed.password, doc.passwordHash);
  if (!ok) throw new Error('Invalid credentials');
  const payload = { sub: String(doc._id), email: doc.email, role: doc.role };
  const secret = process.env.JWT_SECRET || 'dev';
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  const user = doc.toObject() as User;
  // @ts-expect-error strip sensitive field present in raw doc type
  delete user.passwordHash;
  return { token, user };
}

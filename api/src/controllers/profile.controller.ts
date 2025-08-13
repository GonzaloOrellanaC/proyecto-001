import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.js';
import type { AuthRequest } from '../middlewares/auth.js';
import { z } from 'zod';

const UpdateMeSchema = z.object({ name: z.string().min(1).optional(), phone: z.string().optional(), avatarUrl: z.string().url().optional() });

export async function meController(req: AuthRequest, res: Response) {
  const userId = req.user!.sub;
  if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ ok: false, error: 'Invalid user id' });
  const user = await UserModel.findById(userId).select('-passwordHash').lean();
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
  res.json({ ok: true, user });
}

export async function updateMeController(req: AuthRequest, res: Response) {
  const userId = req.user!.sub;
  const parsed = UpdateMeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const user = await UserModel.findByIdAndUpdate(userId, parsed.data, { new: true }).select('-passwordHash').lean();
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
  res.json({ ok: true, user });
}

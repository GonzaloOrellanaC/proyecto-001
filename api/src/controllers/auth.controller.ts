import { type Request, type Response } from 'express';
import { login, register } from '../services/auth.service.js';

export async function registerController(req: Request, res: Response) {
  try {
    const user = await register(req.body);
    res.status(201).json({ ok: true, user });
  } catch (err: any) {
  // eslint-disable-next-line no-console
  console.error('register error:', err);
  res.status(400).json({ ok: false, error: err.message });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const result = await login(req.body);
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(401).json({ ok: false, error: err.message });
  }
}

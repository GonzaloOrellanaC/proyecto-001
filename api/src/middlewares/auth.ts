import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request { user?: { sub: string; email: string; role: string } }

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'Missing token' });
  const token = auth.slice(7)
  try {
    const secret = process.env.JWT_SECRET || 'dev';
    const payload = jwt.verify(token, secret) as any;
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid token' });
  }
}

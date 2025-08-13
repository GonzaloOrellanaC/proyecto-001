import { type Request, type Response } from 'express';
import { z } from 'zod';
import { OrganizationModel } from '../models/Organization.js';

export async function listOrganizationsController(_req: Request, res: Response) {
  const orgs = await OrganizationModel.find().lean();
  res.json({ ok: true, organizations: orgs });
}

const CreateOrganizationSchema = z.object({ name: z.string().min(1) });

export async function createOrganizationController(req: Request, res: Response) {
  const parsed = CreateOrganizationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const doc = await OrganizationModel.create({ name: parsed.data.name });
  res.status(201).json({ ok: true, organization: doc.toObject() });
}

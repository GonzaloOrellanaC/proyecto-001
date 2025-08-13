import { type Request, type Response } from 'express';
import { z } from 'zod';
import { createRole, deleteRole, listRoles, updateRole } from '../services/role.service.js';

const RoleInput = z.object({
  key: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export async function listRolesController(_req: Request, res: Response) {
  const roles = await listRoles();
  res.json({ ok: true, roles });
}

export async function createRoleController(req: Request, res: Response) {
  const parsed = RoleInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  try {
    const role = await createRole(parsed.data);
    res.status(201).json({ ok: true, role });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

export async function updateRoleController(req: Request, res: Response) {
  const id = req.params.id;
  try {
    const role = await updateRole(id, req.body);
    res.json({ ok: true, role });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

export async function deleteRoleController(req: Request, res: Response) {
  const id = req.params.id;
  try {
    await deleteRole(id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { traceService, type TraceEvent } from 'pv-blockchain';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

const TraceParams = z.object({ id: z.string().min(1) });

router.get('/trace/:id', async (req: Request, res: Response) => {
  const parsed = TraceParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { id } = parsed.data;
  const events = await traceService.getEvents(id);
  return res.json({ id, events });
});

const TraceBody = z.object({
  id: z.string().min(1),
  type: z.enum(['CREATED', 'MOVED', 'SOLD']),
  metadata: z.record(z.unknown()).optional(),
});

router.post('/trace', async (req: Request, res: Response) => {
  const parsed = TraceBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const body = parsed.data;
  const event: TraceEvent = {
    id: body.id,
    type: body.type,
    timestamp: new Date().toISOString(),
    metadata: body.metadata,
  };
  const tx = await traceService.recordEvent(event);
  return res.status(201).json({ ok: true, tx });
});

export default router;

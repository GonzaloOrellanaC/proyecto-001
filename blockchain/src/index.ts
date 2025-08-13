export type TraceEvent = {
  id: string;
  type: 'CREATED' | 'MOVED' | 'SOLD';
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export interface ITraceService {
  recordEvent(event: TraceEvent): Promise<string>; // returns tx hash or id
  getEvents(id: string): Promise<TraceEvent[]>;
}

// Placeholder implementation (no blockchain yet)
class InMemoryTraceService implements ITraceService {
  private store = new Map<string, TraceEvent[]>();

  async recordEvent(event: TraceEvent): Promise<string> {
    const events = this.store.get(event.id) ?? [];
    events.push(event);
    this.store.set(event.id, events);
    return `mem:${event.id}:${events.length}`;
  }

  async getEvents(id: string): Promise<TraceEvent[]> {
    return this.store.get(id) ?? [];
  }
}

export const traceService: ITraceService = new InMemoryTraceService();

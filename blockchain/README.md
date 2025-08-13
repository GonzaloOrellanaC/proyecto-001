# pv-blockchain

Paquete de trazabilidad desacoplado. Implementación temporal en memoria.

API:
- `recordEvent(event)` -> Promise<string>
- `getEvents(id)` -> Promise<TraceEvent[]>

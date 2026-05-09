import type { IncomingMessage, ServerResponse } from 'http';

export const config = { runtime: 'nodejs' };

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, version: '1.0.0', source: 'minimal' }));
}

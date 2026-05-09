import { serve } from '@hono/node-server';
import app from './index.js';

const port = parseInt(process.env.PORT ?? '3000');

serve({ fetch: app.fetch, port }, () => {
  console.log(`FITCORE API running on port ${port}`);
});

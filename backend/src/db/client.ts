import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// pg-connection-string v3 overrides ssl config when sslmode= is present in the URL,
// forcing certificate verification. Strip it so our ssl option below takes effect.
function stripSslMode(url: string): string {
  return url.replace(/([?&])sslmode=[^&]*/g, '$1').replace(/[?&]$/, '');
}

const connString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL!;

const pool = new Pool({
  connectionString: stripSslMode(connString),
  ssl: { rejectUnauthorized: false },
  max: 1,
});

export const db = drizzle(pool, { schema });

export type DB = typeof db;

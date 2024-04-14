import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.database';

export const client = postgres(process.env.DATABASE_URL as string, { max: 1 });
export const db = drizzle(client, { schema });

// REMOVE: import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
// REMOVE: import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Create the connection pool as before
const client = mysql.createPool(env.DATABASE_URL);

// EXPORT THE RAW MYSQL2 POOL CLIENT
// Renamed from 'db' to 'dbPool' for clarity, but you can use 'db' if you prefer.
export const dbPool = client;

// REMOVE: export const db = drizzle(client, { schema, mode: 'default' });
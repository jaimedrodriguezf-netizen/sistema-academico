import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/asistencia';

export const connection = mysql.createPool({
  uri: connectionString,
  connectionLimit: 10,
});

export const db = drizzle(connection, { schema, mode: 'default' });

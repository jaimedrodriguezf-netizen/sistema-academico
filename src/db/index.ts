import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/asistencia';

const globalForDb = globalThis as unknown as {
  connection: mysql.Pool | undefined;
};

let connection: mysql.Pool;

if (globalForDb.connection) {
  connection = globalForDb.connection;
} else {
  const url = new URL(connectionString);
  connection = mysql.createPool({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.substring(1),
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // 10s
    idleTimeout: 60000,           // 60s
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.connection = connection;
  }
}

export { connection };
export const db = drizzle(connection, { schema, mode: 'default' });

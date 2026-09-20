import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ENV } from '../config/env.js';

const resolvedDbPath = path.resolve(process.cwd(), ENV.DATABASE_PATH);
const dbDir = path.dirname(resolvedDbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: Database.Database = new Database(resolvedDbPath, {
  verbose: ENV.NODE_ENV === 'development' ? undefined : undefined,
});

// Configure Pragmas for ACID Safety and Performance in WAL mode
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');

export function getDb(): Database.Database {
  return db;
}

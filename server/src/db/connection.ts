import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from '../config/env.js';

const resolvedDbPath = path.resolve(process.cwd(), ENV.DATABASE_PATH);
const dbDir = path.dirname(resolvedDbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function resolveNativeBinding(): string | undefined {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(currentDir, '../node_modules/better-sqlite3/build/Release/better_sqlite3.node'),
    path.resolve(currentDir, '../../node_modules/better-sqlite3/build/Release/better_sqlite3.node'),
    path.resolve(process.cwd(), 'node_modules/better-sqlite3/build/Release/better_sqlite3.node'),
    path.resolve(process.cwd(), 'server/node_modules/better-sqlite3/build/Release/better_sqlite3.node'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

const nativeBinding = resolveNativeBinding();

export const db: Database.Database = new Database(resolvedDbPath, {
  nativeBinding,
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

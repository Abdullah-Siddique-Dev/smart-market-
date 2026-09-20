import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations(): void {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`);
  }

  // Incremental schema migrations for existing local database before running full schema
  try {
    const tableInfo = db.pragma('table_info(orders)') as Array<{ name: string }>;
    const hasOrderSource = tableInfo.some((col) => col.name === 'order_source');
    if (!hasOrderSource && tableInfo.length > 0) {
      db.exec(`ALTER TABLE orders ADD COLUMN order_source TEXT NOT NULL DEFAULT 'MANUAL_WHATSAPP'`);
      console.log('✅ [Database] Added order_source column to orders table.');
    }
  } catch (err) {
    console.warn('Migration check warning (order_source):', err);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(sql);

  console.log('✅ [Database] SQLite schema migrations executed successfully.');
}

// Allow direct execution via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
  process.exit(0);
}

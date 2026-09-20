import { db } from '../db/connection.js';
import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../middleware/error.middleware.js';
import { UserRole } from '../config/constants.js';

export class SystemService {
  static getStatus(): Record<string, unknown> {
    const tableCounts = {
      products: (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c,
      retail_shops: (db.prepare('SELECT COUNT(*) as c FROM retail_shops').get() as { c: number }).c,
      order_bookers: (db.prepare('SELECT COUNT(*) as c FROM order_bookers').get() as { c: number }).c,
      orders: (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c,
      bills: (db.prepare('SELECT COUNT(*) as c FROM bills').get() as { c: number }).c,
      inventory_ledger: (db.prepare('SELECT COUNT(*) as c FROM inventory_ledger').get() as { c: number }).c,
    };

    const integrityCheck = db.pragma('integrity_check') as Array<{ integrity_check: string }>;
    const isIntegrityOk = integrityCheck[0]?.integrity_check === 'ok';

    // Find latest backup if any exists
    const backupDir = path.resolve(process.cwd(), './data/backups');
    let latestBackup: string | null = null;
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sqlite'));
      if (files.length > 0) {
        files.sort();
        latestBackup = files[files.length - 1];
      }
    }

    return {
      status: 'ONLINE',
      uptime_seconds: Math.floor(process.uptime()),
      database: {
        path: ENV.DATABASE_PATH,
        journal_mode: (db.pragma('journal_mode') as Array<{ journal_mode: string }>)[0]?.journal_mode,
        foreign_keys: (db.pragma('foreign_keys') as Array<{ foreign_keys: number }>)[0]?.foreign_keys === 1,
        integrity: isIntegrityOk ? 'OK' : 'CORRUPTED',
      },
      latest_backup: latestBackup,
      records: tableCounts,
    };
  }

  static async triggerBackup(): Promise<{ backup_file: string; size_bytes: number }> {
    const backupDir = path.resolve(process.cwd(), './data/backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `smart_market_backup_${timestamp}.sqlite`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Use better-sqlite3 native backup API to safely take a snapshot while WAL is active
    await db.backup(backupFilePath);

    const stats = fs.statSync(backupFilePath);
    return {
      backup_file: backupFileName,
      size_bytes: stats.size,
    };
  }

  static getUsers(): Array<Record<string, unknown>> {
    return db
      .prepare('SELECT id, username, full_name, role, is_active, created_at FROM system_users ORDER BY id ASC')
      .all() as Array<Record<string, unknown>>;
  }

  static async createUser(data: {
    username: string;
    password: string;
    full_name: string;
    role: UserRole;
  }): Promise<Record<string, unknown>> {
    const existing = db.prepare('SELECT id FROM system_users WHERE username = ?').get(data.username);
    if (existing) {
      throw new AppError('Username is already in use', 409, 'DUPLICATE_USERNAME');
    }

    const passwordHash = await hashPassword(data.password);
    const result = db
      .prepare(`
        INSERT INTO system_users (username, password_hash, full_name, role, is_active)
        VALUES (?, ?, ?, ?, 1)
      `)
      .run(data.username.trim(), passwordHash, data.full_name.trim(), data.role);

    return {
      id: Number(result.lastInsertRowid),
      username: data.username,
      full_name: data.full_name,
      role: data.role,
    };
  }
}

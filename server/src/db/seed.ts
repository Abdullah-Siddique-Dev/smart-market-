import { db } from './connection.js';
import { runMigrations } from './migrate.js';
import { hashPassword } from '../utils/password.js';
import { USER_ROLES } from '../config/constants.js';
import { fileURLToPath } from 'url';

export async function seedDatabase(): Promise<void> {
  runMigrations();

  const existingOwner = db
    .prepare('SELECT id FROM system_users WHERE role = ? LIMIT 1')
    .get(USER_ROLES.OWNER);

  if (!existingOwner) {
    const ownerHash = await hashPassword('admin123');
    db.prepare(`
      INSERT INTO system_users (username, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run('admin', ownerHash, 'Business Owner', USER_ROLES.OWNER);

    console.log('🌱 [Database Seed] Created default OWNER account: admin / admin123');
  }

  // Ensure any existing user accounts have OWNER role
  db.exec("UPDATE system_users SET role = 'OWNER' WHERE role != 'OWNER';");

  console.log('✅ [Database Seed] Seeding completed.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

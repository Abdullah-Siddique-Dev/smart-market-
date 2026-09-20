import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';

async function startServer(): Promise<void> {
  try {
    console.log('🚀 [Server] Initializing Smart Market OS Database...');
    runMigrations();
    await seedDatabase();

    const app = createApp();

    app.listen(ENV.PORT, () => {
      console.log('====================================================');
      console.log(`✅ Smart Market OS REST API running on http://localhost:${ENV.PORT}`);
      console.log(`📡 Environment: ${ENV.NODE_ENV}`);
      console.log(`🔒 Database: SQLite in WAL mode (${ENV.DATABASE_PATH})`);
      console.log(`🌐 Allowed CORS: ${ENV.CLIENT_ORIGINS.join(', ')}`);
      console.log(`🩺 Health check: http://localhost:${ENV.PORT}/api/system/status`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('❌ Failed to start Smart Market OS server:', error);
    process.exit(1);
  }
}

startServer();

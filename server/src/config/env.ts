import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  SESSION_SECRET: process.env.SESSION_SECRET || 'smart-market-os-secret-local-key',
  DATABASE_PATH: process.env.DATABASE_PATH || './data/smart_market.sqlite',
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,tauri://localhost,http://localhost:1420')
    .split(',')
    .map(origin => origin.trim()),
};

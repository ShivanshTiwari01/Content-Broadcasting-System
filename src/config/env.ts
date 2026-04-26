import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT',
  'UPLOAD_DIR',
  'MAX_FILE_SIZE_MB',
] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  DATABASE_URL: process.env['DATABASE_URL']!,
  PORT: parseInt(process.env['PORT'] ?? '3000', 10),
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  JWT_SECRET: process.env['JWT_SECRET']!,
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '7d',
  UPLOAD_DIR: process.env['UPLOAD_DIR'] ?? 'uploads',
  MAX_FILE_SIZE_BYTES:
    parseInt(process.env['MAX_FILE_SIZE_MB'] ?? '10', 10) * 1024 * 1024,
  REDIS_URL: process.env['REDIS_URL'] ?? 'redis://127.0.0.1:6379',
} as const;

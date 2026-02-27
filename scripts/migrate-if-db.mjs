/**
 * Runs `prisma migrate deploy` only when DATABASE_URL is set.
 * Skips silently on Vercel preview deployments (no DB env vars).
 */
import { execSync } from 'child_process';

if (!process.env.DATABASE_URL) {
  console.log('No DATABASE_URL — skipping prisma migrate deploy');
  process.exit(0);
}

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env, DIRECT_URL: directUrl },
});

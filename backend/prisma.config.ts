try {
  await import('dotenv/config');
} catch {
  // In production, environment variables are already set by Docker
  console.warn('dotenv/config not found, skipping dotenv import');
}
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma CLI configuration.
 *
 * As of Prisma 7 the datasource URL is supplied here rather than in
 * `schema.prisma`, and it is used by the CLI (migrate, db, studio) only. The
 * runtime client receives its connection through a driver adapter instead.
 *
 * Prisma 7 also stopped loading `.env` implicitly, hence the explicit
 * `dotenv/config` import above.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

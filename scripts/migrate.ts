import { createPool } from '../src/server/db.js';
import { migrate } from '../src/server/migrations.js';

async function main() {
  const pool = createPool(process.env.DATABASE_URL);
  try {
    const client = await pool.connect();
    try {
      const applied = await migrate(client);
      console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date.');
    } finally {
      client.release(true);
    }
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  console.error('Migration failed. Check DATABASE_URL, PostgreSQL availability and SQL migration files.');
  process.exitCode = 1;
});

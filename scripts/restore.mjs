import { loadEnvFile } from 'node:process';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import pg from 'pg';
const [envFile, dumpFile] = process.argv.slice(2);
if (!envFile || !dumpFile) throw new Error('Usage: node scripts/restore.mjs PRIVATE_ENV_FILE BACKUP_DUMP');
loadEnvFile(envFile);
const url = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
if (!url) throw new Error('Destination connection not configured');
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const { rows } = await client.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'");
  if (rows[0].n !== 0) throw new Error('Destination is not empty; refusing to restore');
  const restore = spawnSync('pg_restore', ['--no-owner', '--no-privileges', '--single-transaction', '--exit-on-error', '-d', url, dumpFile], { encoding: 'utf8', env: { ...process.env, PGDATABASE: url } });
  if (restore.status !== 0) throw new Error('Restore failed: ' + restore.stderr.replaceAll(url, '[connection redacted]'));
  const source = new pg.Client({ connectionString: 'postgresql://mc_migration@127.0.0.1:55439/mc_source' });
  await source.connect();
  const checks = [];
  try {
    for (const table of ['users', 'plumbers', 'jobs', 'payrolls']) {
      const q = `SELECT count(*)::int AS count, md5(coalesce(string_agg(row_to_json(t)::text, '' ORDER BY id), '')) AS fingerprint FROM ${table} t`;
      const a = (await source.query(q)).rows[0], b = (await client.query(q)).rows[0];
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`Mismatch in ${table}`);
      checks.push({ table, rows: a.count, matched: true });
    }
  } finally { await source.end(); }
  await client.query(readFileSync('migrations/001_runtime.sql', 'utf8'));
  writeFileSync('.private-migration/restore-verification.json', JSON.stringify({ verifiedAt: new Date().toISOString(), checks }, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ restored: true, checks }));
} finally { await client.end(); }

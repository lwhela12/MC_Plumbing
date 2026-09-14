# MC Plumbing migration — September 14, 2026

## Destination and preserved data

Vercel project: `mc-plumbing`, team `lwhela12s-projects`.
Production URL: https://mc-plumbing-amber.vercel.app
Repository: https://github.com/lwhela12/MC_Plumbing

Production uses the Neon Marketplace resource `mc-plumbing-db` (Free plan). Preview and development use a separate Free resource, `mc-plumbing-preview-db`, with synthetic data only. Existing shared-workspace access is retained for the 10 original accounts; public registration is closed. Existing password hashes were preserved.

| Business table | Restored rows |
| --- | ---: |
| users | 10 |
| plumbers | 3 |
| jobs | 741 |
| payrolls | 43 |

The full custom-format PostgreSQL backup was restored locally and into Neon. Every row in these four tables matched the source by ordered aggregate row fingerprint, not just counts. A final live Replit comparison on September 14 matched the destination after browser testing. The old published app also returned the same 741 jobs and date coverage as this source.

Private backup: `.private-migration/source-2026-09-14.dump` in the local repository (ignored by Git and deployment). SHA-256: `148f0f85f9a029230b8e4ac6845c740909615bd72b90a843545508a40d6aab2a`. A downloaded copy also exists at `~/Downloads/mc-plumbing-backup.dump`, and a source copy is retained in Replit's `.private-migration` directory. These files contain business data and account hashes; keep them private.

## Historical issues preserved

- 89 jobs reference missing plumber IDs: 52 (14 jobs), 53 (26), 54 (49). Their records and amounts were preserved. Reports include them under an explicit missing-plumber label; no identity was guessed or inserted.
- No missing payroll references. 42 payroll periods were finalized, 1 draft.
- 17 jobs have dates later than September 14, 2026. No dates were changed.
- This is a transfer reconciliation, not an audit of the original financial accuracy.

## Application changes

- PostgreSQL replaces ephemeral in-memory storage; sessions also persist in PostgreSQL.
- Server authentication protects business APIs, with secure session cookies, origin checks, login throttling, and closed registration.
- Server calculates commissions and prevents edits to finalized payrolls. Plumber removal archives records to preserve history.
- Date-only input stays date-only; TypeScript and ESM runtime imports are corrected.
- Vercel serves the Vite frontend and Express API; no framework rewrite.
- Export downloads a consistent business-data snapshot. Unsafe in-browser restore was removed; full recovery uses PostgreSQL backups.
- Login/logout and job/payroll cache refreshes update immediately.

## Validation

TypeScript check, production frontend build, compiled Node ESM runtime health/HTML check, and eight integration tests pass. Tests cover authorization, closed registration, origin protection, persistent login across app instances, historical orphan totals, commission tampering, dates, finalization, archival, export, logout, and login throttling.

Hosted preview verification uses only a synthetic account and fixtures. Production accounts and business records are not used for test mutations. Build warnings remain for the large frontend bundle and old Browserslist metadata; they do not block deployment.

## Cutover and rollback

The Replit publication remains available; no subscription cancellation or client notification was performed. Use the Vercel URL for new work after acceptance. Do not enter payroll changes in both systems: they do not synchronize. If users continue writing to Replit after the final comparison, reconcile those changes before switching them.

For rollback before any Vercel business writes, the original Replit URL remains available. After new Vercel writes, export/back up and reconcile those changes before returning to Replit; pointing users back blindly would lose their new work. Keep the private source dump until the new system is accepted, and establish an ongoing database-backup policy before removing the old service.

## Development and operations

Use Node 22, `npm ci`, and environment variables `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters. Never commit `.env` files. `APP_ORIGIN` can restrict requests to a canonical origin; otherwise same-origin is enforced from the request host. `npm run dev` starts the local app. `npm run check` checks types; `npm run build:vercel` builds hosted assets.

`migrations/001_runtime.sql` adds persistent session/rate-limit tables and indexes. Historical foreign keys are intentionally NOT VALID so missing old plumber references remain intact while new references are enforced. Do not run `db:push` against production as a substitute for reviewed migrations.

`npm test` requires a disposable local PostgreSQL database named `mc_test` at 127.0.0.1 (default port 55439/user mc_migration), with the business schema and runtime migration applied. It truncates that fixture database and rejects other database targets.

`scripts/restore.mjs` was used for this migration: it requires PostgreSQL client tools, a private destination env file, an empty destination, the backup dump, and the restored local source at `127.0.0.1:55439/mc_source`. It refuses nonempty destinations, restores in one transaction, compares all business rows, then applies the runtime migration. Do not point it at an active database. Restore to a fresh database and validate before changing production connection variables.

BEGIN;
CREATE TABLE IF NOT EXISTS sessions (sid varchar PRIMARY KEY, sess json NOT NULL, expire timestamp(6) NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);
CREATE TABLE IF NOT EXISTS login_rate_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL, attempts integer NOT NULL);
CREATE INDEX IF NOT EXISTS login_rate_limits_window_idx ON login_rate_limits(window_start);
CREATE INDEX IF NOT EXISTS jobs_payroll_idx ON jobs(payroll_id);
CREATE INDEX IF NOT EXISTS jobs_plumber_idx ON jobs(plumber_id);
-- NOT VALID retains all historical orphan records, while enforcing new references.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_payroll_fk') THEN
 ALTER TABLE jobs ADD CONSTRAINT jobs_payroll_fk FOREIGN KEY (payroll_id) REFERENCES payrolls(id) NOT VALID;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_plumber_fk') THEN
 ALTER TABLE jobs ADD CONSTRAINT jobs_plumber_fk FOREIGN KEY (plumber_id) REFERENCES plumbers(id) NOT VALID;
 END IF;
END $$;
COMMIT;

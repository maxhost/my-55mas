-- Add timezone snapshot to orders.
--
-- Each order persists the IANA timezone of the country of service (resolved
-- from countries.timezone at creation). All renders of appointment_date and
-- derived start_time/end_time MUST format using this column, never the
-- viewer's local TZ. See docs/features/timezone-handling.md.
--
-- Default 'Europe/Madrid' is safe because all pre-existing rows were created
-- in the Spain market. No backfill needed; the previously-buggy test order
-- (#8) keeps its raw UTC value.

ALTER TABLE orders
  ADD COLUMN timezone text NOT NULL DEFAULT 'Europe/Madrid';

COMMENT ON COLUMN orders.timezone IS
  'IANA timezone (e.g. Europe/Madrid) snapshotted from countries.timezone at order creation. Render hours always in this TZ, never in viewer TZ.';

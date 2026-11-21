-- Emergency rollback only: do not run while the VPS accepts production writes.
-- Target: Neon jolly-paper-81081800 / br-aged-grass-b5uesl65 / neondb.
BEGIN;
SET TRANSACTION READ WRITE;
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS migration_vps_readonly ON public.%I', t.tablename);
  END LOOP;
END $$;
DROP FUNCTION migration_freeze.reject_write();
DROP SCHEMA migration_freeze;
ALTER DATABASE neondb RESET default_transaction_read_only;
ALTER ROLE neondb_owner IN DATABASE neondb RESET default_transaction_read_only;
COMMIT;
-- Reconnect clients after rollback. Ordinary table privileges were restored
-- before applying the trigger fence; no table permission changes remain.

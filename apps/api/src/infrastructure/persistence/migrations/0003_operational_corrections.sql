-- Phase 13 Wave 4 Final Correction: Operational Domain Hardening (W4-C02, W4-C03)
-- Non-destructive forward migration on top of 0000, 0001, 0002.

-- 1. Idempotency Processing State (ADR 0009 / W4-C02)
ALTER TABLE "idempotency_records" ADD COLUMN IF NOT EXISTS "status" varchar(32) NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "idempotency_records" ALTER COLUMN "response_status" DROP NOT NULL;
ALTER TABLE "idempotency_records" ALTER COLUMN "response_body" DROP NOT NULL;

-- 2. Evidence Upload Reservations for Authoritative Provenance & Ownership (W4-C03)
CREATE TABLE IF NOT EXISTS "evidence_upload_reservations" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "task_id" varchar(128) NOT NULL REFERENCES "tasks"("id") ON DELETE cascade,
  "actor_id" varchar(128) NOT NULL REFERENCES "users"("id"),
  "object_key" varchar(512) NOT NULL UNIQUE,
  "storage_ref" varchar(512) NOT NULL,
  "expected_content_type" varchar(128) NOT NULL,
  "expected_size_bytes" bigint,
  "expected_content_hash" varchar(128),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_evidence_reservations_task" ON "evidence_upload_reservations" ("task_id");
CREATE INDEX IF NOT EXISTS "idx_evidence_reservations_actor" ON "evidence_upload_reservations" ("actor_id");

-- 3. Runtime grants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "evidence_upload_reservations" TO app_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "idempotency_records" TO app_runtime;
  END IF;
END $$;

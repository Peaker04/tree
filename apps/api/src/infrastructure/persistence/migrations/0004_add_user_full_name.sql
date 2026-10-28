-- Phase 13 Wave 6: Add authentic Vietnamese staff name support (UI-057, UI-058)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" varchar(255);

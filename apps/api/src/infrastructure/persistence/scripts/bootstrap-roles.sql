-- PostgreSQL Role Privilege Separation (ADR 0011 / Phase 13 Wave 2)
-- Executed by postgres superuser / migration owner

-- Assumes runtime role (app_runtime) is provisioned dynamically via environment credentials

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO app_runtime;

-- Grant standard CRUD on standard business tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessions TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE spent_refresh_tokens TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE credential_setup_tokens TO app_runtime;

-- STRICT APPEND-ONLY PRIVILEGE CONTROL ON audit_events:
-- ALLOW: SELECT, INSERT
-- DENY: UPDATE, DELETE, TRUNCATE
GRANT SELECT, INSERT ON TABLE audit_events TO app_runtime;
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_events FROM app_runtime;

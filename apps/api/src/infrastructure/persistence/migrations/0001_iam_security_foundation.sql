CREATE TABLE "spent_refresh_tokens" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"session_id" varchar(128) NOT NULL,
	"token_family" varchar(128) NOT NULL,
	"refresh_token_hash" varchar(128) NOT NULL,
	"spent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credential_setup_tokens" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credential_setup_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'staff' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "token_family" varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "access_token_hash" varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "refresh_token_hash" varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "auth_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "session_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "access_expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "refresh_expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_rotated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "spent_refresh_tokens" ADD CONSTRAINT "spent_refresh_tokens_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_setup_tokens" ADD CONSTRAINT "credential_setup_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_spent_refresh_tokens_hash" ON "spent_refresh_tokens" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "idx_spent_refresh_tokens_family" ON "spent_refresh_tokens" USING btree ("token_family");--> statement-breakpoint
CREATE INDEX "idx_credential_setup_tokens_hash" ON "credential_setup_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_credential_setup_tokens_user" ON "credential_setup_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_access_token_hash" ON "sessions" USING btree ("access_token_hash");--> statement-breakpoint
CREATE INDEX "idx_sessions_refresh_token_hash" ON "sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "idx_sessions_token_family" ON "sessions" USING btree ("token_family");
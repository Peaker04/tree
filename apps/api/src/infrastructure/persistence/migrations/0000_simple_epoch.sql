CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"initial_role" varchar(20) NOT NULL,
	"account_status" varchar(20) DEFAULT 'INVITED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" varchar(128) NOT NULL,
	"actor_role" varchar(64) NOT NULL,
	"action_type" varchar(128) NOT NULL,
	"resource_type" varchar(128) NOT NULL,
	"resource_id" varchar(128) NOT NULL,
	"outcome" varchar(32) NOT NULL,
	"client_ip" varchar(64),
	"user_agent" text,
	"correlation_id" varchar(128),
	"before_state" jsonb,
	"after_state" jsonb
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_events_actor_timestamp" ON "audit_events" USING btree ("actor_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_events_resource" ON "audit_events" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_events_action_timestamp" ON "audit_events" USING btree ("action_type","timestamp");
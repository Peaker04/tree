CREATE TABLE "trees" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"name" varchar(255) NOT NULL,
	"species" varchar(255) NOT NULL,
	"lat" numeric(10, 7) NOT NULL,
	"lng" numeric(10, 7) NOT NULL,
	"address" text NOT NULL,
	"qr_code" varchar(255) NOT NULL,
	"health_status" varchar(64) NOT NULL,
	"age_years" integer NOT NULL,
	"risk_status" varchar(64),
	"is_retired" boolean DEFAULT false NOT NULL,
	"retired_at" timestamp with time zone,
	"retired_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trees_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "task_types" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"default_proof_profile" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proof_policy_versions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"task_type_id" varchar(128) NOT NULL,
	"version_number" integer NOT NULL,
	"proof_profile" varchar(64) NOT NULL,
	"policy_description" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_template_versions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"task_type_id" varchar(128) NOT NULL,
	"version_number" integer NOT NULL,
	"template_items" jsonb NOT NULL,
	"template_description" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_operational_scopes" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"manager_id" varchar(128) NOT NULL,
	"scope_key" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"task_type_id" varchar(128) NOT NULL,
	"task_type_name" varchar(255) NOT NULL,
	"proof_profile" varchar(64) NOT NULL,
	"policy_version_id" varchar(128),
	"checklist_template_version_id" varchar(128),
	"tree_id" varchar(128) NOT NULL,
	"tree_name" varchar(255) NOT NULL,
	"tree_address" text NOT NULL,
	"assigned_staff_id" varchar(128) NOT NULL,
	"assigned_staff_name" varchar(255) NOT NULL,
	"deadline" varchar(64) NOT NULL,
	"status" varchar(64) DEFAULT 'PENDING' NOT NULL,
	"checklist_snapshot" jsonb,
	"cancellation_reason" text,
	"cancelled_by" varchar(128),
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_objects" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"task_id" varchar(128) NOT NULL,
	"object_key" varchar(512) NOT NULL,
	"storage_ref" varchar(512) NOT NULL,
	"content_hash" varchar(128) NOT NULL,
	"content_type" varchar(128) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"uploaded_by_user_id" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_objects_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "evidence_attempts" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"task_id" varchar(128) NOT NULL,
	"attempt_number" integer NOT NULL,
	"submitted_by_user_id" varchar(128) NOT NULL,
	"proof_profile" varchar(64) NOT NULL,
	"proof_data" jsonb NOT NULL,
	"site_verification" jsonb,
	"location_exception" jsonb,
	"identity_exception" jsonb,
	"notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_issues" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"task_id" varchar(128) NOT NULL,
	"reported_by_user_id" varchar(128) NOT NULL,
	"issue_description" text NOT NULL,
	"issue_photo_storage_ref" text NOT NULL,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" varchar(128),
	"resolution_notes" text
);
--> statement-breakpoint
CREATE TABLE "task_reviews" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"task_id" varchar(128) NOT NULL,
	"evidence_attempt_id" varchar(128),
	"reviewer_id" varchar(128) NOT NULL,
	"decision" varchar(64) NOT NULL,
	"notes" text,
	"exception_reason" text,
	"targeted_area" text,
	"rework_reason" text,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_histories" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"tree_id" varchar(128) NOT NULL,
	"task_id" varchar(128) NOT NULL,
	"task_title" varchar(255) NOT NULL,
	"staff_id" varchar(128) NOT NULL,
	"staff_name" varchar(255) NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(64) DEFAULT 'COMPLETED' NOT NULL,
	"has_exception" boolean DEFAULT false NOT NULL,
	"exception_reason" text,
	"gps_check" jsonb,
	"qr_check" jsonb,
	"before_photo" text,
	"after_photo" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "care_histories_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"actor_id" varchar(128) NOT NULL,
	"request_route" varchar(255) NOT NULL,
	"request_hash" varchar(128) NOT NULL,
	"response_status" integer NOT NULL,
	"response_body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proof_policy_versions" ADD CONSTRAINT "proof_policy_versions_task_type_id_task_types_id_fk" FOREIGN KEY ("task_type_id") REFERENCES "public"."task_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_template_versions" ADD CONSTRAINT "checklist_template_versions_task_type_id_task_types_id_fk" FOREIGN KEY ("task_type_id") REFERENCES "public"."task_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_operational_scopes" ADD CONSTRAINT "manager_operational_scopes_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_type_id_task_types_id_fk" FOREIGN KEY ("task_type_id") REFERENCES "public"."task_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tree_id_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_staff_id_users_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_objects" ADD CONSTRAINT "evidence_objects_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_objects" ADD CONSTRAINT "evidence_objects_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_attempts" ADD CONSTRAINT "evidence_attempts_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_attempts" ADD CONSTRAINT "evidence_attempts_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_issues" ADD CONSTRAINT "field_issues_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_issues" ADD CONSTRAINT "field_issues_reported_by_user_id_users_id_fk" FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_issues" ADD CONSTRAINT "field_issues_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_evidence_attempt_id_evidence_attempts_id_fk" FOREIGN KEY ("evidence_attempt_id") REFERENCES "public"."evidence_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_histories" ADD CONSTRAINT "care_histories_tree_id_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_histories" ADD CONSTRAINT "care_histories_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_assigned_staff" ON "tasks" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_tree_id" ON "tasks" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_attempts_task" ON "evidence_attempts" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_care_histories_tree" ON "care_histories" USING btree ("tree_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_idempotency_actor_key" ON "idempotency_records" USING btree ("actor_id","idempotency_key");

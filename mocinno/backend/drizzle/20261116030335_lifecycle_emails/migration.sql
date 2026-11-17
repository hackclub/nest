CREATE TABLE "lifecycle_emails" (
	"email" text,
	"kind" text,
	"container_id" integer,
	"username" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"sent_by" text NOT NULL,
	"sent_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lifecycle_emails_pkey" PRIMARY KEY("email","kind")
);

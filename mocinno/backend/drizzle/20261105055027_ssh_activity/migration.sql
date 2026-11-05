CREATE TABLE "ssh_activity" (
	"container_id" integer,
	"day" date,
	"connections" integer DEFAULT 1 NOT NULL,
	"first_at" timestamp DEFAULT now() NOT NULL,
	"last_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ssh_activity_pkey" PRIMARY KEY("container_id","day")
);
--> statement-breakpoint
CREATE TABLE "ssh_failures" (
	"day" date,
	"reason" text,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "ssh_failures_pkey" PRIMARY KEY("day","reason")
);
--> statement-breakpoint
ALTER TABLE "containers" ADD COLUMN "last_ssh_at" timestamp;--> statement-breakpoint
CREATE INDEX "ssh_activity_day_idx" ON "ssh_activity" ("day");--> statement-breakpoint
ALTER TABLE "ssh_activity" ADD CONSTRAINT "ssh_activity_container_id_containers_id_fkey" FOREIGN KEY ("container_id") REFERENCES "containers"("id") ON DELETE CASCADE;
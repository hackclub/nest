CREATE TABLE "ssh_activity" (
	"container_id" integer NOT NULL,
	"day" date NOT NULL,
	"connections" integer DEFAULT 1 NOT NULL,
	"first_at" timestamp DEFAULT now() NOT NULL,
	"last_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ssh_activity_container_id_day_pk" PRIMARY KEY("container_id","day")
);
--> statement-breakpoint
CREATE TABLE "ssh_failures" (
	"day" date NOT NULL,
	"reason" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "ssh_failures_day_reason_pk" PRIMARY KEY("day","reason")
);
--> statement-breakpoint
ALTER TABLE "containers" ADD COLUMN "last_ssh_at" timestamp;--> statement-breakpoint
ALTER TABLE "ssh_activity" ADD CONSTRAINT "ssh_activity_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ssh_activity_day_idx" ON "ssh_activity" USING btree ("day");
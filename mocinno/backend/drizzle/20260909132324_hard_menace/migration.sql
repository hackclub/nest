CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"container_id" integer NOT NULL,
	"name" text NOT NULL,
	"demo" text NOT NULL,
	"repo" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "theme" SET DEFAULT 'system';--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE cascade ON UPDATE no action;
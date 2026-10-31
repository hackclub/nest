CREATE TABLE "unified_ships" (
	"record_id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"approved_at" date,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "unified_ships_email_idx" ON "unified_ships" USING btree ("email");
CREATE TABLE "web_activity" (
	"user_id" text,
	"day" date,
	"first_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "web_activity_pkey" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE INDEX "web_activity_day_idx" ON "web_activity" ("day");--> statement-breakpoint
ALTER TABLE "web_activity" ADD CONSTRAINT "web_activity_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
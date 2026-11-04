ALTER TABLE "session" ADD COLUMN "invite_code" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "slack_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "verification_status" text;
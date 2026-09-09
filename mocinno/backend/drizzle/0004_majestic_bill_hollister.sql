ALTER TABLE "domains" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint

ALTER TABLE domains
ALTER COLUMN proxy TYPE integer
USING CASE
  WHEN proxy ~ ':[0-9]+$' THEN split_part(proxy, ':', -1)::integer
  ELSE 80
END;--> statement-breakpoint

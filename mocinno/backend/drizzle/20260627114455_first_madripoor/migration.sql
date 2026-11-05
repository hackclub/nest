ALTER TABLE "domains" RENAME COLUMN "user_id" TO "container_id";--> statement-breakpoint
ALTER TABLE "domains" DROP CONSTRAINT "domains_user_id_containers_id_fk";
--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE cascade ON UPDATE no action;
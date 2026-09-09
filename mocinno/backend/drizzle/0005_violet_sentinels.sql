ALTER TABLE "users" RENAME TO "containers";--> statement-breakpoint
ALTER TABLE "containers" DROP CONSTRAINT "users_sub_unique";--> statement-breakpoint
ALTER TABLE "containers" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
ALTER TABLE "domains" DROP CONSTRAINT "domains_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_user_id_containers_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."containers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "containers" ADD CONSTRAINT "containers_sub_unique" UNIQUE("sub");--> statement-breakpoint
ALTER TABLE "containers" ADD CONSTRAINT "containers_username_unique" UNIQUE("username");
CREATE TABLE "hca_status" (
	"container_id" integer PRIMARY KEY,
	"result" text NOT NULL,
	"aged_out_at" timestamp,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hca_status" ADD CONSTRAINT "hca_status_container_id_containers_id_fkey" FOREIGN KEY ("container_id") REFERENCES "containers"("id") ON DELETE CASCADE;
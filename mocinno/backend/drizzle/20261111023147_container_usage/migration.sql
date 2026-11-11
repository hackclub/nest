CREATE TABLE "container_usage_daily" (
	"container_id" integer,
	"day" date,
	"samples" integer NOT NULL,
	"cpu_sum" double precision NOT NULL,
	"cpu_max" double precision NOT NULL,
	"mem_sum" double precision NOT NULL,
	"mem_max" bigint NOT NULL,
	"net_bytes" bigint NOT NULL,
	CONSTRAINT "container_usage_daily_pkey" PRIMARY KEY("container_id","day")
);
--> statement-breakpoint
CREATE TABLE "container_usage" (
	"container_id" integer PRIMARY KEY,
	"status" text NOT NULL,
	"cpu" double precision NOT NULL,
	"cpus" integer NOT NULL,
	"mem" bigint NOT NULL,
	"maxmem" bigint NOT NULL,
	"disk" bigint NOT NULL,
	"maxdisk" bigint NOT NULL,
	"netin" bigint NOT NULL,
	"netout" bigint NOT NULL,
	"sampled_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "container_usage_daily_day_idx" ON "container_usage_daily" ("day");--> statement-breakpoint
ALTER TABLE "container_usage_daily" ADD CONSTRAINT "container_usage_daily_container_id_containers_id_fkey" FOREIGN KEY ("container_id") REFERENCES "containers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "container_usage" ADD CONSTRAINT "container_usage_container_id_containers_id_fkey" FOREIGN KEY ("container_id") REFERENCES "containers"("id") ON DELETE CASCADE;
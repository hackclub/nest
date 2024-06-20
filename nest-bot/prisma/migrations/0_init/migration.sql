-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "slack_user_id" VARCHAR(255) NOT NULL,
    "tilde_username" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "ssh_public_key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_approved" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT '1970-01-01 00:00:00+00'::timestamp with time zone,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_slack_user_id_key" ON "users"("slack_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tilde_username_key" ON "users"("tilde_username");


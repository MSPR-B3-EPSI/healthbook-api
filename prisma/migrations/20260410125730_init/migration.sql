-- CreateTable
CREATE TABLE "user" (
    "keycloak_id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("keycloak_id")
);

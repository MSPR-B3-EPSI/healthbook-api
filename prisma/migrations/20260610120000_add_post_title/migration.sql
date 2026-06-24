
ALTER TABLE "post" ADD COLUMN "title" TEXT;
UPDATE "post" SET "title" = 'Sans titre' WHERE "title" IS NULL;
ALTER TABLE "post" ALTER COLUMN "title" SET NOT NULL;

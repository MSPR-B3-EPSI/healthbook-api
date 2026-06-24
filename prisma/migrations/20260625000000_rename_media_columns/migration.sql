-- Media is now stored as an object key in MinIO (the API returns a presigned
-- URL at read time), so the columns hold a key, not a URL.
ALTER TABLE "post" RENAME COLUMN "media_url" TO "media_key";
ALTER TABLE "user" RENAME COLUMN "profile_picture_url" TO "profile_media_key";

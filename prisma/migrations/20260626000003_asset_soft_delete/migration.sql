ALTER TABLE "Asset" ADD COLUMN "deletedAt"     TIMESTAMP(3);
ALTER TABLE "Asset" ADD COLUMN "deletedBy"     TEXT;
ALTER TABLE "Asset" ADD COLUMN "deletedReason" TEXT;

CREATE INDEX "Asset_deletedAt_idx" ON "Asset"("deletedAt");

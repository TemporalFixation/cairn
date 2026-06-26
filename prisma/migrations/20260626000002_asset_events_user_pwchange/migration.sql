ALTER TABLE "LocalUser" ADD COLUMN "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "AssetEvent" (
  "id"                 TEXT NOT NULL,
  "assetId"            TEXT NOT NULL,
  "eventType"          TEXT NOT NULL,
  "person"             TEXT,
  "accessories"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "missingAccessories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "performedBy"        TEXT,
  "notes"              TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AssetEvent" ADD CONSTRAINT "AssetEvent_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "AssetEvent_assetId_createdAt_idx" ON "AssetEvent"("assetId", "createdAt");

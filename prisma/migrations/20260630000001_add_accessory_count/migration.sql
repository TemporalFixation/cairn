CREATE TABLE "AccessoryCount" (
    "id" TEXT NOT NULL,
    "building" "Building" NOT NULL,
    "accessoryType" TEXT NOT NULL,
    "initialCount" INTEGER NOT NULL DEFAULT 0,
    "reconciledCount" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessoryCount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessoryCount_building_accessoryType_key" ON "AccessoryCount"("building", "accessoryType");

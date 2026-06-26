-- CreateEnum
CREATE TYPE "Building" AS ENUM ('LPQ', 'MHS', 'BG', 'CC');
CREATE TYPE "Condition" AS ENUM ('New', 'Good', 'Fair', 'Poor');
CREATE TYPE "TicketStatus" AS ENUM ('Open', 'InProgress', 'WaitingForParts', 'Resolved', 'Closed');
CREATE TYPE "UserRole" AS ENUM ('Admin', 'Technician');
CREATE TYPE "UserType" AS ENUM ('Staff', 'Student');
CREATE TYPE "SystemRole" AS ENUM ('User', 'SuperUser', 'Admin');

-- CreateTable: ITUser
CREATE TABLE "ITUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'Technician',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ITUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LocalUser
CREATE TABLE "LocalUser" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "idNumber" TEXT,
    "userType" "UserType" NOT NULL DEFAULT 'Staff',
    "role" "SystemRole" NOT NULL DEFAULT 'User',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LocalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AppSetting
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable: Room
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building" "Building" NOT NULL,
    "responsiblePerson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Asset
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(10,2),
    "warrantyExpiration" TIMESTAMP(3),
    "fundingSource" TEXT,
    "condition" "Condition" NOT NULL DEFAULT 'Good',
    "notes" TEXT,
    "assignedToPerson" JSONB,
    "secondaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "providedAccessories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "checkedOutAt" TIMESTAMP(3),
    "building" "Building" NOT NULL,
    "roomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RepairTicket
CREATE TABLE "RepairTicket" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "issueDescription" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'Open',
    "submittedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "partsUsed" TEXT,
    "repairCost" DECIMAL(10,2),
    "timeSpentMinutes" INTEGER,
    "csNumber" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "RepairTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LookupValue
CREATE TABLE "LookupValue" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "parentValue" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LookupValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Part
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partNumber" TEXT,
    "compatManufacturer" TEXT,
    "compatModel" TEXT,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TicketPart
CREATE TABLE "TicketPart" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Account (Auth.js)
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Session (Auth.js)
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VerificationToken (Auth.js)
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ITUser_email_key" ON "ITUser"("email");
CREATE UNIQUE INDEX "ITUser_googleId_key" ON "ITUser"("googleId");
CREATE UNIQUE INDEX "LocalUser_email_key" ON "LocalUser"("email");
CREATE UNIQUE INDEX "LocalUser_idNumber_key" ON "LocalUser"("idNumber");
CREATE UNIQUE INDEX "Room_name_building_key" ON "Room"("name", "building");
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");
CREATE UNIQUE INDEX "Asset_serialNumber_key" ON "Asset"("serialNumber");
CREATE UNIQUE INDEX "LookupValue_category_value_parentValue_key" ON "LookupValue"("category", "value", "parentValue");
CREATE INDEX "LookupValue_category_parentValue_idx" ON "LookupValue"("category", "parentValue");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RepairTicket" ADD CONSTRAINT "RepairTicket_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RepairTicket" ADD CONSTRAINT "RepairTicket_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "ITUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RepairTicket" ADD CONSTRAINT "RepairTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "ITUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketPart" ADD CONSTRAINT "TicketPart_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "RepairTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketPart" ADD CONSTRAINT "TicketPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ITUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ITUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase 2 is an intentionally destructive pre-production domain reset.
-- No production-data migration or backfill is included.
-- Better Auth tables (user, session, account, verification) are unchanged.

DROP TABLE IF EXISTS "Relationship";
DROP TABLE IF EXISTS "Person";
DROP TABLE IF EXISTS "Tree";
DROP TYPE IF EXISTS "RelationshipType";

CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');
CREATE TYPE "DatePrecision" AS ENUM ('YEAR', 'MONTH', 'DAY');
CREATE TYPE "RelationshipType" AS ENUM ('PARENT_CHILD', 'SPOUSE');

CREATE TABLE "Tree" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tree_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "birthDate" TEXT,
    "birthDatePrecision" "DatePrecision",
    "deathDate" TEXT,
    "deathDatePrecision" "DatePrecision",
    "birthPlace" TEXT,
    "biography" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tree_ownerId_normalizedName_key" ON "Tree"("ownerId", "normalizedName");
CREATE INDEX "Tree_ownerId_idx" ON "Tree"("ownerId");
CREATE INDEX "Person_treeId_idx" ON "Person"("treeId");
CREATE UNIQUE INDEX "Relationship_treeId_personAId_personBId_type_key" ON "Relationship"("treeId", "personAId", "personBId", "type");
CREATE INDEX "Relationship_treeId_idx" ON "Relationship"("treeId");
CREATE INDEX "Relationship_personAId_idx" ON "Relationship"("personAId");
CREATE INDEX "Relationship_personBId_idx" ON "Relationship"("personBId");

ALTER TABLE "Person" ADD CONSTRAINT "Person_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

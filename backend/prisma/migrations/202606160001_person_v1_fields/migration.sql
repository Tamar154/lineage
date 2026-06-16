ALTER TABLE "Person" ALTER COLUMN "lastName" DROP NOT NULL;

ALTER TABLE "Person" ADD COLUMN "gender" TEXT;
ALTER TABLE "Person" ADD COLUMN "birthPlace" TEXT;
ALTER TABLE "Person" RENAME COLUMN "bio" TO "biography";

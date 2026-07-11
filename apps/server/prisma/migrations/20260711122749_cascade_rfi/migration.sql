-- DropForeignKey
ALTER TABLE "rfis" DROP CONSTRAINT "rfis_conflict_id_fkey";

-- AlterTable
ALTER TABLE "conflicts" ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "description" DROP DEFAULT,
ALTER COLUMN "entityA" DROP DEFAULT,
ALTER COLUMN "recommendation" DROP DEFAULT,
ALTER COLUMN "severity" DROP DEFAULT,
ALTER COLUMN "title" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_conflict_id_fkey" FOREIGN KEY ("conflict_id") REFERENCES "conflicts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

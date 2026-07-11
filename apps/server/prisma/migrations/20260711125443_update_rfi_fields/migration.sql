/*
  Warnings:

  - You are about to drop the column `draft` on the `rfis` table. All the data in the column will be lost.
  - Added the required column `conflict_hash` to the `rfis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `rfis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discipline` to the `rfis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drawing_id` to the `rfis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `rfis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `rfis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendation` to the `rfis` table without a default value. This is not possible if the table is not empty.
  - Made the column `title` on table `rfis` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `status` to the `rfis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rfis" DROP COLUMN "draft",
ADD COLUMN     "conflict_hash" VARCHAR(64) NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "discipline" VARCHAR NOT NULL,
ADD COLUMN     "drawing_id" UUID NOT NULL,
ADD COLUMN     "priority" VARCHAR NOT NULL,
ADD COLUMN     "question" TEXT NOT NULL,
ADD COLUMN     "recommendation" TEXT NOT NULL,
ALTER COLUMN "title" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" VARCHAR NOT NULL;

-- AddForeignKey
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_drawing_id_fkey" FOREIGN KEY ("drawing_id") REFERENCES "drawings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

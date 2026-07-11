/*
  Warnings:

  - A unique constraint covering the columns `[hash,project_name]` on the table `drawings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "drawings_hash_key";

-- CreateIndex
CREATE UNIQUE INDEX "drawings_hash_project_name_key" ON "drawings"("hash", "project_name");

/*
  Warnings:

  - Added the required column `category` to the `conflicts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `conflicts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityA` to the `conflicts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendation` to the `conflicts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `severity` to the `conflicts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `conflicts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConflictCategory" AS ENUM ('SEMANTIC', 'GEOMETRY', 'DISCIPLINE');

-- CreateEnum
CREATE TYPE "ConflictSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "conflicts" ADD COLUMN     "category" "ConflictCategory" NOT NULL DEFAULT 'SEMANTIC',
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "entityA" VARCHAR NOT NULL DEFAULT '',
ADD COLUMN     "entityB" VARCHAR,
ADD COLUMN     "recommendation" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "severity" "ConflictSeverity" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "title" VARCHAR NOT NULL DEFAULT '';

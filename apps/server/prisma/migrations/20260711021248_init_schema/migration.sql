/*
  Warnings:

  - You are about to drop the `SystemLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DrawingStatus" AS ENUM ('UPLOADED', 'PARSING', 'PARSED', 'FAILED');

-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('ARCHITECTURAL', 'STRUCTURAL', 'MECHANICAL', 'ELECTRICAL', 'PLUMBING', 'FIRE', 'INTERIOR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RfiStatus" AS ENUM ('GENERATED', 'REVIEWED', 'SENT');

-- DropTable
DROP TABLE "SystemLog";

-- CreateTable
CREATE TABLE "drawings" (
    "id" UUID NOT NULL,
    "hash" VARCHAR(64) NOT NULL,
    "file_name" VARCHAR,
    "file_url" TEXT,
    "public_id" VARCHAR,
    "discipline" "Discipline",
    "status" "DrawingStatus",
    "parsed_json" JSONB,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drawings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflicts" (
    "id" UUID NOT NULL,
    "drawing_id" UUID NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfis" (
    "id" UUID NOT NULL,
    "conflict_id" UUID NOT NULL,
    "title" VARCHAR,
    "draft" TEXT,
    "status" "RfiStatus",
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drawings_hash_key" ON "drawings"("hash");

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_drawing_id_fkey" FOREIGN KEY ("drawing_id") REFERENCES "drawings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_conflict_id_fkey" FOREIGN KEY ("conflict_id") REFERENCES "conflicts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: add active field to User
ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

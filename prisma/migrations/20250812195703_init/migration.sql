-- CreateEnum
CREATE TYPE "public"."LinkPrecedence" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateTable
CREATE TABLE "public"."contacts" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "linkedId" INTEGER,
    "linkPrecedence" "public"."LinkPrecedence" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_linkedId_fkey" FOREIGN KEY ("linkedId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

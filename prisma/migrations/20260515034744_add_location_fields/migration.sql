-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "province" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "province" TEXT;

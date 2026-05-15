/*
  Warnings:

  - A unique constraint covering the columns `[gateway_order_id]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "expired_at" TIMESTAMP(3),
ADD COLUMN     "gateway_order_id" TEXT,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_url" TEXT,
ADD COLUMN     "qr_url" TEXT,
ADD COLUMN     "snap_token" TEXT,
ADD COLUMN     "va_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gateway_order_id_key" ON "Payment"("gateway_order_id");

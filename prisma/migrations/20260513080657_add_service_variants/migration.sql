-- CreateTable
CREATE TABLE "ServiceVariant" (
    "id" TEXT NOT NULL,
    "variant_name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "service_id" TEXT NOT NULL,

    CONSTRAINT "ServiceVariant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceVariant" ADD CONSTRAINT "ServiceVariant_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

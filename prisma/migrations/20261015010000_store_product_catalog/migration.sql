CREATE TABLE "StoreProduct" (
  "id" TEXT NOT NULL,
  "supplier" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "price" TEXT NOT NULL,
  "priceAmount" DOUBLE PRECISION NOT NULL,
  "image" TEXT NOT NULL,
  "tag" TEXT NOT NULL,
  "cost" DOUBLE PRECISION NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StoreProduct_supplier_supplierId_key" ON "StoreProduct"("supplier", "supplierId");
CREATE INDEX "StoreProduct_active_type_idx" ON "StoreProduct"("active", "type");
CREATE INDEX "StoreProduct_updatedAt_idx" ON "StoreProduct"("updatedAt");

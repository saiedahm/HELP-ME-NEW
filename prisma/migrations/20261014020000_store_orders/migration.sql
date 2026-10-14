
CREATE TYPE "StoreOrderStatus" AS ENUM ('PENDING', 'PAID', 'SUPPLIER_SUBMITTED', 'FULFILLMENT_FAILED', 'CANCELLED');
CREATE TABLE "StoreOrder" (
  "id" TEXT NOT NULL,
  "stripeCheckoutSession" TEXT NOT NULL,
  "stripePaymentIntent" TEXT,
  "customerEmail" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'eur',
  "amountTotal" INTEGER NOT NULL,
  "status" "StoreOrderStatus" NOT NULL DEFAULT 'PENDING',
  "itemsJson" TEXT NOT NULL,
  "supplierOrderId" TEXT,
  "supplierOrderNumber" TEXT,
  "supplierStatus" TEXT,
  "lastError" TEXT,
  "paidAt" TIMESTAMP(3),
  "supplierSubmittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoreOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StoreOrder_stripeCheckoutSession_key" ON "StoreOrder"("stripeCheckoutSession");
CREATE UNIQUE INDEX "StoreOrder_stripePaymentIntent_key" ON "StoreOrder"("stripePaymentIntent");
CREATE INDEX "StoreOrder_status_createdAt_idx" ON "StoreOrder"("status", "createdAt");
CREATE INDEX "StoreOrder_supplierOrderId_idx" ON "StoreOrder"("supplierOrderId");

ALTER TABLE "StoreOrder" ADD COLUMN "shippingJson" TEXT;

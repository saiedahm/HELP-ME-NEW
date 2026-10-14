import { prisma } from "@/lib/db";
import { getCJAccessToken } from "@/lib/cj-auth";

type CJResponse = {
  code?: number;
  result?: boolean;
  success?: boolean;
  message?: string;
  data?: string | { orderId?: string; orderNum?: string; orderNumber?: string; orderStatus?: string; cjOrderId?: string; cjOrderCode?: string } | null;
};

type OrderLine = { supplier: string; supplierId: string; name: string; quantity: number };

type Shipping = {
  name?: string | null;
  address?: {
    line1?: string | null; line2?: string | null; city?: string | null;
    state?: string | null; postal_code?: string | null; country?: string | null;
  } | null;
};

/**
 * Creates a CJ order only after Stripe confirms a live payment.
 * payType=3 deliberately creates the CJ order without charging CJ balance;
 * CJ balance payment is a separate business decision.
 */
export async function submitPaidOrderToCJ(orderId: string): Promise<void> {
  const logisticName = process.env.CJ_LOGISTIC_NAME?.trim();
  if (!logisticName) throw new Error("CJ_LOGISTIC_NAME is not configured.");

  const claimed = await prisma.storeOrder.updateMany({
    where: { id: orderId, status: { in: ["PAID", "FULFILLMENT_FAILED"] } },
    data: { status: "SUPPLIER_SUBMITTING", lastError: null }
  });
  if (claimed.count !== 1) return;

  try {
    const order = await prisma.storeOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Saved store order was not found.");
    if (!order.shippingJson) throw new Error("Paid order has no saved shipping address.");
    const shipping = JSON.parse(order.shippingJson) as Shipping;
    const address = shipping.address;
    if (!shipping.name || !address?.line1 || !address.city || !address.country) {
      throw new Error("Paid order has an incomplete shipping address.");
    }
    const countryNames: Record<string, string> = {
      DE: "Germany", AT: "Austria", BE: "Belgium", DK: "Denmark", ES: "Spain",
      FI: "Finland", FR: "France", IE: "Ireland", IT: "Italy", LU: "Luxembourg",
      NL: "Netherlands", PL: "Poland", PT: "Portugal", SE: "Sweden"
    };
    const lines = JSON.parse(order.itemsJson) as OrderLine[];
    if (!lines.length || lines.some((line) => line.supplier !== "CJdropshipping" || !line.supplierId || !Number.isInteger(line.quantity) || line.quantity < 1)) {
      throw new Error("Order includes a supplier other than CJdropshipping or an invalid CJ variant ID.");
    }

    const token = await getCJAccessToken();
    const response = await fetch("https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2", {
      method: "POST",
      headers: { "CJ-Access-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: `HM-${order.id}`,
        shippingZip: address.postal_code || "",
        shippingCountryCode: address.country.toUpperCase(),
        shippingCountry: countryNames[address.country.toUpperCase()] || address.country.toUpperCase(),
        shippingProvince: address.state || address.city,
        shippingCity: address.city,
        shippingCustomerName: shipping.name,
        shippingAddress: address.line1,
        shippingAddress2: address.line2 || "",
        email: order.customerEmail || "",
        logisticName,
        fromCountryCode: (process.env.CJ_FROM_COUNTRY_CODE || "CN").toUpperCase(),
        payType: 3,
        orderFlow: 1,
        products: lines.map((line) => ({ vid: line.supplierId, quantity: line.quantity }))
      }),
      cache: "no-store"
    });
    const payload = await response.json().catch(() => null) as CJResponse | null;
    if (!response.ok || !payload || payload.code !== 200 || payload.result === false || payload.success === false || !(typeof payload.data === "string" ? payload.data : payload.data?.orderId || payload.data?.cjOrderId || payload.data?.cjOrderCode)) {
      throw new Error(`CJ order creation failed (HTTP ${response.status}, code ${payload?.code ?? "unknown"}).`);
    }
    await prisma.storeOrder.update({
      where: { id: order.id },
      data: {
        status: "SUPPLIER_SUBMITTED",
        supplierOrderId: typeof payload.data === "string" ? payload.data : (payload.data.orderId || payload.data.cjOrderId || payload.data.cjOrderCode)!,
        supplierOrderNumber: typeof payload.data === "string" ? `HM-${order.id}` : (payload.data.orderNum || payload.data.orderNumber || `HM-${order.id}`),
        supplierStatus: typeof payload.data === "string" ? "CREATED_UNPAID" : (payload.data.orderStatus || "CREATED_UNPAID"),
        supplierSubmittedAt: new Date(),
        lastError: null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CJ order submission error.";
    await prisma.storeOrder.updateMany({
      where: { id: orderId, status: "SUPPLIER_SUBMITTING" },
      data: { status: "FULFILLMENT_FAILED", lastError: message.slice(0, 500) }
    });
    throw error;
  }
}

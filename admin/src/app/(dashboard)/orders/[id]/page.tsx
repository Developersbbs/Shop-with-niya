import { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import PageTitle from "@/components/shared/PageTitle";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { getDiscount } from "@/helpers/getDiscount";
import { OrderBadgeVariants } from "@/constants/badge";
import { fetchOrderDetails } from "@/services/orders";
import { InvoiceActions } from "./_components/InvoiceActions";

type PageParams = { params: { id: string } };

export async function generateMetadata({ params: { id } }: PageParams): Promise<Metadata> {
  try {
    const { order } = await fetchOrderDetails({ id });
    return { title: `Order #${order.invoice_no}` };
  } catch (e) {
    return { title: "Order not found" };
  }
}

export default async function Order({ params: { id } }: PageParams) {
  try {
    const { order } = await fetchOrderDetails({ id });

    const subtotal = order.order_items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price, 0
    );
    const tax = subtotal * 0.1;
    const discount = getDiscount({
      totalAmount: order.total_amount,
      shippingCost: order.shipping_cost,
      coupon: order.coupons,
    });

    return (
      <section>
        <PageTitle className="print:hidden">Invoice</PageTitle>

        {/* ── Always white wrapper — ignores dark mode ── */}
        <div className="mb-8 mt-2 rounded-lg overflow-hidden shadow-sm print:shadow-none print:rounded-none"
          style={{ backgroundColor: "#ffffff", color: "#111111" }}>

          {/* ── Dark green header with logo ── */}
          <div style={{ backgroundColor: "#082B27", padding: "28px 40px", textAlign: "center" }}>
            <img
              src="/assets/niya-logo.webp"
              alt="Shop With Niya"
              style={{ height: "68px", width: "auto", objectFit: "contain", margin: "0 auto", display: "block" }}
            />
            <p style={{ fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: "10px 0 4px", fontFamily: "sans-serif" }}>
              Invoice
            </p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", margin: 0, fontFamily: "sans-serif" }}>
              No: 33, Reddy St, Krishna Nagar, Virugambakkam, Chennai, Tamilnadu &nbsp;|&nbsp; +91 70944 42030
            </p>
          </div>

          {/* ── Invoice content ── */}
          <div style={{ padding: "32px 40px 40px", backgroundColor: "#ffffff" }}>

            <Separator style={{ margin: "0 0 24px", backgroundColor: "#e5e5e5" }} />

            {/* ── Invoice Details + Billing Details ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

              <div style={{ border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px 18px", backgroundColor: "#ffffff" }}>
                <p style={labelStyle}>Invoice Details</p>
                <InfoRow label="Invoice No" value={`ORD-${order.invoice_no}`} />
                <InfoRow label="Order Date" value={format(order.order_time, "d MMMM yyyy")} />
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#555", fontFamily: "sans-serif" }}>Status:</span>
                  <Badge variant={OrderBadgeVariants[order.status]} className="text-xs capitalize">
                    {order.status}
                  </Badge>
                </div>
                <InfoRow label="Payment" value={order.payment_method.replace(/_/g, " ")} />
              </div>

              <div style={{ border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px 18px", backgroundColor: "#ffffff" }}>
                <p style={labelStyle}>Billing Details</p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#111", margin: "0 0 4px", fontFamily: "sans-serif" }}>
                  {order.customers.name}
                </p>
                <p style={{ fontSize: "11px", color: "#555", margin: "0 0 2px", fontFamily: "sans-serif" }}>
                  {order.customers.email}
                </p>
                {order.customers.phone && (
                  <p style={{ fontSize: "11px", color: "#555", margin: 0, fontFamily: "sans-serif" }}>
                    {order.customers.phone}
                  </p>
                )}
              </div>
            </div>

            {/* ── Shipping Address + Delivery Info ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>

              <div style={{ border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px 18px", backgroundColor: "#ffffff" }}>
                <p style={labelStyle}>Shipping Address</p>
                {order.customers.address ? (
                  <p style={{ fontSize: "11px", color: "#555", margin: 0, lineHeight: 1.6, fontFamily: "sans-serif" }}>
                    {order.customers.address}
                  </p>
                ) : (
                  <p style={{ fontSize: "11px", color: "#aaa", fontFamily: "sans-serif" }}>No address provided</p>
                )}
              </div>

              <div style={{ border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px 18px", backgroundColor: "#ffffff" }}>
                <p style={labelStyle}>Delivery Info</p>
                <p style={{ fontSize: "11px", color: "#555", margin: "0 0 4px", fontFamily: "sans-serif" }}>
                  <span style={{ fontWeight: 600, color: "#111" }}>Est. Delivery: </span>
                  {format(
                    new Date(new Date(order.order_time).getTime() + 7 * 24 * 60 * 60 * 1000),
                    "d MMMM yyyy"
                  )}
                </p>
                <p style={{ fontSize: "11px", color: "#aaa", margin: 0, fontFamily: "sans-serif" }}>
                  Tracking not available yet
                </p>
              </div>
            </div>

            {/* ── Order Items ── */}
            <p style={{ ...labelStyle, marginBottom: "10px" }}>Order Items</p>

            <div style={{ border: "1px solid #e5e5e5", borderRadius: "6px", overflow: "hidden" }}>
              <Table>
                <TableHeader>
                  <TableRow
                    className="hover:bg-transparent border-b-0"
                    style={{ backgroundColor: "#082B27" }}
                  >
                    {["Product", "SKU", "Qty", "Unit Price", "Total"].map((h, i) => (
                      <TableHead
                        key={h}
                        style={{
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          textAlign: i === 2 ? "center" : i === 3 ? "center" : i === 4 ? "right" : "left",
                        }}
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items.map((item, index) => (
                    <TableRow
                      key={`order-item-${index}`}
                      className="hover:bg-transparent"
                      style={{
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#fafafa",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <TableCell style={{ color: "#111", fontSize: "12px", fontFamily: "sans-serif" }}>
                        {item.products.name}
                      </TableCell>
                      <TableCell style={{ color: "#777", fontSize: "11px", fontFamily: "sans-serif" }}>
                        {(item.products as any).sku || "—"}
                      </TableCell>
                      <TableCell style={{ color: "#111", fontSize: "12px", fontFamily: "sans-serif", textAlign: "center" }}>
                        {item.quantity}
                      </TableCell>
                      <TableCell style={{ color: "#111", fontSize: "12px", fontFamily: "sans-serif", textAlign: "center" }}>
                        ₹{item.unit_price.toFixed(2)}
                      </TableCell>
                      <TableCell style={{ color: "#111", fontSize: "12px", fontWeight: 600, fontFamily: "sans-serif", textAlign: "right" }}>
                        ₹{(item.quantity * item.unit_price).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ── Totals ── */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                width: "260px",
                border: "1px solid #e5e5e5",
                borderTop: "none",
                borderBottomLeftRadius: "6px",
                borderBottomRightRadius: "6px",
                overflow: "hidden",
                backgroundColor: "#ffffff",
              }}>
                <TotalRow label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
                <TotalRow label="Tax (10%)" value={`₹${tax.toFixed(2)}`} />
                <TotalRow
                  label="Shipping"
                  value={order.shipping_cost > 0 ? `₹${order.shipping_cost.toFixed(2)}` : "Free"}
                />
                {discount !== "0.00" && (
                  <TotalRow label="Discount" value={`-₹${discount}`} />
                )}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "12px 16px",
                  borderTop: "2px solid #082B27",
                  backgroundColor: "#ffffff",
                }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#111", fontFamily: "sans-serif" }}>
                    Total
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#082B27", fontFamily: "sans-serif" }}>
                    ₹{order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div style={{ borderTop: "1px solid #e5e5e5", marginTop: "40px", paddingTop: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "10px", color: "#373737", margin: "0 0 2px", fontFamily: "sans-serif" }}>
                This is a computer-generated invoice. No signature required.
              </p>
              <p style={{ fontSize: "10px", color: "#373737", margin: 0, fontFamily: "sans-serif" }}>
                Generated on {format(new Date(), "d MMMM yyyy")} &nbsp;•&nbsp; Niya by Yuthika Fashion Studio
              </p>
            </div>

          </div>
        </div>

        <InvoiceActions order={order} />
      </section>
    );
  } catch (e) {
    return notFound();
  }
}

/* ── Style constants ── */
const labelStyle: React.CSSProperties = {
  fontSize: "9px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#888",
  marginBottom: "10px",
  marginTop: 0,
  fontFamily: "sans-serif",
};

/* ── Helpers ── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "6px", marginTop: "5px" }}>
      <span style={{ fontSize: "11px", color: "#555", fontFamily: "sans-serif" }}>{label}:</span>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#111", fontFamily: "sans-serif" }}>{value}</span>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #f0f0f0", backgroundColor: "#ffffff" }}>
      <span style={{ fontSize: "11px", color: "#555", fontFamily: "sans-serif" }}>{label}</span>
      <span style={{ fontSize: "11px", color: "#111", fontFamily: "sans-serif" }}>{value}</span>
    </div>
  );
}
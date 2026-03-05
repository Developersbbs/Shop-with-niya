import { FaBagShopping } from "react-icons/fa6";
import { format } from "date-fns";
import Typography from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OrderDetails } from "@/services/orders/types";
import { OrderBadgeVariants } from "@/constants/badge";

const BRAND = "#082B27";

export default function InvoicePdfTemplate({ order }: { order: OrderDetails }) {
  const subtotal = order.order_items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price, 0
  );
  const tax = subtotal * 0.1;
  const discount = order.coupons
    ? order.coupons.discount_type === "fixed"
      ? order.coupons.discount_value
      : ((subtotal * 100) / (100 - order.coupons.discount_value) - subtotal)
    : 0;

  return (
    <Card
      id={`invoice-${order.invoice_no}`}
      className="border-none rounded-none bg-white text-black"
      style={{ width: "794px", minHeight: "1123px", padding: "48px 56px" }}
    >

      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
          <FaBagShopping style={{ color: BRAND, fontSize: "22px", flexShrink: 0 }} />
          <h1 style={{
            fontSize: "22px", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: BRAND, margin: 0,
            fontFamily: "Georgia, serif",
          }}>
            Shop With Niya
          </h1>
        </div>
        <p style={{
          fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase",
          color: "#888", margin: "0 0 6px", fontFamily: "sans-serif",
        }}>
          Invoice
        </p>
        <p style={{ fontSize: "10px", color: "#777", margin: 0, fontFamily: "sans-serif" }}>
          No: 33, Reddy St, Krishna Nagar, Virugambakkam, Chennai, Tamilnadu &nbsp;|&nbsp; +91 70944 42030
        </p>
      </div>

      <Separator className="my-5 bg-print-border" />

      {/* ── Invoice Details + Billing Details ── */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <div style={{ flex: 1, border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px 18px" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "10px", fontFamily: "sans-serif" }}>
            Invoice Details
          </p>
          <InfoRow label="Invoice No" value={`ORD-${order.invoice_no}`} />
          <InfoRow label="Order Date" value={format(order.order_time, "d MMMM yyyy")} />
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px" }}>
            <span style={{ fontSize: "11px", color: "#555", fontFamily: "sans-serif" }}>Status:</span>
            <Badge
              variant={OrderBadgeVariants[order.status]}
              className="flex-shrink-0 text-xs capitalize relative translate-y-1.5"
            >
              <span className="text-transparent">{order.status}</span>
              <span className="absolute left-2.5 capitalize bottom-2">{order.status}</span>
            </Badge>
          </div>
          <InfoRow label="Payment" value={order.payment_method.replace(/_/g, " ")} />
        </div>

        <div style={{ flex: 1, border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px 18px" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "10px", fontFamily: "sans-serif" }}>
            Billing Details
          </p>
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
      <div style={{ display: "flex", gap: "16px", marginBottom: "28px" }}>
        <div style={{ flex: 1, border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px 18px" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "10px", fontFamily: "sans-serif" }}>
            Shipping Address
          </p>
          {order.customers.address ? (
            <p style={{ fontSize: "11px", color: "#555", margin: 0, lineHeight: 1.6, fontFamily: "sans-serif" }}>
              {order.customers.address}
            </p>
          ) : (
            <p style={{ fontSize: "11px", color: "#aaa", fontFamily: "sans-serif" }}>No address provided</p>
          )}
        </div>

        <div style={{ flex: 1, border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px 18px" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "10px", fontFamily: "sans-serif" }}>
            Delivery Info
          </p>
          <p style={{ fontSize: "11px", color: "#555", margin: "0 0 4px", fontFamily: "sans-serif" }}>
            <span style={{ fontWeight: 600 }}>Est. Delivery: </span>
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

      {/* ── Order Items Table ── */}
      <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "10px", fontFamily: "sans-serif" }}>
        Order Items
      </p>

      <div className="border rounded-md overflow-hidden mb-0 border-print-border">
        <Table>
          <TableHeader>
            <TableRow style={{ background: BRAND }} className="hover:bg-transparent border-b-0">
              <TableHead className="uppercase h-10 whitespace-nowrap" style={{ color: "#fff" }}>Product</TableHead>
              <TableHead className="uppercase h-10 whitespace-nowrap" style={{ color: "#fff" }}>SKU</TableHead>
              <TableHead className="uppercase h-10 whitespace-nowrap text-center" style={{ color: "#fff" }}>Qty</TableHead>
              <TableHead className="uppercase h-10 whitespace-nowrap text-center" style={{ color: "#fff" }}>Unit Price</TableHead>
              <TableHead className="uppercase h-10 whitespace-nowrap text-right" style={{ color: "#fff" }}>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.order_items.map((item, index) => (
              <TableRow
                key={`order-item-${index}`}
                className="hover:bg-transparent border-b-print-border"
                style={{ background: index % 2 === 0 ? "#fff" : "#fafafa" }}
              >
                <TableCell className="py-3 font-normal text-black">{item.products.name}</TableCell>
                <TableCell className="py-3 font-normal" style={{ color: "#777" }}>
                  {(item.products as any).sku || "—"}
                </TableCell>
                <TableCell className="py-3 text-center font-normal text-black">{item.quantity}</TableCell>
                <TableCell className="py-3 text-center font-normal text-black">
                  ₹{item.unit_price.toFixed(2)}
                </TableCell>
                <TableCell className="py-3 text-right font-semibold text-black">
                  ₹{(item.quantity * item.unit_price).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Totals ── */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "260px", border: "1px solid #e5e5e5", borderTop: "none" }}>
          <TotalRow label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
          <TotalRow label="Tax (10%)" value={`₹${tax.toFixed(2)}`} />
          <TotalRow
            label="Shipping"
            value={order.shipping_cost > 0 ? `₹${order.shipping_cost.toFixed(2)}` : "Free"}
          />
          {discount > 0 && (
            <TotalRow label="Discount" value={`-₹${discount.toFixed(2)}`} />
          )}
          <div style={{
            display: "flex", justifyContent: "space-between",
            padding: "12px 16px", borderTop: `2px solid ${BRAND}`,
          }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#111", fontFamily: "sans-serif" }}>
              Total
            </span>
            <span style={{ fontSize: "15px", fontWeight: 700, color: BRAND, fontFamily: "sans-serif" }}>
              ₹{order.total_amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid #e0e0e0", marginTop: "40px", paddingTop: "16px", textAlign: "center" }}>
        <p style={{ fontSize: "10px", color: "#aaa", margin: "0 0 2px", fontFamily: "sans-serif" }}>
          This is a computer-generated invoice. No signature required.
        </p>
        <p style={{ fontSize: "10px", color: "#aaa", margin: 0, fontFamily: "sans-serif" }}>
          Generated on {format(new Date(), "d MMMM yyyy")} &nbsp;•&nbsp; Niya by Yuthika Fashion Studio
        </p>
      </div>

    </Card>
  );
}

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
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #f0f0f0" }}>
      <span style={{ fontSize: "11px", color: "#555", fontFamily: "sans-serif" }}>{label}</span>
      <span style={{ fontSize: "11px", color: "#111", fontFamily: "sans-serif" }}>{value}</span>
    </div>
  );
}
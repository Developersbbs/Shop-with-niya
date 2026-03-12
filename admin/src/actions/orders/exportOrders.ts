"use server";

import { serverAxiosInstance } from "@/helpers/axiosInstance";
import { OrdersExport } from "@/services/orders/types";
import { getDiscount } from "@/helpers/getDiscount";

export async function exportOrders() {
  try {
    const { data } = await serverAxiosInstance.get("/api/orders/export");

    if (!data.success) {
      console.error("API export failed:", data.error);
      return { error: data.error || "Failed to fetch data for orders." };
    }

    return {
      data: data.data.map(
        (order: {
          invoice_no: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          total_amount: number | string;
          coupons: unknown;
          shipping_cost: number | string;
          payment_method: string;
          order_date: string;
          status: string;
          shipping_address: string;
        }): OrdersExport => ({
          id: order.invoice_no,
          invoice_no: order.invoice_no,
          customer_name: order.customer_name,
          customer_email: order.customer_email || "",
          customer_phone: order.customer_phone || "",
          total_amount: Number(order.total_amount) || 0,
          discount: parseFloat(getDiscount({
            coupon: order.coupons as { discount_type: string, discount_value: number } | null,
            totalAmount: Number(order.total_amount),
            shippingCost: Number(order.shipping_cost),
          }).toString()) || 0,
          shipping_cost: Number(order.shipping_cost) || 0,
          payment_method: order.payment_method,
          order_date: order.order_date,
          status: order.status,
          shipping_address: order.shipping_address,
        })
      ),
    };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number, statusText?: string, data?: { error?: string } }, message?: string, config?: { url?: string, headers?: unknown } };
    console.error("Orders export error FULL:", {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
      url: err.config?.url,
      headers: err.config?.headers,
    });
    return {
      error: err.response?.data?.error || "Failed to fetch data for orders."
    };
  }
}
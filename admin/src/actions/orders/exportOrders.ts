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
        (order: any): OrdersExport => ({
          id: order.invoice_no,
          invoice_no: order.invoice_no,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          total_amount: order.total_amount,
          discount: getDiscount({
            coupon: order.coupons,
            totalAmount: order.total_amount,
            shippingCost: order.shipping_cost,
          }),
          shipping_cost: order.shipping_cost,
          payment_method: order.payment_method,
          order_date: order.order_date,
          status: order.status,
          shipping_address: order.shipping_address,
        })
      ),
    };
  } catch (error: any) {
    console.error("Orders export error FULL:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      headers: error.config?.headers,
    });
    return {
      error: error.response?.data?.error || "Failed to fetch data for orders."
    };
  }
}
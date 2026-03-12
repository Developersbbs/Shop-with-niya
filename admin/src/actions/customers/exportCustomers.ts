"use server";

import { serverAxiosInstance } from "@/helpers/axiosInstance";

export async function exportCustomers() {
  try {
    const { data } = await serverAxiosInstance.get("/api/customers/export");

    if (!data.success) {
      console.error("API export failed:", data.error);
      return { error: data.error || "Failed to fetch data for customers." };
    }

    return { data: data.data };
  } catch (error: unknown) {
    console.error("Customers export error:", error);
    const err = error as { response?: { data?: { error?: string } } };
    return {
      error: err.response?.data?.error || "Failed to fetch data for customers."
    };
  }
}

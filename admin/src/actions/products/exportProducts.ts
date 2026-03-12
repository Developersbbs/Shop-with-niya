"use server";

import { serverAxiosInstance } from "@/helpers/axiosInstance";

export async function exportProducts() {
  try {
    const { data } = await serverAxiosInstance.get("/api/products/export/csv", {
      responseType: "text",   // ← expect CSV text, not JSON
    });

    return { data };          // data is now the raw CSV string

  } catch (error: unknown) {
    console.error("Products export error:", error);
    const err = error as { response?: { data?: { error?: string } } };
    return {
      error: err.response?.data?.error || "Failed to fetch data for products."
    };
  }
}